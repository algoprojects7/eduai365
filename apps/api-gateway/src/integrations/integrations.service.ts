import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser, TenantContext } from '@eduai365/shared-types';
import { AuditService } from '../common/audit/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PrismaService } from '../prisma/prisma.service';
import type { AttendanceQrDto } from './dto/attendance-qr.dto';
import type { GpsIngestDto, GpsPosition } from './dto/gps-ingest.dto';
import type { SmsSendDto } from './dto/sms-send.dto';
import type { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { IdempotencyStore } from './idempotency.store';
import {
  buildPaymentWebhookEndpoints,
  buildWebhookEventLogs,
} from './integrations.mock-data';
import type { WebhookProvider } from './webhook-signature.service';

export interface WebhookResult {
  provider: WebhookProvider;
  eventId: string;
  status: 'processed' | 'duplicate';
  payload: Record<string, unknown>;
}

export interface MessagingResult {
  provider: string;
  messageId: string;
  to: string;
  status: 'queued';
  mock: true;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly gpsBySchool = new Map<string, Map<string, GpsPosition>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyStore,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  getWebhookEndpoints(tenant: TenantContext) {
    return buildPaymentWebhookEndpoints(tenant);
  }

  getWebhookLogs(tenant: TenantContext) {
    return buildWebhookEventLogs(tenant);
  }

  async handlePaymentWebhook(
    provider: WebhookProvider,
    payload: Record<string, unknown>,
  ): Promise<WebhookResult> {
    const eventId = this.extractEventId(provider, payload);
    const idempotencyKey = `${provider}:${eventId}`;

    const claimed = await this.idempotency.claim(idempotencyKey);
    if (!claimed) {
      this.logger.debug(`Duplicate ${provider} webhook: ${eventId}`);
      return { provider, eventId, status: 'duplicate', payload };
    }

    this.logger.log(`Processing ${provider} webhook event ${eventId}`);
    // Stub: reconcile payment status with finance module in a future phase.
    return { provider, eventId, status: 'processed', payload };
  }

  async markAttendanceFromQr(
    tenant: TenantContext,
    dto: AttendanceQrDto,
    actor?: AuthenticatedUser,
  ): Promise<unknown> {
    const scannedAt = new Date(dto.timestamp);
    if (Number.isNaN(scannedAt.getTime())) {
      throw new BadRequestException('Invalid timestamp');
    }

    const lookup = dto.studentId.trim();
    const student = await this.prisma.client.student.findFirst({
      where: {
        schoolId: tenant.schoolId,
        OR: [{ id: lookup }, { admissionNo: lookup }],
      },
      select: {
        id: true,
        classId: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.classId) {
      throw new BadRequestException('Student is not assigned to a class');
    }

    const classId = student.classId;

    const date = new Date(
      Date.UTC(scannedAt.getUTCFullYear(), scannedAt.getUTCMonth(), scannedAt.getUTCDate()),
    );

    const record = await this.prisma.client.attendanceRecord.upsert({
      where: {
        studentId_date: { studentId: student.id, date },
      },
      update: {
        status: 'PRESENT',
        classId,
        ...(actor?.id ? { markedById: actor.id } : {}),
      },
      create: {
        schoolId: tenant.schoolId,
        classId,
        studentId: student.id,
        date,
        status: 'PRESENT',
        ...(actor?.id ? { markedById: actor.id } : {}),
      },
    });

    await this.audit.log({
      action: 'integrations.attendance.qr',
      entity: 'AttendanceRecord',
      userId: actor?.id,
      schoolId: tenant.schoolId,
      metadata: {
        studentId: student.id,
        timestamp: dto.timestamp,
        source: 'qr',
      },
    });

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      status: record.status,
      date: date.toISOString().slice(0, 10),
      scannedAt: dto.timestamp,
      source: 'qr',
    };
  }

  async ingestGps(tenant: TenantContext, dto: GpsIngestDto): Promise<GpsPosition> {
    const vehicle = await this.prisma.client.transportVehicle.findFirst({
      where: {
        id: dto.vehicleId,
        route: { schoolId: tenant.schoolId },
      },
      select: { id: true, registrationNo: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const position: GpsPosition = {
      vehicleId: dto.vehicleId,
      lat: dto.lat,
      lng: dto.lng,
      speed: dto.speed,
      updatedAt: new Date().toISOString(),
    };

    let schoolPositions = this.gpsBySchool.get(tenant.schoolId);
    if (!schoolPositions) {
      schoolPositions = new Map();
      this.gpsBySchool.set(tenant.schoolId, schoolPositions);
    }
    schoolPositions.set(dto.vehicleId, position);

    this.notificationsGateway.emitGpsUpdate(tenant.slug, {
      ...position,
      registrationNo: vehicle.registrationNo,
    });

    return position;
  }

  getLiveGps(tenant: TenantContext): GpsPosition[] {
    const schoolPositions = this.gpsBySchool.get(tenant.schoolId);
    if (!schoolPositions) {
      return [];
    }
    return Array.from(schoolPositions.values());
  }

  async sendSms(
    tenant: TenantContext,
    dto: SmsSendDto,
    actor: AuthenticatedUser,
  ): Promise<MessagingResult> {
    const provider = dto.provider ?? 'msg91';
    const messageId = `sms_${provider}_${Date.now()}`;

    this.logger.log(
      `[mock ${provider}] SMS to ${dto.to} for school ${tenant.slug}: ${dto.message.slice(0, 40)}…`,
    );

    await this.audit.log({
      action: 'integrations.sms.send',
      entity: 'SmsMessage',
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: { provider, to: dto.to, messageId, mock: true },
    });

    return {
      provider,
      messageId,
      to: dto.to,
      status: 'queued',
      mock: true,
    };
  }

  async sendWhatsapp(
    tenant: TenantContext,
    dto: WhatsappSendDto,
    actor: AuthenticatedUser,
  ): Promise<MessagingResult> {
    const messageId = `wa_${Date.now()}`;

    this.logger.log(
      `[mock whatsapp] to ${dto.to} for school ${tenant.slug}: ${dto.message.slice(0, 40)}…`,
    );

    await this.audit.log({
      action: 'integrations.whatsapp.send',
      entity: 'WhatsappMessage',
      userId: actor.id,
      schoolId: tenant.schoolId,
      metadata: {
        to: dto.to,
        templateId: dto.templateId,
        messageId,
        mock: true,
      },
    });

    return {
      provider: 'whatsapp',
      messageId,
      to: dto.to,
      status: 'queued',
      mock: true,
    };
  }

  private extractEventId(
    provider: WebhookProvider,
    payload: Record<string, unknown>,
  ): string {
    if (provider === 'razorpay') {
      const nested = payload.payload as
        | Record<string, { entity?: { id?: string } }>
        | undefined;
      const paymentId = nested?.payment?.entity?.id;
      if (typeof paymentId === 'string' && paymentId.length > 0) {
        return paymentId;
      }

      const eventName = payload.event;
      const createdAt = payload.created_at;
      if (typeof eventName === 'string' && createdAt != null) {
        return `${eventName}:${String(createdAt)}`;
      }
    }

    if (provider === 'cashfree') {
      const orderId = payload.orderId ?? payload.order_id;
      const type = payload.type ?? payload.event;
      if (typeof orderId === 'string' && orderId.length > 0) {
        return `${orderId}:${String(type ?? 'event')}`;
      }
    }

    const fallback = JSON.stringify(payload);
    const hash = createHash('sha256').update(fallback).digest('hex').slice(0, 16);
    return `${provider}:hash:${hash}`;
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { Permissions, Public, Roles } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { getRequiredTenantContext } from '../common/tenant/tenant.context';
import { assertTenantAccess } from '../school-admin/helpers/tenant-access.helper';
import { AttendanceQrDto } from './dto/attendance-qr.dto';
import { GpsIngestDto } from './dto/gps-ingest.dto';
import { SmsSendDto } from './dto/sms-send.dto';
import { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { IntegrationsService } from './integrations.service';
import { WebhookSignatureService } from './webhook-signature.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const INTEGRATIONS_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'RECEPTIONIST',
  'TEACHER',
  'TRANSPORT_MANAGER',
  'PARENT',
] as const;

const MESSAGING_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'RECEPTIONIST',
] as const;

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly webhookSignatures: WebhookSignatureService,
  ) {}

  // ─── Payment Webhooks ──────────────────────────────────────────────────────

  @Get('webhooks')
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACCOUNTANT')
  @Permissions('school:settings:read')
  @ApiOperation({ summary: 'Payment gateway webhook URLs for tenant configuration' })
  async listWebhookEndpoints(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.integrations.getWebhookEndpoints(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('webhooks/logs')
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACCOUNTANT')
  @Permissions('school:settings:read')
  @ApiOperation({ summary: 'Recent inbound webhook event log (mock)' })
  async listWebhookLogs(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.integrations.getWebhookLogs(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Public()
  @Post('webhooks/razorpay')
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @ApiHeader({ name: 'X-Razorpay-Signature', description: 'HMAC webhook signature', required: false })
  @ApiOperation({ summary: 'Razorpay payment webhook (public, HMAC stub + idempotency)' })
  async razorpayWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): ApiResult {
    getRequiredTenantContext();
    const rawBody = JSON.stringify(payload);
    this.webhookSignatures.verify('razorpay', rawBody, headers);
    const data = await this.integrations.handlePaymentWebhook('razorpay', payload);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Public()
  @Post('webhooks/cashfree')
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @ApiHeader({ name: 'x-webhook-signature', description: 'HMAC webhook signature', required: false })
  @ApiOperation({ summary: 'Cashfree payment webhook (public, HMAC stub + idempotency)' })
  async cashfreeWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): ApiResult {
    getRequiredTenantContext();
    const rawBody = JSON.stringify(payload);
    this.webhookSignatures.verify('cashfree', rawBody, headers);
    const data = await this.integrations.handlePaymentWebhook('cashfree', payload);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Attendance QR ─────────────────────────────────────────────────────────

  @Post('attendance/qr')
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @Roles(...INTEGRATIONS_ROLES)
  @ApiOperation({ summary: 'Mark attendance from QR scan' })
  async attendanceQr(
    @Body() dto: AttendanceQrDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.integrations.markAttendanceFromQr(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── GPS ───────────────────────────────────────────────────────────────────

  @Public()
  @Post('gps/ingest')
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @ApiOperation({ summary: 'Ingest vehicle GPS position from tracker device' })
  async gpsIngest(@Body() dto: GpsIngestDto): ApiResult {
    const tenant = getRequiredTenantContext();
    const data = await this.integrations.ingestGps(tenant, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('gps/live')
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @Roles(...INTEGRATIONS_ROLES)
  @ApiOperation({ summary: 'Latest GPS positions for the school' })
  async gpsLive(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.integrations.getLiveGps(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Messaging ─────────────────────────────────────────────────────────────

  @Post('sms/send')
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @Roles(...MESSAGING_ROLES)
  @Permissions('notifications:send')
  @ApiOperation({ summary: 'Send SMS via MSG91/Twilio abstraction (mock)' })
  async sendSms(
    @Body() dto: SmsSendDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.integrations.sendSms(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('whatsapp/send')
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
  @Roles(...MESSAGING_ROLES)
  @Permissions('notifications:send')
  @ApiOperation({ summary: 'Send WhatsApp message (mock)' })
  async sendWhatsapp(
    @Body() dto: WhatsappSendDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.integrations.sendWhatsapp(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}

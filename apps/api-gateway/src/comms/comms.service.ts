import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  TenantContext,
  UserRole,
} from '@eduai365/shared-types';
import type { DeliveryChannel, DeliveryStatus, Prisma } from '@eduai365/database';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendBirthdayWishDto } from './dto/birthday-wish.dto';
import type { CreateBroadcastDto } from './dto/broadcast.dto';
import type { ListCircularsQueryDto, CreateCircularDto, AudienceFilterDto } from './dto/circulars.dto';
import type {
  CreateComplaintDto,
  CreateComplaintMessageDto,
  ListComplaintsQueryDto,
} from './dto/complaints.dto';
import type { ListLogsQueryDto } from './dto/logs.dto';
import type {
  CreateNoticeDto,
  ListNoticesQueryDto,
  UpdateNoticeDto,
} from './dto/notices.dto';

const STAFF_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'RECEPTIONIST',
  'TEACHER',
  'COUNSELLOR',
];

function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

function recipientContact(channel: DeliveryChannel, email: string, phone: string | null): string {
  if (channel === 'EMAIL') return email;
  if (phone) return phone;
  return email;
}

@Injectable()
export class CommsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Audience resolution ───────────────────────────────────────────────────

  private async resolveAudience(
    tenant: TenantContext,
    filter: AudienceFilterDto,
  ): Promise<Array<{ id: string; email: string; phone: string | null }>> {
    const { classIds = [], sectionIds = [], roles = [] } = filter;

    if (!classIds.length && !sectionIds.length && !roles.length) {
      return this.prisma.client.user.findMany({
        where: { schoolId: tenant.schoolId, isActive: true },
        select: { id: true, email: true, phone: true },
      });
    }

    const userIds = new Set<string>();

    if (roles.length) {
      const roleUsers = await this.prisma.client.user.findMany({
        where: {
          schoolId: tenant.schoolId,
          isActive: true,
          role: { in: roles },
        },
        select: { id: true },
      });
      for (const u of roleUsers) userIds.add(u.id);
    }

    if (classIds.length || sectionIds.length) {
      const studentWhere: Prisma.StudentWhereInput = {
        schoolId: tenant.schoolId,
        status: 'ACTIVE',
      };
      if (classIds.length) studentWhere.classId = { in: classIds };
      if (sectionIds.length) studentWhere.sectionId = { in: sectionIds };

      const students = await this.prisma.client.student.findMany({
        where: studentWhere,
        select: { userId: true },
      });
      for (const s of students) {
        if (s.userId) userIds.add(s.userId);
      }

      const parentLinks = await this.prisma.client.parentStudent.findMany({
        where: {
          student: studentWhere,
        },
        select: { parentId: true },
      });
      for (const link of parentLinks) userIds.add(link.parentId);
    }

    if (!userIds.size) {
      return [];
    }

    return this.prisma.client.user.findMany({
      where: { id: { in: [...userIds] }, isActive: true },
      select: { id: true, email: true, phone: true },
    });
  }

  private async simulateDelivery(
    tenant: TenantContext,
    params: {
      channel: DeliveryChannel;
      recipientId: string;
      recipientContact: string;
      subject: string;
      body: string;
      campaignId?: string;
      circularId?: string;
      noticeId?: string;
    },
  ): Promise<{ delivered: boolean }> {
    const now = new Date();
    const failSmsWithoutPhone =
      params.channel === 'SMS' && !params.recipientContact.startsWith('+');

    const status: DeliveryStatus = failSmsWithoutPhone ? 'FAILED' : 'DELIVERED';

    await this.prisma.client.notificationLog.create({
      data: {
        schoolId: tenant.schoolId,
        channel: params.channel,
        status,
        recipientId: params.recipientId,
        recipientContact: params.recipientContact,
        subject: params.subject,
        body: params.body,
        campaignId: params.campaignId,
        circularId: params.circularId,
        noticeId: params.noticeId,
        sentAt: now,
        deliveredAt: status === 'DELIVERED' ? now : undefined,
        failedAt: status === 'FAILED' ? now : undefined,
        errorMessage: failSmsWithoutPhone ? 'Missing valid phone number' : undefined,
      },
    });

    return { delivered: status === 'DELIVERED' };
  }

  // ─── Notices ───────────────────────────────────────────────────────────────

  async listNotices(tenant: TenantContext, query: ListNoticesQueryDto): Promise<unknown> {
    const now = new Date();
    return this.prisma.client.notice.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.category ? { category: query.category } : {}),
        ...(query.publishedOnly !== false
          ? {
              isPublished: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            }
          : {}),
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  async createNotice(
    tenant: TenantContext,
    dto: CreateNoticeDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.notice.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        body: dto.body,
        category: dto.category,
        isPinned: dto.isPinned ?? false,
        isPublished: dto.isPublished ?? true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Notice',
      entityId: record.id,
    });

    return record;
  }

  async updateNotice(
    tenant: TenantContext,
    id: string,
    dto: UpdateNoticeDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const existing = await this.prisma.client.notice.findFirst({
      where: { id, schoolId: tenant.schoolId },
    });
    if (!existing) {
      throw new NotFoundException('Notice not found');
    }

    const record = await this.prisma.client.notice.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Notice',
      entityId: record.id,
    });

    return record;
  }

  // ─── Circulars ─────────────────────────────────────────────────────────────

  private matchesAudienceFilter(
    filter: Prisma.JsonValue,
    query: ListCircularsQueryDto,
    userRole: UserRole,
  ): boolean {
    if (!query.classId && !query.sectionId && !query.role) return true;

    const audience = filter as AudienceFilterDto;
    const classIds = audience.classIds ?? [];
    const sectionIds = audience.sectionIds ?? [];
    const roles = audience.roles ?? [];

    const emptyFilter = !classIds.length && !sectionIds.length && !roles.length;
    if (emptyFilter) return true;

    if (query.role && roles.length && !roles.includes(query.role)) return false;
    if (query.role && roles.length && roles.includes(query.role)) return true;
    if (userRole && roles.length && roles.includes(userRole)) return true;

    if (query.classId && classIds.length && classIds.includes(query.classId)) return true;
    if (query.sectionId && sectionIds.length && sectionIds.includes(query.sectionId)) return true;

    return false;
  }

  async listCirculars(
    tenant: TenantContext,
    query: ListCircularsQueryDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const records = await this.prisma.client.circular.findMany({
      where: { schoolId: tenant.schoolId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (!query.classId && !query.sectionId && !query.role) {
      return records;
    }

    return records.filter((c) =>
      this.matchesAudienceFilter(c.audienceFilter, query, user.role as UserRole),
    );
  }

  async createCircular(
    tenant: TenantContext,
    dto: CreateCircularDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const audienceFilter = dto.audienceFilter ?? {};
    const record = await this.prisma.client.circular.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        body: dto.body,
        audienceFilter,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const recipients = await this.resolveAudience(tenant, audienceFilter);
    for (const recipient of recipients) {
      await this.simulateDelivery(tenant, {
        channel: 'IN_APP' as DeliveryChannel,
        recipientId: recipient.id,
        recipientContact: recipient.email,
        subject: dto.title,
        body: dto.body,
        circularId: record.id,
      });
    }

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Circular',
      entityId: record.id,
    });

    return { ...record, recipientCount: recipients.length };
  }

  // ─── Complaints ────────────────────────────────────────────────────────────

  async listComplaints(
    tenant: TenantContext,
    query: ListComplaintsQueryDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const mineOnly = query.mine === 'true' || query.mine === '1';
    const staff = isStaffRole(user.role as UserRole);

    return this.prisma.client.complaintThread.findMany({
      where: {
        schoolId: tenant.schoolId,
        ...(query.status ? { status: query.status } : {}),
        ...(!staff || mineOnly ? { submittedById: user.id } : {}),
      },
      include: {
        submittedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createComplaint(
    tenant: TenantContext,
    dto: CreateComplaintDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const record = await this.prisma.client.complaintThread.create({
      data: {
        schoolId: tenant.schoolId,
        subject: dto.subject,
        description: dto.description,
        submittedById: user.id,
        messages: {
          create: {
            senderId: user.id,
            body: dto.description,
            isStaffReply: false,
          },
        },
      },
      include: {
        submittedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        messages: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'ComplaintThread',
      entityId: record.id,
    });

    return record;
  }

  async addComplaintMessage(
    tenant: TenantContext,
    threadId: string,
    dto: CreateComplaintMessageDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const thread = await this.prisma.client.complaintThread.findFirst({
      where: { id: threadId, schoolId: tenant.schoolId },
    });
    if (!thread) {
      throw new NotFoundException('Complaint thread not found');
    }

    const staff = isStaffRole(user.role as UserRole);
    if (!staff && thread.submittedById !== user.id) {
      throw new ForbiddenException('You can only reply to your own complaints');
    }

    const message = await this.prisma.client.complaintMessage.create({
      data: {
        threadId,
        senderId: user.id,
        body: dto.body,
        isStaffReply: staff,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    const newStatus = staff && thread.status === 'SUBMITTED' ? 'UNDER_REVIEW' : thread.status;
    await this.prisma.client.complaintThread.update({
      where: { id: threadId },
      data: { status: newStatus },
    });

    return message;
  }

  // ─── Broadcast ─────────────────────────────────────────────────────────────

  async createBroadcast(
    tenant: TenantContext,
    dto: CreateBroadcastDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    if (!dto.channels.length) {
      throw new BadRequestException('At least one delivery channel is required');
    }

    const recipients = await this.resolveAudience(tenant, dto.audienceFilter);
    if (!recipients.length) {
      throw new BadRequestException('No recipients match the selected audience');
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const isScheduled = scheduledAt && scheduledAt > new Date();

    const campaign = await this.prisma.client.broadcastCampaign.create({
      data: {
        schoolId: tenant.schoolId,
        title: dto.title,
        message: dto.message,
        channels: dto.channels,
        audienceFilter: dto.audienceFilter,
        status: isScheduled ? 'SCHEDULED' : 'SENDING',
        scheduledAt: scheduledAt ?? undefined,
        createdById: user.id,
        totalRecipients: recipients.length * dto.channels.length,
      },
    });

    if (isScheduled) {
      await this.audit.log({
        schoolId: tenant.schoolId,
        userId: user.id,
        action: 'CREATE',
        entity: 'BroadcastCampaign',
        entityId: campaign.id,
      });
      return campaign;
    }

    let deliveredCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      for (const channel of dto.channels) {
        const contact = recipientContact(channel, recipient.email, recipient.phone);
        const result = await this.simulateDelivery(tenant, {
          channel,
          recipientId: recipient.id,
          recipientContact: contact,
          subject: dto.title,
          body: dto.message,
          campaignId: campaign.id,
        });
        if (result.delivered) deliveredCount += 1;
        else failedCount += 1;
      }
    }

    const updated = await this.prisma.client.broadcastCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'COMPLETED',
        sentAt: new Date(),
        deliveredCount,
        failedCount,
      },
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'BroadcastCampaign',
      entityId: campaign.id,
    });

    return {
      ...updated,
      deliveryRate: updated.totalRecipients
        ? Math.round((deliveredCount / updated.totalRecipients) * 1000) / 10
        : 0,
    };
  }

  async sendBirthdayWish(
    tenant: TenantContext,
    dto: SendBirthdayWishDto,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const recipient = await this.prisma.client.user.findFirst({
      where: { id: dto.userId, schoolId: tenant.schoolId, isActive: true },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    const contact = recipient.phone || recipient.email;

    const result = await this.simulateDelivery(tenant, {
      channel: 'WHATSAPP' as DeliveryChannel,
      recipientId: recipient.id,
      recipientContact: contact,
      subject: 'Happy Birthday!',
      body: dto.message,
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'NotificationLog',
      entityId: recipient.id,
      metadata: { type: 'birthday_wish', channel: 'WHATSAPP' },
    });

    return { success: result.delivered, recipient };
  }

  // ─── Logs ──────────────────────────────────────────────────────────────────

  async listLogs(tenant: TenantContext, query: ListLogsQueryDto): Promise<unknown> {
    const where: Prisma.NotificationLogWhereInput = {
      schoolId: tenant.schoolId,
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.campaignId ? { campaignId: query.campaignId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [logs, total, delivered, failed] = await Promise.all([
      this.prisma.client.notificationLog.findMany({
        where,
        include: {
          recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
          campaign: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.client.notificationLog.count({ where }),
      this.prisma.client.notificationLog.count({
        where: { ...where, status: 'DELIVERED' as DeliveryStatus },
      }),
      this.prisma.client.notificationLog.count({
        where: { ...where, status: 'FAILED' as DeliveryStatus },
      }),
    ]);

    const deliveryRate = total ? Math.round((delivered / total) * 1000) / 10 : 0;
    const failureRate = total ? Math.round((failed / total) * 1000) / 10 : 0;

    const byChannel = await this.prisma.client.notificationLog.groupBy({
      by: ['channel', 'status'],
      where,
      _count: { _all: true },
    });

    const channelRates = (
      ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP'] as DeliveryChannel[]
    ).map((channel) => {
      const channelLogs = byChannel.filter((g) => g.channel === channel);
      const channelTotal = channelLogs.reduce((sum, g) => sum + g._count._all, 0);
      const channelDelivered =
        channelLogs.find((g) => g.status === 'DELIVERED')?._count._all ?? 0;
      return {
        channel,
        total: channelTotal,
        delivered: channelDelivered,
        deliveryRate: channelTotal
          ? Math.round((channelDelivered / channelTotal) * 1000) / 10
          : 0,
      };
    });

    return {
      logs,
      summary: {
        total,
        delivered,
        failed,
        deliveryRate,
        failureRate,
      },
      channelRates,
    };
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(tenant: TenantContext): Promise<unknown> {
    const schoolId = tenant.schoolId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      noticeCount,
      circularCount,
      campaignCount,
      complaintCounts,
      logTotals,
      recentCampaigns,
      openComplaints,
    ] = await Promise.all([
      this.prisma.client.notice.count({
        where: { schoolId, isPublished: true },
      }),
      this.prisma.client.circular.count({ where: { schoolId } }),
      this.prisma.client.broadcastCampaign.count({ where: { schoolId } }),
      this.prisma.client.complaintThread.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { _all: true },
      }),
      this.prisma.client.notificationLog.groupBy({
        by: ['status'],
        where: { schoolId, createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
      }),
      this.prisma.client.broadcastCampaign.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          totalRecipients: true,
          deliveredCount: true,
          failedCount: true,
          sentAt: true,
          channels: true,
        },
      }),
      this.prisma.client.complaintThread.count({
        where: { schoolId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
    ]);

    const totalLogs = logTotals.reduce((sum, g) => sum + g._count._all, 0);
    const deliveredLogs =
      logTotals.find((g) => g.status === 'DELIVERED')?._count._all ?? 0;

    const complaintsByStatus = Object.fromEntries(
      complaintCounts.map((g) => [g.status, g._count._all]),
    );

    return {
      notices: { published: noticeCount },
      circulars: { total: circularCount },
      campaigns: { total: campaignCount, recent: recentCampaigns },
      complaints: {
        open: openComplaints,
        byStatus: complaintsByStatus,
      },
      delivery: {
        last30Days: {
          total: totalLogs,
          delivered: deliveredLogs,
          deliveryRate: totalLogs
            ? Math.round((deliveredLogs / totalLogs) * 1000) / 10
            : 0,
        },
      },
    };
  }
}

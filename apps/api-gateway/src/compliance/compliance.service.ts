import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserConsentStatus, UserDataExport } from '@eduai365/shared-types';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecordConsentDto } from './dto/consent.dto';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getConsent(userId: string): Promise<UserConsentStatus> {
    const row = await this.prisma.client.userConsent.findUnique({
      where: { userId },
    });

    if (!row) {
      return this.defaultConsentStatus(userId);
    }

    return this.toConsentDto(row);
  }

  async recordConsent(
    userId: string,
    dto: RecordConsentDto,
    ipAddress?: string,
  ): Promise<UserConsentStatus> {
    const now = new Date();
    const existing = await this.prisma.client.userConsent.findUnique({
      where: { userId },
    });

    const data = {
      dataProcessing: dto.dataProcessing ?? existing?.dataProcessing ?? false,
      marketing: dto.marketing ?? existing?.marketing ?? false,
      analytics: dto.analytics ?? existing?.analytics ?? false,
      communications: dto.communications ?? existing?.communications ?? false,
      thirdPartySharing: dto.thirdPartySharing ?? existing?.thirdPartySharing ?? false,
      dataProcessingAt:
        dto.dataProcessing !== undefined
          ? now
          : (existing?.dataProcessingAt ?? null),
      marketingAt:
        dto.marketing !== undefined ? now : (existing?.marketingAt ?? null),
      analyticsAt:
        dto.analytics !== undefined ? now : (existing?.analyticsAt ?? null),
      communicationsAt:
        dto.communications !== undefined
          ? now
          : (existing?.communicationsAt ?? null),
      thirdPartySharingAt:
        dto.thirdPartySharing !== undefined
          ? now
          : (existing?.thirdPartySharingAt ?? null),
      ipAddress: ipAddress ?? existing?.ipAddress ?? null,
    };

    const row = await this.prisma.client.userConsent.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });

    await this.audit.log({
      action: 'compliance.consent.update',
      entity: 'UserConsent',
      entityId: row.id,
      userId,
      schoolId: user?.schoolId ?? undefined,
      ipAddress,
      metadata: {
        dataProcessing: row.dataProcessing,
        marketing: row.marketing,
        analytics: row.analytics,
        communications: row.communications,
        thirdPartySharing: row.thirdPartySharing,
      },
    });

    return this.toConsentDto(row);
  }

  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        schoolId: true,
        isActive: true,
        mfaEnabled: true,
        lastLoginAt: true,
        deletionRequestedAt: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: { id: true, name: true, slug: true },
        },
        consent: true,
        devices: {
          select: {
            id: true,
            fingerprint: true,
            name: true,
            lastUsedAt: true,
            isTrusted: true,
            createdAt: true,
          },
        },
        loginHistory: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            success: true,
            failureReason: true,
            createdAt: true,
          },
        },
        sessions: {
          where: { isActive: true },
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            expiresAt: true,
            createdAt: true,
          },
        },
        inAppNotifications: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            title: true,
            body: true,
            read: true,
            link: true,
            createdAt: true,
          },
        },
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
            status: true,
            classId: true,
            sectionId: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            employeeId: true,
            department: true,
            designation: true,
            joinDate: true,
            employmentType: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.audit.log({
      action: 'compliance.export',
      entity: 'User',
      entityId: userId,
      userId,
      schoolId: user.schoolId ?? undefined,
      metadata: { format: 'json' },
    });

    return {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      profile: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        deletionRequestedAt: user.deletionRequestedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      school: user.school,
      consent: user.consent ? this.toConsentDto(user.consent) : this.defaultConsentStatus(userId),
      devices: user.devices.map((d) => ({
        ...d,
        lastUsedAt: d.lastUsedAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
      })),
      loginHistory: user.loginHistory.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
      sessions: user.sessions.map((s) => ({
        ...s,
        expiresAt: s.expiresAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      notifications: user.inAppNotifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      student: user.student,
      employee: user.employeeProfile
        ? {
            ...user.employeeProfile,
            joinDate: user.employeeProfile.joinDate.toISOString(),
          }
        : null,
    };
  }

  async requestAccountDeletion(
    userId: string,
    ipAddress?: string,
  ): Promise<{ requestedAt: string; status: 'pending' }> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { isActive: true, deletionRequestedAt: true, schoolId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive || user.deletionRequestedAt) {
      throw new BadRequestException('Account deletion has already been requested');
    }

    const now = new Date();

    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletionRequestedAt: now,
      },
    });

    await this.audit.log({
      action: 'compliance.account.delete.requested',
      entity: 'User',
      entityId: userId,
      userId,
      schoolId: user.schoolId ?? undefined,
      ipAddress,
      metadata: { softDelete: true },
    });

    return {
      requestedAt: now.toISOString(),
      status: 'pending',
    };
  }

  private defaultConsentStatus(userId: string): UserConsentStatus {
    return {
      userId,
      dataProcessing: false,
      marketing: false,
      analytics: false,
      communications: false,
      thirdPartySharing: false,
      dataProcessingAt: null,
      marketingAt: null,
      analyticsAt: null,
      communicationsAt: null,
      thirdPartySharingAt: null,
      updatedAt: null,
    };
  }

  private toConsentDto(row: {
    userId: string;
    dataProcessing: boolean;
    marketing: boolean;
    analytics: boolean;
    communications: boolean;
    thirdPartySharing: boolean;
    dataProcessingAt: Date | null;
    marketingAt: Date | null;
    analyticsAt: Date | null;
    communicationsAt: Date | null;
    thirdPartySharingAt: Date | null;
    updatedAt: Date;
  }): UserConsentStatus {
    return {
      userId: row.userId,
      dataProcessing: row.dataProcessing,
      marketing: row.marketing,
      analytics: row.analytics,
      communications: row.communications,
      thirdPartySharing: row.thirdPartySharing,
      dataProcessingAt: row.dataProcessingAt?.toISOString() ?? null,
      marketingAt: row.marketingAt?.toISOString() ?? null,
      analyticsAt: row.analyticsAt?.toISOString() ?? null,
      communicationsAt: row.communicationsAt?.toISOString() ?? null,
      thirdPartySharingAt: row.thirdPartySharingAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

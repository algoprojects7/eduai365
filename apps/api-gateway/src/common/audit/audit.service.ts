import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    schoolId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.client.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        schoolId: params.schoolId,
        ipAddress: params.ipAddress,
        metadata: params.metadata ?? {},
      },
    });
  }
}

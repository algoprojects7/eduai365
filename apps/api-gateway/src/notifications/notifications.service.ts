import { Injectable, NotFoundException } from '@nestjs/common';
import type { InAppNotification, InAppNotificationsList } from '@eduai365/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { TestNotificationDto } from './dto/test-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<InAppNotificationsList> {
    const [rows, unreadCount] = await Promise.all([
      this.prisma.client.inAppNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.client.inAppNotification.count({
        where: { userId, read: false },
      }),
    ]);

    return {
      items: rows.map((row) => this.toDto(row)),
      unreadCount,
    };
  }

  async markAsRead(userId: string, id: string): Promise<InAppNotification> {
    const existing = await this.prisma.client.inAppNotification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.client.inAppNotification.update({
      where: { id },
      data: { read: true },
    });

    return this.toDto(updated);
  }

  async createTest(userId: string, dto: TestNotificationDto): Promise<InAppNotification> {
    const created = await this.prisma.client.inAppNotification.create({
      data: {
        userId,
        title: dto.title ?? 'Test Notification',
        body: dto.body ?? 'This is a test in-app notification from eduAI365.',
        link: dto.link ?? null,
        read: false,
      },
    });

    return this.toDto(created);
  }

  private toDto(row: {
    id: string;
    userId: string;
    title: string;
    body: string;
    read: boolean;
    link: string | null;
    createdAt: Date;
  }): InAppNotification {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      body: row.body,
      read: row.read,
      link: row.link,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

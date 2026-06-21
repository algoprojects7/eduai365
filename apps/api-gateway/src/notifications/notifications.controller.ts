import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TestNotificationDto } from './dto/test-notification.dto';
import { NotificationsService } from './notifications.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

@ApiTags('notifications')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: false })
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for the current user' })
  async list(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const data = await this.notifications.listForUser(user.id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an in-app notification as read' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): ApiResult {
    const data = await this.notifications.markAsRead(user.id, id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test in-app notification to the current user' })
  async sendTest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TestNotificationDto,
  ): ApiResult {
    const data = await this.notifications.createTest(user.id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}

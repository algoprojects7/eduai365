import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { Permissions, Roles } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { assertTenantAccess } from '../school-admin/helpers/tenant-access.helper';
import { CommsService } from './comms.service';
import { SendBirthdayWishDto } from './dto/birthday-wish.dto';
import type { CreateBroadcastDto } from './dto/broadcast.dto';
import type { ListCircularsQueryDto, CreateCircularDto } from './dto/circulars.dto';
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
import { CreateSocialPostDto } from './dto/social.dto';
import { moderateContent } from './utils/moderation.util';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const COMMS_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'RECEPTIONIST',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'COUNSELLOR',
] as const;

@ApiTags('comms')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...COMMS_ROLES)
@Controller('comms')
export class CommsController {
  constructor(private readonly comms: CommsService) {}

  // ─── Notices ───────────────────────────────────────────────────────────────

  @Get('notices')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'List notice board entries' })
  async listNotices(
    @Query() query: ListNoticesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.listNotices(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('notices')
  @Permissions('notifications:send')
  @ApiOperation({ summary: 'Create notice board entry' })
  async createNotice(
    @Body() dto: CreateNoticeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.createNotice(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('notices/:id')
  @Permissions('notifications:send')
  @ApiOperation({ summary: 'Update notice board entry' })
  async updateNotice(
    @Param('id') id: string,
    @Body() dto: UpdateNoticeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.updateNotice(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Circulars ─────────────────────────────────────────────────────────────

  @Get('circulars')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'List circulars with optional audience filter' })
  async listCirculars(
    @Query() query: ListCircularsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.listCirculars(tenant, query, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('circulars')
  @Permissions('notifications:send')
  @ApiOperation({ summary: 'Publish circular to audience' })
  async createCircular(
    @Body() dto: CreateCircularDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.createCircular(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Complaints ────────────────────────────────────────────────────────────

  @Get('complaints')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'List grievance threads' })
  async listComplaints(
    @Query() query: ListComplaintsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.listComplaints(tenant, query, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('complaints')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Submit grievance thread' })
  async createComplaint(
    @Body() dto: CreateComplaintDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.createComplaint(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('complaints/:id/messages')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Reply to grievance thread' })
  async addComplaintMessage(
    @Param('id') id: string,
    @Body() dto: CreateComplaintMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.addComplaintMessage(tenant, id, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Broadcast ───────────────────────────────────────────────────────────────

  @Post('broadcast')
  @Permissions('notifications:send')
  @ApiOperation({ summary: 'Bulk send message with audience selector' })
  async createBroadcast(
    @Body() dto: CreateBroadcastDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.createBroadcast(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('birthday-wish')
  @Permissions('notifications:send')
  @ApiOperation({ summary: 'Send a manual birthday wish to a staff/teacher' })
  async sendBirthdayWish(
    @Body() dto: SendBirthdayWishDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.sendBirthdayWish(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Logs & Stats ──────────────────────────────────────────────────────────

  @Get('logs')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Delivery log with rates' })
  async listLogs(
    @Query() query: ListLogsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.listLogs(tenant, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('social')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'List social network posts' })
  async listSocialPosts(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.listSocialPosts(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('social')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Share a constructive post on the social network' })
  async createSocialPost(
    @Body() dto: CreateSocialPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    await moderateContent(dto.content);
    const data = await this.comms.createSocialPost(tenant, dto.content, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('stats')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Communication hub KPIs' })
  async getStats(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.comms.getStats(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}

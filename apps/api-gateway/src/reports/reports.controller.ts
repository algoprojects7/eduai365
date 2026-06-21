import { Body, Controller, Get, Post } from '@nestjs/common';
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
import { CustomReportExportDto, CustomReportPreviewDto } from './dto/custom-report.dto';
import { CreateScheduledReportDto } from './dto/scheduled-report.dto';
import { ReportsService } from './reports.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const REPORTS_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'ACCOUNTANT',
  'HR_MANAGER',
  'EXAM_CONTROLLER',
  'COUNSELLOR',
] as const;

@ApiTags('reports')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...REPORTS_ROLES)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('hub')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'AI Reports Hub — Academic, Financial, HR, Operations tabs' })
  async hub(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.reports.getHub(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('operational-efficiency')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'Cross-module operational efficiency KPIs' })
  async operationalEfficiency(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.reports.getOperationalEfficiency(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('custom/preview')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'Preview custom report with selected metrics and chart type' })
  async customPreview(@Body() dto: CustomReportPreviewDto): ApiResult {
    const data = this.reports.previewCustomReport(dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('custom/export')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'Export custom report as PDF or Excel (simulated download URL)' })
  async customExport(
    @Body() dto: CustomReportExportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.reports.exportCustomReport(tenant, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('scheduled')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'List scheduled auto-generated reports' })
  async listScheduled(@CurrentUser() user: AuthenticatedUser): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = this.reports.listScheduled(tenant);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('scheduled')
  @Permissions('school:reports:read')
  @ApiOperation({ summary: 'Create a scheduled report with cron delivery' })
  async createScheduled(
    @Body() dto: CreateScheduledReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.reports.createScheduled(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}

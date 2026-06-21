import { Injectable } from '@nestjs/common';
import type { TenantContext } from '@eduai365/shared-types';
import { AuditService } from '../common/audit/audit.service';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import type { CustomReportExportDto, CustomReportPreviewDto } from './dto/custom-report.dto';
import type { CreateScheduledReportDto } from './dto/scheduled-report.dto';
import {
  buildCustomPreview,
  buildOperationalEfficiency,
  buildReportHub,
  buildSimulatedExportUrl,
  computeNextRun,
  DEFAULT_SCHEDULED_REPORTS,
} from './reports.mock-data';

interface ScheduledReportRecord {
  id: string;
  name: string;
  cronExpression: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  metrics: string[];
  chartType: 'bar' | 'line' | 'pie' | 'area';
  format: 'pdf' | 'xlsx';
  recipients: string[];
  lastSentAt: string | null;
  nextRunAt: string;
  status: 'active' | 'paused';
  createdAt: string;
}

@Injectable()
export class ReportsService {
  private readonly scheduledByTenant = new Map<string, ScheduledReportRecord[]>();

  constructor(private readonly audit: AuditService) {}

  getHub(tenant: TenantContext) {
    return buildReportHub(tenant);
  }

  getOperationalEfficiency(tenant: TenantContext) {
    return buildOperationalEfficiency(tenant);
  }

  previewCustomReport(dto: CustomReportPreviewDto) {
    return buildCustomPreview(dto.metrics, dto.chartType, dto.groupBy);
  }

  exportCustomReport(tenant: TenantContext, dto: CustomReportExportDto) {
    return buildSimulatedExportUrl(tenant, dto.format, dto.title);
  }

  listScheduled(tenant: TenantContext): ScheduledReportRecord[] {
    return this.scheduledByTenant.get(tenant.schoolId) ?? [...DEFAULT_SCHEDULED_REPORTS];
  }

  async createScheduled(
    tenant: TenantContext,
    dto: CreateScheduledReportDto,
    user: AuthenticatedUser,
  ): Promise<ScheduledReportRecord> {
    const record: ScheduledReportRecord = {
      id: `sched-${Date.now()}`,
      name: dto.name,
      cronExpression: dto.cronExpression,
      frequency: dto.frequency,
      metrics: dto.metrics,
      chartType: dto.chartType ?? 'bar',
      format: dto.format,
      recipients: dto.recipients,
      lastSentAt: null,
      nextRunAt: computeNextRun(dto.cronExpression),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const existing = this.scheduledByTenant.get(tenant.schoolId) ?? [...DEFAULT_SCHEDULED_REPORTS];
    this.scheduledByTenant.set(tenant.schoolId, [...existing, record]);

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'ScheduledReport',
      entityId: record.id,
      metadata: { name: dto.name, cronExpression: dto.cronExpression },
    });

    return record;
  }
}

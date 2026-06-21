import { Injectable } from '@nestjs/common';
import type { TenantContext } from '@eduai365/shared-types';
import { AuditService } from '../common/audit/audit.service';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import type { PdfGenerateDto } from './dto/pdf-generate.dto';
import { buildPdfPlaceholder } from './reports.mock-data';

@Injectable()
export class PdfService {
  constructor(private readonly audit: AuditService) {}

  async generate(
    tenant: TenantContext,
    dto: PdfGenerateDto,
    user: AuthenticatedUser,
  ) {
    const rendered = buildPdfPlaceholder(dto.template, {
      ...dto.data,
      schoolName: dto.data.schoolName ?? tenant.slug,
    });

    await this.audit.log({
      schoolId: tenant.schoolId,
      userId: user.id,
      action: 'CREATE',
      entity: 'PdfDocument',
      entityId: dto.template,
      metadata: { template: dto.template, renderMode: rendered.renderMode },
    });

    return {
      template: dto.template,
      ...rendered,
    };
  }
}

import { Body, Controller, Post } from '@nestjs/common';
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
import { PdfGenerateDto } from './dto/pdf-generate.dto';
import { PdfService } from './pdf.service';

type ApiResult = Promise<{ success: boolean; data: unknown; timestamp: string }>;

const PDF_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'ACCOUNTANT',
  'HR_MANAGER',
  'EXAM_CONTROLLER',
  'TEACHER',
  'RECEPTIONIST',
  'PARENT',
  'STUDENT',
] as const;

@ApiTags('pdf')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Roles(...PDF_ROLES)
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdf: PdfService) {}

  @Post('generate')
  @Permissions('school:reports:read')
  @ApiOperation({
    summary: 'Generate PDF or HTML document (report cards, receipts, salary slips)',
  })
  async generate(
    @Body() dto: PdfGenerateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): ApiResult {
    const tenant = assertTenantAccess(user);
    const data = await this.pdf.generate(tenant, dto, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}

import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { Permissions } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { getTenantContext } from '../common/tenant/tenant.context';

/** @deprecated Use GET /api/v1/school/students instead. Module no longer registered in AppModule. */
@ApiTags('students')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-Slug', description: 'School tenant slug', required: true })
@Controller('students')
export class StudentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('students:read')
  @ApiOperation({ summary: 'List students (tenant-scoped via middleware + Prisma extension)' })
  async listStudents(@CurrentUser() user: AuthenticatedUser): Promise<{
    success: boolean;
    data: unknown;
    tenant?: string;
    timestamp: string;
  }> {
    const tenant = getTenantContext();

    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== tenant?.schoolId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    const students = await this.prisma.client.student.findMany({
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        status: true,
        schoolId: true,
      },
      take: 50,
    });

    return {
      success: true,
      data: students,
      tenant: tenant?.slug,
      timestamp: new Date().toISOString(),
    };
  }
}

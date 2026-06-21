import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { AuthenticatedUser, TenantContext } from '@eduai365/shared-types';
import { getTenantContext } from '../../common/tenant/tenant.context';

export function assertTenantAccess(user: AuthenticatedUser): TenantContext {
  const tenant = getTenantContext();

  if (!tenant?.schoolId) {
    throw new BadRequestException('X-Tenant-Slug header is required');
  }

  if (user.role !== 'SUPER_ADMIN' && user.schoolId !== tenant.schoolId) {
    throw new ForbiddenException('Cross-tenant access denied');
  }

  return tenant;
}

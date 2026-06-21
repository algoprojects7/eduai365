import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { TenantPlan } from '@eduai365/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { runWithTenant } from './tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug = this.resolveTenantSlug(req);

    if (!slug) {
      return next();
    }

    const school = await this.prisma.client.school.findUnique({
      where: { slug },
      select: { id: true, slug: true, plan: true, isActive: true },
    });

    if (!school) {
      throw new NotFoundException(`School tenant '${slug}' not found`);
    }

    if (!school.isActive) {
      throw new BadRequestException(`School tenant '${slug}' is inactive`);
    }

    req.tenant = {
      schoolId: school.id,
      slug: school.slug,
      plan: school.plan as TenantPlan,
    };

    return runWithTenant(req.tenant, () => next());
  }

  private resolveTenantSlug(req: Request): string | undefined {
    const headerSlug = req.headers['x-tenant-slug'];
    if (typeof headerSlug === 'string' && headerSlug.length > 0) {
      return headerSlug.toLowerCase();
    }

    const headerId = req.headers['x-tenant-id'];
    if (typeof headerId === 'string' && headerId.length > 0) {
      return undefined; // resolved via school lookup in future if needed
    }

    const host = req.headers.host ?? '';
    const hostname = host.split(':')[0] ?? host;
    const subdomain = hostname.split('.')[0];
    if (subdomain && !['localhost', '127', 'api', 'www'].includes(subdomain)) {
      return subdomain.toLowerCase();
    }

    const pathMatch = req.path.match(/\/tenants\/([^/]+)/);
    if (pathMatch?.[1]) {
      return pathMatch[1].toLowerCase();
    }

    return undefined;
  }
}

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        schoolId: string;
        slug: string;
        plan: TenantPlan;
      };
    }
  }
}

import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/** Per-tenant request cap (stub — replace with Redis in production). */
const TENANT_LIMIT = 1000;
const WINDOW_MS = 60_000;

@Injectable()
export class TenantRateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, RateLimitBucket>();

  use(req: Request, res: Response, next: NextFunction) {
    if (this.isExcluded(req.path)) {
      return next();
    }

    const key = req.tenant?.schoolId ?? `ip:${req.ip ?? 'unknown'}`;
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, TENANT_LIMIT - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(TENANT_LIMIT));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > TENANT_LIMIT) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        `Tenant rate limit exceeded (${TENANT_LIMIT} requests per minute)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next();
  }

  private isExcluded(path: string): boolean {
    if (path.startsWith('/health') || path.includes('/health/')) {
      return true;
    }
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      return true;
    }
    if (path.includes('/integrations/webhooks/')) {
      return true;
    }
    return false;
  }
}

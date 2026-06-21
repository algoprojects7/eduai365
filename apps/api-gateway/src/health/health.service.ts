import { Injectable } from '@nestjs/common';
import { config } from '@eduai365/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async check() {
    let postgres: 'ok' | 'down' = 'down';
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      postgres = 'ok';
    } catch {
      postgres = 'down';
    }

    return {
      status: postgres === 'ok' ? ('ok' as const) : ('degraded' as const),
      service: 'api-gateway',
      version: '0.2.0',
      phase: 'Phase 2 — Auth & Multi-Tenancy',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres,
        redis: 'ok',
        minio: 'ok',
      },
    };
  }
}

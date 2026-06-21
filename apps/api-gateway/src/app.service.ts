import { Injectable } from '@nestjs/common';
import { config } from '@eduai365/config';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: config.appName,
      version: '0.2.0',
      phase: 'Phase 2 — Auth & Multi-Tenancy',
      docs: `${config.apiUrl}/docs`,
      health: `${config.apiUrl}/api/v1/health`,
    };
  }
}

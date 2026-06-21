import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { HealthModule } from '../health/health.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuditModule, HealthModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}

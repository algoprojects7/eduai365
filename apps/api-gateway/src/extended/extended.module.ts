import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { ExtendedController } from './extended.controller';
import { ExtendedService } from './extended.service';

@Module({
  imports: [AuditModule],
  controllers: [ExtendedController],
  providers: [ExtendedService],
})
export class ExtendedModule {}

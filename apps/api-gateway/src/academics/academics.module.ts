import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { AcademicsController } from './academics.controller';
import { AcademicsService } from './academics.service';

@Module({
  imports: [AuditModule],
  controllers: [AcademicsController],
  providers: [AcademicsService],
})
export class AcademicsModule {}

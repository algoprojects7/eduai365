import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { SchoolAdminController } from './school-admin.controller';
import { SchoolAdminService } from './school-admin.service';

@Module({
  imports: [AuditModule],
  controllers: [SchoolAdminController],
  providers: [SchoolAdminService],
})
export class SchoolAdminModule {}

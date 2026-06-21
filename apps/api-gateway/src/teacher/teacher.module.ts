import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [AuditModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}

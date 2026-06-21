import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { CommsController } from './comms.controller';
import { CommsService } from './comms.service';

@Module({
  imports: [AuditModule],
  controllers: [CommsController],
  providers: [CommsService],
})
export class CommsModule {}

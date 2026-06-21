import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuditModule],
  controllers: [ReportsController, PdfController],
  providers: [ReportsService, PdfService],
  exports: [ReportsService, PdfService],
})
export class ReportsModule {}

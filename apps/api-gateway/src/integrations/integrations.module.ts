import { Module } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IdempotencyStore } from './idempotency.store';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { WebhookSignatureService } from './webhook-signature.service';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, IdempotencyStore, WebhookSignatureService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}

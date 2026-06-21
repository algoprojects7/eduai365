import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AuditModule } from './common/audit/audit.module';
import { TenantMiddleware } from './common/tenant/tenant.middleware';
import { TenantRateLimitMiddleware } from './common/tenant/tenant-rate-limit.middleware';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { SchoolsModule } from './schools/schools.module';
import { SchoolAdminModule } from './school-admin/school-admin.module';
import { AcademicsModule } from './academics/academics.module';
import { FinanceModule } from './finance/finance.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';
import { ParentModule } from './parent/parent.module';
import { PlatformModule } from './platform/platform.module';
import { HrModule } from './hr/hr.module';
import { OperationsModule } from './operations/operations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommsModule } from './comms/comms.module';
import { ExtendedModule } from './extended/extended.module';
import { AiModule } from './ai/ai.module';
import { ReportsModule } from './reports/reports.module';
import { ComplianceModule } from './compliance/compliance.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    HealthModule,
    SchoolsModule,
    SchoolAdminModule,
    AcademicsModule,
    FinanceModule,
    TeacherModule,
    StudentModule,
    ParentModule,
    PlatformModule,
    HrModule,
    OperationsModule,
    NotificationsModule,
    CommsModule,
    ExtendedModule,
    AiModule,
    ReportsModule,
    IntegrationsModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware, TenantRateLimitMiddleware).forRoutes('*');
  }
}

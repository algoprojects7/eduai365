import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@eduai365/database';
import { getTenantContext } from '../common/tenant/tenant.context';

const TENANT_SCOPED_MODELS = new Set([
  'Student',
  'Class',
  'Section',
  'Subject',
  'AuditLog',
  'Subscription',
]);

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: ReturnType<PrismaService['createExtendedClient']>;

  constructor() {
    this.client = this.createExtendedClient();
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  private createExtendedClient() {
    return new PrismaClient().$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenant = getTenantContext();
            if (!tenant?.schoolId || !TENANT_SCOPED_MODELS.has(model)) {
              return query(args);
            }

            const schoolId = tenant.schoolId;
            const readOps = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'];
            const writeOps = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'];

            if (readOps.includes(operation)) {
              (args as { where?: Record<string, unknown> }).where = {
                ...(args as { where?: Record<string, unknown> }).where,
                schoolId,
              };
            }

            if (operation === 'create') {
              (args as { data: Record<string, unknown> }).data = {
                ...(args as { data: Record<string, unknown> }).data,
                schoolId,
              };
            }

            if (operation === 'createMany') {
              const raw = (args as { data: Record<string, unknown> | Record<string, unknown>[] }).data;
              (args as { data: Record<string, unknown>[] }).data = Array.isArray(raw)
                ? raw.map((row) => ({ ...row, schoolId }))
                : [{ ...raw, schoolId }];
            }

            if (writeOps.includes(operation) && operation !== 'create' && operation !== 'createMany') {
              (args as { where?: Record<string, unknown> }).where = {
                ...(args as { where?: Record<string, unknown> }).where,
                schoolId,
              };
            }

            return query(args);
          },
        },
      },
    });
  }
}

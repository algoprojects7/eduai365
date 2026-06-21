import { AsyncLocalStorage } from 'node:async_hooks';
import type { TenantContext } from '@eduai365/shared-types';

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

export function getRequiredTenantContext(): TenantContext {
  const ctx = getTenantContext();
  if (!ctx) {
    throw new Error('Tenant context is not set for this request');
  }
  return ctx;
}

export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

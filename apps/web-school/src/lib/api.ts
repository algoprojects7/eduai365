import type { ApiEnvelope } from '@/types/school';
import { clearTokens, getAccessToken, getTenantSlug } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const tenantSlug = getTenantSlug();
  if (tenantSlug) {
    headers.set('X-Tenant-Slug', tenantSlug);
  }

  return headers;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (response.status === 401) {
    clearTokens();
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      window.location.href = `${basePath}/login`;
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `Request failed (${response.status})`, response.status);
  }

  const json = (await response.json()) as ApiEnvelope<T>;
  return json.data;
}

export async function apiFetchPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const tenantSlug = getTenantSlug();
  if (tenantSlug) {
    headers.set('X-Tenant-Slug', tenantSlug);
  }

  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `Request failed (${response.status})`, response.status);
  }

  const json = (await response.json()) as ApiEnvelope<T>;
  return json.data;
}

export interface AppConfig {
  nodeEnv: string;
  appName: string;
  appUrl: string;
  apiUrl: string;
  apiPort: number;
  // ─── Domain & Portal URLs ──────────────────────────────
  domain: string;
  adminUrl: string;
  parentUrl: string;
  databaseUrl: string;
  redisUrl: string;
  minio: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    bucket: string;
    useSsl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  lokiUrl: string;
}

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

// ─── Role → Path Mapping ──────────────────────────────────
// Maps each role to its URL path prefix under the school subdomain.
// Roles with separate Next.js apps (teacher, student, parent) use basePath.
// Other roles are sections within web-school.
export const ROLE_PATH_MAP: Record<string, string> = {
  SUPER_ADMIN: '',
  PRINCIPAL: '',
  SCHOOL_ADMIN: '',
  VICE_PRINCIPAL: '',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT: '/parent',
  HR_MANAGER: '/hr',
  LIBRARIAN: '/librarian',
  TRANSPORT_MANAGER: '/transport',
  RECEPTIONIST: '/admission',
  CLUB_MANAGER: '/club',
  HOSTEL_WARDEN: '/hostel',
  ASSET_MANAGER: '/assets',
  OPERATOR: '/operator',
  ACCOUNTANT: '',
  EXAM_CONTROLLER: '',
  COUNSELLOR: '',
};

// ─── Platform Subdomains ──────────────────────────────────
// These subdomains are reserved for platform services and must NOT
// be treated as school slugs by tenant middleware.
export const PLATFORM_SUBDOMAINS = [
  'localhost',
  '127',
  'api',
  'www',
  'superadmin',
];

// ─── Dev-mode localhost port map ──────────────────────────
const DEV_ROLE_PORT_MAP: Record<string, number> = {
  TEACHER: 3003,
  STUDENT: 3004,
  PARENT: 3005,
};

// ─── CORS Helpers ─────────────────────────────────────────

const DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:6006',
];

/**
 * Returns the list of allowed CORS origins.
 * - Development: static localhost list
 * - Production: returns the dev list (for the decorator static value).
 *   For runtime validation use `isAllowedOrigin()` instead.
 */
export function getCorsOrigins(): string[] {
  return DEV_CORS_ORIGINS;
}

/**
 * Checks whether an origin is allowed for CORS.
 * - Development: matches localhost ports 3000–3005 and 6006
 * - Production: matches any *.eduai365.com or eduai365.com
 */
export function isAllowedOrigin(origin: string): boolean {
  // Always allow dev origins
  if (DEV_CORS_ORIGINS.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    const domain = getEnv('DOMAIN', 'localhost');

    if (domain === 'localhost') {
      // Dev mode: only localhost origins are allowed (checked above)
      return false;
    }

    // Production: match exact domain or any subdomain
    return (
      url.hostname === domain ||
      url.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Build a full URL for a role portal under a school's subdomain.
 * - Dev: http://localhost:{port}{path}
 * - Prod: https://{slug}.{domain}{rolePath}{path}
 */
export function buildSchoolPortalUrl(
  slug: string,
  role: string,
  path: string = '',
): string {
  const domain = getEnv('DOMAIN', 'localhost');
  const rolePath = ROLE_PATH_MAP[role] ?? '';

  if (domain === 'localhost') {
    // Development: use port-based routing
    const port = DEV_ROLE_PORT_MAP[role] ?? 3002;
    return `http://localhost:${port}${path}`;
  }

  // Production: use subdomain + path
  return `https://${slug}.${domain}${rolePath}${path}`;
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    appName: getEnv('APP_NAME', 'eduAI365'),
    appUrl: getEnv('APP_URL', 'http://localhost:3000'),
    apiUrl: getEnv('API_URL', 'http://localhost:4000'),
    apiPort: getEnvNumber('API_PORT', 4000),
    domain: getEnv('DOMAIN', 'localhost'),
    adminUrl: getEnv('ADMIN_URL', 'http://localhost:3001'),
    parentUrl: getEnv('PARENT_URL', 'http://localhost:3005'),
    databaseUrl: getEnv(
      'DATABASE_URL',
      'postgresql://educore:educore_dev@localhost:5432/educore_ai?schema=public',
    ),
    redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
    minio: {
      endpoint: getEnv('MINIO_ENDPOINT', 'localhost'),
      port: getEnvNumber('MINIO_PORT', 9000),
      accessKey: getEnv('MINIO_ACCESS_KEY', 'educore_minio'),
      secretKey: getEnv('MINIO_SECRET_KEY', 'educore_minio_secret'),
      bucket: getEnv('MINIO_BUCKET', 'educore-assets'),
      useSsl: getEnv('MINIO_USE_SSL', 'false') === 'true',
    },
    jwt: {
      secret: getEnv('JWT_SECRET', 'dev-secret-change-in-production'),
      expiresIn: getEnv('JWT_EXPIRES_IN', '15m'),
      refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    },
    lokiUrl: getEnv('LOKI_URL', 'http://localhost:3100'),
  };
}

export const config = loadConfig();

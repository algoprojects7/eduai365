export interface AppConfig {
  nodeEnv: string;
  appName: string;
  appUrl: string;
  apiUrl: string;
  apiPort: number;
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

export function loadConfig(): AppConfig {
  return {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    appName: getEnv('APP_NAME', 'eduAI365'),
    appUrl: getEnv('APP_URL', 'http://localhost:3000'),
    apiUrl: getEnv('API_URL', 'http://localhost:4000'),
    apiPort: getEnvNumber('API_PORT', 4000),
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

export interface PlatformDashboard {
  activeSchools: number;
  totalStudents: number;
  mrr: number;
  aiCalls: number;
}

export interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  studentCount: number;
  lastPayment: string | null;
  status: string;
  isVerified: boolean;
  mrr: number;
}

export interface RevenuePoint {
  month: string;
  mrr: number;
}

export interface AiUsagePoint {
  schoolId: string;
  schoolName: string;
  slug: string;
  aiCalls: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  uptime: number;
  dbLagMs: number;
  apiLatencyMs: number;
  dependencies: Record<string, { status: string; latencyMs?: number }>;
  timestamp: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

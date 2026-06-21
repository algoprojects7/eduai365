export type TenantPlan = 'CORE' | 'PRO' | 'ENTERPRISE';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
  | 'VICE_PRINCIPAL'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'ACCOUNTANT'
  | 'RECEPTIONIST'
  | 'LIBRARIAN'
  | 'TRANSPORT_MANAGER'
  | 'HR_MANAGER'
  | 'HOSTEL_WARDEN'
  | 'EXAM_CONTROLLER'
  | 'COUNSELLOR';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TenantContext {
  schoolId: string;
  slug: string;
  plan: TenantPlan;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  schoolSlug?: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

/** Optional stub for Phase 2 registration flow. */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  schoolSlug?: string;
}

export type PermissionCode =
  | 'super_admin:schools:read'
  | 'super_admin:schools:write'
  | 'super_admin:schools:delete'
  | 'super_admin:subscriptions:manage'
  | 'super_admin:users:manage'
  | 'school:settings:read'
  | 'school:settings:write'
  | 'school:users:read'
  | 'school:users:write'
  | 'school:reports:read'
  | 'students:read'
  | 'students:write'
  | 'students:admissions:manage'
  | 'students:attendance:read'
  | 'students:attendance:write'
  | 'finance:fees:read'
  | 'finance:fees:write'
  | 'finance:payments:read'
  | 'finance:payments:write'
  | 'academics:classes:read'
  | 'academics:classes:write'
  | 'academics:assignments:read'
  | 'academics:assignments:write'
  | 'academics:grades:read'
  | 'academics:grades:write'
  | 'hr:employees:read'
  | 'hr:employees:write'
  | 'hr:payroll:read'
  | 'hr:payroll:write'
  | 'library:books:read'
  | 'library:books:write'
  | 'library:issues:manage'
  | 'transport:routes:read'
  | 'transport:routes:write'
  | 'hostel:rooms:read'
  | 'hostel:rooms:write'
  | 'hostel:residents:manage'
  | 'exams:schedule:read'
  | 'exams:schedule:write'
  | 'exams:results:read'
  | 'exams:results:write'
  | 'notifications:read'
  | 'notifications:send'
  | 'counselling:sessions:read'
  | 'counselling:sessions:write'
  | 'assets:read'
  | 'assets:write'
  | 'assets:checkout'
  | 'alumni:read'
  | 'alumni:write'
  | 'inventory:read'
  | 'inventory:write';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: PermissionCode[];
  schoolId?: string;
  firstName?: string;
  lastName?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  dependencies?: Record<string, 'ok' | 'down'>;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface InAppNotificationsList {
  items: InAppNotification[];
  unreadCount: number;
}

export type {
  AccountDeletionResult,
  RecordConsentInput,
  UserConsentStatus,
  UserDataExport,
} from './compliance';

export type {
  AiAttendanceRiskStudent,
  AiChatRequest,
  AiChatResponse,
  AiCitation,
  AiCopilotRole,
  AiDashboardInsights,
  AiDropoutRiskStudent,
  AiFeeDefaultPrediction,
  AiInsightCard,
  AiInsightSeverity,
  AiLessonPlan,
  AiLessonPlanRequest,
  AiReportNarrative,
  AiReportNarrativeRequest,
  AiRiskLevel,
} from './ai';

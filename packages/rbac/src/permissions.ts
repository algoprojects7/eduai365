import type { PermissionCode } from '@eduai365/shared-types';

export const SUPER_ADMIN = {
  SCHOOLS_READ: 'super_admin:schools:read',
  SCHOOLS_WRITE: 'super_admin:schools:write',
  SCHOOLS_DELETE: 'super_admin:schools:delete',
  SUBSCRIPTIONS_MANAGE: 'super_admin:subscriptions:manage',
  USERS_MANAGE: 'super_admin:users:manage',
} as const satisfies Record<string, PermissionCode>;

export const SCHOOL = {
  SETTINGS_READ: 'school:settings:read',
  SETTINGS_WRITE: 'school:settings:write',
  USERS_READ: 'school:users:read',
  USERS_WRITE: 'school:users:write',
  REPORTS_READ: 'school:reports:read',
} as const satisfies Record<string, PermissionCode>;

export const STUDENTS = {
  READ: 'students:read',
  WRITE: 'students:write',
  ADMISSIONS_MANAGE: 'students:admissions:manage',
  ATTENDANCE_READ: 'students:attendance:read',
  ATTENDANCE_WRITE: 'students:attendance:write',
} as const satisfies Record<string, PermissionCode>;

export const FINANCE = {
  FEES_READ: 'finance:fees:read',
  FEES_WRITE: 'finance:fees:write',
  PAYMENTS_READ: 'finance:payments:read',
  PAYMENTS_WRITE: 'finance:payments:write',
} as const satisfies Record<string, PermissionCode>;

export const ACADEMICS = {
  CLASSES_READ: 'academics:classes:read',
  CLASSES_WRITE: 'academics:classes:write',
  ASSIGNMENTS_READ: 'academics:assignments:read',
  ASSIGNMENTS_WRITE: 'academics:assignments:write',
  GRADES_READ: 'academics:grades:read',
  GRADES_WRITE: 'academics:grades:write',
} as const satisfies Record<string, PermissionCode>;

export const HR = {
  EMPLOYEES_READ: 'hr:employees:read',
  EMPLOYEES_WRITE: 'hr:employees:write',
  PAYROLL_READ: 'hr:payroll:read',
  PAYROLL_WRITE: 'hr:payroll:write',
} as const satisfies Record<string, PermissionCode>;

export const LIBRARY = {
  BOOKS_READ: 'library:books:read',
  BOOKS_WRITE: 'library:books:write',
  ISSUES_MANAGE: 'library:issues:manage',
} as const satisfies Record<string, PermissionCode>;

export const TRANSPORT = {
  ROUTES_READ: 'transport:routes:read',
  ROUTES_WRITE: 'transport:routes:write',
} as const satisfies Record<string, PermissionCode>;

export const HOSTEL = {
  ROOMS_READ: 'hostel:rooms:read',
  ROOMS_WRITE: 'hostel:rooms:write',
  RESIDENTS_MANAGE: 'hostel:residents:manage',
} as const satisfies Record<string, PermissionCode>;

export const EXAMS = {
  SCHEDULE_READ: 'exams:schedule:read',
  SCHEDULE_WRITE: 'exams:schedule:write',
  RESULTS_READ: 'exams:results:read',
  RESULTS_WRITE: 'exams:results:write',
} as const satisfies Record<string, PermissionCode>;

export const NOTIFICATIONS = {
  READ: 'notifications:read',
  SEND: 'notifications:send',
} as const satisfies Record<string, PermissionCode>;

export const COUNSELLING = {
  SESSIONS_READ: 'counselling:sessions:read',
  SESSIONS_WRITE: 'counselling:sessions:write',
} as const satisfies Record<string, PermissionCode>;

export const EXTENDED = {
  ASSETS_READ: 'assets:read',
  ASSETS_WRITE: 'assets:write',
  ASSETS_CHECKOUT: 'assets:checkout',
  ALUMNI_READ: 'alumni:read',
  ALUMNI_WRITE: 'alumni:write',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
} as const satisfies Record<string, PermissionCode>;

export const PERMISSION_MODULES = {
  SUPER_ADMIN,
  SCHOOL,
  STUDENTS,
  FINANCE,
  ACADEMICS,
  HR,
  LIBRARY,
  TRANSPORT,
  HOSTEL,
  EXAMS,
  NOTIFICATIONS,
  COUNSELLING,
  EXTENDED,
} as const;

export const ALL_PERMISSION_CODES = [
  ...Object.values(SUPER_ADMIN),
  ...Object.values(SCHOOL),
  ...Object.values(STUDENTS),
  ...Object.values(FINANCE),
  ...Object.values(ACADEMICS),
  ...Object.values(HR),
  ...Object.values(LIBRARY),
  ...Object.values(TRANSPORT),
  ...Object.values(HOSTEL),
  ...Object.values(EXAMS),
  ...Object.values(NOTIFICATIONS),
  ...Object.values(COUNSELLING),
  ...Object.values(EXTENDED),
] as const satisfies readonly PermissionCode[];

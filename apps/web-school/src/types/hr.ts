export const LEAVE_TYPES = ['CL', 'SL', 'EL', 'ML', 'PL'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const PAYROLL_RUN_STATUSES = ['DRAFT', 'PROCESSED', 'PAID'] as const;
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export const PAYROLL_ENTRY_STATUSES = ['DRAFT', 'PROCESSED', 'PAID'] as const;
export type PayrollEntryStatus = (typeof PAYROLL_ENTRY_STATUSES)[number];

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  substituteId?: string | null;
  substituteName?: string | null;
  createdAt: string;
}

export interface CreateLeaveInput {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  substituteId?: string;
}

export interface UpdateLeaveInput {
  status: LeaveStatus;
  substituteId?: string;
}

export interface LeaveBalance {
  type: LeaveType;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveTrendPoint {
  month: string;
  CL: number;
  SL: number;
  EL: number;
  ML: number;
  PL: number;
}

export interface LeaveCalendarEmployee {
  id: string;
  name: string;
  department: string;
  leaveType: LeaveType;
}

export interface LeaveCalendarDay {
  date: string;
  employees: LeaveCalendarEmployee[];
}

export interface LeaveCalendarResponse {
  month: string;
  days: LeaveCalendarDay[];
}

export interface PayrollRunSummary {
  id: string;
  month: number;
  year: number;
  status: PayrollRunStatus;
  totalPayable: number;
  totalPf: number;
  totalTds: number;
  netPayable: number;
  processedAt?: string | null;
  entryCount: number;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  basic: number;
  hra: number;
  da: number;
  pf: number;
  tds: number;
  net: number;
  status: PayrollEntryStatus;
}

export interface PayrollRunDetail extends PayrollRunSummary {
  entries: PayrollEntry[];
}

export interface RunPayrollInput {
  month: number;
  year: number;
}

export interface SalarySlip {
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  month: number;
  year: number;
  schoolName: string;
  schoolAddress: string;
  schoolLogoUrl?: string | null;
  payDate: string;
  basic: number;
  hra: number;
  da: number;
  gross: number;
  pf: number;
  tds: number;
  net: number;
  bankAccount?: string | null;
  pan?: string | null;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  CL: 'Casual Leave',
  SL: 'Sick Leave',
  EL: 'Earned Leave',
  ML: 'Maternity Leave',
  PL: 'Paternity Leave',
};

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const EMPLOYMENT_TYPES = ['TEACHING', 'NON_TEACHING', 'CONTRACT'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const STAFF_ROLES = [
  'TEACHER',
  'PRINCIPAL',
  'VICE_PRINCIPAL',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'LIBRARIAN',
  'TRANSPORT_MANAGER',
  'HR_MANAGER',
  'HOSTEL_WARDEN',
  'EXAM_CONTROLLER',
  'COUNSELLOR',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export interface EmployeeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  schoolId: string;
  employeeId: string;
  department: string;
  designation: string;
  joinDate: string;
  bloodGroup: string;
  dateOfBirth?: string;
  aadhaar?: string | null;
  pan?: string | null;
  qualifications: unknown[];
  payGrade: string;
  basicSalary: number | string;
  hra: number | string;
  da: number | string;
  pfPercent: number | string;
  tdsPercent: number | string;
  employmentType: EmploymentType;
  user: EmployeeUser;
  leaveBalances?: LeaveBalance[];
}

export interface EmployeeStats {
  total: number;
  teaching: number;
  nonTeaching: number;
  onLeave: number;
}

export interface EnrollEmployeeInput {
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  phone?: string;
  department: string;
  designation: string;
  joinDate: string;
  bloodGroup: string;
  dateOfBirth?: string;
  aadhaar?: string;
  pan?: string;
  qualifications?: unknown[];
  payGrade: string;
  basicSalary: number;
  hra: number;
  da: number;
  pfPercent: number;
  tdsPercent: number;
  employmentType: EmploymentType;
}

export interface EnrollEmployeeResult {
  employee: EmployeeProfile;
  temporaryPassword: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  designation?: string;
  joinDate?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  aadhaar?: string;
  pan?: string;
  qualifications?: unknown[];
  payGrade?: string;
  basicSalary?: number;
  hra?: number;
  da?: number;
  pfPercent?: number;
  tdsPercent?: number;
  employmentType?: EmploymentType;
}

export interface SalaryBreakdown {
  gross: number;
  pf: number;
  tds: number;
  net: number;
}

export type SubstitutionStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED';

export interface SubstitutionAssignment {
  id: string;
  absentTeacherId: string;
  substituteTeacherId: string;
  classId: string;
  sectionId?: string | null;
  date: string;
  period: number;
  status: SubstitutionStatus;
  aiMatchScore?: number | null;
  absentTeacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  substituteTeacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class: { id: string; name: string; grade?: string };
  section?: { id: string; name: string } | null;
}

export interface AssignSubstitutionInput {
  absentTeacherId: string;
  substituteTeacherId: string;
  classId: string;
  sectionId?: string;
  date: string;
  period: number;
}

export interface SubstitutionSuggestion {
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  employeeId: string;
  department: string;
  aiMatchScore: number;
  availablePeriods: number[];
}

export interface AbsentScheduleSlot {
  id: string;
  period: number;
  classId: string;
  sectionId?: string | null;
  subject?: { id: string; name: string; code: string };
}

export interface SubstitutionSuggestionsResponse {
  absentTeacherId: string;
  date: string;
  absentSchedule: AbsentScheduleSlot[];
  suggestions: SubstitutionSuggestion[];
}

export interface DepartmentFacultyMetrics {
  department: string;
  count: number;
  teaching: number;
  nonTeaching: number;
  contract: number;
}

export interface ContractExpiryAlert {
  employeeId: string;
  name: string;
  department: string;
  contractExpiry: string;
  aiAlert: boolean;
  aiRiskScore: number;
}

export interface FacultyAnalytics {
  totalFaculty: number;
  activeFaculty: number;
  byDepartment: DepartmentFacultyMetrics[];
  contractsExpiring: ContractExpiryAlert[];
  aiInsights: {
    renewalRecommended: number;
    message: string;
  };
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  TEACHING: 'Teaching',
  NON_TEACHING: 'Non-Teaching',
  CONTRACT: 'Contract',
};

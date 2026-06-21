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

export interface StudentRow {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  class?: string | { name?: string };
  className?: string;
  status: string;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  admissionNo: string;
  class: string;
  section: string;
}

export interface TeacherRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
}

export interface SchoolProfile {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  slug: string;
  settings?: {
    disabledServices?: string[];
    principalRestrictedModules?: string[];
    sessionEndingMonth?: string;
    admissionFeeCategories?: string[];
    monthlyFeeCategories?: string[];
  };
}

export interface UpdateSchoolProfileInput {
  name?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  principalRestrictedModules?: string[];
  sessionEndingMonth?: string;
  admissionFeeCategories?: string[];
  monthlyFeeCategories?: string[];
}

export interface SchoolDashboard {
  enrolledStudents: number;
  activeStaff: number;
  avgAttendance: number;
  feesCollected: number;
  feesTarget: number;
  aiInsights: {
    dropoutRiskCount: number;
    feeDefaultPrediction: string;
  };
  plan: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  submittedAt: string;
}

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

export interface ParentChild {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  section: string;
}

export interface ParentDashboard {
  parentName: string;
  children: ParentChild[];
}

export interface ChildAcademics {
  gpa: number;
  rank: number;
  totalStudents: number;
  termResult: string;
  subjects: { name: string; grade: string; score: number }[];
}

export interface ChildAttendance {
  monthlyPercent: number;
  presentDays: number;
  totalDays: number;
}

export interface ParentAiAlert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ChildFees {
  status: string;
  outstandingAmount: number;
  dueDate: string;
  paymentUrl: string;
  sessionEnded?: boolean;
  sessionEndingMonth?: string;
}

export interface ExamScheduleItem {
  id: string;
  name: string;
  subject: string;
  date: string;
  room: string;
}

export interface ChildExams {
  exams: ExamScheduleItem[];
}

export interface ParentMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  sentAt: string;
  unread: boolean;
}

export interface GpsTracking {
  enabled: boolean;
  lastLocation: string;
  batteryPercent: number;
  lastSync: string;
}

export interface HealthStatus {
  status: string;
  lastCheckup: string;
  bloodGroup?: string;
}

export interface UniformStatus {
  status: string;
  size: string;
  lastIssued: string;
}

export interface ChildLibraryBook {
  id: string;
  title: string;
  author: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: 'ISSUED' | 'RETURNED';
}

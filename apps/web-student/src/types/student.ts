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

export type AssignmentPriority = 'high' | 'medium' | 'low';

export interface StudentDashboard {
  studentName: string;
  className: string;
  sectionName: string;
  overallGpa: number;
  overallAttendance: number;
  studyRecommendations: StudyRecommendation[];
  libraryBooks?: LibraryBook[];
  clubs?: ClubMembership[];
}

export interface StudentCourse {
  id: string;
  subject: string;
  teacher: string;
  gradePercent: number;
  nextClass: string;
  attendancePercent: number;
}

export interface StudentAssignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: AssignmentPriority;
  status: string;
}

export interface AttendanceDay {
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
}

export interface StudentAttendance {
  monthlyPercent: number;
  presentDays: number;
  totalDays: number;
  heatmap: AttendanceDay[];
}

export interface StudyRecommendation {
  id: string;
  title: string;
  description: string;
  subject: string;
  priority: AssignmentPriority;
}

export interface PerformanceSubject {
  subject: string;
  score: number;
  marksObtained?: number;
  maxMarks?: number;
  grade?: string;
}

export interface StudentPerformance {
  subjects: PerformanceSubject[];
  exam?: {
    id: string;
    name: string;
    term: string;
  } | null;
  radar?: PerformanceSubject[];
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: 'ISSUED' | 'RETURNED';
}

export interface ClubMembership {
  id: string;
  name: string;
  role: string;
  nextEvent?: string;
}

export interface StudentFees {
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  outstandingAmount: number;
  dueDate: string;
  paymentUrl: string;
}

export interface TimetableSlot {
  period: number;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  isCurrent?: boolean;
}

export interface StudentTimetableToday {
  date: string;
  slots: TimetableSlot[];
}

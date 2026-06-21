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

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface TeacherClass {
  id: string;
  name: string;
  section: string;
  subject: string;
  studentCount: number;
  attendanceToday?: number;
  nextClassAt?: string;
}

export interface AttendanceStudent {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  classId: string;
  date: string;
  students: AttendanceStudent[];
  summary: { present: number; absent: number; late: number };
}

export interface UpdateAttendanceInput {
  classId: string;
  date: string;
  updates: { studentId: string; status: AttendanceStatus }[];
}

export interface GradebookColumn {
  id: string;
  name: string;
  maxScore: number;
}

export interface GradebookEntry {
  studentId: string;
  studentName: string;
  rollNo: string;
  scores: Record<string, number | null>;
  average: number;
}

export interface Gradebook {
  classId: string;
  className: string;
  columns: GradebookColumn[];
  entries: GradebookEntry[];
}

export interface HomeworkItem {
  id: string;
  title: string;
  classId: string;
  className: string;
  dueDate: string;
  submittedCount: number;
  totalCount: number;
  status: string;
}

export interface CreateHomeworkInput {
  title: string;
  classId: string;
  description?: string;
  dueDate: string;
}

export interface TimetableSlot {
  id: string;
  subject: string;
  className: string;
  room: string;
  startTime: string;
  endTime: string;
}

export interface ParentMessage {
  id: string;
  parentName: string;
  studentName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  unread: boolean;
}

export interface ExamDuty {
  id: string;
  examName: string;
  date: string;
  time: string;
  room: string;
  role: string;
}

export interface SyllabusChapter {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface SyllabusTracker {
  classId: string;
  className: string;
  subject: string;
  totalChapters: number;
  completedChapters: number;
  chapters: SyllabusChapter[];
}

export interface TeacherDashboard {
  classes: TeacherClass[];
  todayAttendanceSummary: { present: number; absent: number; late: number; total: number };
  gradebookPreview: Gradebook | null;
  homework: HomeworkItem[];
  syllabus: SyllabusTracker[];
  messages: ParentMessage[];
  examDuties: ExamDuty[];
  timetableToday: TimetableSlot[];
  kpis: {
    totalClasses: number;
    pendingHomework: number;
    unreadMessages: number;
    todayPeriods: number;
  };
}

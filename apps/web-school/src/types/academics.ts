export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'PUBLISHED';

export interface ExamListItem {
  id: string;
  name: string;
  term: string;
  academicYear: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface ExamScheduleEntry {
  id?: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  maxMarks: number;
}

export interface ExamDetail extends ExamListItem {
  scheduleEntries: ExamScheduleEntry[];
}

export interface ExamResultSubject {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
}

export interface ExamResultRow {
  studentId: string;
  studentName: string;
  subjects: ExamResultSubject[];
}

export interface UpdateExamResultInput {
  subjects: Array<{ subjectId: string; marksObtained: number }>;
}

export type CalendarEventType = 'EXAM' | 'HOLIDAY' | 'EVENT' | 'PTM' | 'SPORTS';

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  description?: string;
}

export interface CreateCalendarEventInput {
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  description?: string;
}

export interface ReportCardStudent {
  id: string;
  name: string;
  admissionNo?: string;
  class?: string;
  section?: string;
  rollNo?: string;
}

export interface ReportCardSubject {
  name: string;
  marks: number;
  maxMarks: number;
  grade: string;
}

export interface ReportCard {
  student: ReportCardStudent;
  term: string;
  subjects: ReportCardSubject[];
  attendancePercent: number;
  remarks: string;
  result: 'PASS' | 'FAIL';
}

export interface HomeworkItem {
  id: string;
  title: string;
  subject?: string;
  className?: string;
  dueDate?: string;
  status?: string;
}

export type AdmissionStage =
  | 'INQUIRY'
  | 'APPLICATION'
  | 'ENTRANCE_TEST'
  | 'INTERVIEW'
  | 'OFFER'
  | 'FEE_PAID'
  | 'ENROLLED';

export interface AdmissionApplication {
  id: string;
  applicantName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  targetClass: string;
  previousSchool: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  parentWhatsapp?: string;
  stage: AdmissionStage;
  aiScore: number | null;
  createdAt: string;
}

export interface AdmissionStats {
  applications: number;
  shortlisted: number;
  enrolled: number;
  seatsRemaining: number;
}

export interface SeatAvailability {
  grade: string;
  totalSeats: number;
  filledSeats: number;
  available: number;
}

export interface CreateAdmissionInput {
  applicantName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  targetClass: string;
  previousSchool: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  parentWhatsapp: string;
}

export interface UpdateAdmissionStageInput {
  stage: AdmissionStage;
}

export interface TimetableSubject {
  name: string;
  code: string;
}

export interface TimetableTeacher {
  firstName: string;
  lastName: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number | string;
  period: number;
  subject: TimetableSubject;
  teacher: TimetableTeacher;
  room: string;
  startTime: string;
  endTime: string;
}

export interface TimetableResponse {
  slots: TimetableSlot[];
}

export interface ClassSectionOption {
  classId: string;
  sectionId: string;
  grade: string;
  section: string;
  label: string;
}

export const ADMISSION_STAGES: readonly {
  id: AdmissionStage;
  label: string;
}[] = [
  { id: 'INQUIRY', label: 'Inquiry' },
  { id: 'APPLICATION', label: 'Application' },
  { id: 'ENTRANCE_TEST', label: 'Entrance Test' },
  { id: 'INTERVIEW', label: 'Interview' },
  { id: 'OFFER', label: 'Offer' },
  { id: 'FEE_PAID', label: 'Fee Paid' },
  { id: 'ENROLLED', label: 'Enrolled' },
] as const;

export const TIMETABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const TIMETABLE_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

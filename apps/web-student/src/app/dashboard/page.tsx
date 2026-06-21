'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  KpiBentoCard,
  chartColors,
  rechartsAxisProps,
} from '@eduai365/ui';
import {
  BookOpen,
  CalendarDays,
  Clock,
  ExternalLink,
  Library,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { StudentShell } from '@/components/student-shell';
import { apiFetch } from '@/lib/api';
import { formatInr, formatPercent, formatShortDate } from '@/lib/format';
import type {
  AssignmentPriority,
  ClubMembership,
  LibraryBook,
  StudentAssignment,
  StudentAttendance,
  StudentCourse,
  StudentDashboard,
  StudentFees,
  StudentPerformance,
  StudentTimetableToday,
  StudyRecommendation,
  AttendanceDay,
  TimetableSlot,
  PerformanceSubject,
} from '@/types/student';

interface RawCourse {
  id?: string;
  subjectId?: string;
  subjectName?: string;
  subject?: string;
  name?: string;
  teacher?: string;
  gradePercent?: number;
  marksObtained?: number;
  maxMarks?: number;
  attendancePercent?: number;
  nextClass?: string;
}

// Raw shape returned by /student/dashboard (differs from StudentDashboard type)
interface RawStudentDashboard {
  courses: RawCourse[];
  upcomingAssignments: unknown[];
  attendancePercent: number;
  feeStatus: unknown;
  todayTimetable: unknown;
  libraryBooks?: LibraryBook[];
  clubs?: ClubMembership[];
  studentName?: string;
  className?: string;
  sectionName?: string;
  overallGpa?: number;
  overallAttendance?: number;
  studyRecommendations?: StudyRecommendation[];
}

// Raw shape returned by /student/attendance
interface RawStudentAttendance {
  month?: string;
  overallPercent?: number;
  monthlyPercent?: number;
  presentDays?: number;
  totalDays?: number;
  heatmap: AttendanceDay[];
}

// Raw shape returned by /student/timetable/today
interface RawTimetableToday {
  dayOfWeek?: number;
  periods?: TimetableSlot[];
  slots?: TimetableSlot[];
  date?: string;
}

// Raw shape returned by /student/fees
interface RawStudentFees {
  outstanding?: number;
  outstandingAmount?: number;
  status?: string;
  invoices?: unknown[];
  dueDate?: string;
  paymentUrl?: string;
}

// Raw shape returned by /student/performance
interface RawStudentPerformance {
  subjects?: PerformanceSubject[] | string[];
  radar?: PerformanceSubject[];
  exam?: unknown;
}

interface DashboardData {
  dashboard: StudentDashboard;
  courses: StudentCourse[];
  assignments: StudentAssignment[];
  attendance: StudentAttendance;
  performance: StudentPerformance;
  fees: StudentFees;
  timetable: StudentTimetableToday;
  libraryBooks: LibraryBook[];
  clubs: ClubMembership[];
}

const PRIORITY_VARIANT: Record<AssignmentPriority, 'error' | 'warning' | 'info'> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const HEATMAP_COLORS: Record<string, string> = {
  present: 'bg-success',
  absent: 'bg-error',
  late: 'bg-warning',
  holiday: 'bg-surface-container-high',
};

function AttendanceRing({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5eeff" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={chartColors.primary}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-headline-md font-bold text-on-surface">{formatPercent(percent, 0)}</span>
        <span className="text-label-md text-on-surface-variant">This month</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [
          rawDashboard,
          rawCourses,
          rawAssignments,
          rawAttendance,
          rawPerformance,
          rawFees,
          rawTimetable,
        ] = await Promise.all([
          apiFetch<RawStudentDashboard>('/student/dashboard'),
          apiFetch<unknown[]>('/student/courses'),
          apiFetch<StudentAssignment[]>('/student/assignments'),
          apiFetch<RawStudentAttendance>('/student/attendance'),
          apiFetch<RawStudentPerformance>('/student/performance'),
          apiFetch<RawStudentFees>('/student/fees'),
          apiFetch<RawTimetableToday>('/student/timetable/today'),
        ]);

        if (!cancelled) {
          // Normalise API responses to the shapes the UI expects
          const normalised: DashboardData = {
            dashboard: {
              studentName: rawDashboard.studentName ?? '',
              className: rawDashboard.className ?? '',
              sectionName: rawDashboard.sectionName ?? '',
              overallGpa: rawDashboard.overallGpa ?? 0,
              overallAttendance: rawDashboard.attendancePercent ?? rawDashboard.overallAttendance ?? 0,
              studyRecommendations: rawDashboard.studyRecommendations ?? [],
              libraryBooks: rawDashboard.libraryBooks ?? [],
              clubs: rawDashboard.clubs ?? [],
            },
            courses: Array.isArray(rawCourses)
              ? (rawCourses as RawCourse[]).map((c, idx) => ({
                  id: (c.subjectId ?? c.id ?? `course-${idx}`) as string,
                  subject: (c.subjectName ?? c.subject ?? c.name ?? 'Unknown') as string,
                  teacher: (c.teacher ?? '—') as string,
                  gradePercent: typeof c.gradePercent === 'number'
                    ? c.gradePercent
                    : typeof c.marksObtained === 'number' && typeof c.maxMarks === 'number' && c.maxMarks > 0
                      ? Math.round((c.marksObtained as number / c.maxMarks as number) * 100)
                      : 0,
                  nextClass: (c.nextClass ?? '—') as string,
                  attendancePercent: (c.attendancePercent ?? 0) as number,
                }))
              : [],
            assignments: Array.isArray(rawAssignments) ? rawAssignments : [],
            attendance: {
              // API returns overallPercent; type expects monthlyPercent
              monthlyPercent: rawAttendance.overallPercent ?? rawAttendance.monthlyPercent ?? 0,
              presentDays: rawAttendance.presentDays ?? rawAttendance.heatmap?.filter(
                (d) => {
                  const s = d.status.toLowerCase();
                  return s === 'present' || s === 'late';
                }
              ).length ?? 0,
              totalDays: rawAttendance.totalDays ?? rawAttendance.heatmap?.length ?? 0,
              heatmap: (rawAttendance.heatmap ?? []).map((d) => ({
                date: d.date,
                // Normalise status to lowercase for HEATMAP_COLORS map
                status: d.status.toLowerCase() as AttendanceDay['status'],
              })),
            },
            performance: {
              subjects: (rawPerformance.radar ?? []).map((r) =>
                typeof r === 'object' && r !== null
                  ? {
                      subject: r.subject,
                      score: r.score,
                      marksObtained: r.marksObtained,
                      maxMarks: r.maxMarks,
                      grade: r.grade,
                    }
                  : { subject: String(r), score: 0 }
              ),
              exam: rawPerformance.exam
                ? (rawPerformance.exam as { id: string; name: string; term: string })
                : null,
              radar: (rawPerformance.radar ?? []).map((r) =>
                typeof r === 'object' && r !== null
                  ? {
                      subject: r.subject,
                      score: r.score,
                      marksObtained: r.marksObtained,
                      maxMarks: r.maxMarks,
                      grade: r.grade,
                    }
                  : { subject: String(r), score: 0 }
              ),
            },
            fees: {
              // API returns outstanding; type expects outstandingAmount
              outstandingAmount: rawFees.outstanding ?? rawFees.outstandingAmount ?? 0,
              // API status values are uppercase; type expects lowercase
              status: (rawFees.status?.toLowerCase() ?? 'paid') as StudentFees['status'],
              dueDate: rawFees.dueDate ?? '',
              paymentUrl: rawFees.paymentUrl ?? '',
            },
            timetable: {
              date: rawTimetable.date ?? new Date().toISOString().slice(0, 10),
              // API returns periods[]; type expects slots[]
              slots: rawTimetable.periods ?? rawTimetable.slots ?? [],
            },
            libraryBooks: rawDashboard.libraryBooks ?? [],
            clubs: rawDashboard.clubs ?? [],
          };
          setData(normalised);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const studentName = data?.dashboard.studentName ?? 'Student';
  const classLabel = data
    ? `${data.dashboard.className}${data.dashboard.sectionName ? ` · ${data.dashboard.sectionName}` : ''}`
    : '';

  return (
    <StudentShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">My Dashboard</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Welcome back, {studentName}
            {classLabel ? ` · ${classLabel}` : ''}. Here is your learning overview for today.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading your dashboard…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {data && !loading && (
          <>
            {data.fees.status !== 'paid' && data.fees.outstandingAmount > 0 && (
              <div className="flex flex-col gap-4 rounded-lg border border-warning/30 bg-warning/5 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <Wallet className="h-5 w-5 text-warning" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-title-lg font-semibold text-on-surface">Fee payment due</p>
                    <p className="text-body-md text-on-surface-variant">
                      Outstanding {formatInr(data.fees.outstandingAmount)} · Due{' '}
                      {formatShortDate(data.fees.dueDate)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => window.open(data.fees.paymentUrl, '_blank', 'noopener,noreferrer')}
                >
                  Pay Now
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiBentoCard
                label="Overall GPA"
                value={(data.dashboard.overallGpa ?? 0).toFixed(1)}
                icon={Trophy}
                trend={{ value: 'Term average', direction: 'neutral' }}
              />
              <KpiBentoCard
                label="Attendance"
                value={formatPercent(data.dashboard.overallAttendance ?? 0, 0)}
                icon={CalendarDays}
                trend={{ value: 'This term', direction: 'up' }}
              />
              <KpiBentoCard
                label="Courses"
                value={data.courses.length}
                icon={BookOpen}
              />
              <KpiBentoCard
                label="Pending Tasks"
                value={data.assignments.filter((a) => a.status.toUpperCase() !== 'SUBMITTED').length}
                icon={Clock}
              />
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-title-lg font-semibold text-on-surface">My Courses</h2>
                <Badge variant="info">{data.courses.length} active</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.courses.map((course) => (
                  <div key={course.id} className="bento-card-interactive space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-title-lg font-semibold text-on-surface">{course.subject}</p>
                        <p className="text-body-md text-on-surface-variant">{course.teacher}</p>
                      </div>
                      <Badge variant="success">{formatPercent(course.gradePercent, 0)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-body-md">
                      <div>
                        <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                          Next class
                        </p>
                        <p className="font-medium text-on-surface">{course.nextClass}</p>
                      </div>
                      <div>
                        <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                          Attendance
                        </p>
                        <p className="font-medium text-on-surface">
                          {formatPercent(course.attendancePercent, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="bento-card lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-title-lg font-semibold text-on-surface">Upcoming Assignments</h2>
                  <Badge variant="ai">Priority sorted</Badge>
                </div>
                <div className="space-y-3">
                  {data.assignments.slice(0, 5).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-gray-300/20 bg-surface-faint/50 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-on-surface">{assignment.title}</p>
                        <p className="text-body-md text-on-surface-variant">
                          {assignment.subject} · Due {formatShortDate(assignment.dueDate)}
                        </p>
                      </div>
                      <Badge variant={PRIORITY_VARIANT[assignment.priority]}>
                        {assignment.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bento-card">
                <h2 className="mb-4 text-title-lg font-semibold text-on-surface">Today&apos;s Timetable</h2>
                <div className="space-y-3">
                  {data.timetable.slots.map((slot) => {
                    // API may return subject/teacher as nested objects
                    const raw = slot as unknown as Record<string, unknown>;
                    const subjectName = typeof raw.subject === 'object' && raw.subject !== null
                      ? ((raw.subject as Record<string, unknown>).name as string ?? '')
                      : (slot.subject ?? '');
                    const teacherName = typeof raw.teacher === 'object' && raw.teacher !== null
                      ? `${(raw.teacher as Record<string, unknown>).firstName ?? ''} ${(raw.teacher as Record<string, unknown>).lastName ?? ''}`.trim()
                      : (slot.teacher ?? '—');
                    return (
                      <div
                        key={slot.period}
                        className={`rounded-lg border px-3 py-2 ${
                          slot.isCurrent
                            ? 'border-secondary bg-secondary/5'
                            : 'border-gray-300/20 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-on-surface">{subjectName}</p>
                          <span className="text-label-md text-on-surface-variant">
                            {slot.startTime}–{slot.endTime}
                          </span>
                        </div>
                        <p className="text-body-md text-on-surface-variant">
                          {teacherName}{slot.room ? ` · ${slot.room}` : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="bento-card lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-title-lg font-semibold text-on-surface">Latest Exam Results</h2>
                    <p className="text-body-md text-on-surface-variant">
                      {data.performance.exam ? `${data.performance.exam.name} (${data.performance.exam.term})` : 'No recent exam results'}
                    </p>
                  </div>
                  {data.performance.exam && (
                    <Badge variant="success">Published</Badge>
                  )}
                </div>

                {data.performance.radar && data.performance.radar.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-body-md">
                      <thead>
                        <tr className="border-b border-gray-200 text-label-md uppercase tracking-wider text-on-surface-variant">
                          <th className="pb-3 pt-2 font-semibold">Subject</th>
                          <th className="pb-3 pt-2 font-semibold text-center">Marks</th>
                          <th className="pb-3 pt-2 font-semibold text-center">Percentage</th>
                          <th className="pb-3 pt-2 font-semibold text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.performance.radar.map((r) => (
                          <tr key={r.subject} className="hover:bg-surface-faint/30">
                            <td className="py-3.5 font-medium text-on-surface">{r.subject}</td>
                            <td className="py-3.5 text-center text-on-surface-variant">
                              {r.marksObtained !== undefined && r.maxMarks !== undefined ? `${r.marksObtained}/${r.maxMarks}` : '—'}
                            </td>
                            <td className="py-3.5 text-center font-medium text-on-surface">
                              {r.score}%
                            </td>
                            <td className="py-3.5 text-right">
                              <span className={`inline-block rounded px-2.5 py-0.5 text-label-md font-semibold ${
                                r.grade && ['A', 'A+', 'O', 'E', 'B'].includes(r.grade) 
                                  ? 'bg-success/10 text-success' 
                                  : r.grade && ['C', 'D'].includes(r.grade)
                                    ? 'bg-info/10 text-info' 
                                    : 'bg-warning/10 text-warning'
                              }`}>
                                {r.grade || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-body-md text-on-surface-variant">No exam results available.</p>
                )}
              </section>

              <section className="bento-card">
                <h2 className="mb-4 text-title-lg font-semibold text-on-surface">
                  Subject Performance
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.performance.subjects}>
                      <PolarGrid stroke={chartColors.grid} />
                      <PolarAngleAxis dataKey="subject" {...rechartsAxisProps} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} {...rechartsAxisProps} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke={chartColors.aiViolet}
                        fill={chartColors.aiViolet}
                        fillOpacity={0.35}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, 'Score']}
                        contentStyle={chartColors ? { borderRadius: '8px' } : undefined}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <section className="bento-card">
                <h2 className="mb-4 text-title-lg font-semibold text-on-surface">Attendance</h2>
                <div className="flex flex-col gap-6">
                  <AttendanceRing percent={data.attendance.monthlyPercent} />
                  <div>
                    <p className="text-body-md text-on-surface-variant">
                      {data.attendance.presentDays} of {data.attendance.totalDays} days present this month
                    </p>
                    <div className="mt-4 grid grid-cols-7 gap-1">
                      {data.attendance.heatmap.slice(0, 28).map((day) => (
                        <div
                          key={day.date}
                          title={`${day.date}: ${day.status}`}
                          className={`aspect-square rounded-sm ${HEATMAP_COLORS[day.status] ?? 'bg-surface-container'}`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-label-md text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-success" /> Present
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-warning" /> Late
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-error" /> Absent
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bento-card">
                <div className="mb-4 flex items-center gap-2">
                  <Library className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                  <h2 className="text-title-lg font-semibold text-on-surface">Library Books</h2>
                </div>
                {data.libraryBooks.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">No library logs found for the last 3 months.</p>
                ) : (
                  <div className="space-y-3">
                    {data.libraryBooks.map((book) => {
                      const isOverdue = book.status === 'ISSUED' && new Date(book.dueDate) < new Date();
                      const badgeVariant = book.status === 'RETURNED' ? 'success' : isOverdue ? 'error' : 'info';
                      const badgeText = book.status === 'RETURNED' ? 'Returned' : isOverdue ? 'Overdue' : 'Issued';

                      return (
                        <div key={book.id} className="rounded-lg border border-gray-300/20 px-4 py-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-on-surface">{book.title}</p>
                            <p className="text-body-sm text-on-surface-variant mt-0.5">{book.author}</p>
                            <p className="text-body-md text-on-surface-variant mt-1.5">
                              <span className="text-label-md text-on-surface-variant uppercase font-semibold">Issued:</span> {formatShortDate(book.issuedAt)} ·{' '}
                              {book.status === 'RETURNED' ? (
                                <>
                                  <span className="text-label-md text-on-surface-variant uppercase font-semibold">Returned:</span> {book.returnedAt ? formatShortDate(book.returnedAt) : '—'}
                                </>
                              ) : (
                                <>
                                  <span className="text-label-md text-on-surface-variant uppercase font-semibold">Due:</span> {formatShortDate(book.dueDate)}
                                </>
                              )}
                            </p>
                          </div>
                          <Badge variant={badgeVariant}>{badgeText}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="bento-card">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                  <h2 className="text-title-lg font-semibold text-on-surface">Club Memberships</h2>
                </div>
                {data.clubs.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">No active club memberships.</p>
                ) : (
                  <div className="space-y-3">
                    {data.clubs.map((club) => (
                      <div key={club.id} className="rounded-lg border border-gray-300/20 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-on-surface">{club.name}</p>
                          <Badge variant="info">{club.role}</Badge>
                        </div>
                        {club.nextEvent && (
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            Next: {club.nextEvent}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </StudentShell>
  );
}

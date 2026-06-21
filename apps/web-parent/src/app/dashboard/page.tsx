'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AiInsightCard,
  Badge,
  Button,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import {
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  Heart,
  Library,
  MapPin,
  MessageSquare,
  Shirt,
  Trophy,
  Wallet,
} from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import {
  formatDate,
  formatInr,
  formatPercent,
  formatRelativeTime,
  getInitials,
} from '@/lib/format';
import type {
  ChildAcademics,
  ChildAttendance,
  ChildExams,
  ChildFees,
  GpsTracking,
  HealthStatus,
  ParentAiAlert,
  ParentChild,
  ParentDashboard,
  ParentMessage,
  UniformStatus,
  ChildLibraryBook,
} from '@/types/parent';

interface ChildData {
  academics: ChildAcademics;
  attendance: ChildAttendance;
  fees: ChildFees;
  exams: ChildExams;
  gps: GpsTracking;
  health: HealthStatus;
  uniform: UniformStatus;
  aiAlerts: ParentAiAlert[];
  library: ChildLibraryBook[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dash, msgs] = await Promise.all([
          apiFetch<ParentDashboard>('/parent/dashboard'),
          apiFetch<ParentMessage[]>('/parent/messages'),
        ]);

        if (!cancelled) {
          const rawDash = dash as {
            parentName?: string;
            children?: Array<{
              id?: string;
              name?: string;
              firstName?: string;
              lastName?: string;
              class?: string;
              className?: string;
              section?: string;
            }>;
          };
          const normalisedChildren = Array.isArray(rawDash.children)
            ? rawDash.children.map((child) => {
                const nameParts = (child.name ?? '').split(' ');
                const firstName = child.firstName ?? nameParts[0] ?? '';
                const lastName = child.lastName ?? nameParts.slice(1).join(' ') ?? '';
                return {
                  id: child.id ?? '',
                  firstName,
                  lastName,
                  className: child.className ?? child.class ?? 'Unassigned',
                  section: child.section ?? '',
                };
              })
            : [];

          const normalisedDashboard: ParentDashboard = {
            parentName: rawDash.parentName ?? 'Parent',
            children: normalisedChildren,
          };

          setDashboard(normalisedDashboard);

          // Normalise messages — backend returns body/read, type expects preview/unread
          const rawMsgs = (Array.isArray(msgs) ? msgs : []) as unknown[];
          const normalisedMsgs: ParentMessage[] = rawMsgs.map((raw) => {
            const m = raw as Record<string, unknown>;
            return {
              id: String(m.id ?? ''),
              from: String(m.from ?? ''),
              subject: String(m.subject ?? ''),
              preview: String(m.preview ?? m.body ?? ''),
              sentAt: String(m.sentAt ?? new Date().toISOString()),
              unread: m.unread !== undefined ? !!m.unread : !m.read,
            };
          });
          setMessages(normalisedMsgs);
          if (normalisedChildren.length > 0) {
            const firstChild = normalisedChildren[0];
            if (firstChild) setSelectedChildId(firstChild.id);
          }
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

  useEffect(() => {
    if (!selectedChildId) return;

    let cancelled = false;
    setChildLoading(true);

    async function loadChildData() {
      try {
        const [academics, fees, exams, library] = await Promise.all([
          apiFetch<ChildAcademics>(`/parent/children/${selectedChildId}/academics`),
          apiFetch<ChildFees>(`/parent/children/${selectedChildId}/fees`),
          apiFetch<ChildExams>(`/parent/children/${selectedChildId}/exams`),
          apiFetch<ChildLibraryBook[]>(`/parent/children/${selectedChildId}/library`),
        ]);

        if (!cancelled) {
          const rawAcademics = academics as {
            gpa?: number;
            rank?: number;
            totalStudents?: number;
            termResult?: string;
            term?: string;
            subjects?: Array<{
              name?: string;
              subject?: string;
              grade?: string;
              score?: number;
              marksObtained?: number;
              maxMarks?: number;
            }>;
          };
          const normalisedAcademics: ChildAcademics = {
            gpa: typeof rawAcademics.gpa === 'number' ? rawAcademics.gpa : 0,
            rank: typeof rawAcademics.rank === 'number' ? rawAcademics.rank : 0,
            totalStudents: typeof rawAcademics.totalStudents === 'number' ? rawAcademics.totalStudents : 30,
            termResult: rawAcademics.termResult ?? rawAcademics.term ?? 'Term 1',
            subjects: Array.isArray(rawAcademics.subjects)
              ? rawAcademics.subjects.map((sub) => ({
                  name: sub.name ?? sub.subject ?? 'Unknown',
                  grade: sub.grade ?? '—',
                  score: typeof sub.score === 'number'
                    ? sub.score
                    : typeof sub.marksObtained === 'number' && typeof sub.maxMarks === 'number' && sub.maxMarks > 0
                      ? Math.round((sub.marksObtained / sub.maxMarks) * 100)
                      : 0,
                }))
              : [],
          };

          const rawFees = fees as {
            outstandingAmount?: number;
            outstanding?: number;
            status?: string;
            dueDate?: string;
            paymentUrl?: string;
            sessionEnded?: boolean;
            sessionEndingMonth?: string;
            invoices?: Array<{
              dueDate?: string;
            }>;
          };
          const normalisedFees: ChildFees = {
            outstandingAmount: typeof rawFees.outstandingAmount === 'number'
              ? rawFees.outstandingAmount
              : typeof rawFees.outstanding === 'number'
                ? rawFees.outstanding
                : 0,
            status: typeof rawFees.status === 'string'
              ? rawFees.status
              : (rawFees.outstanding ?? 0) > 0
                ? 'UNPAID'
                : 'PAID',
            dueDate: rawFees.dueDate ?? (rawFees.invoices?.[0]?.dueDate) ?? new Date().toISOString(),
            paymentUrl: rawFees.paymentUrl ?? 'https://example.com/pay',
            sessionEnded: rawFees.sessionEnded ?? false,
            sessionEndingMonth: rawFees.sessionEndingMonth ?? 'March',
          };

          const rawExams = exams as {
            exams?: Array<{
              id: string;
              name: string;
              subject: string;
              date: string;
              room: string;
            }>;
            schedule?: Array<{
              examId?: string;
              id?: string;
              examName?: string;
              name?: string;
              subject?: string;
              date?: string;
              room?: string;
            }>;
          };
          const normalisedExams: ChildExams = {
            exams: Array.isArray(rawExams.exams)
              ? rawExams.exams
              : Array.isArray(rawExams.schedule)
                ? rawExams.schedule.map((item) => ({
                    id: item.examId ?? item.id ?? '',
                    name: item.examName ?? item.name ?? '',
                    subject: item.subject ?? '',
                    date: item.date ?? '',
                    room: item.room ?? 'TBD',
                  }))
                : [],
          };

          const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);
          const studentFirstName = (selectedChild?.firstName ?? '').toLowerCase();
          type GpsKey = 'chioma' | 'tunde';
          const GPS_MOCK: Record<GpsKey, { lastLocation: string; batteryPercent: number }> = {
            chioma: {
              lastLocation: 'Near Central Library Intersection — Route 4B (Metro Shuttle)',
              batteryPercent: 88,
            },
            tunde: {
              lastLocation: 'School Bus Drop-off Zone A — Route 12 (North Campus)',
              batteryPercent: 95,
            },
          };
          const gpsMockData =
            (studentFirstName as GpsKey) in GPS_MOCK
              ? GPS_MOCK[studentFirstName as GpsKey]
              : { lastLocation: 'En route — Route 7 (Greenfield Bus)', batteryPercent: 78 };

          setChildData({
            academics: normalisedAcademics,
            attendance: {
              monthlyPercent: 92,
              presentDays: 18,
              totalDays: 20,
            },
            fees: normalisedFees,
            exams: normalisedExams,
            library: Array.isArray(library) ? library : [],
            gps: {
              enabled: true,
              lastLocation: gpsMockData.lastLocation,
              batteryPercent: gpsMockData.batteryPercent,
              lastSync: new Date().toISOString(),
            },
            health: {
              status: 'Healthy',
              lastCheckup: '2025-08-15',
              bloodGroup: 'O+',
            },
            uniform: {
              status: 'Issued',
              size: 'M (32)',
              lastIssued: '2025-06-01',
            },
            aiAlerts: [
              {
                id: '1',
                type: 'attendance',
                message: 'Attendance dropped 4% this week — consider a check-in.',
                severity: 'warning',
              },
              {
                id: '2',
                type: 'performance',
                message: 'Math scores improved 8% — great progress this term.',
                severity: 'info',
              },
            ],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load child data');
        }
      } finally {
        if (!cancelled) {
          setChildLoading(false);
        }
      }
    }

    void loadChildData();
    return () => {
      cancelled = true;
    };
  }, [selectedChildId, dashboard]);

  const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);

  return (
    <ParentShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Parent Dashboard</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Welcome, {dashboard?.parentName ?? 'Parent'}. Monitor your children&apos;s progress and
            stay connected with the school.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading parent dashboard…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {dashboard && !loading && (
          <>
            {dashboard.children.length > 0 && (
              <TabGroup
                tabs={dashboard.children.map((child: ParentChild) => ({
                  id: child.id,
                  label: `${child.firstName} (${child.className}${child.section})`,
                }))}
                activeTab={selectedChildId ?? dashboard.children[0]?.id ?? ''}
                onChange={setSelectedChildId}
              />
            )}

            {childLoading && (
              <div className="bento-card py-8 text-center text-on-surface-variant">
                Loading {selectedChild?.firstName ?? 'child'}&apos;s data…
              </div>
            )}

            {childData && selectedChild && !childLoading && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiBentoCard
                    label="GPA"
                    value={childData.academics.gpa.toFixed(1)}
                    icon={Trophy}
                    trend={{
                      value: `Rank ${childData.academics.rank}/${childData.academics.totalStudents}`,
                      direction: 'up',
                    }}
                  />
                  <KpiBentoCard
                    label="Attendance"
                    value={formatPercent(childData.attendance.monthlyPercent, 0)}
                    icon={ClipboardList}
                    trend={{ value: 'This month', direction: 'neutral' }}
                  />
                  <KpiBentoCard
                    label="Outstanding Fees"
                    value={formatInr(childData.fees.outstandingAmount)}
                    icon={Wallet}
                    trend={{ value: childData.fees.status, direction: 'neutral' }}
                  />
                  <KpiBentoCard
                    label="Upcoming Exams"
                    value={childData.exams.exams.length}
                    icon={ClipboardList}
                  />
                </div>

                {childData.fees.outstandingAmount > 0 && (
                  <div className={`flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center md:justify-between ${
                    childData.fees.sessionEnded
                      ? 'border-error/30 bg-error/5'
                      : 'border-warning/30 bg-warning/5'
                  }`}>
                    <div>
                      <p className="text-title-lg font-bold text-on-surface">
                        {childData.fees.sessionEnded ? 'Academic Session Ended' : 'Outstanding Fees'}
                      </p>
                      <p className="text-body-md text-on-surface-variant mt-0.5">
                        {childData.fees.sessionEnded
                          ? `The session ended in ${childData.fees.sessionEndingMonth || 'March'}. Please clear the final balance of ${formatInr(childData.fees.outstandingAmount)} immediately.`
                          : `${formatInr(childData.fees.outstandingAmount)} due by ${formatDate(childData.fees.dueDate)}`
                        }
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() =>
                        window.open(childData.fees.paymentUrl, '_self')
                      }
                    >
                      {childData.fees.sessionEnded ? 'Resolve Dues' : 'Pay Now'}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                  <section className="bento-card lg:col-span-2">
                    <h2 className="mb-4 text-title-lg font-semibold text-on-surface">
                      Academic Overview — {selectedChild.firstName}
                    </h2>
                    <p className="mb-4 text-body-md text-on-surface-variant">
                      Term result: <span className="font-semibold text-on-surface">{childData.academics.termResult}</span>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-300/20 text-left">
                            <th className="px-3 py-2 text-label-md uppercase tracking-wider text-on-surface-variant">
                              Subject
                            </th>
                            <th className="px-3 py-2 text-label-md uppercase tracking-wider text-on-surface-variant">
                              Grade
                            </th>
                            <th className="px-3 py-2 text-label-md uppercase tracking-wider text-on-surface-variant">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {childData.academics.subjects.map((subject) => (
                            <tr key={subject.name} className="border-b border-gray-300/10">
                              <td className="px-3 py-2 text-body-md text-on-surface">{subject.name}</td>
                              <td className="px-3 py-2">
                                <Badge variant="success">{subject.grade}</Badge>
                              </td>
                              <td className="px-3 py-2 text-body-md font-medium text-on-surface">
                                {subject.score}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="bento-card bg-ai-card-gradient">
                    <div className="mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-semibold text-on-surface">GPS Live Tracking</h2>
                    </div>
                    <div className="rounded-lg border border-dashed border-secondary/30 bg-white/60 p-6 text-center">
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-lg font-bold text-secondary">
                        {getInitials(selectedChild.firstName, selectedChild.lastName)}
                      </div>
                      <p className="font-medium text-on-surface">{childData.gps.lastLocation}</p>
                      <p className="mt-1 text-body-md text-on-surface-variant">
                        Battery {childData.gps.batteryPercent}% · Synced{' '}
                        {formatRelativeTime(childData.gps.lastSync)}
                      </p>
                      <Button
                        variant="ghost"
                        className="mt-4"
                        size="sm"
                        onClick={() => router.push(`/gps-tracking?childId=${selectedChildId}`)}
                      >
                        View Map
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="bento-card">
                    <h2 className="mb-4 text-title-lg font-semibold text-on-surface">
                      Attendance This Month
                    </h2>
                    <div className="flex items-center gap-6">
                      <div className="text-headline-lg font-bold text-secondary">
                        {formatPercent(childData.attendance.monthlyPercent, 0)}
                      </div>
                      <p className="text-body-md text-on-surface-variant">
                        {childData.attendance.presentDays} of {childData.attendance.totalDays} school
                        days present
                      </p>
                    </div>
                  </section>

                  <section className="bento-card">
                    <div className="mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-semibold text-on-surface">AI Alerts</h2>
                    </div>
                    <div className="space-y-3">
                      {childData.aiAlerts.map((alert) => (
                        <AiInsightCard
                          key={alert.id}
                          title={alert.type.replace(/^\w/, (c) => c.toUpperCase())}
                          description={alert.message}
                          badge={alert.severity.toUpperCase()}
                          variant={alert.severity === 'critical' ? 'dark' : 'light'}
                        />
                      ))}
                    </div>
                  </section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="bento-card">
                    <div className="mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-semibold text-on-surface">Teacher Messages</h2>
                    </div>
                    <div className="space-y-3">
                      {messages.slice(0, 4).map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-lg border px-4 py-3 ${
                            msg.unread
                              ? 'border-secondary/30 bg-secondary/5'
                              : 'border-gray-300/20 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-on-surface">{msg.from}</p>
                            <span className="text-label-md text-on-surface-variant">
                              {formatRelativeTime(msg.sentAt)}
                            </span>
                          </div>
                          <p className="text-body-md font-medium text-on-surface">{msg.subject}</p>
                          <p className="text-body-md text-on-surface-variant">{msg.preview}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bento-card">
                    <h2 className="mb-4 text-title-lg font-semibold text-on-surface">Exam Schedule</h2>
                    <div className="space-y-3">
                      {childData.exams.exams.map((exam) => (
                        <div key={exam.id} className="rounded-lg border border-gray-300/20 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-on-surface">{exam.name}</p>
                            <Badge variant="info">{exam.subject}</Badge>
                          </div>
                          <p className="text-body-md text-on-surface-variant">
                            {formatDate(exam.date)} · Room {exam.room}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="bento-card">
                  <div className="mb-4 flex items-center gap-2">
                    <Library className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                    <h2 className="text-title-lg font-semibold text-on-surface">
                      Library History — {selectedChild.firstName}
                    </h2>
                  </div>
                  {childData.library.length === 0 ? (
                    <p className="text-body-md text-on-surface-variant">
                      No library logs found for the last 3 months.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {childData.library.map((book) => {
                        const isOverdue = book.status === 'ISSUED' && new Date(book.dueDate) < new Date();
                        const badgeVariant = book.status === 'RETURNED' ? 'success' : isOverdue ? 'error' : 'info';
                        const badgeText = book.status === 'RETURNED' ? 'Returned' : isOverdue ? 'Overdue' : 'Issued';

                        return (
                          <div
                            key={book.id}
                            className="rounded-lg border border-gray-300/20 px-4 py-3 flex items-center justify-between gap-4"
                          >
                            <div>
                              <p className="font-medium text-on-surface">{book.title}</p>
                              <p className="text-body-sm text-on-surface-variant mt-0.5">{book.author}</p>
                              <p className="text-body-md text-on-surface-variant mt-1.5">
                                <span className="text-label-md text-on-surface-variant uppercase font-semibold">Issued:</span>{' '}
                                {formatDate(book.issuedAt)} ·{' '}
                                {book.status === 'RETURNED' ? (
                                  <>
                                    <span className="text-label-md text-on-surface-variant uppercase font-semibold">Returned:</span>{' '}
                                    {book.returnedAt ? formatDate(book.returnedAt) : '—'}
                                  </>
                                ) : (
                                  <>
                                    <span className="text-label-md text-on-surface-variant uppercase font-semibold">Due:</span>{' '}
                                    {formatDate(book.dueDate)}
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

                <div className="grid gap-6 sm:grid-cols-2">
                  <section className="bento-card">
                    <div className="mb-3 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-success" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-semibold text-on-surface">Health Status</h2>
                    </div>
                    <p className="text-body-md text-on-surface-variant">
                      Status: <span className="font-semibold text-success">{childData.health.status}</span>
                    </p>
                    <p className="text-body-md text-on-surface-variant">
                      Blood group: {childData.health.bloodGroup} · Last checkup{' '}
                      {formatDate(childData.health.lastCheckup)}
                    </p>
                  </section>

                  <section className="bento-card">
                    <div className="mb-3 flex items-center gap-2">
                      <Shirt className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                      <h2 className="text-title-lg font-semibold text-on-surface">Uniform Status</h2>
                    </div>
                    <p className="text-body-md text-on-surface-variant">
                      Status: <span className="font-semibold text-on-surface">{childData.uniform.status}</span>
                    </p>
                    <p className="text-body-md text-on-surface-variant">
                      Size {childData.uniform.size} · Issued {formatDate(childData.uniform.lastIssued)}
                    </p>
                  </section>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </ParentShell>
  );
}

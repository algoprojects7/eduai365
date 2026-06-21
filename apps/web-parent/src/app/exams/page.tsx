'use client';

import { useEffect, useState } from 'react';
import { Badge, TabGroup } from '@eduai365/ui';
import { ClipboardList, Calendar, MapPin, BookOpen, Clock } from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { ParentChild, ParentDashboard } from '@/types/parent';

interface ExamEntry {
  id: string;
  name: string;
  subject: string;
  date: string;
  room: string;
  startTime?: string;
  endTime?: string;
}

interface ChildExamsData {
  exams: ExamEntry[];
}

export default function ExamsPage() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [examsData, setExamsData] = useState<ChildExamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch dashboard context to get children list
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const dash = await apiFetch<ParentDashboard>('/parent/dashboard');
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
          if (normalisedChildren.length > 0) {
            setSelectedChildId(normalisedChildren[0]?.id ?? null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
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

  // 2. Load child exams details when selectedChildId changes
  useEffect(() => {
    if (!selectedChildId) return;

    let cancelled = false;
    setChildLoading(true);
    setError(null);

    async function loadExams() {
      try {
        const raw = await apiFetch<ChildExamsData>(`/parent/children/${selectedChildId}/exams`);
        if (!cancelled) {
          setExamsData(raw);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load exams data');
      } finally {
        if (!cancelled) setChildLoading(false);
      }
    }

    void loadExams();
    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);

  return (
    <ParentShell>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">Upcoming Exams</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Track exam schedules, subjects coverage, test rooms, and timings for your children.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading portal data…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {dashboard && !loading && (
          <>
            {/* Child Selector */}
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
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading exam schedule…
              </div>
            )}

            {!childLoading && !error && selectedChild && examsData && (
              <div className="space-y-6">
                <div className="bento-card space-y-6">
                  <h2 className="text-title-lg font-bold text-on-surface">Exam Dates & Timings</h2>

                  {examsData.exams.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-faint text-on-surface-variant">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <p className="text-body-md text-on-surface-variant">
                        No upcoming exams scheduled for {selectedChild.firstName} at this time.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {examsData.exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-on-surface text-body-md">{exam.name}</span>
                              <Badge variant="info">{exam.subject}</Badge>
                            </div>
                            <div className="space-y-1.5 pt-1 text-body-md text-on-surface-variant">
                              <p className="flex items-center gap-2">
                                <Calendar className="h-4.5 w-4.5 text-on-surface-variant" />
                                {formatDate(exam.date)}
                              </p>
                              <p className="flex items-center gap-2">
                                <Clock className="h-4.5 w-4.5 text-on-surface-variant" />
                                {exam.startTime && exam.endTime
                                  ? `${exam.startTime} - ${exam.endTime}`
                                  : '09:30 AM — 12:30 PM'}
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="h-4.5 w-4.5 text-on-surface-variant" />
                                Hall / Room: {exam.room}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-label-md text-on-surface-variant uppercase tracking-wider block">Max Marks</span>
                            <span className="font-semibold text-on-surface text-body-md">100 Marks</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ParentShell>
  );
}

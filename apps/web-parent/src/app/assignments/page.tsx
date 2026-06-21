'use client';

import { useEffect, useState } from 'react';
import { Badge, KpiBentoCard, TabGroup } from '@eduai365/ui';
import { AlertCircle, CheckCircle2, Clock, ClipboardList } from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import { formatShortDate } from '@/lib/format';
import type { ParentChild, ParentDashboard } from '@/types/parent';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  description?: string;
}

const PRIORITY_STYLES = {
  high:   { badge: 'error' as const, label: 'High' },
  medium: { badge: 'warning' as const, label: 'Medium' },
  low:    { badge: 'info' as const, label: 'Low' },
};

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

function statusLabel(status: string, dueDate: string): { text: string; color: string } {
  const upper = status.toUpperCase();
  if (upper === 'SUBMITTED') return { text: 'Submitted', color: 'text-success' };
  if (upper === 'OVERDUE' || isOverdue(dueDate)) return { text: 'Overdue', color: 'text-error' };
  return { text: 'Pending', color: 'text-warning' };
}

export default function ParentAssignmentsPage() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

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

  // 2. Fetch assignments when selectedChildId changes
  useEffect(() => {
    if (!selectedChildId) return;

    let cancelled = false;
    setChildLoading(true);
    setError(null);

    async function loadAssignments() {
      try {
        const raw = await apiFetch<Assignment[]>(`/parent/children/${selectedChildId}/assignments`);
        if (!cancelled) setAssignments(Array.isArray(raw) ? raw : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load assignments');
      } finally {
        if (!cancelled) setChildLoading(false);
      }
    }

    void loadAssignments();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  const selectedChild = dashboard?.children.find((c) => c.id === selectedChildId);

  const total = assignments.length;
  const submitted = assignments.filter((a) => a.status.toUpperCase() === 'SUBMITTED').length;
  const overdue = assignments.filter(
    (a) => a.status.toUpperCase() !== 'SUBMITTED' && isOverdue(a.dueDate),
  ).length;

  const filtered = assignments.filter((a) => {
    if (filter === 'submitted') return a.status.toUpperCase() === 'SUBMITTED';
    if (filter === 'pending') return a.status.toUpperCase() !== 'SUBMITTED';
    return true;
  });

  // Sort: overdue first, then by dueDate ascending
  const sorted = [...filtered].sort((a, b) => {
    const aOver = isOverdue(a.dueDate) && a.status.toUpperCase() !== 'SUBMITTED';
    const bOver = isOverdue(b.dueDate) && b.status.toUpperCase() !== 'SUBMITTED';
    if (aOver && !bOver) return -1;
    if (!aOver && bOver) return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <ParentShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Homework & Assignments</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Track pending tasks, homework deadlines, and submission records for your children.
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
            {/* Child selector */}
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
                Loading {selectedChild?.firstName ?? 'child'}&apos;s assignments…
              </div>
            )}

            {!childLoading && !error && selectedChild && (
              <>
                {/* KPI Strip */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <KpiBentoCard
                    label="Total Assignments"
                    value={total}
                    icon={ClipboardList}
                  />
                  <KpiBentoCard
                    label="Submitted"
                    value={submitted}
                    icon={CheckCircle2}
                    trend={{ value: `${total - submitted} remaining`, direction: submitted === total ? 'up' : 'neutral' }}
                  />
                  <KpiBentoCard
                    label="Overdue"
                    value={overdue}
                    icon={AlertCircle}
                    trend={{ value: overdue > 0 ? 'Action needed' : 'All on track', direction: overdue > 0 ? 'down' : 'up' }}
                  />
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 border-b border-surface-container-high pb-1">
                  {(['all', 'pending', 'submitted'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`rounded-t-lg px-4 py-2 text-body-md font-medium capitalize transition-colors ${
                        filter === tab
                          ? 'border-b-2 border-primary text-primary font-bold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Assignment list */}
                {sorted.length === 0 ? (
                  <div className="bento-card py-16 text-center text-on-surface-variant">
                    No assignments in this category for {selectedChild.firstName}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sorted.map((a) => {
                      const st = statusLabel(a.status, a.dueDate);
                      const pri = (a.priority && PRIORITY_STYLES[a.priority]) || PRIORITY_STYLES.low;
                      return (
                        <div
                          key={a.id}
                          className="bento-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="font-semibold text-on-surface">{a.title}</p>
                              <p className="text-body-md text-on-surface-variant">
                                {a.subject} · Due {formatShortDate(a.dueDate)}
                              </p>
                              {a.description && (
                                <p className="mt-1 text-body-md text-on-surface-variant line-clamp-2">
                                  {a.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                            <Badge variant={pri.badge}>{pri.label} priority</Badge>
                            <span className={`text-label-md font-semibold ${st.color}`}>
                              {st.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ParentShell>
  );
}

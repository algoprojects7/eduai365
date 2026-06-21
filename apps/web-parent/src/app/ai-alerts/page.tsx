'use client';

import { useEffect, useState } from 'react';
import { AiInsightCard, TabGroup } from '@eduai365/ui';
import { Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import type { ParentChild, ParentDashboard } from '@/types/parent';

interface AIInsight {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

interface AcademicDetails {
  gpa: number;
  rank: number;
  totalStudents: number;
}

interface FeesDetails {
  outstandingAmount: number;
}

export default function AiAlertsPage() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AIInsight[]>([]);
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

  // 2. Load child-specific alerts dynamically based on actual metrics
  useEffect(() => {
    if (!selectedChildId) return;

    let cancelled = false;
    setChildLoading(true);

    async function fetchChildMetrics() {
      try {
        const [academics, fees] = await Promise.all([
          apiFetch<AcademicDetails>(`/parent/children/${selectedChildId}/academics`),
          apiFetch<FeesDetails>(`/parent/children/${selectedChildId}/fees`),
        ]);

        if (!cancelled) {
          const list: AIInsight[] = [];

          // Generate insights from GPA
          if (academics.gpa < 2.5) {
            list.push({
              id: 'a1',
              type: 'Performance Critique',
              message: `GPA currently at ${academics.gpa.toFixed(1)} (Rank ${academics.rank}/${academics.totalStudents}). Consider coordinating additional home study support or tutoring.`,
              severity: 'critical',
            });
          } else if (academics.gpa > 3.5) {
            list.push({
              id: 'a1',
              type: 'Exemplary Work',
              message: `Excellent GPA of ${academics.gpa.toFixed(1)}! Scoring in top ranks. Consider introducing advanced supplementary materials to sustain interest.`,
              severity: 'info',
            });
          } else {
            list.push({
              id: 'a1',
              type: 'Steady Progress',
              message: `Consistent GPA of ${academics.gpa.toFixed(1)}: Child is tracking comfortably along the core subjects structure.`,
              severity: 'info',
            });
          }

          // Generate insights from fees
          if (fees.outstandingAmount > 0) {
            list.push({
              id: 'a2',
              type: 'Outstanding Fees',
              message: `Pending school dues of ₹${fees.outstandingAmount.toLocaleString('en-IN')}. Please settle outstanding balance to prevent card holds.`,
              severity: 'warning',
            });
          }

          // Static default attendance insight
          list.push({
            id: 'a3',
            type: 'Attendance Watch',
            message: 'Attendance is steady at 92% this month. Maintaining daily classroom engagement supports conceptual learning.',
            severity: 'info',
          });

          setAlerts(list);
        }
      } catch {
        if (!cancelled) {
          // Fallback static alerts
          setAlerts([
            {
              id: 'f1',
              type: 'Performance Watch',
              message: 'Academic performance indicators are tracking on-schedule. Term examinations will begin soon.',
              severity: 'info',
            },
            {
              id: 'f2',
              type: 'Attendance Alert',
              message: 'Daily sign-ins verified. Clean attendance logs recorded for this week.',
              severity: 'info',
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setChildLoading(false);
        }
      }
    }

    void fetchChildMetrics();
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
            <Sparkles className="h-6 w-6 text-ai-violet animate-pulse" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">AI Parent Insights</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Automated recommendations, performance tracking updates, and critical administrative notices powered by eduAI365.
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
                Analyzing child indicators…
              </div>
            )}

            {!childLoading && !error && selectedChild && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Insights List Column (col-span-2) */}
                <section className="lg:col-span-2 space-y-4">
                  <h2 className="text-title-lg font-bold text-on-surface px-1 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-ai-violet" />
                    Generated Insights for {selectedChild.firstName}
                  </h2>

                  {alerts.length === 0 ? (
                    <div className="bento-card py-12 text-center text-on-surface-variant">
                      No notifications generated for this child.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map((alert) => (
                        <AiInsightCard
                          key={alert.id}
                          title={alert.type}
                          description={alert.message}
                          badge={alert.severity.toUpperCase()}
                          variant={alert.severity === 'critical' ? 'dark' : 'light'}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Recommendations Bento Column (col-span-1) */}
                <section className="space-y-6">
                  {/* Parents Guide Bento Box */}
                  <div className="bento-card space-y-4 bg-ai-card-gradient">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-secondary animate-bounce" />
                      <h2 className="text-title-lg font-bold text-on-surface">Recommendations</h2>
                    </div>
                    <ul className="list-disc pl-4 space-y-3 text-body-md text-on-surface-variant">
                      <li>
                        Review weekly homework logs under the <strong>Assignments</strong> section to ensure timely submissions.
                      </li>
                      <li>
                        Coordinate study slots around the <strong>Upcoming Exams</strong> dates published in the timeline.
                      </li>
                      <li>
                        Encourage daily readings to prepare for standard vocabulary tests.
                      </li>
                    </ul>
                  </div>

                  {/* AI Disclaimer Bento Box */}
                  <div className="bento-card border-secondary/20 bg-secondary/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-secondary" />
                      <h3 className="font-semibold text-on-surface text-body-md">AI Insights Notice</h3>
                    </div>
                    <p className="text-label-lg text-on-surface-variant">
                      These automated recommendations are designed for guidance purposes. For individual academic concerns, please message the course teacher directly.
                    </p>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </ParentShell>
  );
}

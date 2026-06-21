'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AiInsightCard, KpiBentoCard, chartColors, rechartsAxisProps } from '@eduai365/ui';
import { AlertTriangle, BarChart3, TrendingUp, Users } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type { FacultyAnalytics } from '@/types/hr';

const PIE_COLORS = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.success,
  chartColors.warning,
  chartColors.aiViolet,
  chartColors.muted,
];

export default function HrAnalyticsPage() {
  const [analytics, setAnalytics] = useState<FacultyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const data = await apiFetch<FacultyAnalytics>('/hr/analytics/faculty');
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load faculty analytics');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  const deptChartData = useMemo(
    () =>
      analytics?.byDepartment.map((d) => ({
        department: d.department.length > 12 ? `${d.department.slice(0, 12)}…` : d.department,
        fullName: d.department,
        count: d.count,
        teaching: d.teaching,
        nonTeaching: d.nonTeaching,
        contract: d.contract,
      })) ?? [],
    [analytics],
  );

  const typePieData = useMemo(() => {
    if (!analytics) return [];
    const totals = analytics.byDepartment.reduce(
      (acc, d) => ({
        teaching: acc.teaching + d.teaching,
        nonTeaching: acc.nonTeaching + d.nonTeaching,
        contract: acc.contract + d.contract,
      }),
      { teaching: 0, nonTeaching: 0, contract: 0 },
    );
    return [
      { name: 'Teaching', value: totals.teaching },
      { name: 'Non-Teaching', value: totals.nonTeaching },
      { name: 'Contract', value: totals.contract },
    ].filter((item) => item.value > 0);
  }, [analytics]);

  return (
    <SchoolShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">HR Analytics</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Department metrics, workforce composition, and AI faculty insights
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading faculty analytics…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {analytics && !loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiBentoCard
                label="Total Faculty"
                value={analytics.totalFaculty}
                icon={Users}
              />
              <KpiBentoCard
                label="Active Faculty"
                value={analytics.activeFaculty}
                icon={TrendingUp}
              />
              <KpiBentoCard
                label="Departments"
                value={analytics.byDepartment.length}
                icon={BarChart3}
              />
              <KpiBentoCard
                label="Contracts Expiring"
                value={analytics.contractsExpiring.length}
                icon={AlertTriangle}
                trend={{
                  value: 'Next 30 days',
                  direction: analytics.contractsExpiring.length > 0 ? 'down' : 'neutral',
                }}
              />
            </div>

            <AiInsightCard
              title="AI Faculty Insights"
              description={analytics.aiInsights.message}
              confidence={`${analytics.aiInsights.renewalRecommended} renewals`}
              badge="HR AI ANALYSIS"
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bento-card">
                <h2 className="text-title-lg font-semibold text-on-surface">Staff by Department</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Headcount distribution across departments
                </p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="department" {...rechartsAxisProps} />
                      <YAxis {...rechartsAxisProps} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number) => [value, 'Staff']}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullName ?? ''
                        }
                      />
                      <Bar dataKey="count" fill={chartColors.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bento-card">
                <h2 className="text-title-lg font-semibold text-on-surface">Employment Mix</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Teaching vs non-teaching vs contract staff
                </p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {typePieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {analytics.contractsExpiring.length > 0 && (
              <section className="bento-card">
                <h2 className="text-title-lg font-semibold text-on-surface">
                  Contract Expiry Watchlist
                </h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  AI-flagged contracts requiring renewal within 30 days
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300/20">
                        <th className="data-table-header px-4 py-3 text-left">Employee</th>
                        <th className="data-table-header px-4 py-3 text-left">Department</th>
                        <th className="data-table-header px-4 py-3 text-left">Expiry</th>
                        <th className="data-table-header px-4 py-3 text-left">AI Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.contractsExpiring.map((row) => (
                        <tr
                          key={row.employeeId}
                          className="border-b border-gray-300/10 last:border-0"
                        >
                          <td className="px-4 py-3 text-body-md">
                            <span className="font-medium text-on-surface">{row.name}</span>
                            <span className="ml-2 text-on-surface-variant">{row.employeeId}</span>
                          </td>
                          <td className="px-4 py-3 text-body-md">{row.department}</td>
                          <td className="px-4 py-3 text-body-md">
                            {new Date(row.contractExpiry).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-body-md text-ai-violet">
                            {Math.round(row.aiRiskScore * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </SchoolShell>
  );
}

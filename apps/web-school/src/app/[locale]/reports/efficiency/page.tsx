'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AiInsightCard, Badge, Button, KpiBentoCard, chartColors, rechartsAxisProps } from '@eduai365/ui';
import { ArrowLeft, Gauge, RefreshCw } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import {
  formatKpiValue,
  moduleScoreVariant,
  trendDirection,
  trendLabel,
  type OperationalEfficiencyResponse,
} from '@/types/reports';

export default function OperationalEfficiencyPage() {
  const [data, setData] = useState<OperationalEfficiencyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEfficiency() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<OperationalEfficiencyResponse>('/reports/operational-efficiency');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operational efficiency');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEfficiency();
  }, []);

  const moduleChartData =
    data?.moduleScores.map((item) => ({
      module: item.module,
      score: item.score,
    })) ?? [];

  return (
    <SchoolShell>
      <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/reports"
              className="mb-2 inline-flex items-center gap-1 text-body-md text-on-surface-variant hover:text-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reports Hub
            </Link>
            <h1 className="text-headline-lg font-bold text-on-surface">Operational Efficiency</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {data?.summary ??
                'Cross-module operational efficiency KPIs for the current academic term'}
            </p>
          </div>
          <Button variant="ghost" onClick={() => void loadEfficiency()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading efficiency metrics…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {data && !loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.kpis.map((kpi) => (
                <KpiBentoCard
                  key={kpi.id}
                  label={kpi.label}
                  value={formatKpiValue(kpi)}
                  icon={Gauge}
                  trend={{
                    value: trendLabel(kpi.trend, kpi.changePercent),
                    direction: trendDirection(kpi.trend),
                  }}
                />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bento-card">
                <h2 className="text-title-lg font-semibold text-on-surface">Module Efficiency Scores</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Composite scores across academics, finance, HR, and operations
                </p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="module" {...rechartsAxisProps} />
                      <YAxis {...rechartsAxisProps} domain={[0, 100]} />
                      <Tooltip contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid rgba(11, 29, 66, 0.08)',
                        boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
                      }} />
                      <Bar dataKey="score" fill={chartColors.secondary} radius={[4, 4, 0, 0]} name="Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <section className="bento-card">
                <h2 className="text-title-lg font-semibold text-on-surface">Module Breakdown</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Last updated {new Date(data.lastUpdated).toLocaleString('en-IN')}
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300/20">
                        <th className="data-table-header px-4 py-3 text-left">Module</th>
                        <th className="data-table-header px-4 py-3 text-left">Score</th>
                        <th className="data-table-header px-4 py-3 text-left">Status</th>
                        <th className="data-table-header px-4 py-3 text-left">Target KPIs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.moduleScores.map((row) => {
                        const moduleKpis = data.kpis.filter((k) => k.module === row.module.toLowerCase());
                        return (
                          <tr key={row.module} className="border-b border-gray-300/10 last:border-0">
                            <td className="px-4 py-3 text-body-md font-medium text-on-surface">
                              {row.module}
                            </td>
                            <td className="px-4 py-3 text-body-md">{row.score}/100</td>
                            <td className="px-4 py-3 text-body-md">
                              <Badge variant={moduleScoreVariant(row.status)} className="uppercase">
                                {row.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-body-md text-on-surface-variant">
                              {moduleKpis.length > 0
                                ? moduleKpis.map((k) => k.label).join(', ')
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <AiInsightCard
              title="Efficiency Summary"
              badge="AI OPERATIONS"
              description={`Finance module scores ${data.moduleScores.find((m) => m.module === 'Finance')?.score ?? '—'}/100 — fee collection rate at ${data.kpis.find((k) => k.id === 'fee-collection-rate')?.value ?? '—'}% is the primary improvement area. Operations and HR modules are performing above target.`}
            />
          </>
        )}
      </div>
    </SchoolShell>
  );
}

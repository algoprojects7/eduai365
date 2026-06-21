'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
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
import {
  IndianRupee,
  Percent,
  Receipt,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr, formatPercent } from '@/lib/format';
import type {
  CategoryPerformancePoint,
  FinancePerformanceSummary,
  MonthlyPerformancePoint,
} from '@/types/finance';

const PIE_COLORS = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.success,
  chartColors.warning,
  chartColors.aiViolet,
  chartColors.muted,
];

export default function FinancePerformancePage() {
  const [summary, setSummary] = useState<FinancePerformanceSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPerformancePoint[]>([]);
  const [categories, setCategories] = useState<CategoryPerformancePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPerformance() {
      try {
        const [summaryData, monthlyData, categoryData] = await Promise.all([
          apiFetch<FinancePerformanceSummary>('/finance/performance/summary'),
          apiFetch<MonthlyPerformancePoint[]>('/finance/performance/monthly'),
          apiFetch<CategoryPerformancePoint[]>('/finance/performance/by-category'),
        ]);

        if (!cancelled) {
          const mappedSummary: FinancePerformanceSummary = {
            ...summaryData,
            totalIncome: (summaryData as any).income ?? summaryData.totalIncome ?? 0,
            totalExpenses: (summaryData as any).expenses ?? summaryData.totalExpenses ?? 0,
          };

          const total = categoryData.reduce((sum, item) => sum + item.amount, 0);
          const mappedCategories = categoryData.map((item) => ({
            ...item,
            percentage: item.percentage ?? (total > 0 ? (item.amount / total) * 100 : 0),
          }));

          setSummary(mappedSummary);
          setMonthly(monthlyData);
          setCategories(mappedCategories);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load financial performance');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPerformance();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryTotal = useMemo(
    () => categories.reduce((sum, item) => sum + item.amount, 0),
    [categories],
  );

  const defaultRiskSummary =
    summary?.defaultRiskSummary ??
    'AI analysis indicates 12 students across Classes 8–10 are at elevated fee default risk based on payment history and attendance patterns. Recommend targeted outreach before the next term deadline.';

  return (
    <SchoolShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Financial Performance</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Income, expenses, collection trends, and AI-powered default risk insights
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading financial performance…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {summary && !loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <KpiBentoCard
                label="Total Income"
                value={formatInr(summary.totalIncome)}
                icon={TrendingUp}
              />
              <KpiBentoCard
                label="Expenses"
                value={formatInr(summary.totalExpenses)}
                icon={TrendingDown}
              />
              <KpiBentoCard
                label="Net Profit"
                value={formatInr(summary.netProfit)}
                icon={IndianRupee}
              />
              <KpiBentoCard
                label="GST Collected"
                value={formatInr(summary.gstCollected)}
                icon={Receipt}
              />
              <KpiBentoCard
                label="Collection Rate"
                value={formatPercent(summary.collectionRate)}
                icon={Percent}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="bento-card lg:col-span-2">
                <h3 className="text-title-lg font-semibold text-on-surface">
                  Income vs Expenses (12 Months)
                </h3>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Monthly financial trend comparison
                </p>

                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="month" {...rechartsAxisProps} />
                      <YAxis
                        {...rechartsAxisProps}
                        tickFormatter={(value: number) =>
                          value >= 100_000 ? `₹${(value / 100_000).toFixed(1)}L` : `₹${value / 1000}K`
                        }
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatInr(value),
                          name === 'income' ? 'Income' : 'Expenses',
                        ]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid rgba(11, 29, 66, 0.08)',
                          boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke={chartColors.primary}
                        fill={chartColors.primary}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke={chartColors.warning}
                        fill={chartColors.warning}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-body-md">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: chartColors.primary }}
                    />
                    Income
                  </span>
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: chartColors.warning }}
                    />
                    Expenses
                  </span>
                </div>
              </div>

              <div className="bento-card">
                <h3 className="text-title-lg font-semibold text-on-surface">Fee Category Breakdown</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Collection by fee head
                </p>

                <div className="relative mt-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {categories.map((entry, index) => (
                          <Cell
                            key={entry.category}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [formatInr(value), name]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid rgba(11, 29, 66, 0.08)',
                          boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      Total
                    </p>
                    <p className="text-headline-md font-bold text-on-surface">
                      {formatInr(categoryTotal)}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {categories.map((item, index) => (
                    <li key={item.category} className="flex items-center justify-between text-body-md">
                      <span className="flex items-center gap-2 text-on-surface-variant">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        {item.category}
                      </span>
                      <span className="font-medium text-on-surface">
                        {formatPercent(item.percentage, 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <AiInsightCard
              title="Default Risk Summary"
              badge="AI FINANCE INSIGHT"
              confidence="87% confidence"
              description={defaultRiskSummary}
            />
          </>
        )}
      </div>
    </SchoolShell>
  );
}

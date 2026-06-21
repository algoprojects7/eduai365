'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KpiBentoCard } from '@eduai365/ui';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CreditCard,
  IndianRupee,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr, formatPercent } from '@/lib/format';
import type { FinancePerformanceSummary } from '@/types/finance';

const QUICK_LINKS = [
  {
    title: 'Fee Structure',
    description: 'Manage fee heads, class matrix, scholarships, and concessions',
    href: '/finance/fees',
    icon: Layers,
  },
  {
    title: 'Collect Payment',
    description: 'Process student fee payments via card, UPI, net banking, or challan',
    href: '/finance/pay',
    icon: CreditCard,
  },
  {
    title: 'Financial Performance',
    description: 'Income, expenses, collection trends, and AI default risk insights',
    href: '/finance/performance',
    icon: BarChart3,
  },
  {
    title: 'Overdue Fees',
    description: 'View overdue invoices and send payment reminders',
    href: '/finance/fees?tab=overdue',
    icon: AlertCircle,
  },
];

export default function FinancePage() {
  const [summary, setSummary] = useState<FinancePerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const data = await apiFetch<FinancePerformanceSummary>('/finance/performance/summary');
        if (!cancelled && data) {
          const mapped: FinancePerformanceSummary = {
            ...data,
            totalIncome: (data as any).income ?? data.totalIncome ?? 0,
            totalExpenses: (data as any).expenses ?? data.totalExpenses ?? 0,
          };
          setSummary(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load finance summary');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SchoolShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Finance Overview</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Manage fee collection, payment gateway, and financial performance
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading finance metrics…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {summary && !loading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiBentoCard
              label="Total Income"
              value={formatInr(summary.totalIncome)}
              icon={IndianRupee}
              trend={{ value: 'This academic year', direction: 'up' }}
            />
            <KpiBentoCard
              label="Total Expenses"
              value={formatInr(summary.totalExpenses)}
              icon={TrendingUp}
              trend={{ value: 'Operating costs', direction: 'neutral' }}
            />
            <KpiBentoCard
              label="Net Profit"
              value={formatInr(summary.netProfit)}
              icon={BarChart3}
              trend={{
                value: summary.netProfit >= 0 ? 'Surplus' : 'Deficit',
                direction: summary.netProfit >= 0 ? 'up' : 'down',
              }}
            />
            <KpiBentoCard
              label="Collection Rate"
              value={formatPercent(summary.collectionRate)}
              icon={CreditCard}
              trend={{ value: `GST ${formatInr(summary.gstCollected)}`, direction: 'neutral' }}
            />
          </div>
        )}

        <section>
          <h2 className="text-title-lg font-semibold text-on-surface">Finance Modules</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Quick access to fee management and payment tools
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bento-card-interactive group flex items-start gap-4 p-5 transition-shadow hover:shadow-card"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                  <link.icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-title-md font-semibold text-on-surface">{link.title}</h3>
                    <ArrowRight className="h-4 w-4 shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-secondary" />
                  </div>
                  <p className="mt-1 text-body-md text-on-surface-variant">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SchoolShell>
  );
}

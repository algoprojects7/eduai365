'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AiInsightCard, Button, KpiBentoCard, TabGroup } from '@eduai365/ui';
import {
  ArrowRight,
  FileSpreadsheet,
  Gauge,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { HubChartPanel } from '@/components/reports/hub-chart-panel';
import { apiFetch } from '@/lib/api';
import {
  SUB_REPORT_LINKS,
  type ReportHubTab,
  type ReportsHubResponse,
  type ReportsHubTabId,
} from '@/types/reports';

const TAB_ITEMS = [
  { id: 'academic', label: 'Academic' },
  { id: 'financial', label: 'Financial' },
  { id: 'hr', label: 'HR' },
  { id: 'operations', label: 'Operations' },
];

function tabKpis(tab: ReportHubTab): Array<{ label: string; value: string | number }> {
  if (tab.id === 'academic') {
    return [
      { label: 'Charts', value: tab.charts.length },
      { label: 'Risk Classes', value: tab.charts.find((c) => c.id === 'dropout-heatmap') ? 7 : 0 },
      { label: 'Subjects Tracked', value: 4 },
      { label: 'AI Insights', value: 'Active' },
    ];
  }
  if (tab.id === 'financial') {
    const riskRows = tab.tables?.find((t) => t.id === 'default-risk')?.rows.length ?? 0;
    return [
      { label: 'Collection Charts', value: tab.charts.length },
      { label: 'Default Risk Flags', value: riskRows },
      { label: 'Fee Heads', value: 7 },
      { label: 'AI Insights', value: 'Active' },
    ];
  }
  if (tab.id === 'hr') {
    return [
      { label: 'Departments', value: 4 },
      { label: 'Leave Types', value: 3 },
      { label: 'Charts', value: tab.charts.length },
      { label: 'AI Insights', value: 'Active' },
    ];
  }
  const opsRows = tab.tables?.[0]?.rows.length ?? 0;
  return [
    { label: 'KPI Charts', value: tab.charts.length },
    { label: 'Ops Metrics', value: opsRows },
    { label: 'Modules', value: 4 },
    { label: 'AI Insights', value: 'Active' },
  ];
}

export default function ReportsHubPage() {
  const [activeTab, setActiveTab] = useState<ReportsHubTabId>('academic');
  const [hub, setHub] = useState<ReportsHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHub() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ReportsHubResponse>('/reports/hub');
      setHub(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports hub');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHub();
  }, []);

  const tabData = useMemo(
    () => hub?.tabs.find((tab) => tab.id === activeTab) ?? null,
    [hub, activeTab],
  );

  return (
    <SchoolShell>
      <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Reports Hub</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {hub?.title ??
                'Academic, financial, HR, and operations analytics with drill-down sub-reports'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => void loadHub()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/reports/builder">
              <Button variant="secondary">
                <Wrench className="mr-2 h-4 w-4" />
                Custom Builder
              </Button>
            </Link>
            <Link href="/reports/efficiency">
              <Button variant="ghost">
                <Gauge className="mr-2 h-4 w-4" />
                Efficiency
              </Button>
            </Link>
          </div>
        </header>

        <TabGroup
          tabs={TAB_ITEMS}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as ReportsHubTabId)}
        />

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading reports…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {tabData && !loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tabKpis(tabData).map((kpi) => (
                <KpiBentoCard key={kpi.label} label={kpi.label} value={kpi.value} />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {tabData.charts.map((chart) => (
                <HubChartPanel key={chart.id} chart={chart} />
              ))}
            </div>

            {tabData.tables?.map((table) => (
              <section key={table.id} className="bento-card">
                <h2 className="text-title-lg font-semibold text-on-surface">{table.title}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300/20">
                        {table.columns.map((col) => (
                          <th key={col} className="data-table-header px-4 py-3 text-left">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-300/10 last:border-0">
                          {table.columns.map((col) => (
                            <td key={col} className="px-4 py-3 text-body-md">
                              {row[col] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="bento-card lg:col-span-1">
                <h3 className="text-title-lg font-semibold text-on-surface">Sub-Reports</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Drill into detailed reports for this category
                </p>
                <ul className="mt-4 space-y-3">
                  {SUB_REPORT_LINKS[activeTab].map((report) => (
                    <li key={report.id}>
                      <Link
                        href={report.href}
                        className="group flex items-start gap-3 rounded-lg border border-gray-300/20 p-3 transition-colors hover:border-secondary/30 hover:bg-secondary/5"
                      >
                        <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-on-surface group-hover:text-secondary">
                            {report.title}
                          </p>
                          <p className="mt-0.5 text-body-sm text-on-surface-variant">
                            {report.description}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2">
                <AiInsightCard
                  title={`${tabData.label} AI Narrative`}
                  badge="AI REPORTS"
                  description={tabData.aiNarrative}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </SchoolShell>
  );
}

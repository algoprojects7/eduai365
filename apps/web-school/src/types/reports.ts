export type ReportsHubTabId = 'academic' | 'financial' | 'hr' | 'operations';

export type HubChartType = 'area' | 'bar' | 'pie' | 'heatmap';

export interface ReportHubChart {
  id: string;
  type: HubChartType;
  title: string;
  data: unknown;
}

export interface ReportHubTable {
  id: string;
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

export interface ReportHubTab {
  id: ReportsHubTabId;
  label: string;
  charts: ReportHubChart[];
  tables?: ReportHubTable[];
  aiNarrative: string;
}

export interface ReportsHubResponse {
  title: string;
  tabs: ReportHubTab[];
}

export type OperationalModule = 'academics' | 'finance' | 'hr' | 'operations';

export interface OperationalKpi {
  id: string;
  label: string;
  value: number;
  unit: string;
  module: OperationalModule;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  target?: number;
}

export interface ModuleScore {
  module: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
}

export interface OperationalEfficiencyResponse {
  summary: string;
  kpis: OperationalKpi[];
  moduleScores: ModuleScore[];
  lastUpdated: string;
}

export const CHART_TYPES = ['bar', 'line', 'pie', 'area'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const EXPORT_FORMATS = ['pdf', 'xlsx'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export interface CustomMetricOption {
  id: string;
  label: string;
  module: string;
}

export const CUSTOM_METRIC_CATALOG: CustomMetricOption[] = [
  { id: 'students.enrolled', label: 'Enrolled Students', module: 'academics' },
  { id: 'attendance.rate', label: 'Attendance Rate (%)', module: 'academics' },
  { id: 'fees.collected', label: 'Fees Collected (₹)', module: 'finance' },
  { id: 'finance.overdue', label: 'Overdue Amount (₹)', module: 'finance' },
  { id: 'staff.attendance', label: 'Staff Attendance (%)', module: 'hr' },
  { id: 'payroll.cost', label: 'Payroll Cost (₹L)', module: 'hr' },
  { id: 'library.utilization', label: 'Library Utilization (%)', module: 'operations' },
  { id: 'transport.ontime', label: 'Transport On-Time (%)', module: 'operations' },
];

export interface CustomReportPreview {
  metrics: Array<{ id: string; label: string; module: string }>;
  chartType: ChartType;
  groupBy: string | null;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  chartSeries: Array<{ name: string; data: Array<{ label: string; value: number }> }>;
}

export interface CustomReportExportResult {
  downloadUrl: string;
  format: ExportFormat;
  fileName: string;
  expiresAt: string;
}

export const SUB_REPORT_LINKS: Record<
  ReportsHubTabId,
  Array<{ id: string; title: string; description: string; href: string }>
> = {
  academic: [
    {
      id: 'report-cards',
      title: 'Report Cards',
      description: 'Term-wise student report card generation and bulk export',
      href: '/report-cards',
    },
    {
      id: 'exam-results',
      title: 'Exam Results',
      description: 'Subject-wise marks, rankings, and grade distribution',
      href: '/exams',
    },
    {
      id: 'attendance',
      title: 'Attendance Reports',
      description: 'Daily, weekly, and monthly attendance summaries',
      href: '/students',
    },
    {
      id: 'progress',
      title: 'Progress Reports',
      description: 'Continuous assessment and homework completion trends',
      href: '/timetable',
    },
  ],
  financial: [
    {
      id: 'performance',
      title: 'Financial Performance',
      description: 'Income, expenses, and collection trend analysis',
      href: '/finance/performance',
    },
    {
      id: 'fee-ledger',
      title: 'Fee Ledger',
      description: 'Invoice status, overdue accounts, and payment history',
      href: '/finance/fees',
    },
    {
      id: 'gst',
      title: 'GST Report',
      description: 'Tax collected, input credit, and filing summary',
      href: '/finance',
    },
    {
      id: 'concessions',
      title: 'Scholarships & Concessions',
      description: 'Approved concessions and scholarship utilization',
      href: '/finance/fees?tab=concessions',
    },
  ],
  hr: [
    {
      id: 'hr-analytics',
      title: 'HR Analytics',
      description: 'Department metrics, workforce composition, and AI insights',
      href: '/hr/analytics',
    },
    {
      id: 'leave',
      title: 'Leave Report',
      description: 'Leave balances, approvals, and calendar view',
      href: '/hr/leave',
    },
    {
      id: 'payroll',
      title: 'Payroll Summary',
      description: 'Salary runs, deductions, and disbursement status',
      href: '/hr/payroll',
    },
    {
      id: 'substitutions',
      title: 'Substitution Log',
      description: 'AI-matched substitute assignments and coverage gaps',
      href: '/hr/substitutions',
    },
  ],
  operations: [
    {
      id: 'efficiency',
      title: 'Operational Efficiency',
      description: 'Cross-module KPIs, module scores, and efficiency trends',
      href: '/reports/efficiency',
    },
    {
      id: 'library',
      title: 'Library Report',
      description: 'Circulation, overdue books, and catalog utilization',
      href: '/operations/library',
    },
    {
      id: 'transport',
      title: 'Transport Report',
      description: 'Route occupancy, GPS compliance, and fee collection',
      href: '/operations/transport',
    },
    {
      id: 'inventory',
      title: 'Inventory Status',
      description: 'Stock levels, reorders, and asset depreciation',
      href: '/extended/inventory',
    },
  ],
};

export function moduleScoreVariant(
  status: ModuleScore['status'],
): 'success' | 'warning' | 'error' {
  if (status === 'good') return 'success';
  if (status === 'warning') return 'warning';
  return 'error';
}

export function formatKpiValue(kpi: OperationalKpi): string {
  if (kpi.unit === '%') return `${kpi.value}%`;
  if (kpi.unit === '₹') return `₹${kpi.value.toLocaleString('en-IN')}`;
  return `${kpi.value}${kpi.unit}`;
}

export function trendLabel(trend: OperationalKpi['trend'], changePercent: number): string {
  const sign = changePercent > 0 ? '+' : '';
  const suffix = `${sign}${changePercent}% vs last term`;
  if (trend === 'up') return suffix;
  if (trend === 'down') return suffix;
  return 'Stable';
}

export function trendDirection(
  trend: OperationalKpi['trend'],
): 'up' | 'down' | 'neutral' {
  if (trend === 'up') return 'up';
  if (trend === 'down') return 'down';
  return 'neutral';
}

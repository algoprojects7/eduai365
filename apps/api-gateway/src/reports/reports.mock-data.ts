import type { TenantContext } from '@eduai365/shared-types';
import { buildPdfDocument } from '@eduai365/shared-utils';
import type { ChartType } from './dto/custom-report.dto';
import type { PdfTemplate } from './dto/pdf-generate.dto';

export interface ReportHubTab {
  id: 'academic' | 'financial' | 'hr' | 'operations';
  label: string;
  charts: Array<{
    id: string;
    type: 'area' | 'bar' | 'pie' | 'heatmap';
    title: string;
    data: unknown;
  }>;
  tables?: Array<{
    id: string;
    title: string;
    columns: string[];
    rows: Array<Record<string, string | number>>;
  }>;
  aiNarrative: string;
}

export interface OperationalKpi {
  id: string;
  label: string;
  value: number;
  unit: string;
  module: 'academics' | 'finance' | 'hr' | 'operations';
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  target?: number;
}

const ACADEMIC_PERFORMANCE_TREND = [
  { term: 'Term I', average: 72, passRate: 88 },
  { term: 'Term II', average: 75, passRate: 91 },
  { term: 'Term III', average: 78, passRate: 93 },
];

const SUBJECT_AVERAGES = [
  { subject: 'Mathematics', class8: 74, class9: 71, class10: 68, class11: 76, class12: 79 },
  { subject: 'Science', class8: 78, class9: 75, class10: 72, class11: 80, class12: 82 },
  { subject: 'English', class8: 81, class9: 79, class10: 77, class11: 83, class12: 85 },
  { subject: 'Social Studies', class8: 76, class9: 73, class10: 70, class11: 78, class12: 80 },
];

const DROPOUT_RISK_HEATMAP = [
  { class: '6-A', high: 2, medium: 5, low: 28 },
  { class: '7-B', high: 1, medium: 4, low: 30 },
  { class: '8-C', high: 3, medium: 6, low: 25 },
  { class: '9-A', high: 4, medium: 8, low: 22 },
  { class: '10-C', high: 6, medium: 10, low: 18 },
  { class: '11-B', high: 2, medium: 5, low: 24 },
  { class: '12-A', high: 1, medium: 3, low: 26 },
];

const FEE_COLLECTION_TREND = [
  { month: 'Apr', collected: 720000, target: 800000 },
  { month: 'May', collected: 680000, target: 750000 },
  { month: 'Jun', collected: 810000, target: 850000 },
  { month: 'Jul', collected: 790000, target: 820000 },
  { month: 'Aug', collected: 850000, target: 880000 },
  { month: 'Sep', collected: 820000, target: 860000 },
  { month: 'Oct', collected: 870000, target: 900000 },
  { month: 'Nov', collected: 840000, target: 880000 },
  { month: 'Dec', collected: 910000, target: 920000 },
  { month: 'Jan', collected: 880000, target: 910000 },
  { month: 'Feb', collected: 860000, target: 890000 },
  { month: 'Mar', collected: 920000, target: 950000 },
];

const FEE_BY_HEAD = [
  { head: 'Tuition', amount: 4200000, percentage: 52 },
  { head: 'Transport', amount: 980000, percentage: 12 },
  { head: 'Exam', amount: 640000, percentage: 8 },
  { head: 'Lab', amount: 520000, percentage: 6 },
  { head: 'Library', amount: 410000, percentage: 5 },
  { head: 'Sports', amount: 380000, percentage: 5 },
  { head: 'Other', amount: 980000, percentage: 12 },
];

const DEFAULT_RISK_STUDENTS = [
  { student: 'Rohan Das', class: '9-C', riskScore: 82, outstanding: 18500 },
  { student: 'Kabir Singh', class: '11-B', riskScore: 76, outstanding: 22000 },
  { student: 'Ananya Patel', class: '7-A', riskScore: 71, outstanding: 9800 },
  { student: 'Meera Nair', class: '6-C', riskScore: 68, outstanding: 7200 },
];

const STAFF_ATTENDANCE = [
  { department: 'Teaching', rate: 96.2, onLeave: 4 },
  { department: 'Administration', rate: 94.8, onLeave: 2 },
  { department: 'Support', rate: 92.5, onLeave: 3 },
  { department: 'Transport', rate: 97.1, onLeave: 1 },
];

const LEAVE_UTILIZATION = [
  { type: 'Casual Leave', used: 68, balance: 32 },
  { type: 'Sick Leave', used: 42, balance: 58 },
  { type: 'Earned Leave', used: 55, balance: 45 },
];

const OPERATIONS_METRICS = {
  libraryUtilization: 71.4,
  transportOnTime: 94.6,
  healthVisitsPerMonth: 38,
  clubParticipation: 62.8,
  gpsAlerts: 12,
};

const METRIC_CATALOG: Record<
  string,
  { label: string; module: string; sampleValues: Array<{ label: string; value: number }> }
> = {
  'students.enrolled': {
    label: 'Enrolled Students',
    module: 'academics',
    sampleValues: [
      { label: 'Nursery', value: 48 },
      { label: 'Primary', value: 320 },
      { label: 'Middle', value: 410 },
      { label: 'Senior', value: 462 },
    ],
  },
  'attendance.rate': {
    label: 'Attendance Rate (%)',
    module: 'academics',
    sampleValues: [
      { label: 'Jan', value: 93.2 },
      { label: 'Feb', value: 94.1 },
      { label: 'Mar', value: 94.8 },
    ],
  },
  'fees.collected': {
    label: 'Fees Collected (₹)',
    module: 'finance',
    sampleValues: FEE_COLLECTION_TREND.map((m) => ({
      label: m.month,
      value: m.collected,
    })),
  },
  'finance.overdue': {
    label: 'Overdue Amount (₹)',
    module: 'finance',
    sampleValues: [
      { label: 'Term I', value: 142000 },
      { label: 'Term II', value: 98000 },
      { label: 'Term III', value: 76000 },
    ],
  },
  'staff.attendance': {
    label: 'Staff Attendance (%)',
    module: 'hr',
    sampleValues: STAFF_ATTENDANCE.map((d) => ({ label: d.department, value: d.rate })),
  },
  'payroll.cost': {
    label: 'Payroll Cost (₹L)',
    module: 'hr',
    sampleValues: [
      { label: 'Oct', value: 38.2 },
      { label: 'Nov', value: 39.1 },
      { label: 'Dec', value: 42.3 },
      { label: 'Jan', value: 41.8 },
    ],
  },
  'library.utilization': {
    label: 'Library Utilization (%)',
    module: 'operations',
    sampleValues: [
      { label: 'Week 1', value: 68 },
      { label: 'Week 2', value: 72 },
      { label: 'Week 3', value: 74 },
      { label: 'Week 4', value: 71 },
    ],
  },
  'transport.ontime': {
    label: 'Transport On-Time (%)',
    module: 'operations',
    sampleValues: [
      { label: 'Route A', value: 96 },
      { label: 'Route B', value: 93 },
      { label: 'Route C', value: 95 },
      { label: 'Route D', value: 94 },
    ],
  },
};

function tenantSeed(tenant: TenantContext): number {
  let hash = 0;
  const text = tenant.schoolId + tenant.slug;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function buildReportHub(tenant: TenantContext): {
  title: string;
  tabs: ReportHubTab[];
} {
  const seed = tenantSeed(tenant);

  return {
    title: 'AI Analytics & Reports — Powered by eduAI365',
    tabs: [
      {
        id: 'academic',
        label: 'Academic',
        charts: [
          {
            id: 'performance-trend',
            type: 'area',
            title: 'School-wide Performance Trend (3 Terms)',
            data: ACADEMIC_PERFORMANCE_TREND,
          },
          {
            id: 'subject-averages',
            type: 'bar',
            title: 'Subject-wise Average Scores by Class',
            data: SUBJECT_AVERAGES,
          },
          {
            id: 'dropout-heatmap',
            type: 'heatmap',
            title: 'Dropout Risk Heatmap',
            data: DROPOUT_RISK_HEATMAP,
          },
        ],
        aiNarrative:
          seed % 2 === 0
            ? 'Class 10C shows a 12% performance decline in Sciences — recommend intervention sessions before Term III exams.'
            : 'Overall academic performance improved 4.2% this term. Grade 8-B leads in Mathematics with a 6-point gain.',
      },
      {
        id: 'financial',
        label: 'Financial',
        charts: [
          {
            id: 'collection-trend',
            type: 'area',
            title: 'Fee Collection vs Target (12 Months)',
            data: FEE_COLLECTION_TREND,
          },
          {
            id: 'collection-by-head',
            type: 'pie',
            title: 'Collection by Fee Head',
            data: FEE_BY_HEAD,
          },
        ],
        tables: [
          {
            id: 'default-risk',
            title: 'AI Default Risk — Flagged Students',
            columns: ['Student', 'Class', 'Risk Score', 'Outstanding (₹)'],
            rows: DEFAULT_RISK_STUDENTS.map((s) => ({
              Student: s.student,
              Class: s.class,
              'Risk Score': s.riskScore,
              'Outstanding (₹)': s.outstanding,
            })),
          },
        ],
        aiNarrative:
          'Fee collection is at 91% of target. Scholarship disbursements reduced net collection by ₹1.2L — 4 students flagged for default risk this month.',
      },
      {
        id: 'hr',
        label: 'HR',
        charts: [
          {
            id: 'staff-attendance',
            type: 'bar',
            title: 'Staff Attendance Rate by Department',
            data: STAFF_ATTENDANCE,
          },
          {
            id: 'leave-utilization',
            type: 'bar',
            title: 'Leave Utilization vs Balance',
            data: LEAVE_UTILIZATION,
          },
        ],
        aiNarrative:
          'Payroll cost rose 8% QoQ driven by new hires. AI attrition risk: 3 teachers show early attrition signals — recommend retention review.',
      },
      {
        id: 'operations',
        label: 'Operations',
        charts: [
          {
            id: 'ops-summary',
            type: 'bar',
            title: 'Operations KPI Snapshot',
            data: [
              { metric: 'Library Utilization', value: OPERATIONS_METRICS.libraryUtilization },
              { metric: 'Transport On-Time', value: OPERATIONS_METRICS.transportOnTime },
              { metric: 'Club Participation', value: OPERATIONS_METRICS.clubParticipation },
            ],
          },
        ],
        tables: [
          {
            id: 'ops-details',
            title: 'Operations Detail',
            columns: ['Metric', 'Value', 'Notes'],
            rows: [
              {
                Metric: 'Library Utilization',
                Value: `${OPERATIONS_METRICS.libraryUtilization}%`,
                Notes: '342 active issues of 4,820 titles',
              },
              {
                Metric: 'Transport On-Time',
                Value: `${OPERATIONS_METRICS.transportOnTime}%`,
                Notes: 'Route 7 adjusted pickup times',
              },
              {
                Metric: 'Health Visits',
                Value: OPERATIONS_METRICS.healthVisitsPerMonth,
                Notes: 'Most common: seasonal allergies',
              },
              {
                Metric: 'GPS Alerts',
                Value: OPERATIONS_METRICS.gpsAlerts,
                Notes: 'Geofence exits this month',
              },
            ],
          },
        ],
        aiNarrative:
          'Club participation is highest in Robotics (84 members). Consider expanding Science club capacity — waitlist at 22 students.',
      },
    ],
  };
}

export function buildOperationalEfficiency(tenant: TenantContext): {
  summary: string;
  kpis: OperationalKpi[];
  moduleScores: Array<{ module: string; score: number; status: 'good' | 'warning' | 'critical' }>;
  lastUpdated: string;
} {
  const seed = tenantSeed(tenant);
  const attendanceBoost = (seed % 5) * 0.2;

  return {
    summary: 'Cross-module operational efficiency overview for the current academic term',
    kpis: [
      {
        id: 'student-attendance',
        label: 'Student Attendance',
        value: Number((94.2 + attendanceBoost).toFixed(1)),
        unit: '%',
        module: 'academics',
        trend: 'up',
        changePercent: 1.4,
        target: 95,
      },
      {
        id: 'exam-pass-rate',
        label: 'Exam Pass Rate',
        value: 91.8,
        unit: '%',
        module: 'academics',
        trend: 'up',
        changePercent: 2.1,
        target: 90,
      },
      {
        id: 'fee-collection-rate',
        label: 'Fee Collection Rate',
        value: 89.6,
        unit: '%',
        module: 'finance',
        trend: 'stable',
        changePercent: 0.3,
        target: 92,
      },
      {
        id: 'payroll-processed',
        label: 'Payroll Processed On-Time',
        value: 100,
        unit: '%',
        module: 'hr',
        trend: 'stable',
        changePercent: 0,
        target: 100,
      },
      {
        id: 'staff-attendance-rate',
        label: 'Staff Attendance',
        value: 95.4,
        unit: '%',
        module: 'hr',
        trend: 'down',
        changePercent: -0.8,
        target: 96,
      },
      {
        id: 'library-utilization',
        label: 'Library Utilization',
        value: OPERATIONS_METRICS.libraryUtilization,
        unit: '%',
        module: 'operations',
        trend: 'up',
        changePercent: 3.2,
        target: 75,
      },
      {
        id: 'transport-ontime',
        label: 'Transport On-Time',
        value: OPERATIONS_METRICS.transportOnTime,
        unit: '%',
        module: 'operations',
        trend: 'up',
        changePercent: 1.1,
        target: 95,
      },
      {
        id: 'admission-conversion',
        label: 'Admission Conversion',
        value: 34.5,
        unit: '%',
        module: 'academics',
        trend: 'up',
        changePercent: 4.6,
        target: 30,
      },
    ],
    moduleScores: [
      { module: 'Academics', score: 88, status: 'good' },
      { module: 'Finance', score: 82, status: 'warning' },
      { module: 'HR', score: 91, status: 'good' },
      { module: 'Operations', score: 86, status: 'good' },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

export function buildCustomPreview(
  metrics: string[],
  chartType: ChartType,
  groupBy?: string,
): {
  metrics: Array<{ id: string; label: string; module: string }>;
  chartType: ChartType;
  groupBy: string | null;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  chartSeries: Array<{ name: string; data: Array<{ label: string; value: number }> }>;
} {
  const resolved = metrics.map((id) => {
    const meta = METRIC_CATALOG[id] ?? {
      label: id,
      module: 'custom',
      sampleValues: [{ label: 'Sample', value: 100 }],
    };
    return { id, ...meta };
  });

  const primary = resolved[0];
  const columns = ['Label', ...resolved.map((m) => m.label)];
  const rowCount = Math.max(...resolved.map((m) => m.sampleValues.length));
  const rows: Array<Record<string, string | number>> = [];

  for (let i = 0; i < rowCount; i += 1) {
    const row: Record<string, string | number> = {
      Label: primary?.sampleValues[i]?.label ?? `Row ${i + 1}`,
    };
    for (const metric of resolved) {
      row[metric.label] = metric.sampleValues[i]?.value ?? 0;
    }
    rows.push(row);
  }

  return {
    metrics: resolved.map(({ id, label, module }) => ({ id, label, module })),
    chartType,
    groupBy: groupBy ?? null,
    columns,
    rows,
    chartSeries: resolved.map((m) => ({
      name: m.label,
      data: m.sampleValues,
    })),
  };
}

export function buildSimulatedExportUrl(
  tenant: TenantContext,
  format: 'pdf' | 'xlsx',
  title?: string,
): { downloadUrl: string; format: 'pdf' | 'xlsx'; fileName: string; expiresAt: string } {
  const slug = title?.replace(/\s+/g, '-').toLowerCase() ?? 'custom-report';
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  return {
    downloadUrl: `https://storage.eduai365.ai/${tenant.slug}/exports/${slug}-${Date.now()}.${format}`,
    format,
    fileName: `${slug}.${format}`,
    expiresAt,
  };
}

export function buildPdfPlaceholder(
  template: PdfTemplate,
  data: Record<string, unknown>,
): ReturnType<typeof buildPdfDocument> {
  return buildPdfDocument(template, data);
}

export const DEFAULT_SCHEDULED_REPORTS = [
  {
    id: 'sched-001',
    name: 'Weekly Attendance Summary',
    cronExpression: '0 7 * * 1',
    frequency: 'weekly' as const,
    metrics: ['attendance.rate', 'students.enrolled'],
    chartType: 'line' as const,
    format: 'pdf' as const,
    recipients: ['principal@school.edu'],
    lastSentAt: '2026-06-16T07:00:00.000Z',
    nextRunAt: '2026-06-23T07:00:00.000Z',
    status: 'active' as const,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'sched-002',
    name: 'Monthly Fee Collection Report',
    cronExpression: '0 8 1 * *',
    frequency: 'monthly' as const,
    metrics: ['fees.collected', 'finance.overdue'],
    chartType: 'area' as const,
    format: 'xlsx' as const,
    recipients: ['accountant@school.edu', 'principal@school.edu'],
    lastSentAt: '2026-06-01T08:00:00.000Z',
    nextRunAt: '2026-07-01T08:00:00.000Z',
    status: 'active' as const,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
];

export function computeNextRun(cronExpression: string): string {
  const now = new Date();
  if (cronExpression.includes('* * 1')) {
    now.setDate(now.getDate() + 7);
  } else if (cronExpression.startsWith('0 8 1')) {
    now.setMonth(now.getMonth() + 1);
    now.setDate(1);
  } else {
    now.setDate(now.getDate() + 1);
  }
  now.setHours(8, 0, 0, 0);
  return now.toISOString();
}

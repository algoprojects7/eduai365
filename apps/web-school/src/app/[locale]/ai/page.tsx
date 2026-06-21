'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AiAttendanceRiskStudent,
  AiDropoutRiskStudent,
  AiFeeDefaultPrediction,
  AiRiskLevel,
} from '@eduai365/shared-types';
import {
  AiInsightCard,
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import {
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr, formatPercent } from '@/lib/format';
import { AI_PREDICTION_TABS, type AiPredictionTab } from '@/types/ai';

function riskBadgeVariant(level: AiRiskLevel): 'error' | 'warning' | 'success' {
  if (level === 'high') return 'error';
  if (level === 'medium') return 'warning';
  return 'success';
}

function RiskBadge({ level }: { level: AiRiskLevel }) {
  return (
    <Badge variant={riskBadgeVariant(level)} className="uppercase">
      {level}
    </Badge>
  );
}

export default function AiInsightsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AiPredictionTab>('dropout');
  const [dropoutRows, setDropoutRows] = useState<AiDropoutRiskStudent[]>([]);
  const [feeDefaultRows, setFeeDefaultRows] = useState<AiFeeDefaultPrediction[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AiAttendanceRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dropout, feeDefault, attendance] = await Promise.all([
        apiFetch<AiDropoutRiskStudent[]>('/ai/predictions/dropout-risk'),
        apiFetch<AiFeeDefaultPrediction[]>('/ai/predictions/fee-default'),
        apiFetch<AiAttendanceRiskStudent[]>('/ai/predictions/attendance'),
      ]);
      setDropoutRows(dropout);
      setFeeDefaultRows(feeDefault);
      setAttendanceRows(attendance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPredictions();
  }, [loadPredictions]);

  const highDropoutCount = useMemo(
    () => dropoutRows.filter((row) => row.riskLevel === 'high').length,
    [dropoutRows],
  );
  const highFeeDefaultCount = useMemo(
    () => feeDefaultRows.filter((row) => row.riskLevel === 'high').length,
    [feeDefaultRows],
  );
  const highAttendanceCount = useMemo(
    () => attendanceRows.filter((row) => row.riskLevel === 'high').length,
    [attendanceRows],
  );

  const tabBadges = useMemo(
    () => ({
      dropout: highDropoutCount || undefined,
      'fee-default': highFeeDefaultCount || undefined,
      attendance: highAttendanceCount || undefined,
    }),
    [highAttendanceCount, highDropoutCount, highFeeDefaultCount],
  );

  const totalOutstanding = useMemo(
    () => feeDefaultRows.reduce((sum, row) => sum + row.outstandingAmount, 0),
    [feeDefaultRows],
  );

  const dropoutColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Student',
        render: (row: AiDropoutRiskStudent) => (
          <div>
            <p className="font-medium text-on-surface">{row.name}</p>
            <p className="text-body-sm text-on-surface-variant">{row.className}</p>
          </div>
        ),
      },
      {
        key: 'riskScore',
        header: 'Risk Score',
        render: (row: AiDropoutRiskStudent) => (
          <span className="font-semibold text-error">{row.riskScore}%</span>
        ),
      },
      {
        key: 'riskLevel',
        header: 'Level',
        render: (row: AiDropoutRiskStudent) => <RiskBadge level={row.riskLevel} />,
      },
      {
        key: 'factors',
        header: 'Key Factors',
        render: (row: AiDropoutRiskStudent) => (
          <div className="flex flex-wrap gap-1">
            {row.factors.slice(0, 3).map((factor) => (
              <Badge key={factor} variant="outline">
                {factor}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  const feeDefaultColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Student',
        render: (row: AiFeeDefaultPrediction) => (
          <div>
            <p className="font-medium text-on-surface">{row.name}</p>
            <p className="text-body-sm text-on-surface-variant">{row.className}</p>
          </div>
        ),
      },
      {
        key: 'outstandingAmount',
        header: 'Outstanding',
        render: (row: AiFeeDefaultPrediction) => formatInr(row.outstandingAmount),
      },
      {
        key: 'daysOverdue',
        header: 'Days Overdue',
        render: (row: AiFeeDefaultPrediction) => (
          <span className={row.daysOverdue > 30 ? 'font-semibold text-error' : ''}>
            {row.daysOverdue} days
          </span>
        ),
      },
      {
        key: 'defaultProbability',
        header: 'Default Prob.',
        render: (row: AiFeeDefaultPrediction) => formatPercent(row.defaultProbability * 100),
      },
      {
        key: 'riskLevel',
        header: 'Level',
        render: (row: AiFeeDefaultPrediction) => <RiskBadge level={row.riskLevel} />,
      },
    ],
    [],
  );

  const attendanceColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Student',
        render: (row: AiAttendanceRiskStudent) => (
          <div>
            <p className="font-medium text-on-surface">{row.name}</p>
            <p className="text-body-sm text-on-surface-variant">{row.className}</p>
          </div>
        ),
      },
      {
        key: 'attendanceRate',
        header: 'Attendance',
        render: (row: AiAttendanceRiskStudent) => formatPercent(row.attendanceRate),
      },
      {
        key: 'consecutiveAbsences',
        header: 'Consecutive Absences',
        render: (row: AiAttendanceRiskStudent) => (
          <span className={row.consecutiveAbsences >= 3 ? 'font-semibold text-error' : ''}>
            {row.consecutiveAbsences}
          </span>
        ),
      },
      {
        key: 'predictedTrend',
        header: 'Trend',
        render: (row: AiAttendanceRiskStudent) => (
          <Badge
            variant={
              row.predictedTrend === 'declining'
                ? 'error'
                : row.predictedTrend === 'improving'
                  ? 'success'
                  : 'warning'
            }
          >
            {row.predictedTrend}
          </Badge>
        ),
      },
      {
        key: 'riskLevel',
        header: 'Level',
        render: (row: AiAttendanceRiskStudent) => <RiskBadge level={row.riskLevel} />,
      },
    ],
    [],
  );

  const activeInsight = useMemo(() => {
    if (activeTab === 'dropout') {
      const topFactors = dropoutRows
        .flatMap((row) => row.factors)
        .slice(0, 2)
        .join(', ');
      return {
        title: 'Dropout Risk Alert',
        badge: 'RETENTION AI',
        confidence: `${highDropoutCount} high risk`,
        description: (
          <>
            <span className="font-semibold text-error">{dropoutRows.length} students</span> flagged
            for early dropout indicators.{' '}
            {topFactors ? `Top signals: ${topFactors}.` : 'Review attendance and engagement trends.'}
          </>
        ),
        actionLabel: 'View Student Profiles',
        onAction: () => router.push('/students'),
      };
    }

    if (activeTab === 'fee-default') {
      return {
        title: 'Fee Default Prediction',
        badge: 'FORECAST',
        confidence: formatInr(totalOutstanding),
        description: (
          <>
            <span className="font-semibold text-warning">{feeDefaultRows.length} accounts</span>{' '}
            show elevated default probability this term, with{' '}
            <span className="font-semibold">{highFeeDefaultCount} high-risk</span> cases requiring
            immediate follow-up.
          </>
        ),
        actionLabel: 'Open Fee Ledger',
        onAction: () => router.push('/finance/fees'),
      };
    }

    const decliningCount = attendanceRows.filter((row) => row.predictedTrend === 'declining').length;
    return {
      title: 'Attendance Risk Monitor',
      badge: 'ATTENDANCE AI',
      confidence: `${decliningCount} declining`,
      description: (
        <>
          <span className="font-semibold text-error">{attendanceRows.length} students</span> need
          attendance intervention. {highAttendanceCount} are classified as high risk with
          consecutive absences or declining trends.
        </>
      ),
      actionLabel: 'Review Timetable',
      onAction: () => router.push('/timetable'),
    };
  }, [
    activeTab,
    attendanceRows,
    dropoutRows,
    feeDefaultRows.length,
    highAttendanceCount,
    highDropoutCount,
    highFeeDefaultCount,
    router,
    totalOutstanding,
  ]);

  return (
    <SchoolShell>
      <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">AI Insights Hub</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Predictive analytics for dropout, fee default, and attendance risk
            </p>
          </div>
          <Button variant="ghost" onClick={() => void loadPredictions()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiBentoCard
            label="Dropout Risk (High)"
            value={loading ? '…' : highDropoutCount}
            icon={Users}
          />
          <KpiBentoCard
            label="Fee Default (High)"
            value={loading ? '…' : highFeeDefaultCount}
            icon={IndianRupee}
          />
          <KpiBentoCard
            label="Attendance Risk (High)"
            value={loading ? '…' : highAttendanceCount}
            icon={TrendingDown}
          />
        </div>

        <TabGroup
          tabs={AI_PREDICTION_TABS.map((tab) => ({
            ...tab,
            badge: tabBadges[tab.id],
          }))}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as AiPredictionTab)}
        />

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-md text-error">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!error && (
          <>
            <AiInsightCard
              title={activeInsight.title}
              badge={activeInsight.badge}
              confidence={activeInsight.confidence}
              description={activeInsight.description}
              actionLabel={activeInsight.actionLabel}
              onAction={activeInsight.onAction}
            >
              <div className="mt-3 flex items-center gap-2 text-body-md text-on-surface-variant">
                <Sparkles className="h-4 w-4 text-ai-violet" />
                Models refreshed from attendance, fee ledger, and engagement signals
              </div>
            </AiInsightCard>

            <section className="rounded-lg border border-surface-faint bg-white p-5">
              <h2 className="text-title-lg font-semibold text-on-surface">
                {AI_PREDICTION_TABS.find((tab) => tab.id === activeTab)?.label} — Flagged Students
              </h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Ranked by AI risk score for proactive counselling and outreach
              </p>
              <div className="mt-4">
                {activeTab === 'dropout' && (
                  <DataTable
                    columns={dropoutColumns}
                    data={dropoutRows}
                    keyExtractor={(row) => row.studentId}
                    emptyMessage={
                      loading ? 'Loading predictions…' : 'No students flagged in this category.'
                    }
                  />
                )}
                {activeTab === 'fee-default' && (
                  <DataTable
                    columns={feeDefaultColumns}
                    data={feeDefaultRows}
                    keyExtractor={(row) => row.studentId}
                    emptyMessage={
                      loading ? 'Loading predictions…' : 'No students flagged in this category.'
                    }
                  />
                )}
                {activeTab === 'attendance' && (
                  <DataTable
                    columns={attendanceColumns}
                    data={attendanceRows}
                    keyExtractor={(row) => row.studentId}
                    emptyMessage={
                      loading ? 'Loading predictions…' : 'No students flagged in this category.'
                    }
                  />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </SchoolShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SchoolShell } from '@/components/school-shell';
import { AiInsightsPanel } from '@/components/dashboard/ai-insights-panel';
import { AttendanceChart } from '@/components/dashboard/attendance-chart';
import { FeeCategoriesChart } from '@/components/dashboard/fee-categories-chart';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { QuickActionsGrid } from '@/components/dashboard/quick-actions-grid';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { apiFetch } from '@/lib/api';
import type { ActivityItem, SchoolDashboard, SchoolProfile } from '@/types/school';
import type { AuthenticatedUser } from '@eduai365/shared-types';

interface DashboardData {
  dashboard: SchoolDashboard;
  activity: ActivityItem[];
  profile: SchoolProfile;
  user: AuthenticatedUser;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const loadFailedMessage = t('loadFailed');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboard, activity, profile, user] = await Promise.all([
          apiFetch<SchoolDashboard>('/school/dashboard'),
          apiFetch<ActivityItem[]>('/school/activity'),
          apiFetch<SchoolProfile>('/school/profile'),
          apiFetch<AuthenticatedUser>('/auth/me'),
        ]);

        if (!cancelled) {
          setData({ dashboard, activity, profile, user });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : loadFailedMessage);
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
  }, [loadFailedMessage]);

  const schoolName = data?.profile.name ?? 'Greenfield Academy';
  const firstName = data?.user.firstName ?? 'Admin';

  return (
    <SchoolShell>
        <div className="space-y-8">
          <header>
            <h1 className="text-headline-lg font-bold text-on-surface">{t('title')}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {t('welcome', { firstName, schoolName })}
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              {t('loadingMetrics')}
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
          )}

          {data && !loading && (
            <>
              <KpiRow data={data.dashboard} />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <AttendanceChart />
                </div>
                <AiInsightsPanel />
              </div>

              <QuickActionsGrid />

              <div className="grid gap-6 lg:grid-cols-2">
                <FeeCategoriesChart data={data.dashboard} />
                <RecentActivityFeed items={data.activity} />
              </div>
            </>
          )}
        </div>
    </SchoolShell>
  );
}

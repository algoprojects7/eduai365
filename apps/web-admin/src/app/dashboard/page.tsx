'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { RevenueVelocityChart } from '@/components/dashboard/revenue-velocity-chart';
import { AiUsageChart } from '@/components/dashboard/ai-usage-chart';
import { SchoolsTable } from '@/components/dashboard/schools-table';
import { OnboardPartnerCard } from '@/components/dashboard/onboard-partner-card';
import {
  SystemHealthWidgets,
  SystemLoadWidget,
} from '@/components/dashboard/system-health-widgets';
import { apiFetch } from '@/lib/api';
import { CheckCircle } from 'lucide-react';
import type {
  AiUsagePoint,
  PlatformDashboard,
  RevenuePoint,
  SchoolRow,
  SystemHealth,
} from '@/types/platform';

interface DashboardData {
  dashboard: PlatformDashboard;
  schools: SchoolRow[];
  revenue: RevenuePoint[];
  aiUsage: AiUsagePoint[];
  systemHealth: SystemHealth;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboard, schools, revenue, aiUsage, systemHealth] = await Promise.all([
          apiFetch<PlatformDashboard>('/platform/dashboard'),
          apiFetch<SchoolRow[]>('/platform/schools'),
          apiFetch<RevenuePoint[]>('/platform/revenue'),
          apiFetch<AiUsagePoint[]>('/platform/ai-usage'),
          apiFetch<SystemHealth>('/platform/system-health'),
        ]);

        if (!cancelled) {
          setData({ dashboard, schools, revenue, aiUsage, systemHealth });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
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

  const handleSuspend = (id: string, currentStatus: string) => {
    if (!data) return;
    const isSuspended =
      currentStatus.toLowerCase() === 'inactive' || currentStatus.toLowerCase() === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';

    const updatedSchools = data.schools.map((school) => {
      if (school.id === id) {
        return { ...school, status: newStatus };
      }
      return school;
    });

    setData({ ...data, schools: updatedSchools });
    setSuccessMessage(`School status has been successfully set to ${newStatus.toUpperCase()}.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleRemove = (id: string) => {
    if (!data) return;
    const targetSchool = data.schools.find((s) => s.id === id);
    const updatedSchools = data.schools.filter((school) => school.id !== id);

    setData({ ...data, schools: updatedSchools });
    setSuccessMessage(`School "${targetSchool?.name || 'Tenant'}" has been permanently deleted.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <AuthGuard>
      <AdminShell>
        <div className="space-y-8">
          <header>
            <h1 className="text-headline-lg font-bold text-on-surface">
              Global System Health & Multi-Tenant Overview
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Real-time status monitoring for{' '}
              {data ? data.dashboard.activeSchools : '…'} independent school ecosystems.
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              Loading platform metrics…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-body-md text-emerald-600 animate-in-fade">
              <CheckCircle className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          )}

          {data && !loading && (
            <>
              <KpiRow data={data.dashboard} />

              <div className="grid gap-6 lg:grid-cols-3">
                <SystemLoadWidget health={data.systemHealth} />
                <div className="lg:col-span-2">
                  <RevenueVelocityChart data={data.revenue} />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <AiUsageChart data={data.aiUsage} />
                </div>
                <OnboardPartnerCard />
              </div>

              <SchoolsTable
                schools={data.schools}
                onSuspend={handleSuspend}
                onRemove={handleRemove}
              />

              <SystemHealthWidgets health={data.systemHealth} />
            </>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  );
}

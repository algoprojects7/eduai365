'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { KpiBentoCard, DataTable, Badge } from '@eduai365/ui';
import { Wallet, DollarSign, Activity, FileCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMrr } from '@/lib/format';
import type { SchoolRow } from '@/types/platform';

export default function FinancePage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const schoolsData = await apiFetch<SchoolRow[]>('/platform/schools');
        if (!cancelled) {
          setSchools(schoolsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load finance overview');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalMrr = schools.reduce((sum, s) => sum + s.mrr, 0);

  return (
    <AuthGuard>
      <AdminShell>
        <div className="space-y-8">
          <header>
            <h1 className="text-headline-lg font-bold text-on-surface">
              Global Financial Performance & Tenant Billing
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Centralized view of platform monthly recurring revenue (MRR), subscription statuses, and invoice collections.
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              Loading financial telemetry…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
          )}

          {!loading && !error && (
            <>
              {/* KPIs */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiBentoCard
                  label="Platform MRR"
                  value={formatMrr(totalMrr)}
                  icon={Wallet}
                  trend={{ value: '+14% MoM', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Average Contract Value"
                  value={formatMrr(totalMrr / (schools.length || 1))}
                  icon={DollarSign}
                  trend={{ value: 'Per school avg', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="Collection Rate"
                  value="99.4%"
                  icon={FileCheck}
                  trend={{ value: 'Extremely High', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Active Invoices"
                  value={schools.length.toString()}
                  icon={Activity}
                  trend={{ value: 'Sent monthly', direction: 'neutral' }}
                />
              </div>

              {/* Schools Table */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Billing by Tenant School</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Monthly recurring revenue Contribution, subscription plan, and payment status.
                  </p>
                </div>

                <DataTable
                  data={schools}
                  keyExtractor={(row) => row.id}
                  columns={[
                    {
                      key: 'name',
                      header: 'School',
                      render: (row) => (
                        <div>
                          <p className="font-medium text-on-surface">{row.name}</p>
                          <p className="text-label-md text-on-surface-variant">{row.slug}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'plan',
                      header: 'Plan',
                      render: (row) => (
                        <Badge variant="info" className="uppercase">
                          {row.plan}
                        </Badge>
                      ),
                    },
                    {
                      key: 'mrr',
                      header: 'MRR Contribution',
                      render: (row) => formatMrr(row.mrr),
                    },
                    {
                      key: 'lastPayment',
                      header: 'Last Payment Date',
                      render: (row) => row.lastPayment || 'N/A',
                    },
                    {
                      key: 'status',
                      header: 'Billing Status',
                      render: (row) => (
                        <Badge variant={row.status.toLowerCase() === 'active' ? 'success' : 'warning'} className="uppercase">
                          {row.status}
                        </Badge>
                      ),
                    },
                  ]}
                  emptyMessage="No billing logs found"
                />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  );
}

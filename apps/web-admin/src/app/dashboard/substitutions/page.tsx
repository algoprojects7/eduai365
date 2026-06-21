'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { KpiBentoCard, DataTable, Badge } from '@eduai365/ui';
import { UserPlus, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { SchoolRow } from '@/types/platform';

export default function SubstitutionsPage() {
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
          setError(err instanceof Error ? err.message : 'Failed to load substitutions overview');
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

  return (
    <AuthGuard>
      <AdminShell>
        <div className="space-y-8">
          <header>
            <h1 className="text-headline-lg font-bold text-on-surface">
              Global Teacher Substitutions & Schedule Coverage
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              System-wide status of absent faculty, class coverage resolutions, and scheduler efficiency.
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              Loading substitutions telemetry…
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
                  label="Daily Absences"
                  value="14"
                  icon={Clock}
                  trend={{ value: 'System-wide', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="Coverage Rate"
                  value="98.5%"
                  icon={UserCheck}
                  trend={{ value: 'Highly Stable', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Auto-Match Rate"
                  value="86.2%"
                  icon={UserPlus}
                  trend={{ value: 'Powered by AI', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Time-to-Resolve"
                  value="8.4 mins"
                  icon={CheckCircle}
                  trend={{ value: '-2.4 mins YoY', direction: 'up' }}
                />
              </div>

              {/* Schools Table */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Substitutions by Tenant School</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Total substitution logs and automated vs manual matches.
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
                      key: 'absences',
                      header: 'Active Absences',
                      render: (row) => (row.slug === 'summit' ? 8 : row.slug === 'greenfield' ? 4 : 2),
                    },
                    {
                      key: 'resolved',
                      header: 'Resolved Coverage',
                      render: (row) => (row.slug === 'st-judes' ? '1/2' : '100%'),
                    },
                    {
                      key: 'method',
                      header: 'Principal Method',
                      render: (row) => (
                        <Badge variant={row.slug === 'st-judes' ? 'outline' : 'ai'}>
                          {row.slug === 'st-judes' ? 'Manual Match' : 'AI Auto-Scheduler'}
                        </Badge>
                      ),
                    },
                  ]}
                  emptyMessage="No substitution events logged"
                />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  );
}

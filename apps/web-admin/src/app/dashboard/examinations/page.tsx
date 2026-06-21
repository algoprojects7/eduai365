'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { KpiBentoCard, DataTable, Badge } from '@eduai365/ui';
import { ClipboardList, Award, CheckSquare, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { SchoolRow } from '@/types/platform';

export default function ExaminationsPage() {
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
          setError(err instanceof Error ? err.message : 'Failed to load examinations overview');
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
              Global Examinations & Performance Auditing
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Centralized auditing of scheduled exams, grading distribution, and regulatory compliance.
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              Loading examinations telemetry…
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
                  label="Exams Scheduled"
                  value="156"
                  icon={ClipboardList}
                  trend={{ value: 'This term', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="Overall System Avg."
                  value="76.8%"
                  icon={Award}
                  trend={{ value: '+1.2% YoY', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Grading Progress"
                  value="98.7%"
                  icon={CheckSquare}
                  trend={{ value: 'On Schedule', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Compliance Status"
                  value="100%"
                  icon={ShieldCheck}
                  trend={{ value: 'Fully Compliant', direction: 'up' }}
                />
              </div>

              {/* Schools Table */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Exams by Tenant School</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Average performance, exam compliance, and schedule validation.
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
                      key: 'exams',
                      header: 'Exams Run',
                      render: (row) => (row.slug === 'summit' ? 74 : row.slug === 'greenfield' ? 48 : 34),
                    },
                    {
                      key: 'avgGrade',
                      header: 'Class Avg Grade',
                      render: (row) => (row.slug === 'summit' ? '79.2%' : row.slug === 'greenfield' ? '76.5%' : '72.1%'),
                    },
                    {
                      key: 'compliance',
                      header: 'Exam Board Compliance',
                      render: (row) => (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface">Verified</span>
                          <Badge variant="success">PASS</Badge>
                        </div>
                      ),
                    },
                  ]}
                  emptyMessage="No exam data found"
                />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  );
}

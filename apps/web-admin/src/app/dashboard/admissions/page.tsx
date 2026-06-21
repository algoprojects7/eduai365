'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { KpiBentoCard, DataTable, Badge } from '@eduai365/ui';
import { GraduationCap, FileText, UserPlus, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { SchoolRow } from '@/types/platform';

export default function AdmissionsPage() {
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
          setError(err instanceof Error ? err.message : 'Failed to load admissions overview');
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
              Global Admissions & Intake Analytics
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Centralized monitoring of new student registrations, applications status, and document verification.
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              Loading admissions metrics…
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
                  label="Intake Applications"
                  value="1,850"
                  icon={FileText}
                  trend={{ value: 'This term', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="Verified Enrolled"
                  value="1,240"
                  icon={GraduationCap}
                  trend={{ value: 'Active Students', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="New Registrations"
                  value="412"
                  icon={UserPlus}
                  trend={{ value: '+14% weekly', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Intake Success Rate"
                  value="96.2%"
                  icon={CheckCircle}
                  trend={{ value: 'Excellent yield', direction: 'up' }}
                />
              </div>

              {/* Schools Table */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Admissions by Tenant School</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Student intake limits, enrolled headcounts, and verification backlogs.
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
                      key: 'studentCount',
                      header: 'Total Enrolled',
                      render: (row) => row.studentCount.toLocaleString(),
                    },
                    {
                      key: 'applications',
                      header: 'Total Applications',
                      render: (row) => (row.slug === 'summit' ? 1200 : row.slug === 'greenfield' ? 450 : 200),
                    },
                    {
                      key: 'verificationStatus',
                      header: 'Document Verification',
                      render: (row) => (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface">
                            {row.slug === 'st-judes' ? 'Pending (12)' : 'Completed'}
                          </span>
                          <Badge variant={row.slug === 'st-judes' ? 'warning' : 'success'}>
                            {row.slug === 'st-judes' ? 'REVIEWING' : 'VERIFIED'}
                          </Badge>
                        </div>
                      ),
                    },
                  ]}
                  emptyMessage="No admissions logged"
                />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  );
}

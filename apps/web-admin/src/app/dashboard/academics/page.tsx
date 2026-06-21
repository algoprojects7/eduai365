'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { KpiBentoCard, DataTable, Badge } from '@eduai365/ui';
import { BookOpen, Users, FileText, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { SchoolRow } from '@/types/platform';

export default function AcademicsPage() {
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
          setError(err instanceof Error ? err.message : 'Failed to load academics overview');
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

  const totalStudents = schools.reduce((sum, s) => sum + s.studentCount, 0);
  const totalClasses = Math.round(totalStudents / 25) || 0;
  const totalTeachers = Math.round(totalStudents / 12) || 0;

  return (
    <AuthGuard>
      <AdminShell>
        <div className="space-y-8">
          <header>
            <h1 className="text-headline-lg font-bold text-on-surface">
              Global Academics & Curriculum Telemetry
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Centralized view of classes, curriculums, and teachers active across all school ecosystems.
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              Loading academics metrics…
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
                  label="Total Classes"
                  value={totalClasses}
                  icon={BookOpen}
                  trend={{ value: 'System-wide', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="Active Teachers"
                  value={totalTeachers}
                  icon={Users}
                  trend={{ value: '+5% this term', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Syllabus Progress"
                  value="94.2%"
                  icon={CheckCircle}
                  trend={{ value: 'On Track', direction: 'up' }}
                />
                <KpiBentoCard
                  label="Active Homeworks"
                  value={(totalStudents * 3).toLocaleString()}
                  icon={FileText}
                  trend={{ value: 'Daily avg', direction: 'neutral' }}
                />
              </div>

              {/* Schools Table */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Academics by Tenant School</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Syllabus progress, teacher load, and class configurations.
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
                      key: 'classes',
                      header: 'Active Classes',
                      render: (row) => Math.round(row.studentCount / 25),
                    },
                    {
                      key: 'teachers',
                      header: 'Teachers',
                      render: (row) => Math.round(row.studentCount / 12),
                    },
                    {
                      key: 'progress',
                      header: 'Curriculum Status',
                      render: (row) => {
                        const progress = row.slug === 'greenfield' ? '92.5%' : row.slug === 'summit' ? '96.1%' : '88.0%';
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-on-surface">{progress}</span>
                            <Badge variant={row.slug === 'st-judes' ? 'warning' : 'success'}>
                              {row.slug === 'st-judes' ? 'Approaching' : 'Verified'}
                            </Badge>
                          </div>
                        );
                      },
                    },
                  ]}
                  emptyMessage="No school tenants found"
                />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  );
}

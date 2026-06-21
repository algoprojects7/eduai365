'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AdminShell } from '@/components/admin-shell';
import { KpiBentoCard, DataTable, Badge } from '@eduai365/ui';
import { Library, BookOpen, AlertTriangle, IndianRupee } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { SchoolRow } from '@/types/platform';

export default function LibraryPage() {
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
          setError(err instanceof Error ? err.message : 'Failed to load library overview');
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
              Global Library & Bookstore Inventory
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Centralized monitoring of book catalogs, checked-out records, and bookstore revenue.
            </p>
          </header>

          {loading && (
            <div className="bento-card py-16 text-center text-on-surface-variant">
              Loading library metrics…
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
                  label="Total Catalog Volume"
                  value="48,250"
                  icon={Library}
                  trend={{ value: 'Books system-wide', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="Checked-Out Books"
                  value="3,412"
                  icon={BookOpen}
                  trend={{ value: '8.4% circulation', direction: 'neutral' }}
                />
                <KpiBentoCard
                  label="Low Stock Warnings"
                  value="14"
                  icon={AlertTriangle}
                  trend={{ value: 'Bookstore items', direction: 'down' }}
                />
                <KpiBentoCard
                  label="Bookstore Revenue"
                  value="₹4,12,850"
                  icon={IndianRupee}
                  trend={{ value: '+12% this month', direction: 'up' }}
                />
              </div>

              {/* Schools Table */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Library Status by Tenant School</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Inventory statistics, active checkouts, and low stock indicators.
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
                      key: 'catalog',
                      header: 'Total Catalog',
                      render: (row) => (row.slug === 'summit' ? '28,000' : row.slug === 'greenfield' ? '12,500' : '7,750'),
                    },
                    {
                      key: 'checkedOut',
                      header: 'Active Checkouts',
                      render: (row) => (row.slug === 'summit' ? '2,140' : row.slug === 'greenfield' ? '820' : '452'),
                    },
                    {
                      key: 'bookstoreStatus',
                      header: 'Bookstore Status',
                      render: (row) => (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface">
                            {row.slug === 'st-judes' ? 'Low Stock (4)' : 'Stock Healthy'}
                          </span>
                          <Badge variant={row.slug === 'st-judes' ? 'warning' : 'success'}>
                            {row.slug === 'st-judes' ? 'RESTOCK' : 'OK'}
                          </Badge>
                        </div>
                      ),
                    },
                  ]}
                  emptyMessage="No library data found"
                />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AuthGuard>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@eduai365/ui';
import { UserCheck, Trophy, ClipboardList, Wallet, GraduationCap } from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import { formatPercent, formatInr, getInitials } from '@/lib/format';
import { useRouter } from 'next/navigation';

interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  className: string;
  section: string;
  gpa: number;
  rank: number;
  attendancePercent: number;
  feeOutstanding: number;
}

interface ParentDashboardResponse {
  parentName: string;
  children: ChildSummary[];
}

export default function ChildrenPage() {
  const router = useRouter();
  const [data, setData] = useState<ParentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch<ParentDashboardResponse>('/parent/dashboard');
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load children profiles');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <ParentShell>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">My Children</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            View profiles and direct indicators for all children linked to your guardian account.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading child profiles…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && data && (
          <div className="grid gap-6 md:grid-cols-2">
            {data.children.length === 0 ? (
              <div className="bento-card col-span-2 py-16 text-center text-on-surface-variant">
                No linked children found for this account.
              </div>
            ) : (
              data.children.map((child) => (
                <div key={child.id} className="bento-card flex flex-col justify-between space-y-6">
                  {/* Top profile part */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {getInitials(child.firstName, child.lastName)}
                    </div>
                    <div>
                      <h2 className="text-title-lg font-bold text-on-surface">{child.name}</h2>
                      <p className="text-body-md text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                        <GraduationCap className="h-4.5 w-4.5" />
                        Class {child.className} {child.section}
                      </p>
                    </div>
                  </div>

                  {/* Indicators Strip */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-surface-container-high text-center">
                    <div>
                      <span className="text-label-md text-on-surface-variant uppercase tracking-wider block">GPA</span>
                      <span className="font-bold text-on-surface text-headline-sm flex items-center justify-center gap-1 mt-0.5">
                        <Trophy className="h-4 w-4 text-warning" />
                        {child.gpa.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-label-md text-on-surface-variant uppercase tracking-wider block">Attendance</span>
                      <span className="font-bold text-on-surface text-headline-sm flex items-center justify-center gap-1 mt-0.5">
                        <ClipboardList className="h-4 w-4 text-secondary" />
                        {formatPercent(child.attendancePercent, 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-label-md text-on-surface-variant uppercase tracking-wider block">Fees Due</span>
                      <span className={`font-bold text-headline-sm flex items-center justify-center gap-1 mt-0.5 ${
                        child.feeOutstanding > 0 ? 'text-error' : 'text-success'
                      }`}>
                        <Wallet className="h-4 w-4" />
                        {child.feeOutstanding > 0 ? formatInr(child.feeOutstanding) : 'Nil'}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/results?childId=${child.id}`)}
                    >
                      View Results
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => router.push(`/dashboard`)}
                    >
                      Open Dashboard
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </ParentShell>
  );
}

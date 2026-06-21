'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  DarkBentoCard,
  DarkModuleShell,
  StatusBadge,
} from '@eduai365/ui';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  IndianRupee,
  Play,
  Receipt,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { SalarySlipModal } from '@/components/hr/salary-slip-modal';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr, formatInrLakh } from '@/lib/format';
import type {
  PayrollEntry,
  PayrollRunDetail,
  PayrollRunSummary,
  SalarySlip,
} from '@/types/hr';
import { MONTH_NAMES } from '@/types/hr';

function payrollStatusBadge(status: PayrollRunSummary['status']) {
  if (status === 'PAID') return 'processed' as const;
  if (status === 'PROCESSED') return 'active' as const;
  return 'pending' as const;
}

function entryStatusVariant(status: PayrollEntry['status']): 'success' | 'warning' | 'outline' {
  if (status === 'PAID') return 'success';
  if (status === 'PROCESSED') return 'warning';
  return 'outline';
}

export default function PayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payroll, setPayroll] = useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [showConfirmRun, setShowConfirmRun] = useState(false);
  const [slip, setSlip] = useState<SalarySlip | null>(null);
  const [loadingSlipId, setLoadingSlipId] = useState<string | null>(null);

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const summary = await apiFetch<PayrollRunSummary | null>(
        `/hr/payroll?month=${month}&year=${year}`,
      );

      if (summary) {
        const detail = await apiFetch<PayrollRunDetail>(`/hr/payroll/${summary.id}`);
        setPayroll(detail);
      } else {
        setPayroll(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payroll');
      setPayroll(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    void loadPayroll();
  }, [loadPayroll]);

  function shiftMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setMonth(newMonth);
    setYear(newYear);
  }

  async function handleRunPayroll() {
    setRunning(true);
    setError(null);

    try {
      const result = await apiFetch<PayrollRunDetail>('/hr/payroll/run', {
        method: 'POST',
        body: JSON.stringify({ month, year }),
      });
      setPayroll(result);
      setShowConfirmRun(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run payroll');
    } finally {
      setRunning(false);
    }
  }

  async function handleMarkPaid() {
    if (!payroll) return;

    setMarkingPaid(true);
    setError(null);

    try {
      const updated = await apiFetch<PayrollRunDetail>(`/hr/payroll/${payroll.id}/pay`, {
        method: 'PATCH',
      });
      setPayroll(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark payroll as paid');
    } finally {
      setMarkingPaid(false);
    }
  }

  async function handleViewSlip(entry: PayrollEntry) {
    if (!payroll) return;

    setLoadingSlipId(entry.id);
    try {
      const slipData = await apiFetch<SalarySlip>(
        `/hr/payroll/${payroll.id}/slip/${entry.employeeId}`,
      );
      setSlip(slipData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load salary slip');
    } finally {
      setLoadingSlipId(null);
    }
  }

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const canRun = !payroll || payroll.status === 'DRAFT';
  const canMarkPaid = payroll?.status === 'PROCESSED';

  return (
    <SchoolShell>
      <DarkModuleShell className="min-h-0 rounded-xl p-6 md:p-8">
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-headline-lg font-bold text-white">Salary & Payroll</h1>
              <p className="mt-1 text-body-md text-white/50">
                Process monthly payroll, review components, and generate salary slips
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[130px] px-2 text-center text-body-md font-medium text-white">
                  {periodLabel}
                </span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => void loadPayroll()}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Refresh
              </Button>

              {canRun && (
                <Button variant="ai" size="sm" onClick={() => setShowConfirmRun(true)}>
                  <Play className="mr-1.5 h-4 w-4" />
                  Run Payroll
                </Button>
              )}

              {canMarkPaid && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={markingPaid}
                  onClick={() => void handleMarkPaid()}
                >
                  <Wallet className="mr-1.5 h-4 w-4" />
                  {markingPaid ? 'Processing…' : 'Mark as Paid'}
                </Button>
              )}
            </div>
          </header>

          {error && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
          )}

          {loading && (
            <div className="py-16 text-center text-white/50">Loading payroll data…</div>
          )}

          {!loading && payroll && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={payrollStatusBadge(payroll.status)} />
                <span className="text-body-md text-white/50">
                  {payroll.entryCount} employees ·{' '}
                  {payroll.processedAt
                    ? `Processed ${new Date(payroll.processedAt).toLocaleDateString('en-IN')}`
                    : 'Not yet processed'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DarkBentoCard glow>
                  <p className="text-label-md uppercase text-white/50">Total Payable</p>
                  <p className="mt-2 text-headline-md font-bold text-white">
                    {formatInrLakh(payroll.totalPayable)}
                  </p>
                  <IndianRupee className="mt-2 h-4 w-4 text-white/30" />
                </DarkBentoCard>
                <DarkBentoCard>
                  <p className="text-label-md uppercase text-white/50">Provident Fund</p>
                  <p className="mt-2 text-headline-md font-bold text-white">
                    {formatInrLakh(payroll.totalPf)}
                  </p>
                  <Receipt className="mt-2 h-4 w-4 text-white/30" />
                </DarkBentoCard>
                <DarkBentoCard>
                  <p className="text-label-md uppercase text-white/50">TDS</p>
                  <p className="mt-2 text-headline-md font-bold text-white">
                    {formatInrLakh(payroll.totalTds)}
                  </p>
                  <Receipt className="mt-2 h-4 w-4 text-white/30" />
                </DarkBentoCard>
                <DarkBentoCard>
                  <p className="text-label-md uppercase text-white/50">Net Disbursement</p>
                  <p className="mt-2 text-headline-md font-bold text-success">
                    {formatInrLakh(payroll.netPayable)}
                  </p>
                  <Wallet className="mt-2 h-4 w-4 text-success/50" />
                </DarkBentoCard>
              </div>

              <DarkBentoCard className="p-0">
                <div className="border-b border-white/10 px-5 py-4">
                  <h3 className="text-title-md font-semibold text-white">Payroll Register</h3>
                  <p className="mt-1 text-body-md text-white/50">
                    Salary components for {periodLabel}
                  </p>
                </div>

                {payroll.entries.length === 0 ? (
                  <div className="py-16 text-center text-white/50">
                    No payroll entries. Run payroll to generate entries.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-left">
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            Employee
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            Basic
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            HRA
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            DA
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            PF
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            TDS
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            Net
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            Status
                          </th>
                          <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                            Slip
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payroll.entries.map((entry) => (
                          <tr
                            key={entry.id}
                            className="border-b border-white/5 transition hover:bg-white/[0.02]"
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{entry.employeeName}</p>
                              <p className="text-body-md text-white/40">
                                {entry.employeeCode} · {entry.department}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-white/80">{formatInr(entry.basic)}</td>
                            <td className="px-4 py-3 text-white/80">{formatInr(entry.hra)}</td>
                            <td className="px-4 py-3 text-white/80">{formatInr(entry.da)}</td>
                            <td className="px-4 py-3 text-white/60">{formatInr(entry.pf)}</td>
                            <td className="px-4 py-3 text-white/60">{formatInr(entry.tds)}</td>
                            <td className="px-4 py-3 font-medium text-white">
                              {formatInr(entry.net)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={entryStatusVariant(entry.status)}>
                                {entry.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                disabled={loadingSlipId === entry.id}
                                onClick={() => void handleViewSlip(entry)}
                              >
                                <Download className="mr-1 h-3.5 w-3.5" />
                                {loadingSlipId === entry.id ? '…' : 'View'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DarkBentoCard>
            </>
          )}

          {!loading && !payroll && (
            <DarkBentoCard className="py-16 text-center">
              <p className="text-title-md font-semibold text-white">No payroll for {periodLabel}</p>
              <p className="mt-2 text-body-md text-white/50">
                Run payroll to calculate salaries for all active employees.
              </p>
              <Button
                variant="ai"
                className="mt-6"
                onClick={() => setShowConfirmRun(true)}
              >
                <Play className="mr-1.5 h-4 w-4" />
                Run Payroll
              </Button>
            </DarkBentoCard>
          )}
        </div>
      </DarkModuleShell>

      {showConfirmRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel-dark w-full max-w-md rounded-lg border border-white/10 p-6">
            <h2 className="text-title-lg font-semibold text-white">Run Payroll</h2>
            <p className="mt-2 text-body-md text-white/60">
              Generate payroll entries for <strong className="text-white">{periodLabel}</strong>?
              This will calculate salary components for all active employees.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowConfirmRun(false)}>
                Cancel
              </Button>
              <Button variant="ai" disabled={running} onClick={() => void handleRunPayroll()}>
                {running ? 'Running…' : 'Confirm & Run'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <SalarySlipModal slip={slip} onClose={() => setSlip(null)} />
    </SchoolShell>
  );
}

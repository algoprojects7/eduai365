'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, KpiBentoCard } from '@eduai365/ui';
import { CheckCircle2, ExternalLink, FileText, Wallet } from 'lucide-react';
import { StudentShell } from '@/components/student-shell';
import { apiFetch } from '@/lib/api';
import { formatInr, formatShortDate } from '@/lib/format';

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  term: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
  dueDate: string;
}

interface RawFees {
  outstanding?: number;
  outstandingAmount?: number;
  status?: string;
  invoices?: InvoiceItem[];
  dueDate?: string;
  paymentUrl?: string;
}

function statusVariant(status: string): 'success' | 'error' | 'warning' | 'info' {
  const s = status.toUpperCase();
  if (s === 'PAID') return 'success';
  if (s === 'OVERDUE') return 'error';
  if (s === 'PARTIAL') return 'warning';
  return 'info';
}

export default function FeesPage() {
  const [fees, setFees] = useState<RawFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const raw = await apiFetch<RawFees>('/student/fees');
        if (!cancelled) setFees(raw);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load fees');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const outstanding = fees?.outstanding ?? fees?.outstandingAmount ?? 0;
  const status = (fees?.status ?? 'DUE').toUpperCase();
  const invoices: InvoiceItem[] = fees?.invoices ?? [];

  return (
    <StudentShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Fee Management</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            View your fee invoices, payment history, and outstanding balance.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading fee details…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && fees && (
          <>
            {/* Outstanding alert */}
            {outstanding > 0 && (
              <div className="flex flex-col gap-4 rounded-xl border border-warning/30 bg-warning/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10">
                    <Wallet className="h-5 w-5 text-warning" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-title-lg font-semibold text-on-surface">Outstanding Balance</p>
                    <p className="text-body-md text-on-surface-variant">
                      {formatInr(outstanding)} pending
                      {fees.dueDate ? ` · Due ${formatShortDate(fees.dueDate)}` : ''}
                    </p>
                  </div>
                </div>
                {fees.paymentUrl && (
                  <Button
                    variant="primary"
                    onClick={() => window.open(fees.paymentUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Pay Now
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* KPI strip */}
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiBentoCard
                label="Outstanding"
                value={formatInr(outstanding)}
                icon={Wallet}
                trend={{ value: outstanding <= 0 ? 'All clear' : 'Pending payment', direction: outstanding <= 0 ? 'up' : 'down' }}
              />
              <KpiBentoCard
                label="Total Invoices"
                value={invoices.length}
                icon={FileText}
              />
              <KpiBentoCard
                label="Fee Status"
                value={status}
                icon={CheckCircle2}
                trend={{ value: 'Current term', direction: status === 'PAID' ? 'up' : 'neutral' }}
              />
            </div>

            {/* Invoices table */}
            <section className="bento-card">
              <h2 className="mb-4 text-title-lg font-semibold text-on-surface">Invoice History</h2>
              {invoices.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">No invoices generated yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-body-md">
                    <thead>
                      <tr className="border-b border-surface-container-high text-left">
                        <th className="pb-3 font-semibold text-on-surface-variant">Invoice No.</th>
                        <th className="pb-3 font-semibold text-on-surface-variant">Term</th>
                        <th className="pb-3 font-semibold text-on-surface-variant text-right">Total</th>
                        <th className="pb-3 font-semibold text-on-surface-variant text-right">Paid</th>
                        <th className="pb-3 font-semibold text-on-surface-variant text-right">Outstanding</th>
                        <th className="pb-3 font-semibold text-on-surface-variant">Due Date</th>
                        <th className="pb-3 font-semibold text-on-surface-variant">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-surface-faint/50 transition-colors">
                          <td className="py-3 font-medium text-on-surface">{inv.invoiceNo}</td>
                          <td className="py-3 text-on-surface-variant">{inv.term}</td>
                          <td className="py-3 text-right text-on-surface">{formatInr(inv.totalAmount)}</td>
                          <td className="py-3 text-right text-success">{formatInr(inv.paidAmount)}</td>
                          <td className="py-3 text-right font-semibold text-error">
                            {inv.outstanding > 0 ? formatInr(inv.outstanding) : '—'}
                          </td>
                          <td className="py-3 text-on-surface-variant">
                            {formatShortDate(inv.dueDate)}
                          </td>
                          <td className="py-3">
                            <Badge variant={statusVariant(inv.status)}>
                              {inv.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </StudentShell>
  );
}

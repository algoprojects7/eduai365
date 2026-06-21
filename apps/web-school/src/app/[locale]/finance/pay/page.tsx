'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, TabGroup } from '@eduai365/ui';
import {
  CheckCircle2,
  CreditCard,
  Download,
  Loader2,
  QrCode,
  Search,
  X,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr } from '@/lib/format';
import { downloadPdf, receiptPdfData } from '@/lib/pdf';
import type {
  InvoiceDetail,
  PaymentInitiateResult,
  PaymentMethod,
  PaymentReceipt,
  StudentInvoice,
} from '@/types/finance';
import type { StudentRow } from '@/types/school';

const CONVENIENCE_FEE_RATE = 0.015;

const PAYMENT_TABS = [
  { id: 'CARD', label: 'Card' },
  { id: 'UPI', label: 'UPI' },
  { id: 'NET_BANKING', label: 'Net Banking' },
  { id: 'CHALLAN', label: 'Challan' },
] as const;

const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
];

function studentDisplayName(row: StudentRow): string {
  return `${row.firstName} ${row.lastName}`.trim();
}

function studentClass(row: StudentRow): string {
  if (typeof row.class === 'string') return row.class;
  if (row.className) return row.className;
  if (row.class && typeof row.class === 'object' && row.class.name) return row.class.name;
  return '—';
}

function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function maskExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function maskCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export default function PaymentGatewayPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [paying, setPaying] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      try {
        const response = await apiFetch<{ items: StudentRow[] }>('/school/students?limit=100');
        if (!cancelled) {
          setStudents(response?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load students');
        }
      } finally {
        if (!cancelled) {
          setLoadingStudents(false);
        }
      }
    }

    void loadStudents();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (s) =>
        studentDisplayName(s).toLowerCase().includes(query) ||
        s.admissionNo.toLowerCase().includes(query) ||
        studentClass(s).toLowerCase().includes(query),
    );
  }, [students, search]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const loadInvoices = useCallback(async (studentId: string) => {
    setLoadingInvoice(true);
    setError(null);
    setInvoiceDetail(null);
    setSelectedLineItems(new Set());

    try {
      const data = await apiFetch<StudentInvoice[]>(`/finance/invoices?studentId=${studentId}`);
      setInvoices(data);

      const payable = data.find((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED');
      const invoiceId = payable?.id ?? data[0]?.id ?? '';
      setSelectedInvoiceId(invoiceId);
    } catch (err) {
      setInvoices([]);
      setSelectedInvoiceId('');
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoadingInvoice(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      void loadInvoices(selectedStudentId);
    } else {
      setInvoices([]);
      setSelectedInvoiceId('');
      setInvoiceDetail(null);
    }
  }, [selectedStudentId, loadInvoices]);

  useEffect(() => {
    if (!selectedInvoiceId) {
      setInvoiceDetail(null);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setLoadingInvoice(true);
      try {
        const data = await apiFetch<InvoiceDetail>(`/finance/invoices/${selectedInvoiceId}`);
        if (!cancelled) {
          setInvoiceDetail(data);
          setSelectedLineItems(new Set(data.lineItems.map((item) => item.id)));
        }
      } catch (err) {
        if (!cancelled) {
          setInvoiceDetail(null);
          setError(err instanceof Error ? err.message : 'Failed to load invoice details');
        }
      } finally {
        if (!cancelled) {
          setLoadingInvoice(false);
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedInvoiceId]);

  const subtotal = useMemo(() => {
    if (!invoiceDetail) return 0;
    return invoiceDetail.lineItems
      .filter((item) => selectedLineItems.has(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
  }, [invoiceDetail, selectedLineItems]);

  const lateFine = invoiceDetail?.lateFine ?? 0;
  const baseAmount = subtotal + lateFine;
  const convenienceFee = Math.round(baseAmount * CONVENIENCE_FEE_RATE * 100) / 100;
  const grandTotal = baseAmount + convenienceFee;

  function toggleLineItem(id: string) {
    setSelectedLineItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleDownloadPdf() {
    if (!receipt) return;

    setDownloadingReceipt(true);
    setError(null);

    try {
      await downloadPdf(
        'receipt',
        receiptPdfData(receipt),
        `receipt-${receipt.receiptNo}.html`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download receipt');
    } finally {
      setDownloadingReceipt(false);
    }
  }

  async function handlePay() {
    if (!selectedStudentId || !selectedInvoiceId || selectedLineItems.size === 0) {
      setError('Select at least one fee item to pay');
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const initiate = await apiFetch<PaymentInitiateResult>('/finance/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          invoiceId: selectedInvoiceId,
          lineItemIds: Array.from(selectedLineItems),
          method: paymentMethod,
          amount: baseAmount,
        }),
      });

      const confirmed = await apiFetch<PaymentReceipt>('/finance/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: initiate.paymentId,
          transactionId: `TXN${Date.now()}`,
          simulateWebhook: true,
        }),
      });

      setReceipt(confirmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Collect Payment</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Process student fee payments via card, UPI, net banking, or challan
          </p>
        </header>

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <div className="bento-card space-y-4">
              <h2 className="text-title-lg font-semibold text-on-surface">Select Student</h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, class, or admission no…"
                  className="w-full rounded-lg border border-gray-300/30 bg-surface-faint py-2.5 pl-10 pr-4 text-body-md text-on-surface outline-none focus:border-secondary"
                />
              </div>

              {loadingStudents ? (
                <p className="text-body-md text-on-surface-variant">Loading students…</p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                  {filteredStudents.map((student) => {
                    const isSelected = student.id === selectedStudentId;
                    return (
                      <li key={student.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'border-secondary bg-secondary/5'
                              : 'border-gray-300/20 hover:border-gray-300/40'
                          }`}
                        >
                          <p className="font-semibold text-on-surface">{studentDisplayName(student)}</p>
                          <p className="text-body-md text-on-surface-variant">
                            {studentClass(student)} · {student.admissionNo}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <li className="py-4 text-center text-body-md text-on-surface-variant">
                      No students found
                    </li>
                  )}
                </ul>
              )}
            </div>

            {selectedStudent && (
              <div className="bento-card">
                <h3 className="text-title-md font-semibold text-on-surface">Student Details</h3>
                <dl className="mt-3 space-y-2 text-body-md">
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Name</dt>
                    <dd className="font-medium text-on-surface">{studentDisplayName(selectedStudent)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Class</dt>
                    <dd className="font-medium text-on-surface">{studentClass(selectedStudent)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">Admission No</dt>
                    <dd className="font-medium text-on-surface">{selectedStudent.admissionNo}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-3">
            <div className="bento-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-title-lg font-semibold text-on-surface">Fee Breakdown</h2>
                {invoices.length > 1 && (
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="rounded-lg border border-gray-300/30 bg-surface-faint px-3 py-1.5 text-body-md text-on-surface"
                    aria-label="Select invoice"
                  >
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNo} — {inv.term} ({inv.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!selectedStudentId && (
                <p className="text-body-md text-on-surface-variant">
                  Select a student to view pending fees
                </p>
              )}

              {selectedStudentId && loadingInvoice && (
                <p className="text-body-md text-on-surface-variant">Loading invoice…</p>
              )}

              {invoiceDetail && !loadingInvoice && (
                <>
                  <ul className="space-y-2">
                    {invoiceDetail.lineItems.map((item) => (
                      <li key={item.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300/20 px-4 py-3 hover:bg-surface-faint">
                          <input
                            type="checkbox"
                            checked={selectedLineItems.has(item.id)}
                            onChange={() => toggleLineItem(item.id)}
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                          />
                          <span className="flex-1 text-body-md text-on-surface">{item.description}</span>
                          <span className="font-semibold tabular-nums text-on-surface">
                            {formatInr(item.amount)}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  {lateFine > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-warning/10 px-4 py-3 text-body-md">
                      <span className="font-medium text-warning">Late Fine (auto-applied)</span>
                      <span className="font-semibold tabular-nums text-on-surface">
                        {formatInr(lateFine)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bento-card space-y-4">
              <h2 className="text-title-lg font-semibold text-on-surface">Payment Method</h2>

              <TabGroup
                tabs={PAYMENT_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
                activeTab={paymentMethod}
                onChange={(id) => setPaymentMethod(id as PaymentMethod)}
              />

              {paymentMethod === 'CARD' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      Card Number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      className="mt-1 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-2.5 font-mono text-body-md text-on-surface outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      Expiry
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(maskExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="mt-1 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-2.5 font-mono text-body-md text-on-surface outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      CVV
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(maskCvv(e.target.value))}
                      placeholder="•••"
                      className="mt-1 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-2.5 font-mono text-body-md text-on-surface outline-none focus:border-secondary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="As printed on card"
                      className="mt-1 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300/40 bg-surface-faint py-8">
                    <QrCode className="h-24 w-24 text-on-surface-variant/40" strokeWidth={1} />
                    <p className="mt-3 text-body-md text-on-surface-variant">
                      Scan QR code with any UPI app
                    </p>
                  </div>
                  <div>
                    <label className="text-label-md uppercase tracking-wider text-on-surface-variant">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@upi"
                      className="mt-1 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'NET_BANKING' && (
                <div>
                  <label className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    Select Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary"
                  >
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMethod === 'CHALLAN' && (
                <div className="rounded-lg border border-gray-300/20 bg-surface-faint px-4 py-6 text-center">
                  <p className="text-body-md text-on-surface-variant">
                    Generate a bank challan for offline payment at any branch
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-4"
                    onClick={() => alert('Challan download will be available once connected.')}
                  >
                    <Download className="h-4 w-4" />
                    Download Challan
                  </Button>
                </div>
              )}
            </div>

            <div className="bento-card space-y-4">
              <div className="space-y-2 text-body-md">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatInr(subtotal)}</span>
                </div>
                {lateFine > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Late Fine</span>
                    <span className="tabular-nums">{formatInr(lateFine)}</span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>Convenience Fee (1.5%)</span>
                  <span className="tabular-nums">{formatInr(convenienceFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300/20 pt-2 text-title-md font-bold text-on-surface">
                  <span>Grand Total</span>
                  <span className="tabular-nums">{formatInr(grandTotal)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={paying || !selectedStudentId || selectedLineItems.size === 0}
                onClick={() => void handlePay()}
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Payment…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay {formatInr(grandTotal)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Payment Successful</h3>
                  <p className="text-body-md text-on-surface-variant">Transaction completed</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-faint"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-6 space-y-3 text-body-md">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Receipt No</dt>
                <dd className="font-semibold text-on-surface">{receipt.receiptNo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Transaction ID</dt>
                <dd className="font-mono text-sm text-on-surface">{receipt.transactionId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Amount Paid</dt>
                <dd className="font-semibold tabular-nums text-on-surface">
                  {formatInr(receipt.grandTotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Timestamp</dt>
                <dd className="text-on-surface">
                  {new Date(receipt.paidAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
            </dl>

            <Button
              variant="primary"
              className="mt-6 w-full"
              disabled={downloadingReceipt}
              onClick={() => void handleDownloadPdf()}
            >
              <Download className="h-4 w-4" />
              {downloadingReceipt ? 'Generating…' : 'Download PDF'}
            </Button>
          </div>
        </div>
      )}
    </SchoolShell>
  );
}

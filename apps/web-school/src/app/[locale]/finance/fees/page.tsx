'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  StatusBadge,
  TabGroup,
  chartColors,
  rechartsAxisProps,
} from '@eduai365/ui';
import {
  AlertCircle,
  Bell,
  IndianRupee,
  Percent,
  Plus,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FeeMatrixGrid } from '@/components/finance/fee-matrix-grid';
import { OverdueTable } from '@/components/finance/overdue-table';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInrLakh, formatPercent } from '@/lib/format';
import type {
  CollectionStat,
  Concession,
  CreateFeeHeadInput,
  CreateScholarshipInput,
  FeeHead,
  FeeMatrixRow,
  FeeMatrixUpdate,
  OverdueInvoice,
  Scholarship,
  UpdateFeeHeadInput,
} from '@/types/finance';
import {
  FEE_HEAD_CATEGORIES,
  FEE_MATRIX_GRADES,
  SCHOLARSHIP_TYPES,
} from '@/types/finance';

type FeeTab = 'fee-heads' | 'matrix' | 'scholarships' | 'concessions' | 'overdue';

const ACADEMIC_YEAR = '2025-26';

const EMPTY_FEE_HEAD: CreateFeeHeadInput = {
  name: '',
  code: '',
  category: FEE_HEAD_CATEGORIES[0],
  amount: 0,
  isActive: true,
  isMandatory: false,
};

const EMPTY_SCHOLARSHIP: CreateScholarshipInput = {
  name: '',
  type: SCHOLARSHIP_TYPES[0],
  discountPercent: 0,
  isActive: true,
};

function formatRupee(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function mergeMatrixWithGrades(rows: FeeMatrixRow[]): FeeMatrixRow[] {
  return FEE_MATRIX_GRADES.map((grade) => {
    const existing = rows.find((r) => r.grade === grade);
    return existing ?? { grade, fees: [] };
  });
}

export default function FeeStructurePage() {
  const [activeTab, setActiveTab] = useState<FeeTab>('fee-heads');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [matrix, setMatrix] = useState<FeeMatrixRow[]>([]);
  const [matrixUpdates, setMatrixUpdates] = useState<FeeMatrixUpdate[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStat[]>([]);

  const [showFeeHeadModal, setShowFeeHeadModal] = useState(false);
  const [editingFeeHead, setEditingFeeHead] = useState<FeeHead | null>(null);
  const [feeHeadForm, setFeeHeadForm] = useState<CreateFeeHeadInput>(EMPTY_FEE_HEAD);
  const [feeHeadSubmitting, setFeeHeadSubmitting] = useState(false);
  const [feeHeadFormError, setFeeHeadFormError] = useState<string | null>(null);

  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [scholarshipForm, setScholarshipForm] = useState<CreateScholarshipInput>(EMPTY_SCHOLARSHIP);
  const [scholarshipSubmitting, setScholarshipSubmitting] = useState(false);
  const [scholarshipFormError, setScholarshipFormError] = useState<string | null>(null);

  const [matrixSaving, setMatrixSaving] = useState(false);
  const [matrixMessage, setMatrixMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [heads, matrixData, scholarshipData, concessionData, overdueData, statsData] =
        await Promise.all([
          apiFetch<FeeHead[]>('/finance/fee-heads'),
          apiFetch<FeeMatrixRow[]>(`/finance/fee-matrix?academicYear=${ACADEMIC_YEAR}`),
          apiFetch<Scholarship[]>('/finance/scholarships'),
          apiFetch<Concession[]>('/finance/concessions'),
          apiFetch<OverdueInvoice[]>('/finance/overdue'),
          apiFetch<CollectionStat[]>('/finance/collection-stats'),
        ]);

      setFeeHeads(heads);
      setMatrix(mergeMatrixWithGrades(matrixData));
      setMatrixUpdates([]);
      setScholarships(scholarshipData);
      setConcessions(concessionData);
      setOverdue(overdueData);
      setCollectionStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fee structure data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const kpis = useMemo(() => {
    const totalCollected = collectionStats.reduce((sum, row) => sum + row.collected, 0);
    const totalTarget = collectionStats.reduce((sum, row) => sum + row.target, 0);
    const outstanding = Math.max(0, totalTarget - totalCollected);
    const collectionRate = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;

    return {
      totalCollected,
      outstanding,
      overdueCount: overdue.length,
      collectionRate,
    };
  }, [collectionStats, overdue]);

  const chartData = useMemo(
    () =>
      collectionStats.map((row) => ({
        className: row.className,
        collected: row.collected / 100_000,
        target: row.target / 100_000,
      })),
    [collectionStats],
  );

  function openAddFeeHead() {
    setEditingFeeHead(null);
    setFeeHeadForm(EMPTY_FEE_HEAD);
    setFeeHeadFormError(null);
    setShowFeeHeadModal(true);
  }

  function openEditFeeHead(head: FeeHead) {
    setEditingFeeHead(head);
    setFeeHeadForm({
      name: head.name,
      code: head.code,
      category: head.category,
      amount: head.amount,
      isActive: head.isActive,
      isMandatory: head.isMandatory,
    });
    setFeeHeadFormError(null);
    setShowFeeHeadModal(true);
  }

  async function handleFeeHeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeeHeadFormError(null);
    setFeeHeadSubmitting(true);

    try {
      if (editingFeeHead) {
        const updated = await apiFetch<FeeHead>(`/finance/fee-heads/${editingFeeHead.id}`, {
          method: 'PATCH',
          body: JSON.stringify(feeHeadForm satisfies UpdateFeeHeadInput),
        });
        setFeeHeads((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
      } else {
        const created = await apiFetch<FeeHead>('/finance/fee-heads', {
          method: 'POST',
          body: JSON.stringify(feeHeadForm),
        });
        setFeeHeads((prev) => [...prev, created]);
      }

      setShowFeeHeadModal(false);
      setEditingFeeHead(null);
      setFeeHeadForm(EMPTY_FEE_HEAD);
    } catch (err) {
      setFeeHeadFormError(err instanceof Error ? err.message : 'Failed to save fee head');
    } finally {
      setFeeHeadSubmitting(false);
    }
  }

  async function handleScholarshipSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScholarshipFormError(null);
    setScholarshipSubmitting(true);

    try {
      const created = await apiFetch<Scholarship>('/finance/scholarships', {
        method: 'POST',
        body: JSON.stringify(scholarshipForm),
      });
      setScholarships((prev) => [...prev, created]);
      setShowScholarshipModal(false);
      setScholarshipForm(EMPTY_SCHOLARSHIP);
    } catch (err) {
      setScholarshipFormError(err instanceof Error ? err.message : 'Failed to create scholarship');
    } finally {
      setScholarshipSubmitting(false);
    }
  }

  function handleMatrixCellChange(grade: string, feeHeadId: string, amount: number) {
    setMatrix((prev) =>
      prev.map((row) => {
        if (row.grade !== grade) return row;

        const fees = [...row.fees];
        const idx = fees.findIndex((f) => f.feeHeadId === feeHeadId);
        const head = feeHeads.find((h) => h.id === feeHeadId);
        const feeHeadName = head?.name ?? fees[idx]?.feeHeadName ?? '';

        if (idx >= 0) {
          fees[idx] = { feeHeadId, feeHeadName, amount };
        } else {
          fees.push({ feeHeadId, feeHeadName, amount });
        }

        return { ...row, fees };
      }),
    );

    setMatrixUpdates((prev) => {
      const rest = prev.filter((u) => u.grade !== grade || u.feeHeadId !== feeHeadId);
      return [...rest, { grade, feeHeadId, amount }];
    });
    setMatrixMessage(null);
  }

  async function handleSaveMatrix() {
    if (matrixUpdates.length === 0) return;

    setMatrixSaving(true);
    setMatrixMessage(null);

    try {
      await apiFetch('/finance/fee-matrix', {
        method: 'PATCH',
        body: JSON.stringify({
          academicYear: ACADEMIC_YEAR,
          updates: matrixUpdates,
        }),
      });
      setMatrixUpdates([]);
      setMatrixMessage('Fee matrix saved successfully');
    } catch (err) {
      setMatrixMessage(err instanceof Error ? err.message : 'Failed to save fee matrix');
    } finally {
      setMatrixSaving(false);
    }
  }

  function handleSendReminder(invoiceId: string, studentName: string) {
    setToast(`Payment reminder sent to ${studentName} (${invoiceId})`);
  }

  function updateFeeHeadField<K extends keyof CreateFeeHeadInput>(
    key: K,
    value: CreateFeeHeadInput[K],
  ) {
    setFeeHeadForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateScholarshipField<K extends keyof CreateScholarshipInput>(
    key: K,
    value: CreateScholarshipInput[K],
  ) {
    setScholarshipForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Fee Structure</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Fee heads, class-wise matrix, scholarships, and overdue tracking
            </p>
          </div>
          {activeTab === 'fee-heads' && (
            <Button variant="primary" onClick={openAddFeeHead}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fee Head
            </Button>
          )}
          {activeTab === 'scholarships' && (
            <Button variant="primary" onClick={() => setShowScholarshipModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Scholarship
            </Button>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard
            label="Total Collected"
            value={loading ? '…' : formatInrLakh(kpis.totalCollected)}
            icon={IndianRupee}
          />
          <KpiBentoCard
            label="Outstanding"
            value={loading ? '…' : formatInrLakh(kpis.outstanding)}
            icon={AlertCircle}
          />
          <KpiBentoCard
            label="Overdue Count"
            value={loading ? '…' : kpis.overdueCount}
            icon={TrendingUp}
          />
          <KpiBentoCard
            label="Collection Rate"
            value={loading ? '…' : formatPercent(kpis.collectionRate, 0)}
            icon={Percent}
          />
        </div>

        {!loading && collectionStats.length > 0 && (
          <section className="bento-card">
            <h2 className="text-title-lg font-semibold text-on-surface">Collection by Class</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Collected vs target (₹ Lakhs)
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="className" {...rechartsAxisProps} />
                  <YAxis {...rechartsAxisProps} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `₹${value.toFixed(1)}L`,
                      name === 'collected' ? 'Collected' : 'Target',
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid rgba(11, 29, 66, 0.08)',
                      boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="collected"
                    name="Collected"
                    fill={chartColors.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name="Target"
                    fill={chartColors.muted}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadData()}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {matrixMessage && (
          <div className="rounded-lg bg-secondary/10 px-4 py-3 text-body-md text-secondary">
            {matrixMessage}
          </div>
        )}

        <TabGroup
          tabs={[
            { id: 'fee-heads', label: 'Fee Heads' },
            { id: 'matrix', label: 'Class-wise Matrix' },
            { id: 'scholarships', label: 'Scholarships' },
            { id: 'concessions', label: 'Concessions' },
            { id: 'overdue', label: 'Overdue' },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as FeeTab)}
        />

        {loading ? (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading fee structure…
          </div>
        ) : (
          <>
            {activeTab === 'fee-heads' && (
              <DataTable
                data={feeHeads}
                keyExtractor={(row) => row.id}
                emptyMessage="No fee heads configured"
                columns={[
                  {
                    key: 'name',
                    header: 'Name',
                    render: (row) => (
                      <button
                        type="button"
                        className="font-medium text-secondary hover:underline"
                        onClick={() => openEditFeeHead(row)}
                      >
                        {row.name}
                      </button>
                    ),
                  },
                  { key: 'code', header: 'Code', render: (row) => row.code },
                  { key: 'category', header: 'Category', render: (row) => row.category },
                  {
                    key: 'amount',
                    header: 'Default Amount',
                    render: (row) => formatRupee(row.amount),
                  },
                  {
                    key: 'isMandatory',
                    header: 'Mandatory',
                    render: (row) =>
                      row.isMandatory ? (
                        <Badge variant="info">Mandatory</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      ),
                  },
                  {
                    key: 'isActive',
                    header: 'Status',
                    render: (row) => (
                      <StatusBadge status={row.isActive ? 'active' : 'inactive'} />
                    ),
                  },
                ]}
              />
            )}

            {activeTab === 'matrix' && (
              <FeeMatrixGrid
                feeHeads={feeHeads}
                matrix={matrix}
                saving={matrixSaving}
                hasChanges={matrixUpdates.length > 0}
                onCellChange={handleMatrixCellChange}
                onSave={() => void handleSaveMatrix()}
              />
            )}

            {activeTab === 'scholarships' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scholarships.length === 0 ? (
                  <div className="bento-card py-12 text-center text-on-surface-variant sm:col-span-2 lg:col-span-3">
                    No scholarships configured
                  </div>
                ) : (
                  scholarships.map((scholarship) => (
                    <div key={scholarship.id} className="bento-card space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-title-md font-semibold text-on-surface">
                            {scholarship.name}
                          </h3>
                          <p className="mt-0.5 text-body-md text-on-surface-variant">
                            {scholarship.type}
                          </p>
                        </div>
                        <StatusBadge status={scholarship.isActive ? 'active' : 'inactive'} />
                      </div>
                      <p className="text-headline-sm font-bold text-secondary">
                        {scholarship.discountPercent}% discount
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'concessions' && (
              <DataTable
                data={concessions}
                keyExtractor={(row) => row.id}
                emptyMessage="No student concessions"
                columns={[
                  {
                    key: 'studentName',
                    header: 'Student',
                    render: (row) => (
                      <span className="font-medium text-on-surface">{row.studentName}</span>
                    ),
                  },
                  {
                    key: 'studentId',
                    header: 'Student ID',
                    render: (row) => row.studentId,
                  },
                  {
                    key: 'discountPercent',
                    header: 'Discount',
                    render: (row) => `${row.discountPercent}%`,
                  },
                  {
                    key: 'reason',
                    header: 'Reason',
                    render: (row) => row.reason,
                  },
                ]}
              />
            )}

            {activeTab === 'overdue' && (
              <OverdueTable rows={overdue} onSendReminder={handleSendReminder} />
            )}
          </>
        )}
      </div>

      {showFeeHeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => !feeHeadSubmitting && setShowFeeHeadModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-headline-sm font-bold text-on-surface">
                  {editingFeeHead ? 'Edit Fee Head' : 'Add Fee Head'}
                </h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Configure fee component details
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                disabled={feeHeadSubmitting}
                onClick={() => setShowFeeHeadModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleFeeHeadSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="feeHeadName"
                    className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                  >
                    Name
                  </label>
                  <input
                    id="feeHeadName"
                    required
                    value={feeHeadForm.name}
                    onChange={(e) => updateFeeHeadField('name', e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="feeHeadCode"
                    className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                  >
                    Code
                  </label>
                  <input
                    id="feeHeadCode"
                    required
                    value={feeHeadForm.code}
                    onChange={(e) => updateFeeHeadField('code', e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="feeHeadCategory"
                    className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                  >
                    Category
                  </label>
                  <select
                    id="feeHeadCategory"
                    value={feeHeadForm.category}
                    onChange={(e) => updateFeeHeadField('category', e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  >
                    {FEE_HEAD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="feeHeadAmount"
                    className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                  >
                    Default Amount (₹)
                  </label>
                  <input
                    id="feeHeadAmount"
                    required
                    type="number"
                    min={0}
                    value={feeHeadForm.amount}
                    onChange={(e) => updateFeeHeadField('amount', Number(e.target.value) || 0)}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-body-md text-on-surface">
                  <input
                    type="checkbox"
                    checked={feeHeadForm.isMandatory}
                    onChange={(e) => updateFeeHeadField('isMandatory', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Mandatory
                </label>
                <label className="flex items-center gap-2 text-body-md text-on-surface">
                  <input
                    type="checkbox"
                    checked={feeHeadForm.isActive}
                    onChange={(e) => updateFeeHeadField('isActive', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Active
                </label>
              </div>

              {feeHeadFormError && (
                <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">
                  {feeHeadFormError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={feeHeadSubmitting}
                  onClick={() => setShowFeeHeadModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={feeHeadSubmitting}>
                  {feeHeadSubmitting ? 'Saving…' : editingFeeHead ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScholarshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => !scholarshipSubmitting && setShowScholarshipModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-headline-sm font-bold text-on-surface">Add Scholarship</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Merit, need-based, or staff ward discount
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                disabled={scholarshipSubmitting}
                onClick={() => setShowScholarshipModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleScholarshipSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="scholarshipName"
                  className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                >
                  Name
                </label>
                <input
                  id="scholarshipName"
                  required
                  value={scholarshipForm.name}
                  onChange={(e) => updateScholarshipField('name', e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="scholarshipType"
                    className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                  >
                    Type
                  </label>
                  <select
                    id="scholarshipType"
                    value={scholarshipForm.type}
                    onChange={(e) => updateScholarshipField('type', e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  >
                    {SCHOLARSHIP_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="scholarshipDiscount"
                    className="mb-1.5 block text-label-md font-medium text-on-surface-variant"
                  >
                    Discount %
                  </label>
                  <input
                    id="scholarshipDiscount"
                    required
                    type="number"
                    min={0}
                    max={100}
                    value={scholarshipForm.discountPercent}
                    onChange={(e) =>
                      updateScholarshipField('discountPercent', Number(e.target.value) || 0)
                    }
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-body-md text-on-surface">
                <input
                  type="checkbox"
                  checked={scholarshipForm.isActive}
                  onChange={(e) => updateScholarshipField('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Active
              </label>

              {scholarshipFormError && (
                <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">
                  {scholarshipFormError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={scholarshipSubmitting}
                  onClick={() => setShowScholarshipModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={scholarshipSubmitting}>
                  {scholarshipSubmitting ? 'Creating…' : 'Create Scholarship'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-lg border border-secondary/30 bg-white px-4 py-3 shadow-lg">
          <Bell className="h-4 w-4 text-secondary" />
          <span className="text-body-md text-on-surface">{toast}</span>
        </div>
      )}
    </SchoolShell>
  );
}

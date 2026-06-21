'use client';

import { Button } from '@eduai365/ui';
import { Save } from 'lucide-react';
import type { FeeHead, FeeMatrixRow } from '@/types/finance';
import { FEE_MATRIX_GRADES } from '@/types/finance';

interface FeeMatrixGridProps {
  feeHeads: FeeHead[];
  matrix: FeeMatrixRow[];
  saving: boolean;
  hasChanges: boolean;
  onCellChange: (grade: string, feeHeadId: string, amount: number) => void;
  onSave: () => void;
}

function formatRupee(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAmount(matrix: FeeMatrixRow[], grade: string, feeHeadId: string): number {
  const row = matrix.find((r) => r.grade === grade);
  const fee = row?.fees.find((f) => f.feeHeadId === feeHeadId);
  return fee?.amount ?? 0;
}

export function FeeMatrixGrid({
  feeHeads,
  matrix,
  saving,
  hasChanges,
  onCellChange,
  onSave,
}: FeeMatrixGridProps) {
  const activeHeads = feeHeads.filter((h) => h.isActive);

  if (activeHeads.length === 0) {
    return (
      <div className="bento-card py-16 text-center text-on-surface-variant">
        No active fee heads configured
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-md text-on-surface-variant">
          Academic year 2025–26 · {FEE_MATRIX_GRADES.length} grades × {activeHeads.length} fee heads
        </p>
        <Button variant="primary" disabled={saving || !hasChanges} onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save Matrix'}
        </Button>
      </div>

      <div className="bento-card overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-body-md">
          <thead>
            <tr className="border-b border-gray-300/20">
              <th className="sticky left-0 z-10 bg-white px-3 py-3 font-semibold text-on-surface">
                Grade
              </th>
              {activeHeads.map((head) => (
                <th
                  key={head.id}
                  className="px-3 py-3 font-semibold text-on-surface whitespace-nowrap"
                >
                  {head.name}
                  <span className="block text-label-md font-normal text-on-surface-variant">
                    {head.code}
                  </span>
                </th>
              ))}
              <th className="px-3 py-3 font-semibold text-on-surface">Total</th>
            </tr>
          </thead>
          <tbody>
            {FEE_MATRIX_GRADES.map((grade) => {
              const rowTotal = activeHeads.reduce(
                (sum, head) => sum + getAmount(matrix, grade, head.id),
                0,
              );

              return (
                <tr key={grade} className="border-b border-gray-300/10">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-on-surface">
                    {grade}
                  </td>
                  {activeHeads.map((head) => {
                    const amount = getAmount(matrix, grade, head.id);

                    return (
                      <td key={head.id} className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={amount}
                          onChange={(e) =>
                            onCellChange(
                              grade,
                              head.id,
                              Math.max(0, Number(e.target.value) || 0),
                            )
                          }
                          className="h-9 w-24 rounded border border-gray-300/30 px-2 text-body-md"
                          aria-label={`${grade} ${head.name}`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 font-semibold text-on-surface">
                    {formatRupee(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

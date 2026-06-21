'use client';

import { useState } from 'react';
import { Button } from '@eduai365/ui';
import { Download, X } from 'lucide-react';
import { formatInr } from '@/lib/format';
import { downloadPdf, salarySlipPdfData } from '@/lib/pdf';
import type { SalarySlip } from '@/types/hr';
import { MONTH_NAMES } from '@/types/hr';

interface SalarySlipModalProps {
  slip: SalarySlip | null;
  onClose: () => void;
}

export function SalarySlipModal({ slip, onClose }: SalarySlipModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!slip) return null;

  const currentSlip = slip;
  const periodLabel = `${MONTH_NAMES[currentSlip.month - 1]} ${currentSlip.year}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPdf(
        'salary-slip',
        salarySlipPdfData(currentSlip),
        `salary-slip-${currentSlip.employeeCode}-${currentSlip.year}-${String(currentSlip.month).padStart(2, '0')}.html`,
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-white/10 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 print:hidden">
          <h2 className="text-title-lg font-semibold text-on-surface">Salary Slip</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={downloading} onClick={() => void handleDownload()}>
              <Download className="mr-1.5 h-4 w-4" />
              {downloading ? 'Generating…' : 'Download PDF'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-on-surface-variant transition hover:bg-surface-faint"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-8">
          <div className="border border-gray-200 p-8">
            <div className="flex items-start justify-between border-b border-gray-300 pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary/10 text-xl font-bold text-secondary">
                {slip.schoolName.charAt(0)}
              </div>
              <div className="text-right">
                <h3 className="text-headline-sm font-bold text-on-surface">{slip.schoolName}</h3>
                <p className="mt-1 max-w-xs text-body-md text-on-surface-variant">
                  {slip.schoolAddress}
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-label-md uppercase tracking-widest text-on-surface-variant">
                Salary Slip
              </p>
              <p className="mt-1 text-title-lg font-semibold text-on-surface">{periodLabel}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-body-md">
                <p>
                  <span className="text-on-surface-variant">Employee:</span>{' '}
                  <span className="font-medium text-on-surface">{slip.employeeName}</span>
                </p>
                <p>
                  <span className="text-on-surface-variant">Employee ID:</span>{' '}
                  <span className="font-medium text-on-surface">{slip.employeeCode}</span>
                </p>
                <p>
                  <span className="text-on-surface-variant">Department:</span>{' '}
                  <span className="font-medium text-on-surface">{slip.department}</span>
                </p>
                <p>
                  <span className="text-on-surface-variant">Designation:</span>{' '}
                  <span className="font-medium text-on-surface">{slip.designation}</span>
                </p>
              </div>
              <div className="space-y-2 text-body-md sm:text-right">
                <p>
                  <span className="text-on-surface-variant">Pay Date:</span>{' '}
                  <span className="font-medium text-on-surface">
                    {new Date(slip.payDate).toLocaleDateString('en-IN')}
                  </span>
                </p>
                {slip.pan && (
                  <p>
                    <span className="text-on-surface-variant">PAN:</span>{' '}
                    <span className="font-medium text-on-surface">{slip.pan}</span>
                  </p>
                )}
                {slip.bankAccount && (
                  <p>
                    <span className="text-on-surface-variant">Bank A/C:</span>{' '}
                    <span className="font-medium text-on-surface">{slip.bankAccount}</span>
                  </p>
                )}
              </div>
            </div>

            <table className="mt-8 w-full border-collapse text-body-md">
              <thead>
                <tr className="border-b border-gray-300 bg-surface-faint">
                  <th className="px-4 py-2 text-left font-semibold text-on-surface">Earnings</th>
                  <th className="px-4 py-2 text-right font-semibold text-on-surface">Amount</th>
                  <th className="px-4 py-2 text-left font-semibold text-on-surface">Deductions</th>
                  <th className="px-4 py-2 text-right font-semibold text-on-surface">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2 text-on-surface-variant">Basic</td>
                  <td className="px-4 py-2 text-right text-on-surface">{formatInr(slip.basic)}</td>
                  <td className="px-4 py-2 text-on-surface-variant">Provident Fund</td>
                  <td className="px-4 py-2 text-right text-on-surface">{formatInr(slip.pf)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2 text-on-surface-variant">HRA</td>
                  <td className="px-4 py-2 text-right text-on-surface">{formatInr(slip.hra)}</td>
                  <td className="px-4 py-2 text-on-surface-variant">TDS</td>
                  <td className="px-4 py-2 text-right text-on-surface">{formatInr(slip.tds)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2 text-on-surface-variant">DA</td>
                  <td className="px-4 py-2 text-right text-on-surface">{formatInr(slip.da)}</td>
                  <td className="px-4 py-2" colSpan={2} />
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-400 font-semibold">
                  <td className="px-4 py-3 text-on-surface">Gross</td>
                  <td className="px-4 py-3 text-right text-on-surface">{formatInr(slip.gross)}</td>
                  <td className="px-4 py-3 text-on-surface">Net Pay</td>
                  <td className="px-4 py-3 text-right text-secondary">{formatInr(slip.net)}</td>
                </tr>
              </tfoot>
            </table>

            <p className="mt-8 text-center text-label-md text-on-surface-variant">
              This is a computer-generated salary slip and does not require a signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

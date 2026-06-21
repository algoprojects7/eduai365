'use client';

import { DarkBentoCard } from '@eduai365/ui';
import type { LeaveBalance, LeaveType } from '@/types/hr';
import { LEAVE_TYPE_LABELS } from '@/types/hr';

const TYPE_COLORS: Record<LeaveType, string> = {
  CL: 'bg-secondary',
  SL: 'bg-warning',
  EL: 'bg-success',
  ML: 'bg-ai-violet',
  PL: 'bg-ai-electric',
};

interface LeaveBalanceBarsProps {
  balances: LeaveBalance[];
}

export function LeaveBalanceBars({ balances }: LeaveBalanceBarsProps) {
  // Deduplicate by type — keep the last entry for each leave type
  const uniqueBalances = Object.values(
    balances.reduce<Record<string, LeaveBalance>>((acc, b) => {
      acc[b.type] = b;
      return acc;
    }, {}),
  );

  if (uniqueBalances.length === 0) {
    return (
      <DarkBentoCard>
        <p className="text-body-md text-white/50">No leave balance data available.</p>
      </DarkBentoCard>
    );
  }

  return (
    <DarkBentoCard>
      <h3 className="text-title-md font-semibold text-white">Leave Balances</h3>
      <p className="mt-1 text-body-md text-white/50">Available days by leave type</p>

      <div className="mt-5 space-y-4">
        {uniqueBalances.map((balance, index) => {
          const usedPercent =
            balance.total > 0 ? Math.min(100, (balance.used / balance.total) * 100) : 0;

          return (
            <div key={`${balance.type}-${index}`}>
              <div className="mb-1.5 flex items-center justify-between text-body-md">
                <span className="font-medium text-white/90">{LEAVE_TYPE_LABELS[balance.type]}</span>
                <span className="text-white/60">
                  {balance.remaining} / {balance.total} days
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${TYPE_COLORS[balance.type]}`}
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DarkBentoCard>
  );
}

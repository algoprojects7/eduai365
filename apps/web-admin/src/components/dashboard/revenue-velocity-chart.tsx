'use client';

import { chartColors, rechartsAxisProps } from '@eduai365/ui';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMrr, formatMonthLabel } from '@/lib/format';
import type { RevenuePoint } from '@/types/platform';

interface RevenueVelocityChartProps {
  data: RevenuePoint[];
}

export function RevenueVelocityChart({ data }: RevenueVelocityChartProps) {
  const lastSix = data.slice(-6).map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }));

  const latestMrr = lastSix[lastSix.length - 1]?.mrr ?? 0;

  return (
    <div className="bento-card h-full">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-semibold text-on-surface">Revenue Velocity</h3>
          <p className="text-body-md text-on-surface-variant">Monthly growth projection</p>
        </div>
        <select
          className="rounded-lg border border-gray-300/30 bg-surface-faint px-3 py-1.5 text-body-md text-on-surface-variant"
          defaultValue="6"
          aria-label="Revenue period"
        >
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
        </select>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={lastSix} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" {...rechartsAxisProps} />
            <YAxis
              {...rechartsAxisProps}
              tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatMrr(value), 'MRR']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid rgba(11, 29, 66, 0.08)',
                boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
              }}
            />
            <Bar dataKey="mrr" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {lastSix.map((entry, index) => (
                <Cell
                  key={entry.month}
                  fill={index === lastSix.length - 1 ? chartColors.primary : chartColors.muted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-body-md font-semibold text-secondary">
        Current MRR: {formatMrr(latestMrr)}
      </p>
    </div>
  );
}

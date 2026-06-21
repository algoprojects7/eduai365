'use client';

import { chartColors, rechartsAxisProps } from '@eduai365/ui';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactNumber } from '@/lib/format';
import type { AiUsagePoint } from '@/types/platform';

interface AiUsageChartProps {
  data: AiUsagePoint[];
}

export function AiUsageChart({ data }: AiUsageChartProps) {
  const topSchools = [...data]
    .sort((a, b) => b.aiCalls - a.aiCalls)
    .slice(0, 8)
    .map((row) => ({
      name: row.schoolName.length > 14 ? `${row.schoolName.slice(0, 14)}…` : row.schoolName,
      aiCalls: row.aiCalls,
    }));

  return (
    <div className="bento-card h-full">
      <div className="mb-4">
        <h3 className="text-title-lg font-semibold text-on-surface">AI Usage</h3>
        <p className="text-body-md text-on-surface-variant">Operations by active school tenant</p>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topSchools} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" {...rechartsAxisProps} interval={0} angle={-20} textAnchor="end" height={56} />
            <YAxis
              {...rechartsAxisProps}
              tickFormatter={(value: number) => formatCompactNumber(value)}
            />
            <Tooltip
              formatter={(value: number) => [formatCompactNumber(value), 'AI Calls']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid rgba(11, 29, 66, 0.08)',
                boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
              }}
            />
            <Bar dataKey="aiCalls" fill={chartColors.aiViolet} radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

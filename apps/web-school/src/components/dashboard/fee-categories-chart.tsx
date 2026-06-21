'use client';

import { chartColors } from '@eduai365/ui';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatInrLakh } from '@/lib/format';
import type { SchoolDashboard } from '@/types/school';

interface FeeCategoriesChartProps {
  data: SchoolDashboard;
}

const SEGMENTS = [
  { name: 'Tuition', value: 65, color: chartColors.primary },
  { name: 'Transport', value: 25, color: chartColors.secondary },
  { name: 'Pending', value: 10, color: chartColors.muted },
];

export function FeeCategoriesChart({ data }: FeeCategoriesChartProps) {
  return (
    <div className="bento-card h-full">
      <h3 className="text-title-lg font-semibold text-on-surface">Fee Categories</h3>
      <p className="mt-1 text-body-md text-on-surface-variant">Collection breakdown by category</p>

      <div className="relative mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={SEGMENTS}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
            >
              {SEGMENTS.map((segment) => (
                <Cell key={segment.name} fill={segment.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid rgba(11, 29, 66, 0.08)',
                boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-label-md uppercase tracking-wider text-on-surface-variant">Total</p>
          <p className="text-headline-md font-bold text-on-surface">
            {formatInrLakh(data.feesCollected)}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {SEGMENTS.map((segment) => (
          <li key={segment.name} className="flex items-center justify-between text-body-md">
            <span className="flex items-center gap-2 text-on-surface-variant">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.name}
            </span>
            <span className="font-medium text-on-surface">{segment.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { DarkBentoCard, chartColors } from '@eduai365/ui';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LeaveTrendPoint } from '@/types/hr';

const darkAxisProps = {
  tick: { fill: 'rgba(255,255,255,0.5)', fontSize: 12 },
  axisLine: { stroke: 'rgba(255,255,255,0.1)' },
  tickLine: false,
};

interface LeaveTrendsChartProps {
  data: LeaveTrendPoint[];
}

export function LeaveTrendsChart({ data }: LeaveTrendsChartProps) {
  return (
    <DarkBentoCard className="lg:col-span-2">
      <h3 className="text-title-md font-semibold text-white">Leave Trends</h3>
      <p className="mt-1 text-body-md text-white/50">Monthly leave usage by type</p>

      <div className="mt-4 h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-white/50">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" {...darkAxisProps} />
              <YAxis {...darkAxisProps} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(11, 17, 32, 0.95)',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
              <Bar dataKey="CL" stackId="a" fill={chartColors.secondary} name="CL" />
              <Bar dataKey="SL" stackId="a" fill={chartColors.warning} name="SL" />
              <Bar dataKey="EL" stackId="a" fill={chartColors.success} name="EL" />
              <Bar dataKey="ML" stackId="a" fill={chartColors.aiViolet} name="ML" />
              <Bar dataKey="PL" stackId="a" fill={chartColors.primary} name="PL" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </DarkBentoCard>
  );
}

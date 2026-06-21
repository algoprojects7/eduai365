'use client';

import { chartColors, rechartsAxisProps } from '@eduai365/ui';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PLACEHOLDER_DATA = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  const base = 92 + Math.sin(index / 4) * 2;
  const attendance = Math.min(99, Math.max(88, base + (index % 5) * 0.3));
  return {
    day: `D${day}`,
    label: `${day}`,
    attendance: Number(attendance.toFixed(1)),
  };
});

export function AttendanceChart() {
  return (
    <div className="bento-card h-full">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-semibold text-on-surface">Attendance Trends (30 Days)</h3>
          <p className="text-body-md text-on-surface-variant">Daily attendance percentage</p>
        </div>
        <select
          className="rounded-lg border border-gray-300/30 bg-surface-faint px-3 py-1.5 text-body-md text-on-surface-variant"
          defaultValue="daily"
          aria-label="Attendance period"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={PLACEHOLDER_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" {...rechartsAxisProps} interval={4} />
            <YAxis
              {...rechartsAxisProps}
              domain={[85, 100]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'Attendance']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid rgba(11, 29, 66, 0.08)',
                boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke={chartColors.primary}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: chartColors.aiViolet }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

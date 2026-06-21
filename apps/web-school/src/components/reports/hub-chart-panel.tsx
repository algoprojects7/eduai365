'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartColors, rechartsAxisProps } from '@eduai365/ui';
import type { ReportHubChart } from '@/types/reports';

const PIE_COLORS = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.success,
  chartColors.warning,
  chartColors.aiViolet,
  chartColors.muted,
];

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid rgba(11, 29, 66, 0.08)',
  boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
};

function asRecordArray(data: unknown): Array<Record<string, string | number>> {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is Record<string, string | number> =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  );
}

function inferBarKeys(rows: Array<Record<string, string | number>>): string[] {
  if (rows.length === 0) return [];
  const first = rows[0]!;
  return Object.keys(first).filter(
    (key) => key !== 'subject' && key !== 'department' && key !== 'type' && key !== 'metric' && key !== 'class' && key !== 'head' && key !== 'month' && key !== 'term' && typeof first[key] === 'number',
  );
}

export function HubChartPanel({ chart }: { chart: ReportHubChart }) {
  const rows = asRecordArray(chart.data);

  return (
    <div className="bento-card">
      <h3 className="text-title-lg font-semibold text-on-surface">{chart.title}</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === 'pie' ? (
            <PieChart>
              <Pie
                data={rows}
                dataKey="amount"
                nameKey="head"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={2}
              >
                {rows.map((entry, index) => (
                  <Cell key={String(entry.head ?? index)} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          ) : chart.type === 'heatmap' ? (
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="class" {...rechartsAxisProps} />
              <YAxis {...rechartsAxisProps} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="high" stackId="risk" fill={chartColors.error} name="High" />
              <Bar dataKey="medium" stackId="risk" fill={chartColors.warning} name="Medium" />
              <Bar dataKey="low" stackId="risk" fill={chartColors.success} name="Low" />
            </BarChart>
          ) : chart.type === 'area' ? (
            <AreaChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey={rows[0]?.term ? 'term' : 'month'}
                {...rechartsAxisProps}
              />
              <YAxis {...rechartsAxisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              {rows[0]?.average !== undefined && (
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Average Score"
                />
              )}
              {rows[0]?.passRate !== undefined && (
                <Area
                  type="monotone"
                  dataKey="passRate"
                  stroke={chartColors.success}
                  fill={chartColors.success}
                  fillOpacity={0.12}
                  strokeWidth={2}
                  name="Pass Rate"
                />
              )}
              {rows[0]?.collected !== undefined && (
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Collected"
                />
              )}
              {rows[0]?.target !== undefined && (
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke={chartColors.warning}
                  fill={chartColors.warning}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="Target"
                />
              )}
            </AreaChart>
          ) : (
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey={
                  rows[0]?.subject
                    ? 'subject'
                    : rows[0]?.department
                      ? 'department'
                      : rows[0]?.type
                        ? 'type'
                        : rows[0]?.metric
                          ? 'metric'
                          : 'label'
                }
                {...rechartsAxisProps}
              />
              <YAxis {...rechartsAxisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              {(() => {
                const labelKey =
                  rows[0]?.subject
                    ? 'subject'
                    : rows[0]?.department
                      ? 'department'
                      : rows[0]?.type
                        ? 'type'
                        : rows[0]?.metric
                          ? 'metric'
                          : 'label';
                const numericKeys = inferBarKeys(rows).filter((key) => key !== labelKey);
                const hasClassKeys = numericKeys.some((key) => key.startsWith('class'));
                if (hasClassKeys) {
                  return numericKeys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                      name={key}
                    />
                  ));
                }
                return numericKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    name={key}
                  />
                ));
              })()}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

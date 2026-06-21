'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, TabGroup, chartColors, rechartsAxisProps } from '@eduai365/ui';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  GripVertical,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import {
  CHART_TYPES,
  CUSTOM_METRIC_CATALOG,
  type ChartType,
  type CustomMetricOption,
  type CustomReportExportResult,
  type CustomReportPreview,
} from '@/types/reports';

const CHART_TYPE_TABS = CHART_TYPES.map((type) => ({
  id: type,
  label: type.charAt(0).toUpperCase() + type.slice(1),
}));

const PIE_COLORS = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.success,
  chartColors.warning,
  chartColors.aiViolet,
  chartColors.muted,
];

function metricsByModule(metrics: CustomMetricOption[]) {
  const groups = new Map<string, CustomMetricOption[]>();
  for (const metric of metrics) {
    const list = groups.get(metric.module) ?? [];
    list.push(metric);
    groups.set(metric.module, list);
  }
  return [...groups.entries()];
}

export default function CustomReportBuilderPage() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [preview, setPreview] = useState<CustomReportPreview | null>(null);
  const [reportTitle, setReportTitle] = useState('Custom Report');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'xlsx' | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);

  const selectedDetails = useMemo(
    () => CUSTOM_METRIC_CATALOG.filter((m) => selectedMetrics.includes(m.id)),
    [selectedMetrics],
  );

  const metricGroups = useMemo(() => metricsByModule(CUSTOM_METRIC_CATALOG), []);

  const addMetric = useCallback((metricId: string) => {
    setSelectedMetrics((prev) => (prev.includes(metricId) ? prev : [...prev, metricId]));
    setPreview(null);
    setExportMessage(null);
  }, []);

  const removeMetric = useCallback((metricId: string) => {
    setSelectedMetrics((prev) => prev.filter((id) => id !== metricId));
    setPreview(null);
    setExportMessage(null);
  }, []);

  const handleDragStart = (e: React.DragEvent, metricId: string) => {
    e.dataTransfer.setData('text/metric-id', metricId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCanvas(false);
    const metricId = e.dataTransfer.getData('text/metric-id');
    if (metricId) addMetric(metricId);
  };

  async function generatePreview() {
    if (selectedMetrics.length === 0) return;
    setPreviewLoading(true);
    setError(null);
    setExportMessage(null);
    try {
      const data = await apiFetch<CustomReportPreview>('/reports/custom/preview', {
        method: 'POST',
        body: JSON.stringify({ metrics: selectedMetrics, chartType }),
      });
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function exportReport(format: 'pdf' | 'xlsx') {
    if (selectedMetrics.length === 0) return;
    setExportLoading(format);
    setError(null);
    try {
      const result = await apiFetch<CustomReportExportResult>('/reports/custom/export', {
        method: 'POST',
        body: JSON.stringify({
          metrics: selectedMetrics,
          chartType,
          format,
          title: reportTitle,
        }),
      });
      setExportMessage(`Export ready: ${result.fileName} (expires ${new Date(result.expiresAt).toLocaleTimeString('en-IN')})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportLoading(null);
    }
  }

  const previewChartSeries = preview?.chartSeries ?? [];

  return (
    <SchoolShell>
      <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/reports"
              className="mb-2 inline-flex items-center gap-1 text-body-md text-on-surface-variant hover:text-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reports Hub
            </Link>
            <h1 className="text-headline-lg font-bold text-on-surface">Custom Report Builder</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Drag metrics onto the canvas, preview, and export as PDF or Excel
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => void generatePreview()}
              disabled={selectedMetrics.length === 0 || previewLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
              Preview
            </Button>
            <Button
              variant="ghost"
              onClick={() => void exportReport('pdf')}
              disabled={selectedMetrics.length === 0 || exportLoading !== null}
            >
              <Download className={`mr-2 h-4 w-4 ${exportLoading === 'pdf' ? 'animate-pulse' : ''}`} />
              Export PDF
            </Button>
            <Button
              variant="ghost"
              onClick={() => void exportReport('xlsx')}
              disabled={selectedMetrics.length === 0 || exportLoading !== null}
            >
              <FileSpreadsheet
                className={`mr-2 h-4 w-4 ${exportLoading === 'xlsx' ? 'animate-pulse' : ''}`}
              />
              Export Excel
            </Button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {exportMessage && (
          <div className="rounded-lg bg-success/10 px-4 py-3 text-body-md text-success">
            {exportMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="bento-card lg:col-span-1">
            <h2 className="text-title-lg font-semibold text-on-surface">Metrics Palette</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Drag metrics into the report canvas
            </p>
            <div className="mt-4 space-y-4">
              {metricGroups.map(([module, metrics]) => (
                <div key={module}>
                  <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                    {module}
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {metrics.map((metric) => {
                      const isSelected = selectedMetrics.includes(metric.id);
                      return (
                        <li key={metric.id}>
                          <button
                            type="button"
                            draggable
                            onDragStart={(e) => handleDragStart(e, metric.id)}
                            onClick={() => addMetric(metric.id)}
                            disabled={isSelected}
                            className="flex w-full cursor-grab items-center gap-2 rounded-lg border border-gray-300/20 px-3 py-2 text-left text-body-md transition-colors hover:border-secondary/30 hover:bg-secondary/5 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <GripVertical className="h-4 w-4 shrink-0 text-on-surface-variant" />
                            <span className="flex-1 text-on-surface">{metric.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-6 lg:col-span-2">
            <div className="bento-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-title-lg font-semibold text-on-surface">Report Canvas</h2>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {selectedMetrics.length === 0
                      ? 'Drop metrics here to build your report'
                      : `${selectedMetrics.length} metric(s) selected`}
                  </p>
                </div>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="rounded-lg border border-gray-300/30 bg-surface px-3 py-2 text-body-md text-on-surface focus:border-secondary focus:outline-none"
                  placeholder="Report title"
                />
              </div>

              <TabGroup
                tabs={CHART_TYPE_TABS}
                activeTab={chartType}
                onChange={(id) => {
                  setChartType(id as ChartType);
                  setPreview(null);
                }}
                className="mt-4"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCanvas(true);
                }}
                onDragLeave={() => setDragOverCanvas(false)}
                onDrop={handleCanvasDrop}
                className={`mt-4 min-h-[160px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                  dragOverCanvas
                    ? 'border-secondary bg-secondary/5'
                    : 'border-gray-300/30 bg-surface-container-low/50'
                }`}
              >
                {selectedDetails.length === 0 ? (
                  <p className="flex h-full min-h-[120px] items-center justify-center text-body-md text-on-surface-variant">
                    Drag metrics from the palette or click to add
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {selectedDetails.map((metric) => (
                      <li
                        key={metric.id}
                        className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-body-md"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-on-surface-variant" />
                        <span className="font-medium text-on-surface">{metric.label}</span>
                        <button
                          type="button"
                          onClick={() => removeMetric(metric.id)}
                          className="rounded-full p-0.5 text-on-surface-variant hover:bg-error/10 hover:text-error"
                          aria-label={`Remove ${metric.label}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedMetrics.length > 0 && (
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" onClick={() => setSelectedMetrics([])}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {preview && (
              <div className="space-y-6">
                <div className="bento-card">
                  <h2 className="text-title-lg font-semibold text-on-surface">{reportTitle}</h2>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {preview.metrics.length} metrics · {preview.chartType} chart
                    {preview.groupBy ? ` · grouped by ${preview.groupBy}` : ''}
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-300/20">
                          {preview.columns.map((col) => (
                            <th key={col} className="data-table-header px-4 py-3 text-left">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-gray-300/10 last:border-0">
                            {preview.columns.map((col) => (
                              <td key={col} className="px-4 py-3 text-body-md">
                                {row[col] ?? '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {previewChartSeries.length > 0 && (
                  <div className="bento-card">
                    <h3 className="text-title-lg font-semibold text-on-surface">Chart Preview</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                      {preview.chartType.charAt(0).toUpperCase() + preview.chartType.slice(1)} visualization
                    </p>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        {preview.chartType === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={previewChartSeries[0]?.data ?? []}
                              dataKey="value"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                            >
                              {(previewChartSeries[0]?.data ?? []).map((_, index) => (
                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        ) : preview.chartType === 'line' ? (
                          <LineChart
                            data={(previewChartSeries[0]?.data ?? []).map((point, index) => {
                              const row: Record<string, string | number> = { label: point.label };
                              previewChartSeries.forEach((series) => {
                                row[series.name] = series.data[index]?.value ?? 0;
                              });
                              return row;
                            })}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis dataKey="label" {...rechartsAxisProps} />
                            <YAxis {...rechartsAxisProps} />
                            <Tooltip />
                            {previewChartSeries.map((series, index) => (
                              <Line
                                key={series.name}
                                type="monotone"
                                dataKey={series.name}
                                stroke={PIE_COLORS[index % PIE_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            ))}
                          </LineChart>
                        ) : preview.chartType === 'area' ? (
                          <AreaChart
                            data={(previewChartSeries[0]?.data ?? []).map((point, index) => {
                              const row: Record<string, string | number> = { label: point.label };
                              previewChartSeries.forEach((series) => {
                                row[series.name] = series.data[index]?.value ?? 0;
                              });
                              return row;
                            })}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis dataKey="label" {...rechartsAxisProps} />
                            <YAxis {...rechartsAxisProps} />
                            <Tooltip />
                            {previewChartSeries.map((series, index) => (
                              <Area
                                key={series.name}
                                type="monotone"
                                dataKey={series.name}
                                stroke={PIE_COLORS[index % PIE_COLORS.length]}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                fillOpacity={0.12}
                                strokeWidth={2}
                              />
                            ))}
                          </AreaChart>
                        ) : (
                          <BarChart
                            data={(previewChartSeries[0]?.data ?? []).map((point, index) => {
                              const row: Record<string, string | number> = { label: point.label };
                              previewChartSeries.forEach((series) => {
                                row[series.name] = series.data[index]?.value ?? 0;
                              });
                              return row;
                            })}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis dataKey="label" {...rechartsAxisProps} />
                            <YAxis {...rechartsAxisProps} />
                            <Tooltip />
                            {previewChartSeries.map((series, index) => (
                              <Bar
                                key={series.name}
                                dataKey={series.name}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                radius={[4, 4, 0, 0]}
                              />
                            ))}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  DataTable,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import {
  AlertTriangle,
  Boxes,
  Package,
  RefreshCw,
  Tags,
  XCircle,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatExtendedDate, stockProgress } from '@/lib/extended';
import type {
  ConsumableItem,
  InventoryStats,
  InventoryTab,
  ReorderAlert,
} from '@/types/extended';
import {
  INVENTORY_TAB_ITEMS,
  REORDER_SEVERITY_LABELS,
  STOCK_STATUS_LABELS,
  reorderSeverityVariant,
  stockStatusVariant,
} from '@/types/extended';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('stock');
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [items, setItems] = useState<ConsumableItem[]>([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, itemsData, alertsData] = await Promise.all([
        apiFetch<InventoryStats>('/extended/inventory/stats'),
        apiFetch<ConsumableItem[]>('/extended/inventory/items'),
        apiFetch<ReorderAlert[]>('/extended/inventory/alerts'),
      ]);
      setStats(statsData);
      setItems(itemsData);
      setAlerts(alertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">General Inventory</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Consumables stock levels and reorder alerts across campus
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center rounded-lg px-3 py-2 text-body-md text-on-surface-variant hover:bg-surface-faint"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard
            label="Total Items"
            value={loading ? '…' : (stats?.totalItems ?? 0)}
            icon={Package}
          />
          <KpiBentoCard
            label="Categories"
            value={loading ? '…' : (stats?.categories ?? 0)}
            icon={Tags}
          />
          <KpiBentoCard
            label="Low Stock"
            value={loading ? '…' : (stats?.lowStock ?? 0)}
            icon={AlertTriangle}
          />
          <KpiBentoCard
            label="Out of Stock"
            value={loading ? '…' : (stats?.outOfStock ?? 0)}
            icon={XCircle}
          />
        </div>

        {stats && stats.reorderAlerts > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <Boxes className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-body-md font-semibold text-on-surface">
                {stats.reorderAlerts} item{stats.reorderAlerts === 1 ? '' : 's'} need reordering
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Review the Reorder Alerts tab to restock before supplies run out.
              </p>
            </div>
          </div>
        )}

        <TabGroup
          tabs={INVENTORY_TAB_ITEMS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as InventoryTab)}
        />

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        {activeTab === 'stock' && (
          <DataTable
            columns={[
              { key: 'name', header: 'Item' },
              { key: 'category', header: 'Category' },
              {
                key: 'stock',
                header: 'Stock',
                render: (row: ConsumableItem) => `${row.stock} ${row.unit}`,
              },
              {
                key: 'reorderLevel',
                header: 'Reorder At',
                render: (row: ConsumableItem) => `${row.reorderLevel} ${row.unit}`,
              },
              {
                key: 'stockStatus',
                header: 'Status',
                render: (row: ConsumableItem) => (
                  <Badge variant={stockStatusVariant(row.stockStatus)}>
                    {STOCK_STATUS_LABELS[row.stockStatus]}
                  </Badge>
                ),
              },
              {
                key: 'level',
                header: 'Level',
                render: (row: ConsumableItem) => (
                  <div className="flex min-w-[100px] items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-faint">
                      <div
                        className={`h-full rounded-full ${
                          row.stockStatus === 'OUT'
                            ? 'bg-error'
                            : row.stockStatus === 'LOW'
                              ? 'bg-warning'
                              : 'bg-success'
                        }`}
                        style={{ width: `${stockProgress(row.stock, row.reorderLevel)}%` }}
                      />
                    </div>
                  </div>
                ),
              },
              { key: 'supplier', header: 'Supplier' },
              {
                key: 'lastRestocked',
                header: 'Last Restocked',
                render: (row: ConsumableItem) => formatExtendedDate(row.lastRestocked),
              },
            ]}
            data={loading ? [] : items}
            keyExtractor={(row) => row.id}
            emptyMessage={loading ? 'Loading stock…' : 'No consumables tracked'}
          />
        )}

        {activeTab === 'alerts' && (
          <DataTable
            columns={[
              { key: 'itemName', header: 'Item' },
              { key: 'category', header: 'Category' },
              {
                key: 'currentStock',
                header: 'Current',
                render: (row: ReorderAlert) => `${row.currentStock} ${row.unit}`,
              },
              {
                key: 'reorderLevel',
                header: 'Reorder Level',
                render: (row: ReorderAlert) => `${row.reorderLevel} ${row.unit}`,
              },
              {
                key: 'severity',
                header: 'Severity',
                render: (row: ReorderAlert) => (
                  <Badge variant={reorderSeverityVariant(row.severity)}>
                    {REORDER_SEVERITY_LABELS[row.severity]}
                  </Badge>
                ),
              },
              { key: 'supplier', header: 'Supplier' },
            ]}
            data={loading ? [] : alerts}
            keyExtractor={(row) => row.id}
            emptyMessage={
              loading ? 'Loading alerts…' : 'All items are above reorder levels'
            }
          />
        )}
      </div>
    </SchoolShell>
  );
}

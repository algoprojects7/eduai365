'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  DataTable,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import { AlertTriangle, Package, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr } from '@/lib/format';
import {
  formatShortDate,
  parseDecimal,
  studentDisplayName,
  uniformStockStatus,
} from '@/lib/operations';
import type { UniformItem, UniformOrder, UniformTab } from '@/types/operations';
import { UNIFORM_TAB_ITEMS } from '@/types/operations';

export default function UniformPage() {
  const [activeTab, setActiveTab] = useState<UniformTab>('inventory');
  const [items, setItems] = useState<UniformItem[]>([]);
  const [orders, setOrders] = useState<UniformOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemList, orderList] = await Promise.all([
        apiFetch<UniformItem[]>('/operations/uniform/items'),
        apiFetch<UniformOrder[]>('/operations/uniform/orders'),
      ]);
      setItems(itemList);
      setOrders(orderList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load uniform data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const lowStockCount = items.filter((i) => uniformStockStatus(i) === 'low').length;
  const outOfStockCount = items.filter((i) => uniformStockStatus(i) === 'out').length;

  const distributionChart = useMemo(() => {
    const byName = new Map<string, number>();
    for (const item of items) {
      byName.set(item.name, (byName.get(item.name) ?? 0) + item.stock);
    }
    return [...byName.entries()].map(([name, stock]) => ({ name, stock }));
  }, [items]);

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Uniform Inventory</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Stock levels, orders, distribution, and supplier overview
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
          <KpiBentoCard label="SKU Variants" value={loading ? '…' : items.length} icon={Package} />
          <KpiBentoCard
            label="Total Stock"
            value={loading ? '…' : items.reduce((sum, i) => sum + i.stock, 0)}
            icon={ShoppingBag}
          />
          <KpiBentoCard label="Low Stock" value={loading ? '…' : lowStockCount} icon={AlertTriangle} />
          <KpiBentoCard label="Orders" value={loading ? '…' : orders.length} icon={Truck} />
        </div>

        <TabGroup
          tabs={UNIFORM_TAB_ITEMS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as UniformTab)}
        />

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        {activeTab === 'inventory' && (
          <DataTable
            columns={[
              { key: 'name', header: 'Item' },
              { key: 'size', header: 'Size' },
              { key: 'sku', header: 'SKU' },
              { key: 'stock', header: 'Stock' },
              {
                key: 'price',
                header: 'Price',
                render: (row) => formatInr(parseDecimal(row.price)),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => {
                  const status = uniformStockStatus(row);
                  return (
                    <Badge
                      variant={
                        status === 'ok' ? 'success' : status === 'low' ? 'warning' : 'error'
                      }
                    >
                      {status === 'ok' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </Badge>
                  );
                },
              },
            ]}
            data={items}
            keyExtractor={(row) => row.id}
            emptyMessage={loading ? 'Loading inventory…' : 'No uniform items'}
          />
        )}

        {activeTab === 'orders' && (
          <DataTable
            columns={[
              {
                key: 'student',
                header: 'Student',
                render: (row) => studentDisplayName(row.student),
              },
              {
                key: 'items',
                header: 'Items',
                render: (row) =>
                  row.items.map((line) => `${line.name} (${line.size}) ×${line.quantity}`).join(', '),
              },
              {
                key: 'totalAmount',
                header: 'Total',
                render: (row) => formatInr(parseDecimal(row.totalAmount)),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <Badge variant="outline">{row.status}</Badge>,
              },
              {
                key: 'createdAt',
                header: 'Date',
                render: (row) => formatShortDate(row.createdAt),
              },
            ]}
            data={orders}
            keyExtractor={(row) => row.id}
            emptyMessage={loading ? 'Loading orders…' : 'No uniform orders'}
          />
        )}

        {activeTab === 'distribution' && (
          <div className="bento-card">
            <h3 className="mb-4 text-title-lg font-semibold text-on-surface">
              Stock by Item (Mock Distribution)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce9ff" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#0052d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'supplier' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bento-card">
              <h3 className="text-title-md font-semibold text-on-surface">Primary Supplier</h3>
              <p className="mt-2 text-body-md text-on-surface-variant">
                EduWear Textiles Ltd. · Lagos · +234-803-555-0199
              </p>
              <p className="mt-4 text-body-md text-on-surface">
                Next bulk order window: July 2025
              </p>
            </div>
            <div className="bento-card">
              <h3 className="text-title-md font-semibold text-on-surface">Reorder Alerts</h3>
              <ul className="mt-3 space-y-2">
                {items
                  .filter((i) => uniformStockStatus(i) !== 'ok')
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-error/5 px-3 py-2 text-body-md"
                    >
                      <span>
                        {item.name} ({item.size})
                      </span>
                      <Badge variant="warning">{item.stock} left</Badge>
                    </li>
                  ))}
                {outOfStockCount === 0 && lowStockCount === 0 && (
                  <li className="text-body-md text-on-surface-variant">All items adequately stocked</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </SchoolShell>
  );
}

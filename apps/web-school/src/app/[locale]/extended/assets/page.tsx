'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import {
  AiInsightCard,
  Badge,
  Button,
  KpiBentoCard,
  TabGroup,
  chartColors,
  rechartsAxisProps,
} from '@eduai365/ui';
import {
  AlertTriangle,
  ArrowRight,
  HardDrive,
  QrCode,
  RefreshCw,
  ScanLine,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import {
  ASSET_MAINTENANCE_MOCK,
  ASSET_REPLACEMENT_SUGGESTION,
  assetCardGradient,
  assetCardIcon,
  buildAssetStats,
  buildDepreciationForecast,
  formatAssetValue,
  formatExtendedDate,
  parseDecimal,
} from '@/lib/extended';
import type {
  AssetCategoryTab,
  AssetCheckout,
  SchoolAsset,
} from '@/types/extended';
import {
  ASSET_CATEGORY_TABS,
  ASSET_STATUS_LABELS,
  assetCategoryTabMatches,
  assetStatusVariant,
} from '@/types/extended';

export default function AssetsPage() {
  const [categoryTab, setCategoryTab] = useState<AssetCategoryTab>('all');
  const [assets, setAssets] = useState<SchoolAsset[]>([]);
  const [checkouts, setCheckouts] = useState<AssetCheckout[]>([]);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsData, checkoutsData, me] = await Promise.all([
        apiFetch<SchoolAsset[]>('/extended/assets'),
        apiFetch<AssetCheckout[]>('/extended/assets/checkouts'),
        apiFetch<AuthenticatedUser>('/auth/me'),
      ]);
      setAssets(assetsData);
      setCheckouts(checkoutsData);
      setUser(me);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => buildAssetStats(assets), [assets]);
  const depreciation = useMemo(() => buildDepreciationForecast(assets), [assets]);

  const filteredAssets = useMemo(
    () => assets.filter((asset) => assetCategoryTabMatches(asset.category, categoryTab)),
    [assets, categoryTab],
  );

  const chartData = useMemo(
    () =>
      depreciation.years.map((y) => ({
        year: String(y.year),
        value: y.value,
        projected: y.projected,
      })),
    [depreciation.years],
  );

  async function handleQrAction(action: 'checkout' | 'return') {
    setScanMessage(null);
    const code = qrInput.trim();
    if (!code) {
      setScanMessage('Enter or scan a QR code to continue.');
      return;
    }

    const asset = assets.find(
      (a) => a.qrCode?.toLowerCase() === code.toLowerCase() || a.serialNo?.toLowerCase() === code.toLowerCase(),
    );
    if (!asset) {
      setScanMessage('No asset matched that QR code.');
      return;
    }

    setActionLoading(true);
    try {
      if (action === 'checkout') {
        if (!user?.id) {
          setScanMessage('Unable to resolve employee for checkout.');
          return;
        }
        await apiFetch(`/extended/assets/${asset.id}/checkout`, {
          method: 'POST',
          body: JSON.stringify({ employeeId: user.id }),
        });
        setScanMessage(`Checked out: ${asset.name}`);
      } else {
        const activeCheckout =
          checkouts.find((c) => c.assetId === asset.id && !c.returnedAt) ??
          asset.checkouts?.find((c) => !c.returnedAt);
        if (!activeCheckout) {
          setScanMessage('No active checkout found for this asset.');
          return;
        }
        await apiFetch(`/extended/assets/checkouts/${activeCheckout.id}/return`, {
          method: 'POST',
        });
        setScanMessage(`Returned: ${asset.name}`);
      }
      setQrInput('');
      await loadData();
    } catch (err) {
      setScanMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Asset &amp; Inventory Console</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Track high-value equipment, QR check-in/out, and depreciation forecasts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-lg border border-surface-faint bg-white px-4 py-2 text-right">
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">Total Asset Value</p>
              <p className="text-title-lg font-bold text-secondary">
                {loading ? '…' : formatAssetValue(stats.totalValue)}
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
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiBentoCard label="Active Fleet" value={loading ? '…' : stats.activeFleet} icon={HardDrive} />
          <KpiBentoCard label="In Repair" value={loading ? '…' : stats.inRepair} icon={Wrench} />
          <KpiBentoCard label="Checked Out" value={loading ? '…' : stats.checkedOut} icon={ScanLine} />
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-md text-error">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-lg border border-surface-faint bg-white p-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-title-lg font-semibold text-on-surface">Asset Fleet</h2>
              <TabGroup
                tabs={ASSET_CATEGORY_TABS.map((t) => ({ id: t.id, label: t.label }))}
                activeTab={categoryTab}
                onChange={(id) => setCategoryTab(id as AssetCategoryTab)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-52 animate-pulse rounded-xl bg-surface-faint" />
                ))}

              {!loading &&
                filteredAssets.map((asset) => (
                  <article
                    key={asset.id}
                    className="group relative overflow-hidden rounded-xl border border-surface-faint bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
                    style={{ perspective: '800px' }}
                  >
                    <div
                      className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${assetCardGradient(asset.category)}`}
                      style={{ transform: 'rotateX(4deg)' }}
                    >
                      <span className="text-5xl drop-shadow-lg filter">{assetCardIcon(asset.category)}</span>
                      <Badge
                        variant={assetStatusVariant(asset.status)}
                        className="absolute right-3 top-3 uppercase tracking-wide"
                      >
                        {ASSET_STATUS_LABELS[asset.status]}
                      </Badge>
                    </div>
                    <div className="space-y-1 p-4">
                      <h3 className="truncate text-body-md font-semibold text-on-surface">{asset.name}</h3>
                      <p className="text-label-md text-on-surface-variant">
                        SN: {asset.serialNo ?? '—'}
                      </p>
                      <p className="text-title-md font-bold text-secondary">
                        {formatAssetValue(parseDecimal(asset.value))}
                      </p>
                      {asset.location && (
                        <p className="text-body-sm text-on-surface-variant">{asset.location}</p>
                      )}
                    </div>
                  </article>
                ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center text-body-md font-medium text-secondary hover:underline"
            >
              View Complete Inventory ({stats.totalCount} items)
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </section>

          <section className="rounded-lg border border-surface-faint bg-white p-5">
            <h2 className="text-title-lg font-semibold text-on-surface">Quick Check-In/Out</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">Scan or enter asset QR code</p>

            <div className="relative mt-4 flex aspect-square max-h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900">
              <div className="absolute inset-8 rounded-lg border-2 border-dashed border-ai-violet/60 shadow-[0_0_24px_rgba(124,58,237,0.35)]" />
              <QrCode className="h-16 w-16 text-ai-violet/80" strokeWidth={1.25} />
              <p className="absolute bottom-4 text-body-sm text-white/70">Align QR code within frame</p>
            </div>

            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="QR-GF-PRJ-001 or serial no."
              className="mt-4 w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md outline-none focus:border-secondary"
            />

            {scanMessage && (
              <p className="mt-2 text-body-sm text-on-surface-variant">{scanMessage}</p>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                disabled={actionLoading}
                onClick={() => void handleQrAction('checkout')}
              >
                Check Out
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={actionLoading}
                onClick={() => void handleQrAction('return')}
              >
                Return
              </Button>
            </div>

            <button type="button" className="mt-3 text-body-sm text-secondary hover:underline">
              Manual Entry
            </button>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-surface-faint bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-title-lg font-semibold text-on-surface">Asset Value Lifecycle</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Real-time depreciation forecast &amp; replacement modeling
                </p>
              </div>
              <select className="rounded-lg border border-surface-faint px-3 py-1.5 text-body-sm">
                <option>Next 5 Years</option>
              </select>
            </div>

            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="year" {...rechartsAxisProps} />
                  <YAxis {...rechartsAxisProps} tickFormatter={(v) => formatAssetValue(Number(v))} />
                  <Tooltip
                    formatter={(value: number) => formatAssetValue(value)}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.year}
                        fill={entry.projected ? 'transparent' : chartColors.primary}
                        stroke={entry.projected ? chartColors.aiViolet : undefined}
                        strokeWidth={entry.projected ? 2 : 0}
                        strokeDasharray={entry.projected ? '4 4' : undefined}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-surface-faint pt-4">
              <div>
                <p className="text-label-md uppercase text-on-surface-variant">Resale Value</p>
                <p className="text-body-md font-semibold">{formatAssetValue(depreciation.resaleValue)}</p>
              </div>
              <div>
                <p className="text-label-md uppercase text-on-surface-variant">Annual Loss</p>
                <p className="text-body-md font-semibold">{depreciation.annualLossPct}%</p>
              </div>
              <div>
                <p className="text-label-md uppercase text-on-surface-variant">ROI Factor</p>
                <p className="text-body-md font-semibold">{depreciation.roiFactor}x</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-surface-faint bg-white p-5">
            <h2 className="text-title-lg font-semibold text-on-surface">Service Schedule</h2>
            <ul className="mt-4 space-y-3">
              {ASSET_MAINTENANCE_MOCK.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-surface-faint px-3 py-3"
                >
                  <div>
                    <p className="text-label-md text-on-surface-variant">
                      {formatExtendedDate(task.scheduledDate)}
                    </p>
                    <p className="text-body-md font-medium text-on-surface">{task.title}</p>
                    <p className="text-body-sm text-on-surface-variant">{task.location}</p>
                    {task.note && (
                      <p className="text-body-sm text-on-surface-variant">{task.note}</p>
                    )}
                  </div>
                  {task.overdue ? (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="error">Overdue</Badge>
                      <Button variant="secondary" size="sm">
                        Action
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center rounded-lg border border-dashed border-surface-faint py-3 text-body-md text-on-surface-variant hover:border-secondary hover:text-secondary"
            >
              + Schedule Maintenance
            </button>
          </section>
        </div>

        <AiInsightCard
          title={ASSET_REPLACEMENT_SUGGESTION.title}
          description={ASSET_REPLACEMENT_SUGGESTION.message}
          badge="PREDICTIVE AUDITOR"
          confidence={`${ASSET_REPLACEMENT_SUGGESTION.confidence}% confidence`}
        >
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm">
              Analyze Detail
            </Button>
            <Button variant="ai" size="sm">
              Execute Swap Plan
            </Button>
          </div>
        </AiInsightCard>

        {stats.inRepair > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p className="text-body-md text-on-surface">
              {stats.inRepair} asset{stats.inRepair === 1 ? '' : 's'} currently in maintenance — review service
              schedule for overdue tasks.
            </p>
          </div>
        )}
      </div>
    </SchoolShell>
  );
}

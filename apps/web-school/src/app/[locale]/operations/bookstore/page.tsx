'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  AiInsightCard,
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  StatusBadge,
  TabGroup,
  chartColors,
} from '@eduai365/ui';
import {
  AlertTriangle,
  BookOpen,
  IndianRupee,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
  Camera,
  QrCode,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr } from '@/lib/format';
import { damageStatusVariant, formatShortDate } from '@/lib/operations';
import type {
  BookstoreForecast,
  BookstoreStats,
  BookstoreStockChart,
  BookstoreTab,
  IssueTextbookInput,
  RecordDamageFineInput,
  ReturnTextbookInput,
  Textbook,
  TextbookDamageReport,
  TextbookIssue,
} from '@/types/operations';
import { BOOKSTORE_TAB_ITEMS } from '@/types/operations';

const PIE_COLORS = [chartColors.secondary, chartColors.primary];

export default function BookstorePage() {
  const [tab, setTab] = useState<BookstoreTab>('inventory');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<BookstoreStats | null>(null);
  const [inventory, setInventory] = useState<Textbook[]>([]);
  const [issued, setIssued] = useState<TextbookIssue[]>([]);
  const [activeIssues, setActiveIssues] = useState<TextbookIssue[]>([]);
  const [damageReports, setDamageReports] = useState<TextbookDamageReport[]>([]);
  const [stockChart, setStockChart] = useState<BookstoreStockChart | null>(null);
  const [forecast, setForecast] = useState<BookstoreForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [issueForm, setIssueForm] = useState<IssueTextbookInput>({ textbookId: '', studentId: '' });
  const [returnForm, setReturnForm] = useState<ReturnTextbookInput>({ issueId: '', condition: 'GOOD' });
  const [damageForm, setDamageForm] = useState<RecordDamageFineInput>({
    issueId: '',
    damageType: '',
    fineAmount: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    isbn: '',
    classGrade: '',
    price: 0,
    stock: 0,
    rackNo: '',
  });

  // Dynamic QR Code generation for Add form
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');

  // States for printing on successful addition
  const [successBook, setSuccessBook] = useState<{
    title: string;
    isbn: string;
    classGrade: string;
    price: number;
    stock: number;
    rackNo: string;
  } | null>(null);
  const [successBookQr, setSuccessBookQr] = useState<string>('');

  // States for printing from inventory actions
  const [printModalBook, setPrintModalBook] = useState<Textbook | null>(null);
  const [printModalQrUrl, setPrintModalQrUrl] = useState<string>('');

  // States for Return Scanning
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedIsbn, setScannedIsbn] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const searchQuery = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';

    try {
      const [statsData, inventoryData, issuedData, damageData, chartData, forecastData] =
        await Promise.all([
          apiFetch<BookstoreStats>('/operations/bookstore/stats'),
          apiFetch<Textbook[]>(`/operations/bookstore/inventory${searchQuery}`),
          apiFetch<TextbookIssue[]>('/operations/bookstore/issued'),
          apiFetch<TextbookDamageReport[]>('/operations/bookstore/damage-reports'),
          apiFetch<BookstoreStockChart>('/operations/bookstore/analytics/stock'),
          apiFetch<BookstoreForecast>('/operations/bookstore/ai/forecast'),
        ]);

      setStats(statsData);
      setInventory(inventoryData);
      setIssued(issuedData);
      setActiveIssues(issuedData.filter((row) => !row.returnedAt));
      setDamageReports(damageData);
      setStockChart(chartData);
      setForecast(forecastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookstore data');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Real-time QR Code preview when typing ISBN in Add Textbook form
  useEffect(() => {
    if (addForm.isbn.trim()) {
      QRCode.toDataURL(addForm.isbn.trim(), { margin: 1, width: 140 })
        .then((url) => setQrPreviewUrl(url))
        .catch(() => setQrPreviewUrl(''));
    } else {
      setQrPreviewUrl('');
    }
  }, [addForm.isbn]);

  // Standard Print label popup window utility
  const handlePrint = (title: string, isbn: string, qrUrl: string) => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) {
      alert('Popup blocker prevented printing. Please allow popups for this site.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label - ${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
              text-align: center;
              background-color: white;
            }
            .label-card {
              border: 2px dashed #999;
              padding: 24px;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              max-width: 320px;
            }
            .qr-img {
              width: 180px;
              height: 180px;
              margin-bottom: 16px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              margin: 0 0 6px 0;
              color: #111;
              line-height: 1.3;
            }
            .isbn {
              font-size: 14px;
              font-family: monospace;
              color: #444;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <img class="qr-img" src="${qrUrl}" alt="QR" />
            <h1 class="title">${title}</h1>
            <p class="isbn">ISBN: ${isbn}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShowPrintModal = async (book: Textbook) => {
    setPrintModalBook(book);
    if (book.isbn) {
      try {
        const qrUrl = await QRCode.toDataURL(book.isbn.trim(), { margin: 2, width: 250 });
        setPrintModalQrUrl(qrUrl);
      } catch (err) {
        console.error('Failed to generate QR Code', err);
        setPrintModalQrUrl('');
      }
    } else {
      setPrintModalQrUrl('');
    }
  };

  async function handleAddTextbook(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/operations/bookstore/items', {
        method: 'POST',
        body: JSON.stringify(addForm),
      });

      let qrUrl = '';
      if (addForm.isbn.trim()) {
        try {
          qrUrl = await QRCode.toDataURL(addForm.isbn.trim(), { margin: 2, width: 250 });
        } catch (qrErr) {
          console.error('QR generation failed on success', qrErr);
        }
      }

      setSuccessBook({ ...addForm });
      setSuccessBookQr(qrUrl);
      setAddForm({ title: '', isbn: '', classGrade: '', price: 0, stock: 0, rackNo: '' });
      setToast('Textbook added successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add textbook');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleIssue(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/operations/bookstore/issue', {
        method: 'POST',
        body: JSON.stringify(issueForm),
      });
      setIssueForm({ textbookId: '', studentId: '' });
      setToast('Textbook issued successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue textbook');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturn(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/operations/bookstore/return', {
        method: 'POST',
        body: JSON.stringify(returnForm),
      });
      setReturnForm({ issueId: '', condition: 'GOOD' });
      setToast('Textbook returned successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return textbook');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDamageFine(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/operations/bookstore/damage-fine', {
        method: 'POST',
        body: JSON.stringify(damageForm),
      });
      setDamageForm({ issueId: '', damageType: '', fineAmount: 0 });
      setToast('Damage fine recorded');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record damage fine');
    } finally {
      setSubmitting(false);
    }
  }

  const pieData = useMemo(
    () =>
      stockChart
        ? [
            { name: 'Issued', value: stockChart.issued },
            { name: 'Available', value: stockChart.available },
          ]
        : [],
    [stockChart],
  );

  const inventoryColumns = useMemo(
    () => [
      { key: 'subject', header: 'Subject', render: (row: Textbook) => row.subject },
      { key: 'className', header: 'Class', render: (row: Textbook) => row.className },
      { key: 'title', header: 'Title', render: (row: Textbook) => row.title },
      { key: 'publisher', header: 'Publisher', render: (row: Textbook) => row.publisher },
      { key: 'rackNo', header: 'Rack No', render: (row: Textbook) => row.rackNo || 'N/A' },
      {
        key: 'price',
        header: 'Price',
        render: (row: Textbook) => formatInr(row.price),
      },
      { key: 'stock', header: 'Stock', render: (row: Textbook) => row.stock },
      { key: 'issued', header: 'Issued', render: (row: Textbook) => row.issued },
      {
        key: 'status',
        header: 'Status',
        render: (row: Textbook) =>
          row.stock <= 5 ? (
            <Badge variant="warning">Low stock</Badge>
          ) : (
            <Badge variant="success">In stock</Badge>
          ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row: Textbook) => (
          <div className="flex items-center gap-2">
            {row.isbn ? (
              <button
                type="button"
                onClick={() => void handleShowPrintModal(row)}
                className="flex items-center gap-1.5 rounded-md bg-secondary/10 px-2.5 py-1.5 text-body-sm font-medium text-secondary transition hover:bg-secondary/20"
                title="Print QR Code Label"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Print QR</span>
              </button>
            ) : (
              <span className="text-body-sm text-on-surface-variant/40 italic">No ISBN</span>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const issueListColumns = useMemo(
    () => [
      {
        key: 'textbookTitle',
        header: 'Textbook',
        render: (row: TextbookIssue) => row.textbookTitle,
      },
      { key: 'subject', header: 'Subject', render: (row: TextbookIssue) => row.subject },
      {
        key: 'student',
        header: 'Student',
        render: (row: TextbookIssue) => `${row.studentName} (${row.studentClass})`,
      },
      {
        key: 'issuedAt',
        header: 'Issued',
        render: (row: TextbookIssue) => formatShortDate(row.issuedAt),
      },
    ],
    [],
  );

  const damageColumns = useMemo(
    () => [
      {
        key: 'textbookTitle',
        header: 'Textbook',
        render: (row: TextbookDamageReport) => row.textbookTitle,
      },
      { key: 'studentName', header: 'Student', render: (row: TextbookDamageReport) => row.studentName },
      { key: 'studentClass', header: 'Class', render: (row: TextbookDamageReport) => row.studentClass },
      { key: 'damageType', header: 'Damage', render: (row: TextbookDamageReport) => row.damageType },
      {
        key: 'fineAmount',
        header: 'Fine',
        render: (row: TextbookDamageReport) => formatInr(row.fineAmount),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: TextbookDamageReport) => (
          <StatusBadge status={damageStatusVariant(row.status)} />
        ),
      },
      {
        key: 'reportedAt',
        header: 'Reported',
        render: (row: TextbookDamageReport) => formatShortDate(row.reportedAt),
      },
    ],
    [],
  );

  const filteredIssues = useMemo(() => {
    if (!scannedIsbn.trim()) return activeIssues;
    const searchVal = scannedIsbn.trim().toLowerCase();
    return activeIssues.filter(
      (issue) =>
        issue.isbn?.toLowerCase() === searchVal ||
        issue.textbookTitle.toLowerCase().includes(searchVal)
    );
  }, [activeIssues, scannedIsbn]);

  useEffect(() => {
    const firstIssue = filteredIssues[0];
    if (filteredIssues.length === 1 && firstIssue) {
      setReturnForm((prev) => ({ ...prev, issueId: firstIssue.id }));
    } else {
      const exists = filteredIssues.some((issue) => issue.id === returnForm.issueId);
      if (!exists) {
        setReturnForm((prev) => ({ ...prev, issueId: '' }));
      }
    }
  }, [filteredIssues, returnForm.issueId]);

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-headline-lg font-bold text-on-surface">Books Store</h1>
              <Badge variant="outline">Campus Operations</Badge>
            </div>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Textbook inventory, issue/return, and damage fine tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              Add Textbook
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              Refresh
            </Button>
          </div>
        </header>

        {toast && (
          <div className="rounded-lg bg-success/10 px-4 py-3 text-body-md text-success">{toast}</div>
        )}
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiBentoCard
            label="Total Titles"
            value={loading ? '…' : (stats?.totalTitles ?? 0)}
            icon={BookOpen}
          />
          <KpiBentoCard
            label="In Stock"
            value={loading ? '…' : (stats?.inStock ?? 0)}
            icon={Package}
          />
          <KpiBentoCard
            label="Issued"
            value={loading ? '…' : (stats?.issued ?? 0)}
            icon={ShoppingBag}
          />
          <KpiBentoCard
            label="Damage Fines"
            value={loading ? '…' : formatInr(stats?.damageFinesCollected ?? 0)}
            icon={IndianRupee}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {forecast && !loading && (
            <AiInsightCard
              title="AI Order Forecast"
              badge="ENROLLMENT AI"
              description={forecast.message}
              confidence={`${forecast.confidence}% confidence`}
              actionLabel="View recommendations"
              onAction={() => setTab('inventory')}
            >
              {forecast.recommendations.length > 0 && (
                <ul className="mt-3 space-y-1 text-body-md text-on-surface-variant">
                  {forecast.recommendations.slice(0, 3).map((item) => (
                    <li key={`${item.className}-${item.title}`}>
                      {item.className} {item.subject}: order {item.forecastDemand} × {item.title}
                    </li>
                  ))}
                </ul>
              )}
            </AiInsightCard>
          )}

          <div className="bento-card">
            <h3 className="text-title-lg font-semibold text-on-surface">Stock Distribution</h3>
            <p className="mt-1 text-body-md text-on-surface-variant">Issued vs. available textbooks</p>
            {pieData.length === 0 ? (
              <p className="mt-8 text-center text-on-surface-variant">No stock data yet</p>
            ) : (
              <div className="mt-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString('en-IN')} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <TabGroup
          tabs={BOOKSTORE_TAB_ITEMS}
          activeTab={tab}
          onChange={(id) => setTab(id as BookstoreTab)}
        />

        {tab === 'inventory' && (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, class, title…"
                className="w-full rounded-lg border border-gray-300/30 bg-white py-2 pl-10 pr-4 text-body-md outline-none focus:border-secondary"
              />
            </div>
            {loading ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">Loading inventory…</div>
            ) : (
              <DataTable
                columns={inventoryColumns}
                data={inventory}
                keyExtractor={(row) => row.id}
                emptyMessage="No textbooks in inventory"
              />
            )}
          </>
        )}

        {tab === 'issue' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={(e) => void handleIssue(e)} className="bento-card space-y-4 p-6">
              <h3 className="text-title-lg font-semibold text-on-surface">Issue Textbook</h3>
              <p className="text-body-md text-on-surface-variant">
                Scan student ID to auto-select class textbooks
              </p>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Student ID</label>
                <input
                  type="text"
                  value={issueForm.studentId}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, studentId: e.target.value }))}
                  placeholder="e.g. STU-2024-0142"
                  required
                  className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Textbook</label>
                <select
                  value={issueForm.textbookId}
                  onChange={(e) => setIssueForm((prev) => ({ ...prev, textbookId: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
                >
                  <option value="">Select textbook</option>
                  {inventory
                    .filter((book) => book.stock > 0)
                    .map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.className} — {book.title} ({book.stock} in stock)
                      </option>
                    ))}
                </select>
              </div>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Issuing…' : 'Issue Textbook'}
              </Button>
            </form>

            <div>
              <h3 className="mb-3 text-title-md font-semibold text-on-surface">Recently Issued</h3>
              {loading ? (
                <div className="bento-card py-12 text-center text-on-surface-variant">Loading…</div>
              ) : (
                <DataTable
                  columns={issueListColumns}
                  data={issued.slice(0, 8)}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No recent issues"
                />
              )}
            </div>
          </div>
        )}

        {tab === 'return' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={(e) => void handleReturn(e)} className="bento-card space-y-4 p-6">
              <h3 className="text-title-lg font-semibold text-on-surface">Return Textbook</h3>

              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-label-md text-on-surface-variant font-medium">Scan QR / Search Book ISBN</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="text"
                        value={scannedIsbn}
                        onChange={(e) => setScannedIsbn(e.target.value)}
                        placeholder="Scan or type ISBN/title to search..."
                        className="w-full rounded-lg border border-gray-300/30 bg-white py-2 pl-10 pr-8 text-body-md outline-none focus:border-secondary"
                      />
                      {scannedIsbn && (
                        <button
                          type="button"
                          onClick={() => setScannedIsbn('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowScannerModal(true)}
                    className="flex items-center gap-1.5 h-[38px] px-3.5"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Scan QR</span>
                  </Button>
                </div>
                {scannedIsbn && (
                  <p className="text-body-sm text-secondary font-medium">
                    Filtering records by: &quot;{scannedIsbn}&quot; ({filteredIssues.length} matches)
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Active Issue *</label>
                <select
                  value={returnForm.issueId}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, issueId: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
                >
                  <option value="">Select issue record</option>
                  {filteredIssues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.studentName} — {issue.textbookTitle} {issue.isbn ? `(${issue.isbn})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Condition</label>
                <select
                  value={returnForm.condition}
                  onChange={(e) =>
                    setReturnForm((prev) => ({
                      ...prev,
                      condition: e.target.value as ReturnTextbookInput['condition'],
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
                >
                  <option value="GOOD">Good</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
              {returnForm.condition === 'DAMAGED' && (
                <p className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-body-md text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Record a damage fine from the Damage Report tab after return
                </p>
              )}
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Processing…' : 'Confirm Return'}
              </Button>
            </form>

            <div>
              <h3 className="mb-3 text-title-md font-semibold text-on-surface">Outstanding Issues</h3>
              {loading ? (
                <div className="bento-card py-12 text-center text-on-surface-variant">Loading…</div>
              ) : (
                <DataTable
                  columns={issueListColumns}
                  data={filteredIssues}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No outstanding issues"
                />
              )}
            </div>
          </div>
        )}

        {tab === 'damage' && (
          <div className="space-y-6">
            <form
              onSubmit={(e) => void handleDamageFine(e)}
              className="bento-card grid gap-4 p-6 md:grid-cols-4 md:items-end"
            >
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Issue Record</label>
                <select
                  value={damageForm.issueId}
                  onChange={(e) => setDamageForm((prev) => ({ ...prev, issueId: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
                >
                  <option value="">Select issue</option>
                  {activeIssues.map((issue) => (
                    <option key={issue.id} value={issue.id}>
                      {issue.studentName} — {issue.textbookTitle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Damage Type</label>
                <input
                  type="text"
                  value={damageForm.damageType}
                  onChange={(e) => setDamageForm((prev) => ({ ...prev, damageType: e.target.value }))}
                  placeholder="e.g. Torn pages"
                  required
                  className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Fine Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={damageForm.fineAmount || ''}
                  onChange={(e) =>
                    setDamageForm((prev) => ({ ...prev, fineAmount: Number(e.target.value) }))
                  }
                  required
                  className="w-full rounded-lg border border-gray-300/30 bg-white px-3 py-2 text-body-md outline-none focus:border-secondary"
                />
              </div>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Record Fine'}
              </Button>
            </form>

            {loading ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">Loading damage reports…</div>
            ) : (
              <DataTable
                columns={damageColumns}
                data={damageReports}
                keyExtractor={(row) => row.id}
                emptyMessage="No damage reports recorded"
              />
            )}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
              {successBook === null ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-title-lg font-semibold text-gray-900">Add New Textbook</h2>
                      <p className="mt-1 text-body-md text-gray-500">Add a new textbook item to the Bookstore inventory.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={(e) => void handleAddTextbook(e)} className="mt-6 space-y-4">
                    <div>
                      <label className="mb-1 block text-label-md text-gray-700 font-medium">Title *</label>
                      <input
                        type="text"
                        required
                        value={addForm.title}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Mathematics Part I"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-md text-gray-900 outline-none focus:border-secondary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-label-md text-gray-700 font-medium">ISBN</label>
                      <input
                        type="text"
                        value={addForm.isbn}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, isbn: e.target.value }))}
                        placeholder="e.g. 978-3-16-148410-0"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-md text-gray-900 outline-none focus:border-secondary"
                      />
                      {qrPreviewUrl && (
                        <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-2.5">
                          <img src={qrPreviewUrl} alt="QR Preview" className="h-14 w-14 border rounded bg-white p-0.5" />
                          <div>
                            <p className="text-body-sm font-semibold text-gray-800">ISBN QR Preview</p>
                            <p className="text-body-xs font-mono text-gray-500">{addForm.isbn}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-label-md text-gray-700 font-medium">Class / Grade *</label>
                      <input
                        type="text"
                        required
                        value={addForm.classGrade}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, classGrade: e.target.value }))}
                        placeholder="e.g. Class 10"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-md text-gray-900 outline-none focus:border-secondary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-label-md text-gray-700 font-medium">Rack No</label>
                      <input
                        type="text"
                        value={addForm.rackNo}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, rackNo: e.target.value }))}
                        placeholder="e.g. Rack A-4"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-md text-gray-900 outline-none focus:border-secondary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-label-md text-gray-700 font-medium">Price (₹) *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={addForm.price || ''}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="e.g. 299"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-md text-gray-900 outline-none focus:border-secondary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-label-md text-gray-700 font-medium">Stock *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={addForm.stock || ''}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                          placeholder="e.g. 150"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-body-md text-gray-900 outline-none focus:border-secondary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Adding…' : 'Add Textbook'}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-success/15 p-3.5 text-success">
                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                  </div>
                  <h2 className="mt-3 text-headline-sm font-bold text-gray-900">Textbook Added!</h2>
                  <p className="mt-1 text-body-md text-gray-500">
                    &quot;{successBook.title}&quot; has been successfully added to inventory.
                  </p>

                  {successBookQr ? (
                    <div className="mt-6 flex flex-col items-center border border-dashed border-gray-200 bg-gray-50 p-4 rounded-xl w-full">
                      <img src={successBookQr} alt="QR Code" className="h-36 w-36 border border-gray-100 rounded-lg bg-white p-2 shadow-sm" />
                      <p className="mt-2.5 text-body-sm font-mono font-semibold text-gray-700">ISBN: {successBook.isbn}</p>

                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handlePrint(successBook.title, successBook.isbn, successBookQr)}
                        className="mt-4 flex items-center gap-1.5"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Label Now</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-5 py-6 text-center text-body-md text-gray-500 italic bg-gray-50 rounded-xl w-full">
                      No ISBN entered. QR code label generation skipped.
                    </div>
                  )}

                  <div className="mt-6 flex w-full gap-3 border-t border-gray-100 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSuccessBook(null);
                        setSuccessBookQr('');
                      }}
                      className="flex-1"
                    >
                      Add Another
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSuccessBook(null);
                        setSuccessBookQr('');
                        setShowAddModal(false);
                      }}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Later Print Modal */}
        {printModalBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-title-md font-semibold text-gray-900">Print Textbook Label</h3>
                <button
                  type="button"
                  onClick={() => {
                    setPrintModalBook(null);
                    setPrintModalQrUrl('');
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="my-5 flex flex-col items-center text-center">
                {printModalQrUrl ? (
                  <div className="flex flex-col items-center border border-dashed border-gray-200 bg-gray-50 p-4 rounded-xl w-full">
                    <img src={printModalQrUrl} alt="QR Code" className="h-32 w-32 border border-gray-100 rounded-lg bg-white p-2 shadow-sm" />
                    <p className="mt-2 text-body-sm font-mono font-medium text-gray-700">ISBN: {printModalBook.isbn}</p>
                  </div>
                ) : (
                  <p className="text-body-md text-gray-500 italic">No QR Code available (missing ISBN).</p>
                )}
                <div className="mt-4 text-left w-full space-y-1 text-body-sm text-gray-600 px-1 border-t border-gray-100 pt-3">
                  <p><span className="font-semibold text-gray-800">Title:</span> {printModalBook.title}</p>
                  <p><span className="font-semibold text-gray-800">Class:</span> {printModalBook.className}</p>
                  {printModalBook.rackNo && (
                    <p><span className="font-semibold text-gray-800">Rack:</span> {printModalBook.rackNo}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPrintModalBook(null);
                    setPrintModalQrUrl('');
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                {printModalQrUrl && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handlePrint(printModalBook.title, printModalBook.isbn || '', printModalQrUrl)}
                    className="flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Label</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        <QrScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onScanSuccess={(data) => {
            setScannedIsbn(data);
            setShowScannerModal(false);
            setToast(`Scanned ISBN: ${data}`);
          }}
          activeIssues={activeIssues}
        />
      </div>
    </SchoolShell>
  );
}

// ─── QR Scanner Modal component using webcam and canvas with jsQR ───
interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
  activeIssues: TextbookIssue[];
}

function QrScannerModal({ isOpen, onClose, onScanSuccess, activeIssues }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter issues containing a non-empty ISBN
  const issuesWithIsbn = useMemo(() => {
    return activeIssues.filter((issue) => issue.isbn && issue.isbn.trim() !== '');
  }, [activeIssues]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = mediaStream;
        if (active && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          animationFrameId = requestAnimationFrame(tick);
        } else {
          // Clean up if closed before stream resolves
          mediaStream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error('Camera access error', err);
        if (active) {
          setCameraError('Could not access camera. Please check permissions, or use the simulation below.');
        }
      }
    };

    const tick = () => {
      if (!active) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            onScanSuccess(code.data);
            return;
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    void startCamera();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-title-lg font-semibold text-white">Scan Textbook QR Code</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-6">
          <div className="relative mx-auto h-56 w-full overflow-hidden rounded-lg bg-black border border-gray-800">
            {!cameraError ? (
              <>
                <video ref={videoRef} className="h-full w-full object-cover" />
                {/* Laser scan animation line */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
                <div className="absolute inset-0 border-[20px] border-black/40" />
                <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-green-500 rounded" />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-gray-400">
                <AlertTriangle className="mb-2 h-7 w-7 text-warning" />
                <p className="text-body-sm">{cameraError}</p>
              </div>
            )}
          </div>
          <p className="mt-2.5 text-center text-body-xs text-gray-400">
            Hold QR Code within the dashed square frame to scan automatically.
          </p>
        </div>

        <div className="border-t border-gray-900 pt-4">
          <h4 className="text-label-md font-semibold text-gray-300">Simulate QR Scan (for Testing)</h4>
          {issuesWithIsbn.length === 0 ? (
            <p className="mt-2 text-body-sm text-gray-500 italic">No active book issues have an ISBN to simulate.</p>
          ) : (
            <div className="mt-2.5 max-h-36 overflow-y-auto space-y-1.5 pr-1 text-gray-300">
              {issuesWithIsbn.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onScanSuccess(issue.isbn || '')}
                  className="flex w-full items-center justify-between rounded bg-gray-900 px-3 py-2 text-left text-body-sm transition hover:bg-gray-800 hover:text-white border border-gray-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-200">{issue.textbookTitle}</p>
                    <p className="truncate text-body-xs text-gray-400">{issue.studentName}</p>
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                    {issue.isbn}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

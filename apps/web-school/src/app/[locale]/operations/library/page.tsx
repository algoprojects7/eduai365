'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AiInsightCard,
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  TabGroup,
  chartColors,
  rechartsAxisProps,
} from '@eduai365/ui';
import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  Clock,
  IndianRupee,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  LibraryIssueModal,
  LibraryQuickIssueModal,
  LibraryReturnModal,
} from '@/components/operations/library-transaction-modal';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr } from '@/lib/format';
import { formatAvailability, formatShortDate, reservationStatusLabel } from '@/lib/operations';
import type {
  IssueBookInput,
  LibraryBook,
  LibraryIssue,
  LibraryReorderSuggestion,
  LibraryReservation,
  LibraryStats,
  LibraryTab,
  TopBorrowedBook,
} from '@/types/operations';
import { LIBRARY_TAB_ITEMS } from '@/types/operations';

export default function LibraryPage() {
  const [tab, setTab] = useState<LibraryTab>('catalog');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [catalog, setCatalog] = useState<LibraryBook[]>([]);
  const [issued, setIssued] = useState<LibraryIssue[]>([]);
  const [overdue, setOverdue] = useState<LibraryIssue[]>([]);
  const [reservations] = useState<LibraryReservation[]>([]);
  const [newArrivals, setNewArrivals] = useState<LibraryBook[]>([]);
  const [topBorrowed, setTopBorrowed] = useState<TopBorrowedBook[]>([]);
  const [reorder] = useState<LibraryReorderSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issueBook, setIssueBook] = useState<LibraryBook | null>(null);
  const [returnIssue, setReturnIssue] = useState<LibraryIssue | null>(null);
  const [quickIssueOpen, setQuickIssueOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const searchLower = search.trim().toLowerCase();

    try {
      // Raw Prisma shapes returned by the backend
      type RawBook = {
        id: string; title: string; author: string; isbn?: string | null;
        category: string; totalCopies: number; availableCopies: number;
        shelf?: string | null; createdAt?: string;
      };
      type RawIssue = {
        id: string; bookId: string; studentId: string;
        dueDate: string; issuedAt: string; returnedAt?: string | null;
        fineAmount?: number | null;
        book: { title: string; isbn?: string | null };
        student: { id: string; firstName: string; lastName: string; admissionNo: string };
      };
      type RawStats = {
        totalTitles: number; totalCopies: number; availableCopies: number;
        issuedCopies: number; activeIssues: number; overdueIssues: number;
      };

      const [rawStats, rawBooks, rawIssues, rawOverdue] = await Promise.all([
        apiFetch<RawStats>('/operations/library/stats'),
        apiFetch<RawBook[]>('/operations/library/books'),
        apiFetch<RawIssue[]>('/operations/library/issues'),
        apiFetch<RawIssue[]>('/operations/library/overdue'),
      ]);

      // Map books → LibraryBook
      const mapBook = (b: RawBook): LibraryBook => ({
        id: b.id,
        title: b.title,
        author: b.author,
        isbn: b.isbn ?? '',
        category: b.category,
        copies: b.totalCopies,
        available: b.availableCopies,
        shelf: b.shelf ?? '—',
        addedAt: b.createdAt,
      });

      // Map issues → LibraryIssue
      const mapIssue = (i: RawIssue): LibraryIssue => {
        const dueDate = new Date(i.dueDate);
        const now = new Date();
        const daysOverdue =
          !i.returnedAt && dueDate < now
            ? Math.ceil((now.getTime() - dueDate.getTime()) / 86_400_000)
            : 0;
        return {
          id: i.id,
          bookId: i.bookId,
          bookTitle: i.book.title,
          studentId: i.studentId,
          studentName: `${i.student.firstName} ${i.student.lastName}`,
          studentClass: i.student.admissionNo,
          issuedAt: i.issuedAt,
          dueDate: i.dueDate,
          returnedAt: i.returnedAt ?? undefined,
          fineAmount: i.fineAmount ?? 0,
          daysOverdue,
        };
      };

      const allBooks = rawBooks.map(mapBook);
      const filteredBooks = searchLower
        ? allBooks.filter(
            (b) =>
              b.title.toLowerCase().includes(searchLower) ||
              b.author.toLowerCase().includes(searchLower) ||
              b.isbn.toLowerCase().includes(searchLower),
          )
        : allBooks;

      // New arrivals = last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const arrivals = allBooks
        .filter((b) => b.addedAt && b.addedAt > thirtyDaysAgo)
        .slice(0, 20);

      // Top borrowed derived from issue counts
      const borrowCounts = new Map<string, number>();
      [...rawIssues, ...rawOverdue].forEach((i) => {
        borrowCounts.set(i.book.title, (borrowCounts.get(i.book.title) ?? 0) + 1);
      });
      const top = [...borrowCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([title, borrowCount]) => ({ title, borrowCount }));

      const mappedIssues = rawIssues.map(mapIssue);
      const mappedOverdue = rawOverdue.map(mapIssue);

      // Map stats
      const mappedStats: LibraryStats = {
        totalBooks: rawStats.totalCopies,
        issued: rawStats.activeIssues,
        overdue: rawStats.overdueIssues,
        totalFines: mappedOverdue.reduce((s, i) => s + (i.fineAmount ?? 0), 0),
      };

      setStats(mappedStats);
      setCatalog(filteredBooks);
      setIssued(mappedIssues.filter((i) => !i.returnedAt));
      setOverdue(mappedOverdue);
      setNewArrivals(arrivals);
      setTopBorrowed(top);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library data');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleIssue(input: IssueBookInput) {
    await apiFetch('/operations/library/issues', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await loadData();
  }

  async function handleReturn(issueId: string) {
    await apiFetch(`/operations/library/issues/return/${issueId}`, {
      method: 'POST',
    });
    await loadData();
  }

  const chartData = useMemo(
    () => topBorrowed.slice(0, 10).map((b) => ({ name: b.title, count: b.borrowCount })),
    [topBorrowed],
  );

  const catalogColumns = useMemo(
    () => [
      { key: 'title', header: 'Title', render: (row: LibraryBook) => row.title },
      { key: 'author', header: 'Author', render: (row: LibraryBook) => row.author },
      { key: 'isbn', header: 'ISBN', render: (row: LibraryBook) => row.isbn },
      { key: 'category', header: 'Category', render: (row: LibraryBook) => row.category },
      {
        key: 'copies',
        header: 'Copies',
        render: (row: LibraryBook) => formatAvailability(row.available, row.copies),
      },
      { key: 'shelf', header: 'Shelf', render: (row: LibraryBook) => row.shelf },
      {
        key: 'actions',
        header: '',
        render: (row: LibraryBook) =>
          row.available > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setIssueBook(row)}>
              Issue
            </Button>
          ) : (
            <Badge variant="warning">Unavailable</Badge>
          ),
      },
    ],
    [],
  );

  const issueColumns = useMemo(
    () => [
      { key: 'bookTitle', header: 'Book', render: (row: LibraryIssue) => row.bookTitle },
      {
        key: 'student',
        header: 'Student',
        render: (row: LibraryIssue) => `${row.studentName} (${row.studentClass})`,
      },
      {
        key: 'issuedAt',
        header: 'Issued',
        render: (row: LibraryIssue) => formatShortDate(row.issuedAt),
      },
      {
        key: 'dueDate',
        header: 'Due',
        render: (row: LibraryIssue) => formatShortDate(row.dueDate),
      },
      {
        key: 'actions',
        header: '',
        render: (row: LibraryIssue) => (
          <Button variant="ghost" size="sm" onClick={() => setReturnIssue(row)}>
            Return
          </Button>
        ),
      },
    ],
    [],
  );

  const overdueColumns = useMemo(
    () => [
      { key: 'bookTitle', header: 'Book', render: (row: LibraryIssue) => row.bookTitle },
      {
        key: 'student',
        header: 'Student',
        render: (row: LibraryIssue) => `${row.studentName} (${row.studentClass})`,
      },
      {
        key: 'issuedAt',
        header: 'Issued',
        render: (row: LibraryIssue) => formatShortDate(row.issuedAt),
      },
      {
        key: 'dueDate',
        header: 'Due',
        render: (row: LibraryIssue) => formatShortDate(row.dueDate),
      },
      {
        key: 'daysOverdue',
        header: 'Days Overdue',
        render: (row: LibraryIssue) => (
          <Badge variant="error">{row.daysOverdue ?? 0} days</Badge>
        ),
      },
      {
        key: 'fineAmount',
        header: 'Fine',
        render: (row: LibraryIssue) => formatInr(row.fineAmount),
      },
      {
        key: 'actions',
        header: '',
        render: (row: LibraryIssue) => (
          <Button variant="ghost" size="sm" onClick={() => setReturnIssue(row)}>
            Return
          </Button>
        ),
      },
    ],
    [],
  );

  const reservationColumns = useMemo(
    () => [
      { key: 'bookTitle', header: 'Book', render: (row: LibraryReservation) => row.bookTitle },
      { key: 'studentName', header: 'Student', render: (row: LibraryReservation) => row.studentName },
      {
        key: 'reservedAt',
        header: 'Reserved',
        render: (row: LibraryReservation) => formatShortDate(row.reservedAt),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: LibraryReservation) => (
          <Badge variant={row.status === 'READY' ? 'success' : 'info'}>
            {reservationStatusLabel(row.status)}
          </Badge>
        ),
      },
    ],
    [],
  );

  const tabEmptyMessage = `No ${tab.replace('-', ' ')} records found`;

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-headline-lg font-bold text-on-surface">Library Management</h1>
              <Badge variant="ai">Librarian Portal</Badge>
            </div>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Catalog, issue/return, fines, and AI inventory insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => setQuickIssueOpen(true)}>
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Issue Book
            </Button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiBentoCard
            label="Total Books"
            value={loading ? '…' : (stats?.totalBooks.toLocaleString('en-IN') ?? 0)}
            icon={BookOpen}
          />
          <KpiBentoCard
            label="Issued"
            value={loading ? '…' : (stats?.issued ?? 0)}
            icon={BookMarked}
          />
          <KpiBentoCard
            label="Overdue"
            value={loading ? '…' : (stats?.overdue ?? 0)}
            icon={AlertTriangle}
            trend={
              stats && stats.overdue > 0
                ? { value: 'Action required', direction: 'down' as const }
                : undefined
            }
          />
          <KpiBentoCard
            label="Fines Collected"
            value={loading ? '…' : formatInr(stats?.totalFines ?? 0)}
            icon={IndianRupee}
          />
        </div>

        {reorder && !loading && (
          <AiInsightCard
            title="AI Reorder Suggestion"
            badge="INVENTORY AI"
            description={reorder.message}
            confidence={`${reorder.confidence}% confidence`}
            actionLabel="View low-stock titles"
            onAction={() => setTab('catalog')}
          >
            {reorder.books.length > 0 && (
              <ul className="mt-3 space-y-1 text-body-md text-on-surface-variant">
                {reorder.books.slice(0, 3).map((book) => (
                  <li key={book.title}>
                    {book.title} — stock {book.currentStock}, order {book.suggestedOrder} copies
                  </li>
                ))}
              </ul>
            )}
          </AiInsightCard>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="bento-card xl:col-span-2">
            <h3 className="text-title-lg font-semibold text-on-surface">Top 10 Borrowed Books</h3>
            <p className="mt-1 text-body-md text-on-surface-variant">Most circulated titles this term</p>
            {chartData.length === 0 ? (
              <p className="mt-8 text-center text-on-surface-variant">No borrowing data yet</p>
            ) : (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                    <XAxis type="number" {...rechartsAxisProps} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: chartColors.muted, fontSize: 11 }}
                      axisLine={{ stroke: chartColors.grid }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill={chartColors.secondary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bento-card">
            <h3 className="text-title-lg font-semibold text-on-surface">Quick Stats</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-surface-faint px-4 py-3">
                <span className="text-body-md text-on-surface-variant">Active reservations</span>
                <span className="text-title-md font-semibold text-on-surface">
                  {loading ? '…' : reservations.filter((r) => r.status !== 'FULFILLED').length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-faint px-4 py-3">
                <span className="text-body-md text-on-surface-variant">New arrivals</span>
                <span className="text-title-md font-semibold text-on-surface">
                  {loading ? '…' : newArrivals.length}
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-body-md text-on-surface-variant">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                Fine rate: ₹2/day on overdue returns
              </div>
            </div>
          </div>
        </div>

        <TabGroup
          tabs={LIBRARY_TAB_ITEMS}
          activeTab={tab}
          onChange={(id) => setTab(id as LibraryTab)}
        />

        {(tab === 'catalog' || tab === 'new-arrivals') && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, ISBN…"
              className="w-full rounded-lg border border-gray-300/30 bg-white py-2 pl-10 pr-4 text-body-md outline-none focus:border-secondary"
            />
          </div>
        )}

        {loading ? (
          <div className="bento-card py-16 text-center text-on-surface-variant">Loading library records…</div>
        ) : tab === 'catalog' ? (
          <DataTable
            columns={catalogColumns}
            data={catalog}
            keyExtractor={(row) => row.id}
            emptyMessage={tabEmptyMessage}
          />
        ) : tab === 'issued' ? (
          <DataTable
            columns={issueColumns}
            data={issued}
            keyExtractor={(row) => row.id}
            emptyMessage={tabEmptyMessage}
          />
        ) : tab === 'overdue' ? (
          <DataTable
            columns={overdueColumns}
            data={overdue}
            keyExtractor={(row) => row.id}
            emptyMessage={tabEmptyMessage}
          />
        ) : tab === 'reservations' ? (
          <DataTable
            columns={reservationColumns}
            data={reservations}
            keyExtractor={(row) => row.id}
            emptyMessage={tabEmptyMessage}
          />
        ) : (
          <DataTable
            columns={catalogColumns}
            data={newArrivals}
            keyExtractor={(row) => row.id}
            emptyMessage={tabEmptyMessage}
          />
        )}
      </div>

      <LibraryIssueModal
        open={Boolean(issueBook)}
        book={issueBook}
        onClose={() => setIssueBook(null)}
        onSubmit={handleIssue}
      />
      <LibraryReturnModal
        open={Boolean(returnIssue)}
        issue={returnIssue}
        onClose={() => setReturnIssue(null)}
        onSubmit={handleReturn}
      />
      <LibraryQuickIssueModal
        open={quickIssueOpen}
        catalog={catalog}
        onClose={() => setQuickIssueOpen(false)}
        onSubmit={handleIssue}
      />
    </SchoolShell>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import {
  BedDouble,
  ClipboardList,
  DoorOpen,
  RefreshCw,
  UtensilsCrossed,
  Users,
  Wallet,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr } from '@/lib/format';
import {
  formatExtendedDate,
  formatExtendedDateTime,
  occupancyPercent,
  roomLabel,
} from '@/lib/extended';
import type {
  CreateVisitorInput,
  HostelFee,
  HostelRoom,
  HostelStats,
  HostelTab,
  MessMenuDay,
  VisitorLogEntry,
} from '@/types/extended';
import {
  HOSTEL_FEE_STATUS_LABELS,
  HOSTEL_ROOM_TYPE_LABELS,
  HOSTEL_TAB_ITEMS,
  hostelFeeStatusVariant,
} from '@/types/extended';

const EMPTY_VISITOR: CreateVisitorInput = {
  visitorName: '',
  studentId: '',
  relation: '',
  purpose: '',
  idProof: '',
};

export default function HostelPage() {
  const [activeTab, setActiveTab] = useState<HostelTab>('rooms');
  const [stats, setStats] = useState<HostelStats | null>(null);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [messMenu, setMessMenu] = useState<MessMenuDay[]>([]);
  const [visitors, setVisitors] = useState<VisitorLogEntry[]>([]);
  const [fees, setFees] = useState<HostelFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [visitorForm, setVisitorForm] = useState(EMPTY_VISITOR);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, roomsData, messData, visitorsData, feesData] = await Promise.all([
        apiFetch<HostelStats>('/extended/hostel/stats'),
        apiFetch<HostelRoom[]>('/extended/hostel/rooms'),
        apiFetch<MessMenuDay[]>('/extended/hostel/mess'),
        apiFetch<VisitorLogEntry[]>('/extended/hostel/visitors'),
        apiFetch<HostelFee[]>('/extended/hostel/fees'),
      ]);
      setStats(statsData);
      setRooms(roomsData);
      setMessMenu(messData);
      setVisitors(visitorsData);
      setFees(feesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hostel data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const residentOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ id: string; label: string }> = [];
    for (const room of rooms) {
      for (const resident of room.residents) {
        if (!seen.has(resident.id)) {
          seen.add(resident.id);
          options.push({
            id: resident.id,
            label: `${resident.name} (${resident.admissionNo})`,
          });
        }
      }
    }
    return options;
  }, [rooms]);

  async function handleCheckout(visitorId: string) {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/extended/hostel/visitors/${visitorId}/checkout`, { method: 'PATCH' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out visitor');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateVisitor(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/extended/hostel/visitors', {
        method: 'POST',
        body: JSON.stringify(visitorForm),
      });
      setVisitorForm(EMPTY_VISITOR);
      setShowVisitorForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log visitor');
    } finally {
      setSubmitting(false);
    }
  }

  const pendingFeesTotal = fees
    .filter((f) => f.status !== 'PAID')
    .reduce((sum, f) => sum + (f.amount - f.paid), 0);

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Hostel Management</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Room allocation, mess menu, visitor log, and hostel fees
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
            label="Occupancy"
            value={loading ? '…' : `${stats?.occupancyRate ?? 0}%`}
            icon={BedDouble}
            trend={
              loading
                ? undefined
                : {
                    value: `${stats?.occupiedBeds ?? 0} / ${stats?.totalBeds ?? 0} beds`,
                    direction: 'neutral',
                  }
            }
          />
          <KpiBentoCard
            label="Rooms"
            value={loading ? '…' : (stats?.totalRooms ?? 0)}
            icon={DoorOpen}
            trend={
              loading
                ? undefined
                : {
                    value: `${stats?.availableBeds ?? 0} beds free`,
                    direction: 'neutral',
                  }
            }
          />
          <KpiBentoCard
            label="Visitors Today"
            value={loading ? '…' : (stats?.visitorsToday ?? 0)}
            icon={Users}
          />
          <KpiBentoCard
            label="Pending Fees"
            value={loading ? '…' : (stats?.pendingFees ?? 0)}
            icon={Wallet}
            trend={
              loading
                ? undefined
                : { value: formatInr(pendingFeesTotal), direction: 'neutral' }
            }
          />
        </div>

        <TabGroup
          tabs={HOSTEL_TAB_ITEMS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as HostelTab)}
        />

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        {activeTab === 'rooms' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="bento-card col-span-full py-16 text-center text-on-surface-variant">
                Loading rooms…
              </div>
            ) : rooms.length === 0 ? (
              <div className="bento-card col-span-full py-16 text-center text-on-surface-variant">
                No hostel rooms configured
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="bento-card space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-title-md font-semibold text-on-surface">
                        {roomLabel(room.block, room.roomNo)}
                      </h3>
                      <p className="text-body-sm text-on-surface-variant">
                        Floor {room.floor} · {HOSTEL_ROOM_TYPE_LABELS[room.type]}
                      </p>
                    </div>
                    <Badge variant={room.available === 0 ? 'warning' : 'success'}>
                      {room.occupied}/{room.capacity}
                    </Badge>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-surface-faint">
                    <div
                      className="h-full rounded-full bg-secondary transition-all"
                      style={{ width: `${occupancyPercent(room.occupied, room.capacity)}%` }}
                    />
                  </div>

                  {room.residents.length > 0 ? (
                    <ul className="space-y-2">
                      {room.residents.map((resident) => (
                        <li
                          key={resident.id}
                          className="flex items-center justify-between rounded-lg bg-surface-faint px-3 py-2 text-body-sm"
                        >
                          <span className="font-medium text-on-surface">{resident.name}</span>
                          <span className="text-on-surface-variant">
                            {resident.className} · {resident.admissionNo}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-body-sm text-on-surface-variant">No residents allocated</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'mess' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <UtensilsCrossed className="h-4 w-4" />
              <span>Weekly mess menu — mock data for warden review</span>
            </div>
            {loading ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading mess menu…
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: 'day', header: 'Day' },
                  { key: 'breakfast', header: 'Breakfast' },
                  { key: 'lunch', header: 'Lunch' },
                  { key: 'dinner', header: 'Dinner' },
                ]}
                data={messMenu}
                keyExtractor={(row) => row.day}
                emptyMessage="No mess menu available"
              />
            )}
          </div>
        )}

        {activeTab === 'visitors' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-md text-on-surface-variant">
                Track parent and guardian visits to the hostel
              </p>
              <Button size="sm" onClick={() => setShowVisitorForm((v) => !v)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Log Visitor
              </Button>
            </div>

            {showVisitorForm && (
              <form
                onSubmit={handleCreateVisitor}
                className="bento-card grid gap-4 sm:grid-cols-2"
              >
                <label className="block space-y-1">
                  <span className="text-label-md text-on-surface-variant">Visitor Name</span>
                  <input
                    required
                    value={visitorForm.visitorName}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, visitorName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-label-md text-on-surface-variant">Visiting Student</span>
                  <select
                    required
                    value={visitorForm.studentId}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, studentId: e.target.value }))
                    }
                    className="w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                  >
                    <option value="">Select student</option>
                    {residentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-label-md text-on-surface-variant">Relation</span>
                  <input
                    required
                    value={visitorForm.relation}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, relation: e.target.value }))
                    }
                    className="w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-label-md text-on-surface-variant">Purpose</span>
                  <input
                    required
                    value={visitorForm.purpose}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, purpose: e.target.value }))
                    }
                    className="w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                  />
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-label-md text-on-surface-variant">ID Proof (optional)</span>
                  <input
                    value={visitorForm.idProof ?? ''}
                    onChange={(e) =>
                      setVisitorForm((f) => ({ ...f, idProof: e.target.value }))
                    }
                    className="w-full rounded-lg border border-surface-faint px-3 py-2 text-body-md"
                  />
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save Entry'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowVisitorForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <DataTable
              columns={[
                { key: 'visitorName', header: 'Visitor' },
                { key: 'studentName', header: 'Student' },
                { key: 'relation', header: 'Relation' },
                { key: 'purpose', header: 'Purpose' },
                {
                  key: 'checkIn',
                  header: 'Check In',
                  render: (row: VisitorLogEntry) => formatExtendedDateTime(row.checkIn),
                },
                {
                  key: 'checkOut',
                  header: 'Check Out',
                  render: (row: VisitorLogEntry) =>
                    row.checkOut ? (
                      formatExtendedDateTime(row.checkOut)
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={submitting}
                        onClick={() => void handleCheckout(row.id)}
                      >
                        Check Out
                      </Button>
                    ),
                },
              ]}
              data={loading ? [] : visitors}
              keyExtractor={(row) => row.id}
              emptyMessage={loading ? 'Loading visitor log…' : 'No visitors logged yet'}
            />
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-4">
            <p className="text-body-md text-on-surface-variant">
              Hostel fee ledger — mock term billing for resident students
            </p>
            <DataTable
              columns={[
                { key: 'studentName', header: 'Student' },
                { key: 'term', header: 'Term' },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (row: HostelFee) => formatInr(row.amount),
                },
                {
                  key: 'paid',
                  header: 'Paid',
                  render: (row: HostelFee) => formatInr(row.paid),
                },
                {
                  key: 'dueDate',
                  header: 'Due Date',
                  render: (row: HostelFee) => formatExtendedDate(row.dueDate),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: HostelFee) => (
                    <Badge variant={hostelFeeStatusVariant(row.status)}>
                      {HOSTEL_FEE_STATUS_LABELS[row.status]}
                    </Badge>
                  ),
                },
              ]}
              data={loading ? [] : fees}
              keyExtractor={(row) => row.id}
              emptyMessage={loading ? 'Loading fees…' : 'No hostel fee records'}
            />
          </div>
        )}
      </div>
    </SchoolShell>
  );
}

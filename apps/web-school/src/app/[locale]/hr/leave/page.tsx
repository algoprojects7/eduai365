'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  DarkBentoCard,
  DarkModuleShell,
  TabGroup,
} from '@eduai365/ui';
import { CalendarDays, Check, Plus, RefreshCw, X as XIcon } from 'lucide-react';
import { AbsentCalendar, monthKey } from '@/components/hr/absent-calendar';
import { ApplyLeaveModal } from '@/components/hr/apply-leave-modal';
import { LeaveBalanceBars } from '@/components/hr/leave-balance-bars';
import { LeaveTrendsChart } from '@/components/hr/leave-trends-chart';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type {
  CreateLeaveInput,
  LeaveBalance,
  LeaveCalendarResponse,
  LeaveRequest,
  LeaveStatus,
  LeaveTrendPoint,
} from '@/types/hr';
import { LEAVE_TYPE_LABELS } from '@/types/hr';

type LeaveTab = 'pending' | 'approved' | 'rejected' | 'my-leaves' | 'calendar';

const TAB_STATUS_MAP: Record<Exclude<LeaveTab, 'my-leaves' | 'calendar'>, LeaveStatus> = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
};

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const startLabel = new Date(start).toLocaleDateString('en-IN', opts);
  const endLabel = new Date(end).toLocaleDateString('en-IN', opts);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

function statusBadgeVariant(status: LeaveStatus): 'warning' | 'success' | 'error' {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'error';
  return 'warning';
}

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<LeaveTab>('pending');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [trends, setTrends] = useState<LeaveTrendPoint[]>([]);
  const [calendarData, setCalendarData] = useState<LeaveCalendarResponse | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadLeaveData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statusParam =
        activeTab === 'my-leaves'
          ? 'mine'
          : activeTab !== 'calendar'
            ? TAB_STATUS_MAP[activeTab]
            : undefined;

      const leavePath =
        activeTab === 'my-leaves'
          ? '/hr/leave?mine=true'
          : activeTab !== 'calendar' && statusParam
            ? `/hr/leave?status=${statusParam}`
            : '/hr/leave';

      const [leaveList, balanceList, rawTrends, pendingList] = await Promise.all([
        activeTab === 'calendar'
          ? Promise.resolve([] as LeaveRequest[])
          : apiFetch<LeaveRequest[]>(leavePath),
        apiFetch<LeaveBalance[]>('/hr/leave/balances'),
        apiFetch<any>('/hr/leave/trends'),
        apiFetch<LeaveRequest[]>('/hr/leave?status=PENDING'),
      ]);

      const trendList: LeaveTrendPoint[] =
        rawTrends?.labels?.map((label: string, idx: number) => {
          const point: any = { month: label };
          rawTrends.datasets?.forEach((dataset: any) => {
            point[dataset.type] = dataset.data[idx] ?? 0;
          });
          return point;
        }) || [];

      setRequests(leaveList);
      setBalances(balanceList);
      setTrends(trendList);
      setPendingCount(pendingList.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadCalendar = useCallback(async () => {
    try {
      const data = await apiFetch<LeaveCalendarResponse>(
        `/hr/leave/calendar?month=${monthKey(calendarMonth)}`,
      );
      setCalendarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave calendar');
    }
  }, [calendarMonth]);

  useEffect(() => {
    void loadLeaveData();
  }, [loadLeaveData]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      void loadCalendar();
    }
  }, [activeTab, loadCalendar]);

  async function handleStatusUpdate(id: string, status: LeaveStatus) {
    setActionId(id);
    try {
      const updated = await apiFetch<LeaveRequest>(`/hr/leave/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (status !== 'PENDING') {
        setPendingCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update leave request');
    } finally {
      setActionId(null);
    }
  }

  async function handleApplyLeave(input: CreateLeaveInput) {
    const created = await apiFetch<LeaveRequest>('/hr/leave', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (activeTab === 'my-leaves' || activeTab === 'pending') {
      setRequests((prev) => [created, ...prev]);
    }
    const balanceList = await apiFetch<LeaveBalance[]>('/hr/leave/balances');
    setBalances(balanceList);
  }

  const tabs = [
    { id: 'pending', label: 'Pending', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'my-leaves', label: 'My Leaves' },
    { id: 'calendar', label: 'Calendar' },
  ];

  return (
    <SchoolShell>
      <DarkModuleShell className="min-h-0 rounded-xl p-6 md:p-8">
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-headline-lg font-bold text-white">Leave Management</h1>
              <p className="mt-1 text-body-md text-white/50">
                Review requests, track balances, and manage staff absences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="border-white/10 text-white hover:bg-white/10"
                onClick={() => void loadLeaveData()}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="ai" size="sm" onClick={() => setShowApplyModal(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Apply Leave
              </Button>
            </div>
          </header>

          {error && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <LeaveBalanceBars balances={balances} />
            <LeaveTrendsChart data={trends} />
          </div>

          <DarkBentoCard className="p-0">
            <div className="border-b border-white/10 px-4 pt-2">
              <TabGroup
                tabs={tabs}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as LeaveTab)}
                className="border-white/10"
              />
            </div>

            {loading && activeTab !== 'calendar' && (
              <div className="py-16 text-center text-white/50">Loading leave requests…</div>
            )}

            {!loading && activeTab !== 'calendar' && requests.length === 0 && (
              <div className="py-16 text-center text-white/50">No leave requests found.</div>
            )}

            {!loading && activeTab !== 'calendar' && requests.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                        Type
                      </th>
                      <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                        Dates
                      </th>
                      <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                        Days
                      </th>
                      <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                        Status
                      </th>
                      <th className="px-4 py-3 text-label-md uppercase tracking-wider text-white/40">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{request.employeeName}</p>
                          <p className="text-body-md text-white/40">{request.employeeCode}</p>
                        </td>
                        <td className="px-4 py-3 text-white/80">
                          {LEAVE_TYPE_LABELS[request.type]}
                        </td>
                        <td className="px-4 py-3 text-white/80">
                          {formatDateRange(request.startDate, request.endDate)}
                        </td>
                        <td className="px-4 py-3 text-white/80">{request.days}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-white/60">
                          {request.reason}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(request.status)}>
                            {request.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {request.status === 'PENDING' && activeTab === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 border border-success/30 text-success hover:bg-success/10"
                                disabled={actionId === request.id}
                                onClick={() => void handleStatusUpdate(request.id, 'APPROVED')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 border border-error/30 text-error hover:bg-error/10"
                                disabled={actionId === request.id}
                                onClick={() => void handleStatusUpdate(request.id, 'REJECTED')}
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : request.substituteName ? (
                            <span className="text-body-md text-white/50">
                              Sub: {request.substituteName}
                            </span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="p-4 pt-0">
                <AbsentCalendar
                  month={calendarMonth}
                  days={calendarData?.days ?? []}
                  onMonthChange={setCalendarMonth}
                />
              </div>
            )}
          </DarkBentoCard>

          {activeTab !== 'calendar' && (
            <div className="flex items-center gap-2 text-body-md text-white/40">
              <CalendarDays className="h-4 w-4" />
              Switch to the Calendar tab to view who&apos;s absent by day
            </div>
          )}
        </div>
      </DarkModuleShell>

      <ApplyLeaveModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleApplyLeave}
      />
    </SchoolShell>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AiInsightCard,
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  StatusBadge,
  TabGroup,
} from '@eduai365/ui';
import {
  AlertTriangle,
  Plus,
  Search,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { EditEmployeeModal } from '@/components/hr/edit-employee-modal';
import { apiFetch } from '@/lib/api';
import { getInitials } from '@/lib/format';
import { employeeFullName, isContractExpiringSoon } from '@/lib/hr';
import type {
  EmployeeProfile,
  EmployeeStats,
  EmploymentType,
  FacultyAnalytics,
  LeaveRequest,
} from '@/types/hr';

type EmployeeTab = 'all' | EmploymentType | 'on-leave';

const TAB_ITEMS: { id: EmployeeTab; label: string; type?: EmploymentType }[] = [
  { id: 'all', label: 'All' },
  { id: 'TEACHING', label: 'Teaching', type: 'TEACHING' },
  { id: 'NON_TEACHING', label: 'Non-Teaching', type: 'NON_TEACHING' },
  { id: 'CONTRACT', label: 'Contract', type: 'CONTRACT' },
  { id: 'on-leave', label: 'On Leave' },
];

function isOnLeaveToday(leave: LeaveRequest, today: string): boolean {
  return leave.status === 'APPROVED' && leave.startDate <= today && leave.endDate >= today;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [analytics, setAnalytics] = useState<FacultyAnalytics | null>(null);
  const [onLeaveIds, setOnLeaveIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<EmployeeTab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tabConfig = TAB_ITEMS.find((item) => item.id === tab);
      const typeQuery = tabConfig?.type ? `?type=${tabConfig.type}` : '';
      const today = new Date().toISOString().slice(0, 10);

      const [employeeData, statsData, analyticsData, leaveData] = await Promise.all([
        apiFetch<EmployeeProfile[]>(`/hr/employees${typeQuery}`),
        apiFetch<EmployeeStats>('/hr/employees/stats'),
        apiFetch<FacultyAnalytics>('/hr/analytics/faculty'),
        apiFetch<LeaveRequest[]>('/hr/leave?status=APPROVED'),
      ]);

      setEmployees(employeeData);
      setStats(statsData);
      setAnalytics(analyticsData);
      setOnLeaveIds(
        new Set(leaveData.filter((leave) => isOnLeaveToday(leave, today)).map((l) => l.employeeId)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((row) => {
      if (tab === 'on-leave' && !onLeaveIds.has(row.userId)) return false;

      if (!query) return true;
      const name = employeeFullName(row).toLowerCase();
      return (
        name.includes(query) ||
        row.employeeId.toLowerCase().includes(query) ||
        row.department.toLowerCase().includes(query) ||
        row.designation.toLowerCase().includes(query)
      );
    });
  }, [employees, search, tab, onLeaveIds]);

  const expiringCount = analytics?.contractsExpiring.length ?? 0;

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Employee Directory</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Staff records, employment types, and contract monitoring
            </p>
          </div>
          <Link href="/hr/employees/enroll">
            <Button variant="primary">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Enroll Employee
            </Button>
          </Link>
        </header>

        {expiringCount > 0 && analytics && (
          <AiInsightCard
            title="Contract Expiry Alert"
            badge="AI MONITORING"
            description={analytics.aiInsights.message}
            confidence={`${expiringCount} expiring`}
            actionLabel="View HR Analytics"
            onAction={() => {
              window.location.href = '/hr/analytics';
            }}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiBentoCard label="Total Staff" value={loading ? '…' : (stats?.total ?? 0)} icon={Users} />
          <KpiBentoCard
            label="Teaching"
            value={loading ? '…' : (stats?.teaching ?? 0)}
            icon={UserCheck}
          />
          <KpiBentoCard
            label="Non-Teaching"
            value={loading ? '…' : (stats?.nonTeaching ?? 0)}
            icon={Users}
          />
          <KpiBentoCard
            label="On Leave"
            value={loading ? '…' : (stats?.onLeave ?? 0)}
            icon={UserX}
          />
        </div>

        <TabGroup
          tabs={TAB_ITEMS.map(({ id, label }) => ({ id, label }))}
          activeTab={tab}
          onChange={(id) => setTab(id as EmployeeTab)}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Search by name, ID, or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300/30 bg-white pl-10 pr-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading employees…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && (
          <DataTable
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyMessage="No employees match your filters"
            columns={[
              {
                key: 'employee',
                header: 'Employee',
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
                      {getInitials(row.user.firstName, row.user.lastName)}
                    </div>
                    <div>
                      <p className="font-medium text-on-surface">{employeeFullName(row)}</p>
                      <p className="text-label-md text-on-surface-variant">{row.employeeId}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'department',
                header: 'Department',
                render: (row) => row.department,
              },
              {
                key: 'designation',
                header: 'Designation',
                render: (row) => row.designation,
              },
              {
                key: 'joinDate',
                header: 'Join Date',
                render: (row) => new Date(row.joinDate).toLocaleDateString('en-IN'),
              },
              {
                key: 'type',
                header: 'Type',
                render: (row) => (
                  <Badge variant="info">{row.employmentType.replace(/_/g, ' ')}</Badge>
                ),
              },
              {
                key: 'payGrade',
                header: 'Pay Grade',
                render: (row) => row.payGrade,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.user.isActive ? 'active' : 'inactive'} />
                    {onLeaveIds.has(row.userId) && <Badge variant="warning">On Leave</Badge>}
                    {isContractExpiringSoon(row) && (
                      <Badge variant="error">
                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                        Expiring
                      </Badge>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-secondary hover:text-secondary-hover"
                    onClick={() => setEditingEmployee(row)}
                  >
                    Edit
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>

      {editingEmployee && (
        <EditEmployeeModal
          open={!!editingEmployee}
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={async () => {
            setEditingEmployee(null);
            await loadData();
          }}
        />
      )}
    </SchoolShell>
  );
}

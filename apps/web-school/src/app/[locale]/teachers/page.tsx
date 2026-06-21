'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  DataTable,
  KpiBentoCard,
  StatusBadge,
  TabGroup,
} from '@eduai365/ui';
import { BookOpen, Search, UserCheck, Users } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type { TeacherRow } from '@/types/school';

type DepartmentTab = 'all' | 'academics' | 'administration';

const DEPARTMENT_MOCK: Record<string, string> = {
  TEACHER: 'Academics',
  PRINCIPAL: 'Administration',
  VICE_PRINCIPAL: 'Administration',
  SCHOOL_ADMIN: 'Administration',
  LIBRARIAN: 'Library',
  HR_MANAGER: 'Human Resources',
};

function mapStatus(status: string): 'active' | 'pending' | 'inactive' | 'warning' {
  switch (status.toLowerCase()) {
    case 'active':
      return 'active';
    case 'inactive':
      return 'inactive';
    default:
      return 'pending';
  }
}

function teacherDepartment(row: TeacherRow): string {
  return row.department ?? DEPARTMENT_MOCK[row.role] ?? 'General';
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [search, setSearch] = useState('');
  const [deptTab, setDeptTab] = useState<DepartmentTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTeachers() {
      try {
        const response = await apiFetch<{ items: any[] }>('/school/teachers?limit=100');
        if (!cancelled) {
          const list = (response?.items || []).map((t) => ({
            ...t,
            name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
            status: t.isActive ? 'ACTIVE' : 'INACTIVE',
          }));
          setTeachers(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load teachers');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeachers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teachers.filter((row) => {
      const dept = teacherDepartment(row).toLowerCase();
      const matchesSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query) ||
        dept.includes(query);

      const matchesDept =
        deptTab === 'all' ||
        (deptTab === 'academics' && dept.includes('academic')) ||
        (deptTab === 'administration' && dept.includes('admin'));

      return matchesSearch && matchesDept;
    });
  }, [teachers, search, deptTab]);

  const activeCount = teachers.filter((t) => t.status.toLowerCase() === 'active').length;

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Teachers</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Staff directory, roles, and department assignments
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiBentoCard
            label="Total Staff"
            value={loading ? '…' : teachers.length}
            icon={Users}
          />
          <KpiBentoCard
            label="Active"
            value={loading ? '…' : activeCount}
            icon={UserCheck}
          />
          <KpiBentoCard
            label="Departments"
            value={loading ? '…' : new Set(teachers.map(teacherDepartment)).size}
            icon={BookOpen}
          />
        </div>

        <TabGroup
          tabs={[
            { id: 'all', label: 'All Staff' },
            { id: 'academics', label: 'Academics' },
            { id: 'administration', label: 'Administration' },
          ]}
          activeTab={deptTab}
          onChange={(id) => setDeptTab(id as DepartmentTab)}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Search by name, email, or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300/30 bg-white pl-10 pr-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading teachers…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && (
          <DataTable
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyMessage="No teachers match your filters"
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (row) => (
                  <span className="font-medium text-on-surface">{row.name}</span>
                ),
              },
              {
                key: 'email',
                header: 'Email',
                render: (row) => row.email,
              },
              {
                key: 'role',
                header: 'Role',
                render: (row) => (
                  <Badge variant="info" className="uppercase">
                    {row.role.replace(/_/g, ' ')}
                  </Badge>
                ),
              },
              {
                key: 'department',
                header: 'Department',
                render: (row) => teacherDepartment(row),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={mapStatus(row.status)} />,
              },
            ]}
          />
        )}
      </div>
    </SchoolShell>
  );
}

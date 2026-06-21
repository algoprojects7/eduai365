'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  DataTable,
  KpiBentoCard,
  StatusBadge,
  TabGroup,
} from '@eduai365/ui';
import { GraduationCap, Plus, Search, UserCheck, Users } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type { StudentRow } from '@/types/school';

type StatusTab = 'all' | 'active' | 'inactive';

function studentName(row: StudentRow): string {
  return `${row.firstName} ${row.lastName}`.trim();
}

function studentClass(row: StudentRow): string {
  if (typeof row.class === 'string') return row.class;
  if (row.className) return row.className;
  if (row.class && typeof row.class === 'object' && row.class.name) return row.class.name;
  return '—';
}

function mapStatus(status: string): 'active' | 'pending' | 'inactive' | 'warning' {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'INACTIVE':
    case 'GRADUATED':
    case 'TRANSFERRED':
      return 'inactive';
    case 'SUSPENDED':
      return 'warning';
    default:
      return 'pending';
  }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      try {
        const response = await apiFetch<{ items: StudentRow[] }>('/school/students?limit=100');
        if (!cancelled) {
          setStudents(response?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load students');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStudents();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((row) => {
      const matchesSearch =
        !query ||
        row.admissionNo.toLowerCase().includes(query) ||
        studentName(row).toLowerCase().includes(query) ||
        studentClass(row).toLowerCase().includes(query);

      const matchesStatus =
        statusTab === 'all' ||
        (statusTab === 'active' && row.status.toUpperCase() === 'ACTIVE') ||
        (statusTab === 'inactive' && row.status.toUpperCase() !== 'ACTIVE');

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusTab]);

  const activeCount = students.filter((s) => s.status.toUpperCase() === 'ACTIVE').length;

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Students</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Manage enrollment, admissions, and student records
            </p>
          </div>
          <Link href="/students/new">
            <Button variant="primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiBentoCard
            label="Total Students"
            value={loading ? '…' : students.length}
            icon={Users}
          />
          <KpiBentoCard
            label="Active"
            value={loading ? '…' : activeCount}
            icon={UserCheck}
            trend={{ value: `${students.length ? Math.round((activeCount / students.length) * 100) : 0}%`, direction: 'up' }}
          />
          <KpiBentoCard
            label="Classes"
            value={loading ? '…' : new Set(students.map(studentClass).filter((c) => c !== '—')).size}
            icon={GraduationCap}
          />
        </div>

        <TabGroup
          tabs={[
            { id: 'all', label: 'All', badge: students.length || undefined },
            { id: 'active', label: 'Active', badge: activeCount || undefined },
            {
              id: 'inactive',
              label: 'Inactive',
              badge: students.length - activeCount || undefined,
            },
          ]}
          activeTab={statusTab}
          onChange={(id) => setStatusTab(id as StatusTab)}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            placeholder="Search by name, admission no, or class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300/30 bg-white pl-10 pr-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading students…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && (
          <DataTable
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyMessage="No students match your filters"
            columns={[
              {
                key: 'admissionNo',
                header: 'Admission No',
                render: (row) => (
                  <span className="font-mono text-body-md">{row.admissionNo}</span>
                ),
              },
              {
                key: 'name',
                header: 'Name',
                render: (row) => (
                  <span className="font-medium text-on-surface">{studentName(row)}</span>
                ),
              },
              {
                key: 'class',
                header: 'Class',
                render: (row) => studentClass(row),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusBadge status={mapStatus(row.status)} />,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: () => (
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
    </SchoolShell>
  );
}

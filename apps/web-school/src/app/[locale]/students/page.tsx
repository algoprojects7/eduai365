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

  // Detailed modal states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

  async function handleViewStudent(row: StudentRow) {
    setSelectedStudent({ ...row }); // Show modal immediately with list-level data
    setModalLoading(true);
    setModalError(null);
    try {
      const detail = await apiFetch<any>(`/school/students/${row.id}`);
      setSelectedStudent(detail);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to load student details');
    } finally {
      setModalLoading(false);
    }
  }

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
                render: (row) => (
                  <Button variant="ghost" size="sm" onClick={() => handleViewStudent(row)}>
                    View
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200/50 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-headline-sm font-bold text-on-surface">Student Profile</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-gray-100 transition-colors text-lg font-semibold"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {modalLoading && !selectedStudent.class && (
              <div className="py-12 text-center text-on-surface-variant">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
                Loading detailed profile…
              </div>
            )}

            {modalError && (
              <div className="py-8 text-center text-error bg-error/10 rounded-xl my-4 px-4">{modalError}</div>
            )}

            {selectedStudent && (!modalLoading || selectedStudent.class) && (
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-title-lg font-bold text-on-surface">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h3>
                    <p className="text-body-md text-on-surface-variant">
                      Admission No: <span className="font-mono font-semibold">{selectedStudent.admissionNo}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-y border-gray-100 py-5">
                  <div>
                    <span className="block text-label-md font-medium text-on-surface-variant">Class</span>
                    <span className="text-body-md font-semibold text-on-surface mt-0.5 block">
                      {selectedStudent.class?.name || selectedStudent.className || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-label-md font-medium text-on-surface-variant">Section</span>
                    <span className="text-body-md font-semibold text-on-surface mt-0.5 block">
                      {selectedStudent.section?.name || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-label-md font-medium text-on-surface-variant">Status</span>
                    <div className="mt-1">
                      <StatusBadge status={mapStatus(selectedStudent.status)} />
                    </div>
                  </div>
                  <div>
                    <span className="block text-label-md font-medium text-on-surface-variant">Enrolled Date</span>
                    <span className="text-body-md font-semibold text-on-surface mt-0.5 block">
                      {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SchoolShell>
  );
}

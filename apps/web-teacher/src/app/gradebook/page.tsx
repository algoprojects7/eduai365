'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataTable, TabGroup } from '@eduai365/ui';
import { TeacherShell } from '@/components/teacher-shell';
import { apiFetch } from '@/lib/api';
import type { Gradebook, TeacherClass } from '@/types/teacher';

export default function GradebookPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [gradebook, setGradebook] = useState<Gradebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      try {
        const data = await apiFetch<TeacherClass[]>('/teacher/classes');
        if (!cancelled) {
          const safeData = data ?? [];
          setClasses(safeData);
          if (safeData[0]) setSelectedClassId(safeData[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load classes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadClasses();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadGradebook = useCallback(async (classId: string) => {
    if (!classId) return;
    setLoadingGrades(true);
    setError(null);
    try {
      const data = await apiFetch<Gradebook>(
        `/teacher/gradebook?classId=${encodeURIComponent(classId)}`,
      );
      setGradebook(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gradebook');
      setGradebook(null);
    } finally {
      setLoadingGrades(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      void loadGradebook(selectedClassId);
    }
  }, [selectedClassId, loadGradebook]);

  return (
    <TeacherShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Gradebook</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            View and manage assessment scores by class.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">Loading…</div>
        )}

        {!loading && classes.length > 0 && (
          <TabGroup
            tabs={classes.map((cls) => ({
              id: cls.id,
              label: `${cls.name} ${cls.section}`,
            }))}
            activeTab={selectedClassId}
            onChange={setSelectedClassId}
          />
        )}

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {loadingGrades && (
          <div className="bento-card py-12 text-center text-on-surface-variant">
            Loading gradebook…
          </div>
        )}

        {!loadingGrades && gradebook && (
          <DataTable
            columns={[
              { key: 'rollNo', header: 'Roll', className: 'w-16' },
              { key: 'studentName', header: 'Student' },
              ...gradebook.columns.map((col) => ({
                key: col.id,
                header: `${col.name} / ${col.maxScore}`,
                render: (row: (typeof gradebook.entries)[0]) => {
                  const score = row.scores[col.id];
                  return score !== null && score !== undefined ? String(score) : '—';
                },
              })),
              {
                key: 'average',
                header: 'Average',
                render: (row) => (
                  <span className="font-semibold text-secondary">{row.average.toFixed(1)}</span>
                ),
              },
            ]}
            data={gradebook.entries}
            keyExtractor={(row) => row.studentId}
          />
        )}
      </div>
    </TeacherShell>
  );
}

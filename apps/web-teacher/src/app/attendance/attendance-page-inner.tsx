'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AttendanceInlineGrid } from '@/components/dashboard/attendance-inline-grid';
import { TeacherShell } from '@/components/teacher-shell';
import { apiFetch } from '@/lib/api';
import type { TeacherClass } from '@/types/teacher';

export default function AttendancePageInner() {
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get('classId') ?? undefined;
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch<TeacherClass[]>('/teacher/classes');
        if (!cancelled) setClasses(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load classes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TeacherShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Attendance</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Mark today&apos;s attendance with Present, Absent, or Late toggles.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">Loading…</div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}
        {!loading && !error && (
          <AttendanceInlineGrid classes={classes} defaultClassId={classIdParam ?? classes[0]?.id} />
        )}
      </div>
    </TeacherShell>
  );
}

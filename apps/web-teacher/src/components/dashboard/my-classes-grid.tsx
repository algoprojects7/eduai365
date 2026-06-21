'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { formatPercent } from '@/lib/format';
import type { TeacherClass } from '@/types/teacher';

interface MyClassesGridProps {
  classes: TeacherClass[];
}

export function MyClassesGrid({ classes }: MyClassesGridProps) {
  const router = useRouter();

  if (classes.length === 0) {
    return (
      <div className="bento-card py-12 text-center text-on-surface-variant">
        No classes assigned yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {classes.map((cls) => (
        <button
          key={cls.id}
          type="button"
          onClick={() => router.push(`/attendance?classId=${cls.id}`)}
          className="bento-card-interactive text-left transition-shadow hover:shadow-card"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-title-lg font-semibold text-on-surface">
                {cls.name} {cls.section}
              </p>
              <p className="mt-1 text-body-md text-on-surface-variant">{cls.subject}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <Users className="h-5 w-5 text-secondary" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-body-md">
            <span className="text-on-surface-variant">{cls.studentCount} students</span>
            {cls.attendanceToday !== undefined && (
              <span className="font-medium text-success">
                {formatPercent(cls.attendanceToday)} present
              </span>
            )}
          </div>
          {cls.nextClassAt && (
            <p className="mt-2 text-label-md text-on-surface-variant">Next: {cls.nextClassAt}</p>
          )}
        </button>
      ))}
    </div>
  );
}

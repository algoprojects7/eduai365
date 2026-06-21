'use client';

import { Suspense } from 'react';
import AttendancePageInner from './attendance-page-inner';

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface-variant">
          Loading attendance…
        </div>
      }
    >
      <AttendancePageInner />
    </Suspense>
  );
}

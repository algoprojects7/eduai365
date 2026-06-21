'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { buildLoginUrl } from '@/lib/roles';
import type { UserRole } from '@eduai365/shared-types';

function LoginRedirect() {
  const searchParams = useSearchParams();
  const role = (searchParams.get('role') ?? 'PRINCIPAL') as UserRole;
  const school = searchParams.get('school') ?? 'greenfield';

  useEffect(() => {
    window.location.replace(buildLoginUrl(role, school));
  }, [role, school]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <p className="text-body-md text-on-surface-variant">Redirecting to school portal…</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
          <p className="text-body-md text-on-surface-variant">Loading…</p>
        </main>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}

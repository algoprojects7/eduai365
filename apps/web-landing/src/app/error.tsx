'use client';

import { useEffect } from 'react';
import { Button } from '@eduai365/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cinematic-navy px-4 text-center text-white">
      <h1 className="text-headline-lg font-bold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-body-md text-white/60">
        The page failed to load. This is usually fixed by refreshing or restarting the dev server.
      </p>
      <Button type="button" variant="ai" className="mt-8 rounded-full px-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

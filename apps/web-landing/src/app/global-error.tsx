'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#050A1E] px-4 text-center font-sans text-white">
        <h1 className="text-2xl font-bold">eduAI365</h1>
        <p className="mt-3 max-w-md text-sm text-white/60">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-[#0052d2] px-8 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}

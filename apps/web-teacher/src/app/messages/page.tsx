'use client';

import { useEffect, useState } from 'react';
import { ParentMessagesSnippet } from '@/components/dashboard/parent-messages';
import { TeacherShell } from '@/components/teacher-shell';
import { apiFetch } from '@/lib/api';
import type { ParentMessage, TeacherDashboard } from '@/types/teacher';

export default function MessagesPage() {
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const dashboard = await apiFetch<TeacherDashboard>('/teacher/dashboard');
        if (!cancelled) setMessages(dashboard.messages ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
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
          <h1 className="text-headline-lg font-bold text-on-surface">Messages</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Parent communication inbox for your students.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">Loading messages…</div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}
        {!loading && !error && <ParentMessagesSnippet messages={messages} />}
      </div>
    </TeacherShell>
  );
}

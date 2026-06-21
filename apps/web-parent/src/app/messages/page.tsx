'use client';

import { useEffect, useState } from 'react';
import { Badge, Button } from '@eduai365/ui';
import { MessageSquare, Calendar, User, Eye } from 'lucide-react';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import { formatDate, formatRelativeTime } from '@/lib/format';

interface ParentMessage {
  id: string;
  from: string;
  role: string;
  subject: string;
  body: string;
  sentAt: string;
  read?: boolean;
  unread?: boolean; // Gateway returns both formats
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ParentMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch<ParentMessage[]>('/parent/messages');
        if (!cancelled) {
          setMessages(Array.isArray(res) ? res : []);
          if (Array.isArray(res) && res.length > 0) {
            setSelectedMessage(res[0] ?? null);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <ParentShell>
      <div className="space-y-8">
        <header>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">Teacher Messages</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Stay in touch with your children&apos;s teachers and school staff.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading messages…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 lg:grid-cols-3">
            {messages.length === 0 ? (
              <div className="bento-card lg:col-span-3 py-16 text-center text-on-surface-variant">
                No messages found.
              </div>
            ) : (
              <>
                {/* Inbox List (col-span-1 or 2 depending on layout) */}
                <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  <h2 className="text-title-md font-bold text-on-surface-variant uppercase tracking-wider px-1">
                    Inbox ({messages.filter(m => m.unread || !m.read).length} Unread)
                  </h2>
                  {messages.map((msg) => {
                    const isUnread = msg.unread || !msg.read;
                    const isSelected = selectedMessage?.id === msg.id;

                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`bento-card p-4 text-left cursor-pointer border transition-all ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/10'
                            : isUnread
                              ? 'border-secondary/30 bg-secondary/5'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-on-surface truncate text-body-md">{msg.from}</p>
                          <span className="text-body-sm text-on-surface-variant flex-shrink-0">
                            {formatRelativeTime(msg.sentAt)}
                          </span>
                        </div>
                        <p className="text-body-md font-medium text-on-surface truncate mt-1">
                          {msg.subject}
                        </p>
                        <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-1">
                          {msg.body}
                        </p>
                        {isUnread && (
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-secondary" />
                            <Badge variant="info">New</Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Message View Panel (col-span-2) */}
                <div className="lg:col-span-2">
                  {selectedMessage ? (
                    <div className="bento-card space-y-6 min-h-[350px] flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* Header Details */}
                        <div className="border-b border-gray-100 pb-4 space-y-3">
                          <h2 className="text-headline-sm font-bold text-on-surface">
                            {selectedMessage.subject}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-md text-on-surface-variant">
                            <span className="flex items-center gap-1.5 font-medium text-on-surface">
                              <User className="h-4.5 w-4.5 text-primary" />
                              {selectedMessage.from} ({selectedMessage.role})
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4.5 w-4.5" />
                              {formatDate(selectedMessage.sentAt)}
                            </span>
                          </div>
                        </div>

                        {/* Body content */}
                        <div className="text-body-md text-on-surface leading-relaxed whitespace-pre-line py-2">
                          {selectedMessage.body}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => alert(`Replying to ${selectedMessage.from} via email...`)}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bento-card py-16 text-center text-on-surface-variant flex flex-col items-center justify-center space-y-3">
                      <Eye className="h-10 w-10 text-on-surface-variant/40" />
                      <p className="font-semibold">Select a message to view content</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ParentShell>
  );
}

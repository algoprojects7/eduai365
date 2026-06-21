'use client';

import { formatRelativeTime } from '@/lib/format';
import type { ParentMessage } from '@/types/teacher';

interface ParentMessagesSnippetProps {
  messages: ParentMessage[];
}

export function ParentMessagesSnippet({ messages }: ParentMessagesSnippetProps) {
  if (messages.length === 0) {
    return (
      <div className="bento-card py-8 text-center text-on-surface-variant">
        No parent messages yet.
      </div>
    );
  }

  return (
    <div className="bento-card space-y-3">
      <h3 className="text-title-lg font-semibold text-on-surface">Parent Messages</h3>
      <ul className="divide-y divide-gray-300/20">
        {messages.slice(0, 4).map((msg) => (
          <li key={msg.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${msg.unread ? 'bg-secondary' : 'bg-gray-300'}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-on-surface">{msg.parentName}</p>
                <span className="text-label-md text-on-surface-variant">
                  {formatRelativeTime(msg.receivedAt)}
                </span>
              </div>
              <p className="text-body-md text-on-surface-variant">
                Re: {msg.studentName} — {msg.subject}
              </p>
              <p className="mt-1 truncate text-body-md text-on-surface-variant">{msg.preview}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

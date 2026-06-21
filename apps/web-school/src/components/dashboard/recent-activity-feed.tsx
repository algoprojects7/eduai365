'use client';

import { useState } from 'react';
import { Button } from '@eduai365/ui';
import { formatRelativeTime } from '@/lib/format';
import type { ActivityItem } from '@/types/school';

interface RecentActivityFeedProps {
  items: ActivityItem[];
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  const [feed, setFeed] = useState(items);

  function clearAll() {
    setFeed([]);
  }

  return (
    <div className="bento-card h-full">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-title-lg font-semibold text-on-surface">Recent Activity</h3>
          <p className="text-body-md text-on-surface-variant">Pending approvals and alerts</p>
        </div>
        {feed.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-body-md font-medium text-secondary hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {feed.length === 0 ? (
        <p className="py-8 text-center text-body-md text-on-surface-variant">No pending items</p>
      ) : (
        <ul className="space-y-4">
          {feed.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-gray-300/20 bg-surface-faint px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{item.title}</p>
                  <p className="mt-1 text-body-md text-on-surface-variant">{item.description}</p>
                  <p className="mt-2 text-label-md text-on-surface-variant">
                    {formatRelativeTime(item.submittedAt)}
                  </p>
                </div>
              </div>

              {item.type === 'leave_request' && (
                <div className="mt-3 flex gap-2">
                  <Button variant="primary" size="sm">
                    Approve
                  </Button>
                  <Button variant="ghost" size="sm">
                    Reject
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

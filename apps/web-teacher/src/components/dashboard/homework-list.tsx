'use client';

import { formatDate } from '@/lib/format';
import type { HomeworkItem } from '@/types/teacher';

interface HomeworkListProps {
  items: HomeworkItem[];
  compact?: boolean;
}

export function HomeworkList({ items, compact = false }: HomeworkListProps) {
  if (items.length === 0) {
    return (
      <div className="bento-card py-8 text-center text-on-surface-variant">
        No homework assigned.
      </div>
    );
  }

  const displayItems = compact ? items.slice(0, 4) : items;

  return (
    <div className="space-y-3">
      {!compact && <h3 className="text-title-lg font-semibold text-on-surface">Homework</h3>}
      <div className="space-y-3">
        {displayItems.map((item) => {
          const submissionRate =
            item.totalCount > 0
              ? Math.round((item.submittedCount / item.totalCount) * 100)
              : 0;

          return (
            <div key={item.id} className="bento-card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-on-surface">{item.title}</p>
                <p className="text-body-md text-on-surface-variant">
                  {item.className} · Due {formatDate(item.dueDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-body-md font-medium text-on-surface">
                  {item.submittedCount}/{item.totalCount} submitted
                </p>
                <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-surface-faint">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${submissionRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

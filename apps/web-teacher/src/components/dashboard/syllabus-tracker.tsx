'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { SyllabusTracker } from '@/types/teacher';

interface SyllabusTrackerPanelProps {
  trackers: SyllabusTracker[];
}

const STATUS_COLORS = {
  completed: '#10B981',
  in_progress: '#F59E0B',
  pending: '#94A3B8',
};

export function SyllabusTrackerPanel({ trackers }: SyllabusTrackerPanelProps) {
  if (trackers.length === 0) {
    return (
      <div className="bento-card py-8 text-center text-on-surface-variant">
        Syllabus tracking will appear here once classes are configured.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-title-lg font-semibold text-on-surface">Syllabus Tracker</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {trackers.slice(0, 2).map((tracker) => {
          const completed = tracker.chapters.filter((c) => c.status === 'completed').length;
          const inProgress = tracker.chapters.filter((c) => c.status === 'in_progress').length;
          const pending = tracker.chapters.filter((c) => c.status === 'pending').length;
          const chartData = [
            { name: 'Completed', value: completed, fill: STATUS_COLORS.completed },
            { name: 'In Progress', value: inProgress, fill: STATUS_COLORS.in_progress },
            { name: 'Pending', value: pending, fill: STATUS_COLORS.pending },
          ].filter((d) => d.value > 0);

          const progress =
            tracker.totalChapters > 0
              ? Math.round((tracker.completedChapters / tracker.totalChapters) * 100)
              : 0;

          return (
            <div key={tracker.classId} className="bento-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-on-surface">{tracker.className}</p>
                  <p className="text-body-md text-on-surface-variant">{tracker.subject}</p>
                  <p className="mt-2 text-headline-md font-bold text-secondary">{progress}%</p>
                  <p className="text-label-md text-on-surface-variant">
                    {tracker.completedChapters} of {tracker.totalChapters} chapters taught
                  </p>
                </div>
                <div className="h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        innerRadius={28}
                        outerRadius={40}
                        paddingAngle={2}
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <ul className="mt-4 space-y-1 border-t border-gray-300/20 pt-3">
                {tracker.chapters.slice(0, 3).map((chapter) => (
                  <li
                    key={chapter.id}
                    className="flex items-center gap-2 text-body-md text-on-surface-variant"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[chapter.status] }}
                    />
                    {chapter.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

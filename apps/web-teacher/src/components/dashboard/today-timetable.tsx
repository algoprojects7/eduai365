'use client';

import { Clock } from 'lucide-react';
import { formatTimeRange } from '@/lib/format';
import type { TimetableSlot } from '@/types/teacher';

interface TodayTimetableProps {
  slots: TimetableSlot[];
}

export function TodayTimetable({ slots }: TodayTimetableProps) {
  if (slots.length === 0) {
    return null;
  }

  return (
    <div className="bento-card">
      <h3 className="mb-3 text-title-lg font-semibold text-on-surface">Today&apos;s Timetable</h3>
      <ul className="space-y-2">
        {slots.map((slot) => (
          <li
            key={slot.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-faint/60 px-3 py-2"
          >
            <div>
              <p className="font-medium text-on-surface">{slot.subject}</p>
              <p className="text-body-md text-on-surface-variant">
                {slot.className} · Room {slot.room}
              </p>
            </div>
            <p className="flex items-center gap-1 text-body-md text-on-surface-variant">
              <Clock className="h-4 w-4" strokeWidth={1.5} />
              {formatTimeRange(slot.startTime, slot.endTime)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

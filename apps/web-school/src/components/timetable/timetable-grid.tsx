'use client';

import { cn } from '@eduai365/ui';
import {
  TIMETABLE_DAYS,
  TIMETABLE_PERIODS,
  type TimetableSlot,
} from '@/types/academics';

function normalizeDay(dayOfWeek: number | string): number {
  if (typeof dayOfWeek === 'number') {
    return dayOfWeek >= 1 && dayOfWeek <= 6 ? dayOfWeek : 1;
  }

  const map: Record<string, number> = {
    MONDAY: 1,
    MON: 1,
    TUESDAY: 2,
    TUE: 2,
    WEDNESDAY: 3,
    WED: 3,
    THURSDAY: 4,
    THU: 4,
    FRIDAY: 5,
    FRI: 5,
    SATURDAY: 6,
    SAT: 6,
  };

  return map[dayOfWeek.toUpperCase()] ?? 1;
}

export function subjectColor(subjectName: string): { bg: string; text: string; border: string } {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 70%, 94%)`,
    text: `hsl(${hue}, 55%, 28%)`,
    border: `hsl(${hue}, 50%, 82%)`,
  };
}

function teacherName(slot: TimetableSlot): string {
  return `${slot.teacher.firstName} ${slot.teacher.lastName}`.trim();
}

export interface TimetableGridProps {
  slots: TimetableSlot[];
  loading?: boolean;
  emptyMessage?: string;
}

export function TimetableGrid({
  slots,
  loading = false,
  emptyMessage = 'No timetable slots scheduled',
}: TimetableGridProps) {
  const slotMap = new Map<string, TimetableSlot>();
  for (const slot of slots) {
    const day = normalizeDay(slot.dayOfWeek);
    slotMap.set(`${day}-${slot.period}`, slot);
  }

  if (loading) {
    return (
      <div className="bento-card py-16 text-center text-on-surface-variant">
        Loading timetable…
      </div>
    );
  }

  return (
    <div className="bento-card overflow-x-auto p-0">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-gray-200/60 bg-surface-faint/50">
            <th className="w-20 px-3 py-3 text-left text-label-md font-semibold text-on-surface-variant">
              Day
            </th>
            {TIMETABLE_PERIODS.map((period) => (
              <th
                key={period}
                className="px-2 py-3 text-center text-label-md font-semibold text-on-surface-variant"
              >
                P{period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIMETABLE_DAYS.map((dayLabel, dayIndex) => {
            const day = dayIndex + 1;
            return (
              <tr key={dayLabel} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 text-body-md font-medium text-on-surface">{dayLabel}</td>
                {TIMETABLE_PERIODS.map((period) => {
                  const slot = slotMap.get(`${day}-${period}`);
                  if (!slot) {
                    return (
                      <td key={period} className="p-1.5">
                        <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-gray-200/80 bg-surface-faint/30 text-xs text-on-surface-variant">
                          —
                        </div>
                      </td>
                    );
                  }

                  const colors = subjectColor(slot.subject.name);
                  return (
                    <td key={period} className="p-1.5">
                      <div
                        className={cn('flex h-16 flex-col justify-center rounded-md border px-2 py-1')}
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.text,
                        }}
                      >
                        <p className="truncate text-xs font-semibold">{slot.subject.name}</p>
                        <p className="truncate text-[10px] opacity-80">{teacherName(slot)}</p>
                        {slot.room && (
                          <p className="truncate text-[10px] opacity-70">{slot.room}</p>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {slots.length === 0 && (
        <p className="border-t border-gray-100 px-4 py-6 text-center text-body-md text-on-surface-variant">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

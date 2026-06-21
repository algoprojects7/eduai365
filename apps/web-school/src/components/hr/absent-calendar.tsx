'use client';

import { useMemo } from 'react';
import { DarkBentoCard } from '@eduai365/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LeaveCalendarDay } from '@/types/hr';
import { LEAVE_TYPE_LABELS } from '@/types/hr';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AbsentCalendarProps {
  month: Date;
  days: LeaveCalendarDay[];
  onMonthChange: (date: Date) => void;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function AbsentCalendar({ month, days, onMonthChange }: AbsentCalendarProps) {
  const dayMap = useMemo(() => {
    const map = new Map<string, LeaveCalendarDay['employees']>();
    for (const day of days) {
      map.set(day.date.slice(0, 10), day.employees);
    }
    return map;
  }, [days]);

  const calendarCells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ date: null, key: `pad-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({ date: new Date(year, monthIndex, d), key: `day-${d}` });
    }

    return cells;
  }, [month]);

  const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  function shiftMonth(delta: number) {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  return (
    <DarkBentoCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-title-md font-semibold text-white">Who&apos;s Absent</h3>
          <p className="mt-1 text-body-md text-white/50">Approved leave calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-body-md font-medium text-white">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-label-md uppercase tracking-wider text-white/40">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell) => {
          if (!cell.date) {
            return <div key={cell.key} className="min-h-[72px]" />;
          }

          const iso = cell.date.toISOString().slice(0, 10);
          const absent = dayMap.get(iso) ?? [];
          const hasAbsent = absent.length > 0;

          return (
            <div
              key={cell.key}
              className={`min-h-[72px] rounded-lg border p-1.5 ${
                hasAbsent
                  ? 'border-warning/30 bg-warning/10'
                  : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              <p className={`text-xs font-medium ${hasAbsent ? 'text-warning' : 'text-white/60'}`}>
                {cell.date.getDate()}
              </p>
              <div className="mt-1 space-y-0.5">
                {absent.slice(0, 2).map((emp) => (
                  <p
                    key={emp.id}
                    className="truncate text-[10px] leading-tight text-white/80"
                    title={`${emp.name} — ${LEAVE_TYPE_LABELS[emp.leaveType]}`}
                  >
                    {emp.name.split(' ')[0]}
                  </p>
                ))}
                {absent.length > 2 && (
                  <p className="text-[10px] text-white/50">+{absent.length - 2} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DarkBentoCard>
  );
}

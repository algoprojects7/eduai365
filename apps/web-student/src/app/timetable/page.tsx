'use client';

import { useEffect, useState } from 'react';
import { StudentShell } from '@/components/student-shell';
import { apiFetch } from '@/lib/api';

interface TimetableSlot {
  period: number;
  subject: string | Record<string, unknown>;
  teacher: string | Record<string, unknown>;
  room: string;
  startTime: string;
  endTime: string;
  isCurrent?: boolean;
}

interface RawTimetable {
  dayOfWeek?: number;
  periods?: TimetableSlot[];
  slots?: TimetableSlot[];
  date?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_COLORS = [
  'border-l-primary',
  'border-l-secondary',
  'border-l-success',
  'border-l-warning',
  'border-l-ai-violet',
  'border-l-error',
  'border-l-info',
];

function getSubjectName(raw: TimetableSlot): string {
  if (typeof raw.subject === 'object' && raw.subject !== null) {
    return ((raw.subject as Record<string, unknown>).name as string) ?? '—';
  }
  return (raw.subject as string) ?? '—';
}

function getTeacherName(raw: TimetableSlot): string {
  if (typeof raw.teacher === 'object' && raw.teacher !== null) {
    const t = raw.teacher as Record<string, unknown>;
    return `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() || '—';
  }
  return (raw.teacher as string) ?? '—';
}

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<number>(new Date().getDay());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const raw = await apiFetch<RawTimetable>('/student/timetable/today');
        if (!cancelled) {
          setSlots(raw.periods ?? raw.slots ?? []);
          setDayOfWeek(raw.dayOfWeek ?? new Date().getDay());
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load timetable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  function isCurrent(slot: TimetableSlot): boolean {
    if (typeof slot.isCurrent === 'boolean') return slot.isCurrent;
    return slot.startTime <= timeStr && timeStr <= slot.endTime;
  }

  return (
    <StudentShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Timetable</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {DAYS[dayOfWeek] ?? 'Today'}&apos;s class schedule and periods.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading timetable…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Day indicator */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DAYS.slice(1, 6).map((day, i) => (
                <div
                  key={day}
                  className={`flex-shrink-0 rounded-xl px-4 py-2 text-body-md font-medium transition-colors ${
                    i + 1 === dayOfWeek
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {slots.length === 0 ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                {dayOfWeek === 0 || dayOfWeek === 6
                  ? 'No classes on weekends. Enjoy your rest!'
                  : 'No timetable slots found for today. Check back later.'}
              </div>
            ) : (
              <div className="space-y-3">
                {slots.map((slot, idx) => {
                  const active = isCurrent(slot);
                  const colorClass = PERIOD_COLORS[idx % PERIOD_COLORS.length];
                  return (
                    <div
                      key={slot.period}
                      className={`relative rounded-xl border-l-4 ${colorClass} p-4 transition-all ${
                        active
                          ? 'bg-primary/5 shadow-md ring-1 ring-primary/20'
                          : 'bg-surface-faint hover:bg-surface-container-high/50'
                      }`}
                    >
                      {active && (
                        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-label-md font-semibold text-primary">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                          Live now
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-4 pr-20">
                        <div className="space-y-1">
                          <p className="text-title-lg font-semibold text-on-surface">
                            {getSubjectName(slot)}
                          </p>
                          <p className="text-body-md text-on-surface-variant">
                            {getTeacherName(slot)}
                            {slot.room ? ` · Room ${slot.room}` : ''}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-title-md font-semibold text-on-surface">
                            Period {slot.period}
                          </p>
                          <p className="text-body-md text-on-surface-variant">
                            {slot.startTime} – {slot.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </StudentShell>
  );
}

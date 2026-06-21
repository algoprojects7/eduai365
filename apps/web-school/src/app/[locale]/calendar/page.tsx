'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@eduai365/ui';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type { CalendarEvent, CalendarEventType, CreateCalendarEventInput } from '@/types/academics';

const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  EXAM: 'bg-error',
  HOLIDAY: 'bg-success',
  EVENT: 'bg-secondary',
  PTM: 'bg-ai-violet',
  SPORTS: 'bg-warning',
};

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  EXAM: 'Exam',
  HOLIDAY: 'Holiday',
  EVENT: 'Event',
  PTM: 'PTM',
  SPORTS: 'Sports',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateInRange(date: Date, start: string, end: string): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: CreateCalendarEventInput) => Promise<void>;
  initial?: CalendarEvent | null;
}

function EventModal({ open, onClose, onSave, initial }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEventType>('EVENT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setType(initial?.type ?? 'EVENT');
      setStartDate(initial?.startDate?.slice(0, 10) ?? '');
      setEndDate(initial?.endDate?.slice(0, 10) ?? '');
      setAllDay(initial?.allDay ?? true);
      setDescription(initial?.description ?? '');
    }
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, type, startDate, endDate, allDay, description });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-title-lg font-semibold text-on-surface">
          {initial ? 'Edit Event' : 'Add Event'}
        </h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300/30 px-3 text-body-md"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CalendarEventType)}
              className="h-11 w-full rounded-lg border border-gray-300/30 px-3 text-body-md"
            >
              {(Object.keys(EVENT_TYPE_LABELS) as CalendarEventType[]).map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">Start</label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 px-3 text-body-md"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-on-surface-variant">End</label>
              <input
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 px-3 text-body-md"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-body-md text-on-surface">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            All day event
          </label>
          <div>
            <label className="mb-1 block text-label-md text-on-surface-variant">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300/30 px-3 py-2 text-body-md"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const academicYear = `${viewYear}-${(viewYear + 1).toString().slice(-2)}`;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CalendarEvent[]>(
        `/academics/calendar/events?month=${viewMonth + 1}&year=${viewYear}`,
      );
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [viewMonth, viewYear]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }

    return days;
  }, [viewMonth, viewYear]);

  const eventsForDay = useCallback(
    (day: Date) => events.filter((ev) => dateInRange(day, ev.startDate, ev.endDate)),
    [events],
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return [...events]
      .filter((ev) => new Date(ev.endDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 8);
  }, [events]);

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  async function handleSaveEvent(input: CreateCalendarEventInput) {
    if (editingEvent) {
      await apiFetch(`/academics/calendar/events/${editingEvent.id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    } else {
      await apiFetch('/academics/calendar/events', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    }
    setEditingEvent(null);
    await loadEvents();
  }

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Academic Calendar</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Exams, holidays, events, and important dates
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingEvent(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </header>

        <div className="flex flex-wrap gap-3">
          {(Object.keys(EVENT_TYPE_COLORS) as CalendarEventType[]).map((type) => (
            <span key={type} className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <span className={`h-2.5 w-2.5 rounded-full ${EVENT_TYPE_COLORS[type]}`} />
              {EVENT_TYPE_LABELS[type]}
            </span>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="bento-card">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg p-2 hover:bg-surface-faint"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-title-lg font-semibold text-on-surface">{monthLabel}</h2>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg p-2 hover:bg-surface-faint"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="py-24 text-center text-on-surface-variant">Loading calendar…</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center text-label-md font-medium text-on-surface-variant">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="py-2">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (!day) {
                      return <div key={`pad-${i}`} className="min-h-[72px]" />;
                    }

                    const dayEvents = eventsForDay(day);
                    const isSelected = selectedDay && sameDay(day, selectedDay);
                    const isToday = sameDay(day, today);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`min-h-[72px] rounded-lg border p-1 text-left transition-colors ${
                          isSelected
                            ? 'border-secondary bg-secondary/5'
                            : 'border-transparent hover:bg-surface-faint'
                        } ${isToday ? 'ring-1 ring-secondary/40' : ''}`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-body-md ${
                            isToday ? 'bg-secondary text-white' : 'text-on-surface'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={`h-1.5 w-1.5 rounded-full ${EVENT_TYPE_COLORS[ev.type]}`}
                              title={ev.title}
                            />
                          ))}
                        </div>
                        {dayEvents.length > 0 && (
                          <p className="mt-0.5 truncate text-[10px] text-on-surface-variant">
                            {dayEvents[0]?.title}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selectedDay && (
              <div className="mt-6 border-t border-gray-300/20 pt-4">
                <h3 className="text-body-md font-semibold text-on-surface">
                  {formatDisplayDate(selectedDay.toISOString())}
                </h3>
                {selectedDayEvents.length === 0 ? (
                  <p className="mt-2 text-body-md text-on-surface-variant">No events on this day</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {selectedDayEvents.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex items-start gap-3 rounded-lg border border-gray-300/20 px-3 py-2"
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${EVENT_TYPE_COLORS[ev.type]}`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-on-surface">{ev.title}</p>
                          <p className="text-label-md text-on-surface-variant">
                            {EVENT_TYPE_LABELS[ev.type]}
                            {ev.description ? ` · ${ev.description}` : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(ev);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="bento-card">
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                Academic Year
              </p>
              <p className="mt-1 text-title-lg font-semibold text-on-surface">{academicYear}</p>
            </div>

            <div className="bento-card">
              <h3 className="text-title-lg font-semibold text-on-surface">Upcoming Events</h3>
              {upcomingEvents.length === 0 ? (
                <p className="mt-3 text-body-md text-on-surface-variant">No upcoming events</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {upcomingEvents.map((ev) => (
                    <li key={ev.id} className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${EVENT_TYPE_COLORS[ev.type]}`}
                      />
                      <div>
                        <p className="text-body-md font-medium text-on-surface">{ev.title}</p>
                        <p className="text-label-md text-on-surface-variant">
                          {formatDisplayDate(ev.startDate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>

      <EventModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initial={editingEvent}
      />
    </SchoolShell>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AiInsightCard,
  Badge,
  Button,
  DarkBentoCard,
  DarkModuleShell,
  DataTable,
  StatusBadge,
} from '@eduai365/ui';
import { RefreshCw, Sparkles, UserRoundCheck } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { employeeFullName } from '@/lib/hr';
import type {
  AssignSubstitutionInput,
  EmployeeProfile,
  SubstitutionAssignment,
  SubstitutionSuggestionsResponse,
} from '@/types/hr';

interface OpsLogEntry {
  id: string;
  message: string;
  timestamp: string;
}

const darkInputClassName =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-body-md text-white outline-none focus:border-secondary';

function teacherName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export default function SubstitutionsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [assignments, setAssignments] = useState<SubstitutionAssignment[]>([]);
  const [teachers, setTeachers] = useState<EmployeeProfile[]>([]);
  const [suggestions, setSuggestions] = useState<SubstitutionSuggestionsResponse | null>(null);
  const [absentTeacherId, setAbsentTeacherId] = useState('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opsLog, setOpsLog] = useState<OpsLogEntry[]>([]);

  const appendLog = useCallback((message: string) => {
    setOpsLog((prev) => [
      { id: `${Date.now()}-${prev.length}`, message, timestamp: new Date().toISOString() },
      ...prev,
    ].slice(0, 20));
  }, []);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subs, staff] = await Promise.all([
        apiFetch<SubstitutionAssignment[]>(`/hr/substitutions?date=${date}`),
        apiFetch<EmployeeProfile[]>('/hr/employees?type=TEACHING'),
      ]);
      setAssignments(subs);
      setTeachers(staff);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load substitutions');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const selectedSlot = suggestions?.absentSchedule[selectedSlotIndex];

  const topSuggestions = useMemo(
    () => suggestions?.suggestions.slice(0, 5) ?? [],
    [suggestions],
  );

  async function loadSuggestions() {
    if (!absentTeacherId) return;
    setSuggestLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SubstitutionSuggestionsResponse>(
        `/hr/substitutions/suggestions?absentTeacherId=${encodeURIComponent(absentTeacherId)}&date=${date}`,
      );
      setSuggestions(data);
      setSelectedSlotIndex(0);
      if (data.suggestions[0]) {
        setSubstituteTeacherId(data.suggestions[0].teacher.id);
      }
      appendLog(`AI match loaded for absent teacher on ${date}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI suggestions');
    } finally {
      setSuggestLoading(false);
    }
  }

  async function handleAssign() {
    if (!absentTeacherId || !substituteTeacherId || !selectedSlot) {
      setError('Select absent teacher, substitute, and a class period');
      return;
    }

    const payload: AssignSubstitutionInput = {
      absentTeacherId,
      substituteTeacherId,
      classId: selectedSlot.classId,
      sectionId: selectedSlot.sectionId ?? undefined,
      date,
      period: selectedSlot.period,
    };

    setAssignLoading(true);
    setError(null);
    try {
      const record = await apiFetch<SubstitutionAssignment>('/hr/substitutions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAssignments((prev) => [record, ...prev]);
      appendLog(
        `Assigned ${teacherName(record.substituteTeacher)} → Period ${record.period} (${record.class.name})`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign substitute');
    } finally {
      setAssignLoading(false);
    }
  }

  return (
    <SchoolShell>
      <DarkModuleShell className="space-y-6 rounded-xl p-4 md:p-6">
        <header>
          <h1 className="text-headline-lg font-bold text-white">Substitution Management</h1>
          <p className="mt-1 text-body-md text-white/60">
            AI smart-match suggestions, assign substitutes, and live operations log
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <DarkBentoCard glow>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ai-violet" strokeWidth={1.5} />
                <h2 className="text-title-lg font-semibold text-white">AI Smart Match</h2>
              </div>
              <p className="mt-2 text-body-md text-white/60">
                Select an absent teacher to get ranked substitute suggestions based on availability
                and subject fit.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Date">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={darkInputClassName}
                  />
                </Field>
                <Field label="Absent Teacher">
                  <select
                    value={absentTeacherId}
                    onChange={(e) => setAbsentTeacherId(e.target.value)}
                    className={darkInputClassName}
                  >
                    <option value="">Select teacher…</option>
                    {teachers.map((t) => (
                      <option key={t.userId} value={t.userId}>
                        {employeeFullName(t)} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Button
                variant="ai"
                size="sm"
                className="mt-4"
                disabled={!absentTeacherId || suggestLoading}
                onClick={() => void loadSuggestions()}
              >
                {suggestLoading ? 'Analyzing…' : 'Run AI Match'}
              </Button>

              {topSuggestions.length > 0 && (
                <div className="mt-5 space-y-2">
                  {topSuggestions.map((item) => (
                    <button
                      key={item.teacher.id}
                      type="button"
                      onClick={() => setSubstituteTeacherId(item.teacher.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                        substituteTeacherId === item.teacher.id
                          ? 'border-ai-violet bg-ai-violet/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">
                          {teacherName(item.teacher)}
                        </p>
                        <p className="text-body-md text-white/50">
                          {item.department} · {item.employeeId}
                        </p>
                      </div>
                      <Badge variant="ai">{Math.round(item.aiMatchScore * 100)}% match</Badge>
                    </button>
                  ))}
                </div>
              )}
            </DarkBentoCard>

            <DarkBentoCard>
              <h2 className="text-title-lg font-semibold text-white">Assign Substitute</h2>
              {suggestions && suggestions.absentSchedule.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <Field label="Class Period">
                    <select
                      value={selectedSlotIndex}
                      onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
                      className={darkInputClassName}
                    >
                      {suggestions.absentSchedule.map((slot, index) => (
                        <option key={slot.id} value={index}>
                          Period {slot.period}
                          {slot.subject ? ` — ${slot.subject.name}` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Button
                    variant="primary"
                    disabled={assignLoading || !substituteTeacherId}
                    onClick={() => void handleAssign()}
                  >
                    <UserRoundCheck className="h-4 w-4" />
                    {assignLoading ? 'Assigning…' : 'Confirm Assignment'}
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-body-md text-white/50">
                  Run AI match to load absent schedule and assign a substitute.
                </p>
              )}
            </DarkBentoCard>
          </div>

          <DarkBentoCard>
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg font-semibold text-white">Live Ops Log</h2>
              <RefreshCw className="h-4 w-4 text-white/40" strokeWidth={1.5} />
            </div>
            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {opsLog.length === 0 && (
                <p className="text-body-md text-white/50">Operations events will appear here.</p>
              )}
              {opsLog.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-body-md text-white/90">{entry.message}</p>
                  <p className="mt-1 text-label-md text-white/40">
                    {formatRelativeTime(entry.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </DarkBentoCard>
        </div>

        {error && (
          <div className="rounded-lg bg-error/20 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        <section>
          <h2 className="mb-4 text-title-lg font-semibold text-white">
            Today&apos;s Assignments ({date})
          </h2>
          {loading ? (
            <DarkBentoCard>
              <p className="text-center text-white/50">Loading assignments…</p>
            </DarkBentoCard>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <DataTable
                data={assignments}
                keyExtractor={(row) => row.id}
                emptyMessage="No substitutions scheduled for this date"
                columns={[
                  {
                    key: 'period',
                    header: 'Period',
                    render: (row) => `P${row.period}`,
                  },
                  {
                    key: 'class',
                    header: 'Class',
                    render: (row) => row.section?.name ? `${row.class.name} ${row.section.name}` : row.class.name,
                  },
                  {
                    key: 'absent',
                    header: 'Absent',
                    render: (row) => teacherName(row.absentTeacher),
                  },
                  {
                    key: 'substitute',
                    header: 'Substitute',
                    render: (row) => teacherName(row.substituteTeacher),
                  },
                  {
                    key: 'aiScore',
                    header: 'AI Score',
                    render: (row) =>
                      row.aiMatchScore != null ? `${Math.round(row.aiMatchScore * 100)}%` : '—',
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row) => (
                      <StatusBadge
                        status={
                          row.status === 'COMPLETED'
                            ? 'active'
                            : row.status === 'ASSIGNED'
                              ? 'pending'
                              : 'warning'
                        }
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}
        </section>

        {suggestions && suggestions.suggestions.length === 0 && (
          <AiInsightCard
            variant="dark"
            title="No Substitutes Available"
            description="All teaching staff appear occupied for the selected date. Consider adjusting the timetable or approving external cover."
          />
        )}
      </DarkModuleShell>
    </SchoolShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-label-md text-white/60">{label}</label>
      {children}
    </div>
  );
}

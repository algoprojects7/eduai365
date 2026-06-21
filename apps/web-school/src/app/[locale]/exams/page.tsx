'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AiInsightCard,
  Button,
  DataTable,
  KpiBentoCard,
  StatusBadge,
  TabGroup,
  chartColors,
  rechartsAxisProps,
} from '@eduai365/ui';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Save,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type {
  ExamListItem,
  ExamResultRow,
  ExamScheduleEntry,
  UpdateExamResultInput,
} from '@/types/academics';

type ExamTab = 'schedule' | 'hall-tickets' | 'mark-entry' | 'results' | 'ai-analysis';

function mapExamStatus(status: string): 'active' | 'pending' | 'inactive' | 'warning' {
  switch (status.toUpperCase()) {
    case 'ONGOING':
    case 'PUBLISHED':
      return 'active';
    case 'SCHEDULED':
      return 'pending';
    case 'COMPLETED':
      return 'inactive';
    default:
      return 'warning';
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(time: string): string {
  if (!time) return '—';
  const parts = time.split(':');
  const h = parts[0] ?? '0';
  const m = parts[1] ?? '00';
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function letterGrade(percent: number): string {
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B+';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 40) return 'D';
  return 'F';
}

function computeGradeDistribution(rows: ExamResultRow[]) {
  const buckets: Record<string, number> = {
    'A+': 0,
    A: 0,
    'B+': 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };

  for (const row of rows) {
    const total = row.subjects.reduce((s, sub) => s + sub.marksObtained, 0);
    const max = row.subjects.reduce((s, sub) => s + sub.maxMarks, 0);
    const pct = max > 0 ? (total / max) * 100 : 0;
    const grade = letterGrade(pct);
    buckets[grade] = (buckets[grade] ?? 0) + 1;
  }

  return Object.entries(buckets).map(([grade, count]) => ({ grade, count }));
}

const AI_INSIGHTS = [
  {
    title: 'Math weakness in Class 8-B',
    description:
      'Average math score is 12% below school mean. Consider remedial sessions for algebra topics.',
    confidence: '87% confidence',
  },
  {
    title: 'Science improvement in Class 10-A',
    description:
      'Lab-based learning correlated with 8% score uplift. Recommend expanding practical sessions.',
    confidence: '92% confidence',
  },
  {
    title: 'Attendance-exam correlation',
    description:
      'Students below 75% attendance scored 18% lower on average. Flag at-risk students before finals.',
    confidence: '79% confidence',
  },
];

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<ExamTab>('schedule');
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [schedule, setSchedule] = useState<ExamScheduleEntry[]>([]);
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [editableMarks, setEditableMarks] = useState<Record<string, Record<string, number>>>({});
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExams() {
      try {
        const data = await apiFetch<ExamListItem[]>('/academics/exams');
        if (!cancelled) {
          setExams(data);
          if (data.length > 0 && data[0]) {
            setSelectedExamId(data[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load exams');
        }
      } finally {
        if (!cancelled) {
          setLoadingExams(false);
        }
      }
    }

    void loadExams();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedExamId || activeTab !== 'schedule') return;

    let cancelled = false;
    setLoadingSchedule(true);

    async function loadSchedule() {
      try {
        const data = await apiFetch<ExamScheduleEntry[]>(
          `/academics/exams/${selectedExamId}/schedule`,
        );
        if (!cancelled) {
          setSchedule(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule');
        }
      } finally {
        if (!cancelled) {
          setLoadingSchedule(false);
        }
      }
    }

    void loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [selectedExamId, activeTab]);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of schedule) {
      map.set(entry.classId, entry.className);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [schedule]);

  useEffect(() => {
    if (classOptions.length === 0) return;
    setSelectedClassId((prev) =>
      classOptions.some((c) => c.id === prev) ? prev : (classOptions[0]?.id ?? ''),
    );
  }, [classOptions]);

  const loadResults = useCallback(async () => {
    if (!selectedExamId || !selectedClassId) return;

    setLoadingResults(true);
    setError(null);

    try {
      const data = await apiFetch<ExamResultRow[]>(
        `/academics/exams/${selectedExamId}/results?classId=${selectedClassId}`,
      );
      setResults(data);

      const marks: Record<string, Record<string, number>> = {};
      for (const row of data) {
        const rowMarks: Record<string, number> = {};
        for (const sub of row.subjects) {
          rowMarks[sub.subjectId] = sub.marksObtained;
        }
        marks[row.studentId] = rowMarks;
      }
      setEditableMarks(marks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoadingResults(false);
    }
  }, [selectedExamId, selectedClassId]);

  useEffect(() => {
    if (!selectedExamId || (activeTab !== 'mark-entry' && activeTab !== 'results')) {
      return;
    }

    let cancelled = false;

    async function loadScheduleForClass() {
      try {
        const data = await apiFetch<ExamScheduleEntry[]>(
          `/academics/exams/${selectedExamId}/schedule`,
        );
        if (!cancelled) {
          setSchedule(data);
        }
      } catch {
        /* class selector falls back empty */
      }
    }

    void loadScheduleForClass();
    return () => {
      cancelled = true;
    };
  }, [selectedExamId, activeTab]);

  useEffect(() => {
    if (
      !selectedExamId ||
      !selectedClassId ||
      (activeTab !== 'mark-entry' && activeTab !== 'results')
    ) {
      return;
    }

    void loadResults();
  }, [selectedExamId, selectedClassId, activeTab, loadResults]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const subjectColumns = results[0]?.subjects ?? [];
  const gradeData = useMemo(() => computeGradeDistribution(results), [results]);

  const resultStats = useMemo(() => {
    if (results.length === 0) {
      return { avgPercent: 0, passCount: 0, topScore: 0 };
    }

    let totalPct = 0;
    let passCount = 0;
    let topScore = 0;

    for (const row of results) {
      const total = row.subjects.reduce((s, sub) => s + sub.marksObtained, 0);
      const max = row.subjects.reduce((s, sub) => s + sub.maxMarks, 0);
      const pct = max > 0 ? (total / max) * 100 : 0;
      totalPct += pct;
      if (pct >= 40) passCount += 1;
      if (total > topScore) topScore = total;
    }

    return {
      avgPercent: Math.round(totalPct / results.length),
      passCount,
      topScore,
    };
  }, [results]);

  async function handleSaveMarks(studentId: string) {
    if (!selectedExamId) return;

    setSaving(true);
    setSaveMessage(null);

    const subjects: UpdateExamResultInput['subjects'] = Object.entries(
      editableMarks[studentId] ?? {},
    ).map(([subjectId, marksObtained]) => ({ subjectId, marksObtained }));

    try {
      await apiFetch(`/academics/exams/${selectedExamId}/results/${studentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ subjects }),
      });
      setSaveMessage('Marks saved successfully');
      void loadResults();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  }

  function updateMark(studentId: string, subjectId: string, value: number) {
    setEditableMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: value,
      },
    }));
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">Exam Management</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Schedule exams, enter marks, and analyze performance
          </p>
        </header>

        <TabGroup
          tabs={[
            { id: 'schedule', label: 'Schedule' },
            { id: 'hall-tickets', label: 'Hall Tickets' },
            { id: 'mark-entry', label: 'Mark Entry' },
            { id: 'results', label: 'Results' },
            { id: 'ai-analysis', label: 'AI Analysis' },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as ExamTab)}
        />

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {saveMessage && (
          <div className="rounded-lg bg-secondary/10 px-4 py-3 text-body-md text-secondary">
            {saveMessage}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {loadingExams ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading exams…
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`bento-card text-left transition-colors ${
                        selectedExamId === exam.id
                          ? 'ring-2 ring-secondary'
                          : 'hover:border-secondary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-on-surface">{exam.name}</p>
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            {exam.term} · {exam.academicYear}
                          </p>
                        </div>
                        <StatusBadge status={mapExamStatus(exam.status)} />
                      </div>
                      <p className="mt-3 text-body-md text-on-surface-variant">
                        {formatDate(exam.startDate)} – {formatDate(exam.endDate)}
                      </p>
                    </button>
                  ))}
                </div>

                {selectedExam && (
                  <div>
                    <h2 className="mb-4 text-title-lg font-semibold text-on-surface">
                      Schedule — {selectedExam.name}
                    </h2>
                    {loadingSchedule ? (
                      <div className="bento-card py-12 text-center text-on-surface-variant">
                        Loading schedule…
                      </div>
                    ) : (
                      <DataTable
                        data={schedule}
                        keyExtractor={(row) =>
                          row.id ?? `${row.subjectId}-${row.classId}-${row.date}`
                        }
                        emptyMessage="No schedule entries for this exam"
                        columns={[
                          { key: 'subject', header: 'Subject', render: (r) => r.subjectName },
                          { key: 'class', header: 'Class', render: (r) => r.className },
                          {
                            key: 'date',
                            header: 'Date',
                            render: (r) => formatDate(r.date),
                          },
                          {
                            key: 'time',
                            header: 'Time',
                            render: (r) =>
                              `${formatTime(r.startTime)} – ${formatTime(r.endTime)}`,
                          },
                          { key: 'room', header: 'Room', render: (r) => r.room || '—' },
                          {
                            key: 'maxMarks',
                            header: 'Max Marks',
                            render: (r) => r.maxMarks,
                          },
                        ]}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Hall Tickets Tab */}
        {activeTab === 'hall-tickets' && (
          <div className="bento-card flex flex-col items-center gap-4 py-16 text-center">
            <Ticket className="h-12 w-12 text-on-surface-variant" strokeWidth={1.5} />
            <div>
              <h2 className="text-title-lg font-semibold text-on-surface">Hall Ticket Generator</h2>
              <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
                Generate printable hall tickets for all students registered in the selected exam.
              </p>
            </div>
            <Button variant="primary" onClick={() => alert('Hall ticket generation coming soon')}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Hall Tickets
            </Button>
          </div>
        )}

        {/* Mark Entry Tab */}
        {activeTab === 'mark-entry' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Exam</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="h-11 min-w-[200px] rounded-lg border border-gray-300/30 bg-white px-3 text-body-md"
                >
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="h-11 min-w-[160px] rounded-lg border border-gray-300/30 bg-white px-3 text-body-md"
                >
                  {classOptions.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingResults ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading mark sheet…
              </div>
            ) : results.length === 0 ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                No students found for this class
              </div>
            ) : (
              <div className="bento-card overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-body-md">
                  <thead>
                    <tr className="border-b border-gray-300/20">
                      <th className="px-3 py-3 font-semibold text-on-surface">Student</th>
                      {subjectColumns.map((sub) => (
                        <th key={sub.subjectId} className="px-3 py-3 font-semibold text-on-surface">
                          {sub.subjectName}
                          <span className="block text-label-md font-normal text-on-surface-variant">
                            / {sub.maxMarks}
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-3 font-semibold text-on-surface">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row) => (
                      <tr key={row.studentId} className="border-b border-gray-300/10">
                        <td className="px-3 py-2 font-medium text-on-surface">
                          {row.studentName}
                        </td>
                        {subjectColumns.map((sub) => (
                          <td key={sub.subjectId} className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              max={sub.maxMarks}
                              value={editableMarks[row.studentId]?.[sub.subjectId] ?? 0}
                              onChange={(e) =>
                                updateMark(
                                  row.studentId,
                                  sub.subjectId,
                                  Math.min(sub.maxMarks, Math.max(0, Number(e.target.value))),
                                )
                              }
                              className="h-9 w-20 rounded border border-gray-300/30 px-2 text-body-md"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={saving}
                            onClick={() => void handleSaveMarks(row.studentId)}
                          >
                            <Save className="mr-1 h-4 w-4" />
                            Save
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Exam</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="h-11 min-w-[200px] rounded-lg border border-gray-300/30 bg-white px-3 text-body-md"
                >
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-md text-on-surface-variant">Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="h-11 min-w-[160px] rounded-lg border border-gray-300/30 bg-white px-3 text-body-md"
                >
                  {classOptions.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <KpiBentoCard
                label="Average Score"
                value={loadingResults ? '…' : `${resultStats.avgPercent}%`}
                icon={TrendingUp}
              />
              <KpiBentoCard
                label="Pass Rate"
                value={
                  loadingResults
                    ? '…'
                    : results.length
                      ? `${Math.round((resultStats.passCount / results.length) * 100)}%`
                      : '0%'
                }
                icon={ClipboardList}
              />
              <KpiBentoCard
                label="Top Score"
                value={loadingResults ? '…' : resultStats.topScore}
                icon={CalendarDays}
              />
            </div>

            {loadingResults ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                Loading results…
              </div>
            ) : (
              <div className="bento-card">
                <h3 className="mb-4 text-title-lg font-semibold text-on-surface">
                  Grade Distribution
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="grade" {...rechartsAxisProps} />
                      <YAxis {...rechartsAxisProps} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid rgba(11, 29, 66, 0.08)',
                          boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
                        }}
                      />
                      <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'ai-analysis' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {AI_INSIGHTS.map((insight) => (
              <AiInsightCard
                key={insight.title}
                title={insight.title}
                description={insight.description}
                confidence={insight.confidence}
                actionLabel="View Details"
                onAction={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </SchoolShell>
  );
}

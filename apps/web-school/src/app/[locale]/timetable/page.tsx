'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, TabGroup } from '@eduai365/ui';
import {
  AlertTriangle,
  Clock,
  Coffee,
  RefreshCw,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { TimetableGrid } from '@/components/timetable/timetable-grid';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import {
  deriveClassSectionsFromStudents,
  getFallbackClassSections,
} from '@/lib/class-sections';
import type { ClassSectionOption, TimetableResponse } from '@/types/academics';
import type { StudentRow, TeacherRow } from '@/types/school';

type TimetableTab = 'class' | 'teacher';

const PERIOD_SETTINGS = [
  { label: 'Period Duration', value: '45 minutes' },
  { label: 'Morning Break', value: '10:30 – 10:45 AM' },
  { label: 'Lunch Break', value: '12:45 – 1:30 PM' },
  { label: 'Short Break', value: '3:00 – 3:10 PM' },
];

export default function TimetablePage() {
  const [activeTab, setActiveTab] = useState<TimetableTab>('class');
  const [classSections, setClassSections] = useState<ClassSectionOption[]>(getFallbackClassSections());
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [selectedClassKey, setSelectedClassKey] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [classTimetable, setClassTimetable] = useState<TimetableResponse | null>(null);
  const [teacherTimetable, setTeacherTimetable] = useState<TimetableResponse | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedClass = useMemo(
    () => classSections.find((c) => `${c.classId}:${c.sectionId}` === selectedClassKey),
    [classSections, selectedClassKey],
  );

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    setError(null);

    try {
      const [studentsRes, teachersRes, conflictsData] = await Promise.all([
        apiFetch<{ items: StudentRow[] }>('/school/students?limit=100').catch(() => ({ items: [] })),
        apiFetch<{ items: TeacherRow[] }>('/school/teachers?limit=100').catch(() => ({ items: [] })),
        apiFetch<string[]>('/academics/timetable/conflicts').catch(() => []),
      ]);

      const studentsList = studentsRes?.items || [];
      const teachersList = (teachersRes?.items || []).map((t: any) => ({
        ...t,
        name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
        status: t.isActive ? 'ACTIVE' : 'INACTIVE',
      }));

      const sections = studentsList.length > 0
        ? deriveClassSectionsFromStudents(studentsList)
        : getFallbackClassSections();

      setClassSections(sections);
      setTeachers(teachersList);
      setConflicts(conflictsData);

      setSelectedClassKey((current) => {
        if (current) return current;
        const first = sections[0];
        if (!first) return '';
        return `${first.classId}:${first.sectionId}`;
      });

      setSelectedTeacherId((current) => {
        if (current) return current;
        const firstTeacher = teachersList[0];
        if (!firstTeacher) return '';
        return firstTeacher.id;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timetable metadata');
      setClassSections(getFallbackClassSections());
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const loadClassTimetable = useCallback(async (option: ClassSectionOption) => {
    setLoadingTimetable(true);
    setError(null);

    try {
      const data = await apiFetch<TimetableResponse>(
        `/academics/timetable/class?classId=${encodeURIComponent(option.classId)}&sectionId=${encodeURIComponent(option.sectionId)}`,
      );
      setClassTimetable(data);
    } catch (err) {
      setClassTimetable({ slots: [] });
      setError(err instanceof Error ? err.message : 'Failed to load class timetable');
    } finally {
      setLoadingTimetable(false);
    }
  }, []);

  const loadTeacherTimetable = useCallback(async (teacherId: string) => {
    setLoadingTimetable(true);
    setError(null);

    try {
      const data = await apiFetch<TimetableResponse>(
        `/academics/timetable/teacher?teacherId=${encodeURIComponent(teacherId)}`,
      );
      setTeacherTimetable(data);
    } catch (err) {
      setTeacherTimetable({ slots: [] });
      setError(err instanceof Error ? err.message : 'Failed to load teacher timetable');
    } finally {
      setLoadingTimetable(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (activeTab === 'class' && selectedClass) {
      void loadClassTimetable(selectedClass);
    }
  }, [activeTab, selectedClass, loadClassTimetable]);

  useEffect(() => {
    if (activeTab === 'teacher' && selectedTeacherId) {
      void loadTeacherTimetable(selectedTeacherId);
    }
  }, [activeTab, selectedTeacherId, loadTeacherTimetable]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleAutoGenerate() {
    setToast('AI timetable generation coming soon');
  }

  const activeSlots =
    activeTab === 'class'
      ? (classTimetable?.slots ?? [])
      : (teacherTimetable?.slots ?? []);

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Timetable</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Class and teacher schedules with conflict detection
            </p>
          </div>
          <Button variant="ai" onClick={handleAutoGenerate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-generate
          </Button>
        </header>

        {conflicts.length > 0 && (
          <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3">
            <div className="flex items-start gap-2 text-error">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Scheduling conflicts detected</p>
                <ul className="mt-1 list-inside list-disc text-body-md">
                  {conflicts.map((conflict) => (
                    <li key={conflict}>{conflict}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadMeta()}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        <TabGroup
          tabs={[
            { id: 'class', label: 'Class Timetable' },
            { id: 'teacher', label: 'Teacher Timetable' },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TimetableTab)}
        />

        {activeTab === 'class' && (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="classSelect" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Grade / Section
              </label>
              <select
                id="classSelect"
                disabled={loadingMeta}
                value={selectedClassKey}
                onChange={(e) => setSelectedClassKey(e.target.value)}
                className="h-11 min-w-[200px] rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              >
                {classSections.map((option) => (
                  <option
                    key={`${option.classId}:${option.sectionId}`}
                    value={`${option.classId}:${option.sectionId}`}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'teacher' && (
          <div>
            <label htmlFor="teacherSelect" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              Teacher
            </label>
            <select
              id="teacherSelect"
              disabled={loadingMeta || teachers.length === 0}
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="h-11 min-w-[240px] rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              {teachers.length === 0 && <option value="">No teachers available</option>}
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <TimetableGrid
          slots={activeSlots}
          loading={loadingMeta || loadingTimetable}
          emptyMessage={
            activeTab === 'class'
              ? 'No slots scheduled for this class yet'
              : 'No slots scheduled for this teacher yet'
          }
        />

        <section className="bento-card">
          <h2 className="mb-4 text-body-md font-semibold text-on-surface">Period Settings</h2>
          <p className="mb-4 text-body-md text-on-surface-variant">
            Read-only schedule configuration for this academic year
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERIOD_SETTINGS.map((setting, index) => {
              const icons = [Clock, Coffee, UtensilsCrossed, Coffee];
              const Icon = icons[index] ?? Clock;
              return (
                <div
                  key={setting.label}
                  className="rounded-lg border border-gray-200/60 bg-surface-faint/40 px-4 py-3"
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                    <Icon className="h-4 w-4 text-secondary" />
                  </div>
                  <p className="text-label-md font-medium text-on-surface-variant">{setting.label}</p>
                  <p className="mt-0.5 text-body-md font-semibold text-on-surface">{setting.value}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 rounded-lg border border-ai-violet/30 bg-white px-4 py-3 shadow-lg">
          <Sparkles className="h-4 w-4 text-ai-violet" />
          <span className="text-body-md text-on-surface">{toast}</span>
        </div>
      )}
    </SchoolShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@eduai365/ui';
import { Sparkles } from 'lucide-react';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { AttendanceInlineGrid } from '@/components/dashboard/attendance-inline-grid';
import { ExamDutySchedule } from '@/components/dashboard/exam-duty-schedule';
import { GradebookPreview } from '@/components/dashboard/gradebook-preview';
import { HomeworkList } from '@/components/dashboard/homework-list';
import { MyClassesGrid } from '@/components/dashboard/my-classes-grid';
import { ParentMessagesSnippet } from '@/components/dashboard/parent-messages';
import { SyllabusTrackerPanel } from '@/components/dashboard/syllabus-tracker';
import { TeacherKpiRow } from '@/components/dashboard/teacher-kpi-row';
import { TodayTimetable } from '@/components/dashboard/today-timetable';
import { LessonPlanModal } from '@/components/dashboard/lesson-plan-modal';
import { TeacherShell } from '@/components/teacher-shell';
import { apiFetch } from '@/lib/api';
import type { TeacherDashboard } from '@/types/teacher';

export default function DashboardPage() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [dashboard, me] = await Promise.all([
          apiFetch<TeacherDashboard>('/teacher/dashboard'),
          apiFetch<AuthenticatedUser>('/auth/me'),
        ]);

        if (!cancelled) {
          setData({
            ...dashboard,
            classes: dashboard.classes ?? [],
            homework: dashboard.homework ?? [],
            timetableToday: dashboard.timetableToday ?? [],
            messages: dashboard.messages ?? [],
            examDuties: dashboard.examDuties ?? [],
            syllabus: dashboard.syllabus ?? [],
            gradebookPreview: dashboard.gradebookPreview ?? null,
          });
          setUser(me);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.firstName ?? 'Teacher';
  const lessonPlanDefaults = data?.classes?.[0]
    ? {
        subject: data.classes[0].subject,
        grade: `${data.classes[0].name}${data.classes[0].section ? `-${data.classes[0].section}` : ''}`,
      }
    : undefined;

  return (
    <TeacherShell>
      <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Teacher Dashboard</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Welcome back, {firstName}. Here is your classroom overview for today.
            </p>
          </div>
          <Button variant="ai" onClick={() => setShowLessonPlanModal(true)}>
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            AI Lesson Plan
          </Button>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading teacher dashboard…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {data && !loading && (
          <>
            {data.kpis && <TeacherKpiRow kpis={data.kpis} />}

            <section className="space-y-4">
              <h2 className="text-title-lg font-semibold text-on-surface">My Classes</h2>
              <MyClassesGrid classes={data.classes} />
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2 space-y-6">
                <AttendanceInlineGrid
                  classes={data.classes}
                  defaultClassId={data.classes?.[0]?.id}
                />
                <GradebookPreview gradebook={data.gradebookPreview} />
                <HomeworkList items={data.homework} compact />
              </div>
              <div className="space-y-6">
                <TodayTimetable slots={data.timetableToday} />
                <ParentMessagesSnippet messages={data.messages} />
                <ExamDutySchedule duties={data.examDuties} />
              </div>
            </div>

            <SyllabusTrackerPanel trackers={data.syllabus} />
          </>
        )}
      </div>

      <LessonPlanModal
        open={showLessonPlanModal}
        onClose={() => setShowLessonPlanModal(false)}
        defaults={lessonPlanDefaults}
      />
    </TeacherShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Badge, KpiBentoCard } from '@eduai365/ui';
import { BookOpen, CheckCircle2, TrendingUp, Trophy } from 'lucide-react';
import { StudentShell } from '@/components/student-shell';
import { apiFetch } from '@/lib/api';
import { formatPercent } from '@/lib/format';

interface RawCourse {
  subjectId?: string;
  id?: string;
  subjectName?: string;
  subject?: string;
  name?: string;
  code?: string;
  grade?: string | null;
  marksObtained?: number | null;
  maxMarks?: number | null;
  teacher?: string;
  gradePercent?: number;
}

interface Course {
  id: string;
  subject: string;
  code: string;
  grade: string;
  marksObtained: number;
  maxMarks: number;
  percent: number;
  teacher: string;
}

function gradeColor(grade: string): 'success' | 'warning' | 'error' | 'info' {
  if (!grade) return 'info';
  const g = grade.toUpperCase();
  if (g === 'A+' || g === 'A') return 'success';
  if (g === 'B+' || g === 'B') return 'info';
  if (g === 'C+' || g === 'C') return 'warning';
  return 'error';
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color =
    pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error';
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const raw = await apiFetch<RawCourse[]>('/student/courses');
        if (!cancelled) {
          const mapped: Course[] = (Array.isArray(raw) ? raw : []).map((c, i) => {
            const marks = typeof c.marksObtained === 'number' ? c.marksObtained : 0;
            const max = typeof c.maxMarks === 'number' && c.maxMarks > 0 ? c.maxMarks : 100;
            const pct = Math.round((marks / max) * 100);
            return {
              id: (c.subjectId ?? c.id ?? `course-${i}`),
              subject: (c.subjectName ?? c.subject ?? c.name ?? 'Unknown'),
              code: c.code ?? '—',
              grade: c.grade ?? '—',
              marksObtained: marks,
              maxMarks: max,
              percent: pct,
              teacher: c.teacher ?? '—',
            };
          });
          setCourses(mapped);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const avg = courses.length > 0
    ? Math.round(courses.reduce((s, c) => s + c.percent, 0) / courses.length)
    : 0;
  const passing = courses.filter((c) => c.percent >= 50).length;
  const topCourse = courses.sort((a, b) => b.percent - a.percent)[0];

  return (
    <StudentShell>
      <div className="space-y-8">
        <header>
          <h1 className="text-headline-lg font-bold text-on-surface">My Courses</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Your enrolled subjects, marks, and academic performance overview.
          </p>
        </header>

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading courses…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* KPI strip */}
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiBentoCard
                label="Avg. Score"
                value={`${avg}%`}
                icon={TrendingUp}
                trend={{ value: 'Across all subjects', direction: avg >= 60 ? 'up' : 'down' }}
              />
              <KpiBentoCard
                label="Subjects Enrolled"
                value={courses.length}
                icon={BookOpen}
              />
              <KpiBentoCard
                label="Passing"
                value={`${passing} / ${courses.length}`}
                icon={CheckCircle2}
                trend={{ value: '≥ 50% threshold', direction: passing === courses.length ? 'up' : 'neutral' }}
              />
            </div>

            {/* Top performer callout */}
            {topCourse && topCourse.percent > 0 && (
              <div className="flex items-center gap-4 rounded-xl border border-success/30 bg-success/5 px-5 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <Trophy className="h-5 w-5 text-success" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-title-lg font-semibold text-on-surface">
                    Top Subject: {topCourse.subject}
                  </p>
                  <p className="text-body-md text-on-surface-variant">
                    {topCourse.marksObtained} / {topCourse.maxMarks} marks · {formatPercent(topCourse.percent, 0)}
                    {topCourse.grade !== '—' ? ` · Grade ${topCourse.grade}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Subject cards */}
            {courses.length === 0 ? (
              <div className="bento-card py-16 text-center text-on-surface-variant">
                No courses found. Enrol in a class to see subjects here.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.id} className="bento-card-interactive space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-title-lg font-semibold text-on-surface">{course.subject}</p>
                        <p className="text-label-md text-on-surface-variant">{course.code}</p>
                      </div>
                      {course.grade !== '—' && (
                        <Badge variant={gradeColor(course.grade)}>Grade {course.grade}</Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-body-md">
                        <span className="text-on-surface-variant">Marks</span>
                        <span className="font-semibold text-on-surface">
                          {course.marksObtained} / {course.maxMarks}
                        </span>
                      </div>
                      <ProgressBar value={course.marksObtained} max={course.maxMarks} />
                      <p className="text-right text-label-md text-on-surface-variant">
                        {formatPercent(course.percent, 0)}
                      </p>
                    </div>

                    {course.teacher !== '—' && (
                      <p className="text-body-md text-on-surface-variant">
                        Teacher: <span className="font-medium text-on-surface">{course.teacher}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StudentShell>
  );
}

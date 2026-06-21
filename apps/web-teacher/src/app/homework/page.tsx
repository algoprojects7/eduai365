'use client';

import { useEffect, useState } from 'react';
import { Button } from '@eduai365/ui';
import { Plus } from 'lucide-react';
import { HomeworkList } from '@/components/dashboard/homework-list';
import { TeacherShell } from '@/components/teacher-shell';
import { apiFetch } from '@/lib/api';
import type { CreateHomeworkInput, HomeworkItem, TeacherClass } from '@/types/teacher';

export default function HomeworkPage() {
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateHomeworkInput>({
    title: '',
    classId: '',
    description: '',
    dueDate: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [homework, classList] = await Promise.all([
          apiFetch<HomeworkItem[]>('/teacher/homework'),
          apiFetch<TeacherClass[]>('/teacher/classes'),
        ]);
        if (!cancelled) {
          const safeHomework = homework ?? [];
          const safeClassList = classList ?? [];
          setItems(safeHomework);
          setClasses(safeClassList);
          const firstClass = safeClassList[0];
          if (firstClass) {
            setForm((prev) => ({ ...prev, classId: firstClass.id }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load homework');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiFetch<HomeworkItem>('/teacher/homework', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setItems((prev) => [created, ...prev]);
      setShowForm(false);
      setForm({ title: '', classId: classes[0]?.id ?? '', description: '', dueDate: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create homework');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TeacherShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Homework</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Create assignments and track submission progress.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            New Homework
          </Button>
        </header>

        {showForm && (
          <form onSubmit={handleCreate} className="bento-card grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="title" className="mb-1 block text-label-md text-on-surface-variant">
                Title
              </label>
              <input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label htmlFor="classId" className="mb-1 block text-label-md text-on-surface-variant">
                Class
              </label>
              <select
                id="classId"
                required
                value={form.classId}
                onChange={(e) => setForm((prev) => ({ ...prev, classId: e.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md outline-none focus:border-secondary"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section} — {cls.subject}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="mb-1 block text-label-md text-on-surface-variant">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-1 block text-label-md text-on-surface-variant">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 py-2 text-body-md outline-none focus:border-secondary"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Homework'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading && (
          <div className="bento-card py-16 text-center text-on-surface-variant">Loading homework…</div>
        )}
        {error && !loading && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}
        {!loading && <HomeworkList items={items} />}
      </div>
    </TeacherShell>
  );
}

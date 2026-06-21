'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import { Button } from '@eduai365/ui';
import { ArrowLeft } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type { CreateStudentInput, StudentRow } from '@/types/school';

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateStudentInput>({
    firstName: '',
    lastName: '',
    admissionNo: '',
    class: '',
    section: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof CreateStudentInput>(key: K, value: CreateStudentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch<StudentRow>('/school/students', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push('/students');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SchoolShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/students"
            className="mb-4 inline-flex items-center text-body-md text-secondary hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Students
          </Link>
          <h1 className="text-headline-lg font-bold text-on-surface">Add Student</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Enroll a new student into the school registry
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bento-card space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                First Name
              </label>
              <input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Last Name
              </label>
              <input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admissionNo" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              Admission No
            </label>
            <input
              id="admissionNo"
              required
              value={form.admissionNo}
              onChange={(e) => updateField('admissionNo', e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="class" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Class
              </label>
              <input
                id="class"
                required
                placeholder="e.g. Grade 10"
                value={form.class}
                onChange={(e) => updateField('class', e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label htmlFor="section" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                Section
              </label>
              <input
                id="section"
                required
                placeholder="e.g. A"
                value={form.section}
                onChange={(e) => updateField('section', e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Student'}
            </Button>
            <Link href="/students">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </SchoolShell>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DataTable,
  KpiBentoCard,
} from '@eduai365/ui';
import {
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Plus,
  RefreshCw,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AdmissionKanban } from '@/components/admissions/admission-kanban';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import type {
  AdmissionApplication,
  AdmissionStage,
  AdmissionStats,
  CreateAdmissionInput,
  SeatAvailability,
} from '@/types/academics';

const EMPTY_FORM: CreateAdmissionInput = {
  applicantName: '',
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  targetClass: '',
  previousSchool: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  parentWhatsapp: '',
};

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAdmissionInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [appsRes, statsData, seatsData] = await Promise.all([
        apiFetch<{ applications: AdmissionApplication[] }>('/academics/admissions'),
        apiFetch<AdmissionStats>('/academics/admissions/stats'),
        apiFetch<SeatAvailability[]>('/academics/admissions/seats'),
      ]);

      setApplications(appsRes?.applications || []);
      setStats(statsData);
      setSeats(seatsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admissions data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleMove(id: string, stage: AdmissionStage) {
    setMovingId(id);
    try {
      const updated = await apiFetch<AdmissionApplication>(
        `/academics/admissions/${id}/stage`,
        {
          method: 'PATCH',
          body: JSON.stringify({ stage }),
        },
      );

      setApplications((prev) => prev.map((app) => (app.id === id ? updated : app)));

      const statsData = await apiFetch<AdmissionStats>('/academics/admissions/stats');
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move application');
    } finally {
      setMovingId(null);
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const created = await apiFetch<AdmissionApplication>('/academics/admissions', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setApplications((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);

      const [statsData, seatsData] = await Promise.all([
        apiFetch<AdmissionStats>('/academics/admissions/stats'),
        apiFetch<SeatAvailability[]>('/academics/admissions/seats'),
      ]);
      setStats(statsData);
      setSeats(seatsData);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof CreateAdmissionInput>(key: K, value: CreateAdmissionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Admissions</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Kanban pipeline, AI scoring, and seat availability
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard
            label="Applications"
            value={loading ? '…' : (stats?.applications ?? applications.length)}
            icon={ClipboardList}
          />
          <KpiBentoCard
            label="Shortlisted"
            value={loading ? '…' : (stats?.shortlisted ?? '—')}
            icon={Users}
          />
          <KpiBentoCard
            label="Enrolled"
            value={loading ? '…' : (stats?.enrolled ?? '—')}
            icon={UserCheck}
          />
          <KpiBentoCard
            label="Seats Remaining"
            value={loading ? '…' : (stats?.seatsRemaining ?? '—')}
            icon={GraduationCap}
          />
        </div>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadData()}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="bento-card py-16 text-center text-on-surface-variant">
            Loading admissions pipeline…
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-body-md font-semibold text-on-surface">Pipeline</h2>
              <AdmissionKanban
                applications={applications}
                movingId={movingId}
                onMove={handleMove}
              />
            </section>

            <section>
              <h2 className="mb-3 text-body-md font-semibold text-on-surface">
                Class-wise Seat Availability
              </h2>
              <DataTable
                data={seats}
                keyExtractor={(row) => row.grade}
                emptyMessage="No seat data available"
                columns={[
                  {
                    key: 'grade',
                    header: 'Grade',
                    render: (row) => (
                      <span className="font-medium text-on-surface">{row.grade}</span>
                    ),
                  },
                  {
                    key: 'totalSeats',
                    header: 'Total Seats',
                    render: (row) => row.totalSeats,
                  },
                  {
                    key: 'filledSeats',
                    header: 'Filled',
                    render: (row) => row.filledSeats,
                  },
                  {
                    key: 'available',
                    header: 'Available',
                    render: (row) => (
                      <span className={row.available <= 5 ? 'font-semibold text-error' : ''}>
                        {row.available}
                      </span>
                    ),
                  },
                ]}
              />
            </section>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => !submitting && setShowForm(false)}
          />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-headline-sm font-bold text-on-surface">New Application</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Submit a new admission inquiry
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                disabled={submitting}
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Applicant Details */}
              <div className="rounded-lg bg-surface-faint/50 px-4 py-3">
                <p className="mb-3 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">Applicant Details</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="applicantName" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                      Applicant Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="applicantName"
                      required
                      value={form.applicantName}
                      onChange={(e) => updateField('applicantName', e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="gender" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                        Gender <span className="text-error">*</span>
                      </label>
                      <select
                        id="gender"
                        required
                        value={form.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dateOfBirth" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                        Date of Birth <span className="text-error">*</span>
                      </label>
                      <input
                        id="dateOfBirth"
                        type="date"
                        required
                        value={form.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                      Address for Communication <span className="text-error">*</span>
                    </label>
                    <textarea
                      id="address"
                      rows={2}
                      required
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="House / Building no., Street, City, State — PIN"
                      className="w-full rounded-lg border border-gray-300/30 bg-white px-4 py-2.5 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Parent / Guardian */}
              <div className="rounded-lg bg-surface-faint/50 px-4 py-3">
                <p className="mb-3 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">Parent / Guardian</p>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="parentName" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                        Parent Name <span className="text-error">*</span>
                      </label>
                      <input
                        id="parentName"
                        required
                        value={form.parentName}
                        onChange={(e) => updateField('parentName', e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="parentPhone" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                        Parent Phone <span className="text-error">*</span>
                      </label>
                      <input
                        id="parentPhone"
                        required
                        type="tel"
                        value={form.parentPhone}
                        onChange={(e) => updateField('parentPhone', e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="parentEmail" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                        Parent Email <span className="text-error">*</span>
                      </label>
                      <input
                        id="parentEmail"
                        required
                        type="email"
                        value={form.parentEmail}
                        onChange={(e) => updateField('parentEmail', e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="parentWhatsapp" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                          WhatsApp Number
                        </span>
                      </label>
                      <input
                        id="parentWhatsapp"
                        type="tel"
                        value={form.parentWhatsapp}
                        onChange={(e) => updateField('parentWhatsapp', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div className="rounded-lg bg-surface-faint/50 px-4 py-3">
                <p className="mb-3 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">Academic Details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="targetClass" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                      Target Class <span className="text-error">*</span>
                    </label>
                    <input
                      id="targetClass"
                      required
                      placeholder="e.g. Class 8 A"
                      value={form.targetClass}
                      onChange={(e) => updateField('targetClass', e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="previousSchool" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
                      Previous School
                    </label>
                    <input
                      id="previousSchool"
                      value={form.previousSchool}
                      onChange={(e) => updateField('previousSchool', e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-300/30 bg-white px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SchoolShell>
  );
}

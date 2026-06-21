'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  KpiBentoCard,
  TabGroup,
} from '@eduai365/ui';
import { Activity, HeartPulse, Plus, RefreshCw, Stethoscope } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatShortDate, parseDecimal, studentDisplayName } from '@/lib/operations';
import type {
  CreateInfirmaryVisitInput,
  HealthRecord,
  HealthTab,
  InfirmaryVisit,
} from '@/types/operations';
import { COMMON_AILMENTS, HEALTH_TAB_ITEMS } from '@/types/operations';

const EMPTY_VISIT: CreateInfirmaryVisitInput = {
  studentId: '',
  visitDate: new Date().toISOString().slice(0, 10),
  complaint: '',
  treatment: '',
  referred: false,
};

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState<HealthTab>('profiles');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [visits, setVisits] = useState<InfirmaryVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordList, visitList] = await Promise.all([
        apiFetch<HealthRecord[]>('/operations/health/records'),
        apiFetch<InfirmaryVisit[]>('/operations/health/infirmary'),
      ]);
      setRecords(recordList);
      setVisits(visitList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreateVisit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/operations/health/infirmary', {
        method: 'POST',
        body: JSON.stringify(visitForm),
      });
      setVisitForm(EMPTY_VISIT);
      setShowVisitForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log visit');
    } finally {
      setSubmitting(false);
    }
  }

  const referredCount = visits.filter((v) => v.referred).length;

  return (
    <SchoolShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Student Health & Wellness</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Health profiles, infirmary visits, vaccinations, and screening reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {activeTab === 'infirmary' && (
              <Button variant="primary" onClick={() => setShowVisitForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Visit
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiBentoCard
            label="Health Profiles"
            value={loading ? '…' : records.length}
            icon={HeartPulse}
          />
          <KpiBentoCard
            label="Infirmary Visits"
            value={loading ? '…' : visits.length}
            icon={Stethoscope}
          />
          <KpiBentoCard label="Referred Cases" value={loading ? '…' : referredCount} icon={Activity} />
          <KpiBentoCard
            label="With Allergies"
            value={loading ? '…' : records.filter((r) => r.allergies.length > 0).length}
            icon={HeartPulse}
          />
        </div>

        <TabGroup
          tabs={HEALTH_TAB_ITEMS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as HealthTab)}
        />

        {error && (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
        )}

        {activeTab === 'profiles' && (
          <DataTable
            columns={[
              {
                key: 'student',
                header: 'Student',
                render: (row) => studentDisplayName(row.student),
              },
              { key: 'admissionNo', header: 'Admission No.', render: (row) => row.student.admissionNo },
              {
                key: 'bloodGroup',
                header: 'Blood Group',
                render: (row) => row.bloodGroup ?? '—',
              },
              {
                key: 'allergies',
                header: 'Allergies',
                render: (row) =>
                  row.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.allergies.map((a) => (
                        <Badge key={a} variant="warning">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    'None'
                  ),
              },
              {
                key: 'bmi',
                header: 'BMI',
                render: (row) => (row.bmi != null ? parseDecimal(row.bmi).toFixed(1) : '—'),
              },
              {
                key: 'lastCheckup',
                header: 'Last Checkup',
                render: (row) => (row.lastCheckup ? formatShortDate(row.lastCheckup) : '—'),
              },
            ]}
            data={records}
            keyExtractor={(row) => row.id}
            emptyMessage={loading ? 'Loading profiles…' : 'No health records found'}
          />
        )}

        {activeTab === 'infirmary' && (
          <>
            {showVisitForm && (
              <form onSubmit={handleCreateVisit} className="bento-card grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-label-md text-on-surface-variant">
                    Student ID
                  </label>
                  <input
                    required
                    value={visitForm.studentId}
                    onChange={(e) => setVisitForm((f) => ({ ...f, studentId: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md"
                    placeholder="Student cuid"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-label-md text-on-surface-variant">
                    Visit Date
                  </label>
                  <input
                    required
                    type="date"
                    value={visitForm.visitDate}
                    onChange={(e) => setVisitForm((f) => ({ ...f, visitDate: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-label-md text-on-surface-variant">
                    Complaint
                  </label>
                  <input
                    required
                    value={visitForm.complaint}
                    onChange={(e) => setVisitForm((f) => ({ ...f, complaint: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-label-md text-on-surface-variant">
                    Treatment
                  </label>
                  <input
                    required
                    value={visitForm.treatment}
                    onChange={(e) => setVisitForm((f) => ({ ...f, treatment: e.target.value }))}
                    className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md"
                  />
                </div>
                <label className="flex items-center gap-2 text-body-md text-on-surface">
                  <input
                    type="checkbox"
                    checked={visitForm.referred}
                    onChange={(e) => setVisitForm((f) => ({ ...f, referred: e.target.checked }))}
                  />
                  Referred to hospital
                </label>
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save Visit'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowVisitForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <DataTable
              columns={[
                {
                  key: 'visitDate',
                  header: 'Date',
                  render: (row) => formatShortDate(row.visitDate),
                },
                {
                  key: 'student',
                  header: 'Student',
                  render: (row) => studentDisplayName(row.student),
                },
                { key: 'complaint', header: 'Complaint' },
                { key: 'treatment', header: 'Treatment' },
                {
                  key: 'referred',
                  header: 'Referred',
                  render: (row) => (
                    <Badge variant={row.referred ? 'warning' : 'success'}>
                      {row.referred ? 'Yes' : 'No'}
                    </Badge>
                  ),
                },
              ]}
              data={visits}
              keyExtractor={(row) => row.id}
              emptyMessage={loading ? 'Loading visits…' : 'No infirmary visits logged'}
            />
          </>
        )}

        {activeTab === 'vaccinations' && (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="bento-card">
                <h3 className="font-semibold text-on-surface">{studentDisplayName(record.student)}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(record.vaccinations as Array<{ name?: string; date?: string }>).map((vax, i) => (
                    <span
                      key={`${record.id}-${i}`}
                      className="rounded-lg bg-surface-faint px-3 py-2 text-body-md text-on-surface"
                    >
                      {vax.name ?? 'Vaccine'} · {vax.date ? formatShortDate(vax.date) : 'Scheduled'}
                    </span>
                  ))}
                  {record.vaccinations.length === 0 && (
                    <p className="text-body-md text-on-surface-variant">No vaccinations recorded</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bento-card">
            <h3 className="mb-4 text-title-lg font-semibold text-on-surface">
              Most Common Ailments
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COMMON_AILMENTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce9ff" />
                  <XAxis dataKey="ailment" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0052d2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </SchoolShell>
  );
}

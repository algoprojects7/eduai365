'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import { Button } from '@eduai365/ui';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { formatInr, getInitials } from '@/lib/format';
import { calculateNetSalary } from '@/lib/hr';
import type { EnrollEmployeeInput, EnrollEmployeeResult, EmploymentType, StaffRole } from '@/types/hr';
import { EMPLOYMENT_TYPE_LABELS, STAFF_ROLES } from '@/types/hr';

const STEPS = ['Personal', 'Professional', 'Salary', 'Access'] as const;

const EMPTY_FORM: EnrollEmployeeInput = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'TEACHER',
  phone: '',
  department: '',
  designation: '',
  joinDate: new Date().toISOString().slice(0, 10),
  bloodGroup: 'O+',
  dateOfBirth: '',
  aadhaar: '',
  pan: '',
  qualifications: [],
  payGrade: 'Grade-III',
  basicSalary: 45000,
  hra: 18000,
  da: 9000,
  pfPercent: 12,
  tdsPercent: 5,
  employmentType: 'TEACHING',
};

const inputClassName =
  'h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20';

export default function EnrollEmployeePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EnrollEmployeeInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrollEmployeeResult | null>(null);

  const salary = useMemo(
    () =>
      calculateNetSalary(form.basicSalary, form.hra, form.da, form.pfPercent, form.tdsPercent),
    [form.basicSalary, form.hra, form.da, form.pfPercent, form.tdsPercent],
  );

  function updateField<K extends keyof EnrollEmployeeInput>(key: K, value: EnrollEmployeeInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function nextStep() {
    setError(null);
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function prevStep() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      const payload: EnrollEmployeeInput = {
        ...form,
        phone: form.phone || undefined,
        aadhaar: form.aadhaar || undefined,
        pan: form.pan || undefined,
      };
      const data = await apiFetch<EnrollEmployeeResult>('/hr/employees/enroll', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll employee');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <SchoolShell>
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <div className="bento-card space-y-4 p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" strokeWidth={1.5} />
            <h1 className="text-headline-md font-bold text-on-surface">Employee Enrolled</h1>
            <p className="text-body-md text-on-surface-variant">
              {result.employee.user.firstName} {result.employee.user.lastName} has been added as{' '}
              {result.employee.employeeId}.
            </p>
            <div className="rounded-lg bg-surface-faint px-4 py-3 text-left">
              <p className="text-label-md uppercase text-on-surface-variant">Temporary Password</p>
              <p className="mt-1 font-mono text-title-md text-on-surface">{result.temporaryPassword}</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="primary" onClick={() => router.push('/hr/employees')}>
                Back to Directory
              </Button>
              <Button variant="ghost" onClick={() => { setResult(null); setForm(EMPTY_FORM); setStep(0); }}>
                Enroll Another
              </Button>
            </div>
          </div>
        </div>
      </SchoolShell>
    );
  }

  return (
    <SchoolShell>
      <div className="space-y-6">
        <div>
          <Link
            href="/hr/employees"
            className="mb-4 inline-flex items-center text-body-md text-secondary hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Employees
          </Link>
          <h1 className="text-headline-lg font-bold text-on-surface">Employee Enrollment</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            4-step wizard to onboard new staff with salary preview and portal access
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-label-md text-on-surface-variant">
            <span>
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </span>
            <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-faint">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="bento-card space-y-5">
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First Name" id="firstName">
                    <input
                      id="firstName"
                      required
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Last Name" id="lastName">
                    <input
                      id="lastName"
                      required
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                </div>
                <Field label="Email" id="email">
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Phone" id="phone">
                  <input
                    id="phone"
                    value={form.phone ?? ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date of Birth" id="dateOfBirth">
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth ?? ''}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Blood Group" id="bloodGroup">
                    <input
                      id="bloodGroup"
                      required
                      value={form.bloodGroup}
                      onChange={(e) => updateField('bloodGroup', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Aadhaar (optional)" id="aadhaar">
                    <input
                      id="aadhaar"
                      value={form.aadhaar ?? ''}
                      onChange={(e) => updateField('aadhaar', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="PAN (optional)" id="pan">
                    <input
                      id="pan"
                      value={form.pan ?? ''}
                      onChange={(e) => updateField('pan', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Department" id="department">
                    <input
                      id="department"
                      required
                      value={form.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Designation" id="designation">
                    <input
                      id="designation"
                      required
                      value={form.designation}
                      onChange={(e) => updateField('designation', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Join Date" id="joinDate">
                    <input
                      id="joinDate"
                      type="date"
                      required
                      value={form.joinDate}
                      onChange={(e) => updateField('joinDate', e.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Employment Type" id="employmentType">
                    <select
                      id="employmentType"
                      value={form.employmentType}
                      onChange={(e) => updateField('employmentType', e.target.value as EmploymentType)}
                      className={inputClassName}
                    >
                      {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Qualifications" id="qualifications">
                  <textarea
                    id="qualifications"
                    rows={3}
                    placeholder="e.g. B.Ed, Delhi University"
                    onChange={(e) =>
                      updateField(
                        'qualifications',
                        e.target.value
                          ? [{ degree: e.target.value, institution: '' }]
                          : [],
                      )
                    }
                    className="w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Pay Grade" id="payGrade">
                  <input
                    id="payGrade"
                    required
                    value={form.payGrade}
                    onChange={(e) => updateField('payGrade', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Basic Salary" id="basicSalary">
                    <input
                      id="basicSalary"
                      type="number"
                      min={0}
                      value={form.basicSalary}
                      onChange={(e) => updateField('basicSalary', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="HRA" id="hra">
                    <input
                      id="hra"
                      type="number"
                      min={0}
                      value={form.hra}
                      onChange={(e) => updateField('hra', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="DA" id="da">
                    <input
                      id="da"
                      type="number"
                      min={0}
                      value={form.da}
                      onChange={(e) => updateField('da', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="PF %" id="pfPercent">
                    <input
                      id="pfPercent"
                      type="number"
                      min={0}
                      value={form.pfPercent}
                      onChange={(e) => updateField('pfPercent', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="TDS %" id="tdsPercent">
                    <input
                      id="tdsPercent"
                      type="number"
                      min={0}
                      value={form.tdsPercent}
                      onChange={(e) => updateField('tdsPercent', Number(e.target.value))}
                      className={inputClassName}
                    />
                  </Field>
                </div>
                <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4">
                  <p className="text-label-md uppercase text-on-surface-variant">Live Net Preview</p>
                  <p className="mt-2 text-headline-md font-bold text-secondary">
                    {formatInr(salary.net)}
                  </p>
                  <div className="mt-3 grid gap-2 text-body-md text-on-surface-variant sm:grid-cols-2">
                    <span>Gross: {formatInr(salary.gross)}</span>
                    <span>PF: {formatInr(salary.pf)}</span>
                    <span>TDS: {formatInr(salary.tds)}</span>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Portal Role" id="role">
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) => updateField('role', e.target.value as StaffRole)}
                    className={inputClassName}
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="rounded-lg bg-surface-faint px-4 py-3 text-body-md text-on-surface-variant">
                  <p className="font-medium text-on-surface">Access & Credentials</p>
                  <p className="mt-2">
                    A portal account will be created with the email above. A temporary password will
                    be generated on submission — share it securely with the employee.
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={prevStep}>
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" variant="primary" onClick={nextStep}>
                  Continue
                </Button>
              ) : (
                <Button type="button" variant="primary" disabled={loading} onClick={() => void handleSubmit()}>
                  {loading ? 'Enrolling…' : 'Complete Enrollment'}
                </Button>
              )}
            </div>
          </div>

          <aside className="bento-card h-fit space-y-4">
            <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
              Live Preview
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-lg font-semibold text-secondary">
                {getInitials(form.firstName, form.lastName)}
              </div>
              <div>
                <p className="text-title-md font-semibold text-on-surface">
                  {form.firstName || 'First'} {form.lastName || 'Last'}
                </p>
                <p className="text-body-md text-on-surface-variant">
                  {form.designation || 'Designation'} · {form.department || 'Department'}
                </p>
              </div>
            </div>
            <dl className="space-y-2 text-body-md">
              <PreviewRow label="Email" value={form.email || '—'} />
              <PreviewRow label="Type" value={EMPLOYMENT_TYPE_LABELS[form.employmentType]} />
              <PreviewRow label="Role" value={form.role.replace(/_/g, ' ')} />
              <PreviewRow label="Pay Grade" value={form.payGrade} />
              <PreviewRow label="Net Salary" value={formatInr(salary.net)} highlight />
            </dl>
          </aside>
        </div>
      </div>
    </SchoolShell>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}

function PreviewRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={highlight ? 'font-semibold text-secondary' : 'text-on-surface'}>{value}</dd>
    </div>
  );
}

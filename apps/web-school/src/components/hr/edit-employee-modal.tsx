'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@eduai365/ui';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatInr } from '@/lib/format';
import { calculateNetSalary } from '@/lib/hr';
import type { EmployeeProfile, UpdateEmployeeInput, EmploymentType } from '@/types/hr';
import { EMPLOYMENT_TYPE_LABELS } from '@/types/hr';

interface EditEmployeeModalProps {
  open: boolean;
  employee: EmployeeProfile;
  onClose: () => void;
  onSuccess: () => void;
}

const TABS = ['Personal', 'Professional', 'Salary & Deductions'] as const;

export function EditEmployeeModal({ open, employee, onClose, onSuccess }: EditEmployeeModalProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [form, setForm] = useState<UpdateEmployeeInput>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with existing values
  useEffect(() => {
    if (open && employee) {
      setForm({
        firstName: employee.user.firstName,
        lastName: employee.user.lastName,
        phone: employee.user.phone ?? '',
        department: employee.department,
        designation: employee.designation,
        joinDate: employee.joinDate ? employee.joinDate.slice(0, 10) : '',
        bloodGroup: employee.bloodGroup,
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : '',
        aadhaar: employee.aadhaar ?? '',
        pan: employee.pan ?? '',
        qualifications: employee.qualifications,
        payGrade: employee.payGrade,
        basicSalary: Number(employee.basicSalary),
        hra: Number(employee.hra),
        da: Number(employee.da),
        pfPercent: Number(employee.pfPercent),
        tdsPercent: Number(employee.tdsPercent),
        employmentType: employee.employmentType,
      });
      setActiveTab(0);
      setError(null);
    }
  }, [open, employee]);

  const salary = useMemo(() => {
    const basic = Number(form.basicSalary ?? 0);
    const hra = Number(form.hra ?? 0);
    const da = Number(form.da ?? 0);
    const pf = Number(form.pfPercent ?? 0);
    const tds = Number(form.tdsPercent ?? 0);
    return calculateNetSalary(basic, hra, da, pf, tds);
  }, [form.basicSalary, form.hra, form.da, form.pfPercent, form.tdsPercent]);

  if (!open) return null;

  function updateField<K extends keyof UpdateEmployeeInput>(key: K, value: UpdateEmployeeInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiFetch(`/hr/employees/${employee.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          aadhaar: form.aadhaar || undefined,
          pan: form.pan || undefined,
        }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee profile');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName =
    'h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint px-3 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-on-surface';

  const tabClass = (idx: number) =>
    `flex-1 pb-3 text-center border-b-2 text-label-md font-semibold transition-all ${
      activeTab === idx
        ? 'border-secondary text-secondary'
        : 'border-transparent text-on-surface-variant hover:text-on-surface'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-gray-300/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-surface-faint shrink-0">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Edit Employee Profile</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Updating records for {employee.user.firstName} {employee.user.lastName} ({employee.employeeId})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition hover:bg-surface-faint hover:text-on-surface"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-surface-faint px-6 pt-3 shrink-0">
          {TABS.map((tabName, idx) => (
            <button
              key={tabName}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={tabClass(idx)}
            >
              {tabName}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => void handleSubmit(e)} className="flex-grow overflow-y-auto p-6 space-y-5">
          {activeTab === 0 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name" id="firstName">
                  <input
                    id="firstName"
                    required
                    value={form.firstName ?? ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Last Name" id="lastName">
                  <input
                    id="lastName"
                    required
                    value={form.lastName ?? ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
              </div>
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
                    value={form.bloodGroup ?? ''}
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
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Department" id="department">
                  <input
                    id="department"
                    required
                    value={form.department ?? ''}
                    onChange={(e) => updateField('department', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Designation" id="designation">
                  <input
                    id="designation"
                    required
                    value={form.designation ?? ''}
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
                    value={form.joinDate ?? ''}
                    onChange={(e) => updateField('joinDate', e.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Employment Type" id="employmentType">
                  <select
                    id="employmentType"
                    value={form.employmentType ?? 'TEACHING'}
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
                  value={
                    Array.isArray(form.qualifications) && form.qualifications[0]
                      ? (form.qualifications[0] as { degree?: string }).degree ?? ''
                      : ''
                  }
                  placeholder="e.g. B.Ed, Delhi University"
                  onChange={(e) =>
                    updateField(
                      'qualifications',
                      e.target.value
                        ? [{ degree: e.target.value, institution: '' }]
                        : [],
                    )
                  }
                  className="w-full rounded-lg border border-gray-300/30 bg-surface-faint px-4 py-3 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </Field>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <Field label="Pay Grade" id="payGrade">
                <input
                  id="payGrade"
                  required
                  value={form.payGrade ?? ''}
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
                    value={form.basicSalary ?? 0}
                    onChange={(e) => updateField('basicSalary', Number(e.target.value))}
                    className={inputClassName}
                  />
                </Field>
                <Field label="HRA" id="hra">
                  <input
                    id="hra"
                    type="number"
                    min={0}
                    value={form.hra ?? 0}
                    onChange={(e) => updateField('hra', Number(e.target.value))}
                    className={inputClassName}
                  />
                </Field>
                <Field label="DA" id="da">
                  <input
                    id="da"
                    type="number"
                    min={0}
                    value={form.da ?? 0}
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
                    value={form.pfPercent ?? 0}
                    onChange={(e) => updateField('pfPercent', Number(e.target.value))}
                    className={inputClassName}
                  />
                </Field>
                <Field label="TDS %" id="tdsPercent">
                  <input
                    id="tdsPercent"
                    type="number"
                    min={0}
                    value={form.tdsPercent ?? 0}
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
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-faint shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving changes…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
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

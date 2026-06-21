'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParentShell } from '@/components/parent-shell';
import { apiFetch } from '@/lib/api';
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Hash,
  User,
  Heart,
  Loader2,
} from 'lucide-react';

type SearchMode = 'admissionNumber' | 'fullName';

const RELATION_OPTIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Grandparent', label: 'Grandparent' },
  { value: 'Uncle/Aunt', label: 'Uncle / Aunt' },
  { value: 'Other', label: 'Other' },
];

interface AddChildResponse {
  message: string;
  studentId: string;
  relation: string;
}

export default function AddChildPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>('admissionNumber');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relation, setRelation] = useState('Father');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<AddChildResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const body: Record<string, string> = { relation };
      if (mode === 'admissionNumber') {
        if (!admissionNumber.trim()) {
          setError('Please enter an admission number.');
          setLoading(false);
          return;
        }
        body.admissionNumber = admissionNumber.trim();
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          setError('Please enter both first name and last name.');
          setLoading(false);
          return;
        }
        body.firstName = firstName.trim();
        body.lastName = lastName.trim();
      }

      const res = await apiFetch<AddChildResponse>('/parent/children/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link child. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ParentShell>
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Page header */}
        <header>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h1 className="text-headline-lg font-bold text-on-surface">Add Child</h1>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Link a student to your guardian account by their admission number or full name.
            Once linked, their academics, fees, and activities will appear on your dashboard.
          </p>
        </header>

        {/* Success state */}
        {success && (
          <div className="bento-card border border-success/30 bg-success/5 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-on-surface text-body-lg">Child linked successfully!</p>
                <p className="text-body-md text-on-surface-variant mt-0.5">{success.message}</p>
                <p className="text-label-md text-on-surface-variant mt-1">
                  Relation: <span className="font-semibold text-on-surface">{success.relation}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-surface-container-high">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-colors"
              >
                Go to Dashboard <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setSuccess(null);
                  setAdmissionNumber('');
                  setFirstName('');
                  setLastName('');
                  setRelation('Father');
                }}
                className="rounded-lg border border-surface-container-high bg-surface px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Add Another Child
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {/* Search mode toggle */}
            <div className="bento-card space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h2 className="text-title-md font-semibold text-on-surface">Search Method</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('admissionNumber')}
                  className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    mode === 'admissionNumber'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-surface-container-high bg-surface text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  <Hash className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Admission Number</p>
                    <p className="text-xs opacity-70 mt-0.5">Use school roll / reg. ID</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('fullName')}
                  className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    mode === 'fullName'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-surface-container-high bg-surface text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  <User className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Full Name</p>
                    <p className="text-xs opacity-70 mt-0.5">First + last name</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Student details */}
            <div className="bento-card space-y-5">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-title-md font-semibold text-on-surface">Student Details</h2>
              </div>

              {mode === 'admissionNumber' ? (
                <div className="space-y-1.5">
                  <label htmlFor="admissionNumber" className="text-label-md font-medium text-on-surface-variant uppercase tracking-wider">
                    Admission / Roll Number
                  </label>
                  <input
                    id="admissionNumber"
                    type="text"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    placeholder="e.g. ADM-2024-001"
                    className="w-full rounded-lg border border-surface-container-high bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    autoComplete="off"
                    required
                  />
                  <p className="text-xs text-on-surface-variant">
                    Enter the exact admission number as it appears on the school card.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="firstName" className="text-label-md font-medium text-on-surface-variant uppercase tracking-wider">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Aisha"
                      className="w-full rounded-lg border border-surface-container-high bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="text-label-md font-medium text-on-surface-variant uppercase tracking-wider">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Khan"
                      className="w-full rounded-lg border border-surface-container-high bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Relation */}
            <div className="bento-card space-y-5">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h2 className="text-title-md font-semibold text-on-surface">Your Relation to Child</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {RELATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRelation(opt.value)}
                    className={`rounded-lg border-2 py-2.5 text-sm font-semibold transition-all ${
                      relation === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-surface-container-high bg-surface text-on-surface-variant hover:border-primary/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching &amp; Linking…
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Link Child to My Account
                </>
              )}
            </button>
          </form>
        )}

        {/* Help note */}
        <div className="rounded-xl border border-surface-container-high bg-surface-container-low/60 px-4 py-3 text-body-sm text-on-surface-variant">
          <strong className="text-on-surface">Not finding your child?</strong> Contact the school admin to verify
          that the student record is active and matches the details on your child&apos;s school card.
        </div>
      </div>
    </ParentShell>
  );
}

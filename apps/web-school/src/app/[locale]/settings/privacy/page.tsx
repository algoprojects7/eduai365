'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@eduai365/ui';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { SchoolShell } from '@/components/school-shell';
import { apiFetch } from '@/lib/api';
import { clearTokens } from '@/lib/auth';
import {
  CONSENT_LABELS,
  type AccountDeletionResult,
  type RecordConsentInput,
  type UserConsentStatus,
  type UserDataExport,
} from '@/types/compliance';

type ConsentKey = keyof Pick<
  UserConsentStatus,
  'dataProcessing' | 'marketing' | 'analytics' | 'communications' | 'thirdPartySharing'
>;

const CONSENT_KEYS: ConsentKey[] = [
  'dataProcessing',
  'marketing',
  'analytics',
  'communications',
  'thirdPartySharing',
];

export default function PrivacySettingsPage() {
  const [consent, setConsent] = useState<UserConsentStatus | null>(null);
  const [form, setForm] = useState<RecordConsentInput>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletionResult, setDeletionResult] = useState<AccountDeletionResult | null>(null);

  const loadConsent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<UserConsentStatus>('/compliance/consent');
      setConsent(data);
      setForm({
        dataProcessing: data.dataProcessing,
        marketing: data.marketing,
        analytics: data.analytics,
        communications: data.communications,
        thirdPartySharing: data.thirdPartySharing,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consent preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConsent();
  }, [loadConsent]);

  function updateConsentField(key: ConsentKey, value: boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  }

  async function handleSaveConsent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await apiFetch<UserConsentStatus>('/compliance/consent', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setConsent(updated);
      setSuccess('Consent preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consent preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    setError(null);

    try {
      const data = await apiFetch<UserDataExport>('/compliance/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `eduai365-data-export-${data.userId}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setSuccess('Your data export has been downloaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiFetch<AccountDeletionResult>('/compliance/account', {
        method: 'DELETE',
      });
      setDeletionResult(result);
      clearTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request account deletion');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (deletionResult) {
    return (
      <SchoolShell>
        <div className="mx-auto max-w-2xl space-y-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-7 w-7 text-warning" />
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">Deletion request submitted</h1>
          <p className="text-body-md text-on-surface-variant">
            Your account has been scheduled for deletion. Our team will complete the process within
            30 days as required under DPDPA/GDPR. Requested at{' '}
            {new Date(deletionResult.requestedAt).toLocaleString()}.
          </p>
          <Link href="/login">
            <Button variant="primary">Return to login</Button>
          </Link>
        </div>
      </SchoolShell>
    );
  }

  return (
    <SchoolShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <Link
            href="/settings"
            className="inline-flex items-center text-body-md text-secondary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Privacy &amp; Data</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Manage consent preferences, export your data, or request account deletion (DPDPA/GDPR)
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">{error}</div>
        )}

        {success && (
          <div className="rounded-lg bg-success/10 px-4 py-3 text-body-md text-success">{success}</div>
        )}

        <section className="bento-card space-y-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-secondary" />
            <div>
              <h2 className="text-title-md font-semibold text-on-surface">Consent preferences</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Control how your personal data is used across eduAI365.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading consent settings…</p>
          ) : (
            <form onSubmit={handleSaveConsent} className="space-y-4">
              {CONSENT_KEYS.map((key) => {
                const meta = CONSENT_LABELS[key];
                const checked = form[key] ?? false;
                const timestampKey = `${key}At` as keyof UserConsentStatus;
                const timestamp = consent?.[timestampKey];

                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-300/20 bg-surface-faint/50 p-4"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => updateConsentField(key, e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-body-md font-medium text-on-surface">
                        {meta.label}
                        {meta.required && (
                          <span className="rounded bg-secondary/10 px-2 py-0.5 text-label-md text-secondary">
                            Required for service
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-body-md text-on-surface-variant">
                        {meta.description}
                      </span>
                      {typeof timestamp === 'string' && (
                        <span className="mt-1 block text-label-md text-on-surface-variant">
                          Last updated {new Date(timestamp).toLocaleString()}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}

              <Button type="submit" variant="primary" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving…' : 'Save consent preferences'}
              </Button>
            </form>
          )}
        </section>

        <section className="bento-card space-y-4">
          <div>
            <h2 className="text-title-md font-semibold text-on-surface">Export your data</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Download a JSON copy of your profile, consent records, devices, login history, and
              notifications.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleExportData()}
            disabled={exporting || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Preparing export…' : 'Download my data'}
          </Button>
        </section>

        <section className="bento-card space-y-4 border-error/20">
          <div className="flex items-start gap-3">
            <Trash2 className="mt-0.5 h-5 w-5 text-error" />
            <div>
              <h2 className="text-title-md font-semibold text-on-surface">Delete account</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Request permanent deletion of your account and personal data. This action deactivates
                your account immediately; full erasure is completed within 30 days.
              </p>
            </div>
          </div>

          {confirmDelete && (
            <div className="rounded-lg bg-error/10 px-4 py-3 text-body-md text-error">
              Are you sure? You will be signed out and unable to access eduai365 until deletion is
              complete.
            </div>
          )}

          <Button
            type="button"
            variant={confirmDelete ? 'primary' : 'ghost'}
            className={confirmDelete ? 'bg-error hover:bg-error/90' : 'text-error'}
            onClick={() => void handleDeleteAccount()}
            disabled={deleting || loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting
              ? 'Submitting…'
              : confirmDelete
                ? 'Confirm deletion request'
                : 'Request account deletion'}
          </Button>

          {confirmDelete && !deleting && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-body-md text-on-surface-variant hover:underline"
            >
              Cancel
            </button>
          )}
        </section>
      </div>
    </SchoolShell>
  );
}

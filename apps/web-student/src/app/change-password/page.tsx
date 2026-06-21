'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@eduai365/ui';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { StudentShell } from '@/components/student-shell';
import { apiFetch } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentShell>
      <div className="max-w-md mx-auto my-12 space-y-8">
        <header className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">Change Password</h1>
          <p className="text-body-md text-on-surface-variant">
            Update your account password securely.
          </p>
        </header>

        <section className="bento-card p-6 md:p-8 space-y-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h2 className="text-title-lg font-bold text-on-surface">Password Updated</h2>
                <p className="text-body-md text-on-surface-variant">
                  Your password was changed successfully. Redirecting you back to the dashboard...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-error/20 bg-error/5 p-4 flex items-start gap-2.5 text-label-lg text-error">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-label-sm font-semibold text-on-surface-variant">
                  Current Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300/50 bg-white px-3.5 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-sm font-semibold text-on-surface-variant">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300/50 bg-white px-3.5 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-sm font-semibold text-on-surface-variant">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300/50 bg-white px-3.5 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="show-passwords"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                />
                <label htmlFor="show-passwords" className="text-body-md text-on-surface-variant cursor-pointer select-none">
                  Show passwords
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </StudentShell>
  );
}

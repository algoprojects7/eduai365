'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@eduai365/ui';
import { Building2, GraduationCap, Lock, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiFetchPublic } from '@/lib/api';
import { isAuthenticated, setTenantSlug, setTokens } from '@/lib/auth';
import type { LoginResult } from '@/types/school';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const [email, setEmail] = useState('principal@greenfield.eduai365.ai');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [schoolSlug, setSchoolSlug] = useState('greenfield');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const school = params.get('school');
    const redirect = params.get('redirect');
    if (school) {
      setSchoolSlug(school);
      setTenantSlug(school.trim().toLowerCase());
    }

    if (isAuthenticated()) {
      router.replace(redirect && redirect.startsWith('/') ? redirect : '/dashboard');
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setTenantSlug(schoolSlug.trim().toLowerCase());

      const result = await apiFetchPublic<LoginResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          schoolSlug: schoolSlug.trim().toLowerCase(),
        }),
      });

      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      setTenantSlug(schoolSlug.trim().toLowerCase());
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      router.push(redirect && redirect.startsWith('/') ? redirect : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-ai-gradient text-white shadow-ai-glow">
            <GraduationCap className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <p className="mt-1 text-label-md uppercase tracking-wider text-on-surface-variant">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bento-card space-y-5">
          <div>
            <label htmlFor="schoolSlug" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              {t('schoolSlug')}
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="schoolSlug"
                type="text"
                required
                autoComplete="organization"
                value={schoolSlug}
                onChange={(e) => setSchoolSlug(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint pl-10 pr-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                placeholder={t('schoolSlugPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint pl-10 pr-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-label-md font-medium text-on-surface-variant">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300/30 bg-surface-faint pl-10 pr-4 text-body-md outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div className="flex items-center mt-2.5">
              <input
                id="showPassword"
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="showPassword" className="ml-2 text-body-sm text-on-surface-variant select-none cursor-pointer">
                {t('showPassword')}
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-body-md text-error">{error}</p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </Button>
        </form>
      </div>
    </div>
  );
}

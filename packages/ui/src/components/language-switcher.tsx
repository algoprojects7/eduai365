'use client';

import { Globe } from 'lucide-react';
import { cn } from '../lib/cn';

export interface LanguageOption {
  code: string;
  label: string;
}

export interface LanguageSwitcherProps {
  locale: string;
  locales: LanguageOption[];
  onLocaleChange: (locale: string) => void;
  className?: string;
  'aria-label'?: string;
}

export function LanguageSwitcher({
  locale,
  locales,
  onLocaleChange,
  className,
  'aria-label': ariaLabel = 'Select language',
}: LanguageSwitcherProps) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Globe
        className="pointer-events-none absolute left-3 h-4 w-4 text-on-surface-variant"
        strokeWidth={1.5}
        aria-hidden
      />
      <select
        value={locale}
        onChange={(event) => onLocaleChange(event.target.value)}
        aria-label={ariaLabel}
        className="h-9 appearance-none rounded-lg border border-surface-faint bg-white pl-9 pr-8 text-body-md text-on-surface outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary/20"
      >
        {locales.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2.5 text-on-surface-variant"
        aria-hidden
      >
        ▾
      </span>
    </div>
  );
}

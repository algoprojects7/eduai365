import { Search } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/cn';

export interface TopSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  actions?: React.ReactNode;
  /** Accessible label for the search field. */
  searchAriaLabel?: string;
}

export function TopSearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  className,
  actions,
  searchAriaLabel = 'Search portal',
}: TopSearchBarProps) {
  return (
    <div className={cn('flex items-center gap-4', className)} role="search">
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          strokeWidth={1.5}
        />
        <input
          type="search"
          aria-label={searchAriaLabel}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-11 w-full rounded-full border border-gray-300/30 bg-surface-faint pl-11 pr-4 text-body-md outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
        />
      </div>
      {actions}
    </div>
  );
}

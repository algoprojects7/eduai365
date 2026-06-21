import * as React from 'react';
import { cn } from '../lib/cn';
import { SidebarNav, type SidebarNavProps } from './sidebar-nav';
import { TopSearchBar, type TopSearchBarProps } from './top-search-bar';

export interface AppShellProps {
  sidebar: SidebarNavProps;
  search?: TopSearchBarProps;
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Accessible name for the portal shell landmark. */
  portalAriaLabel?: string;
  /** Target id for the skip link (also applied to `<main>`). */
  mainContentId?: string;
  /** Visible/focus label for the skip-to-content link. */
  skipToContentLabel?: string;
  /** Accessible name for the top header region. */
  headerAriaLabel?: string;
  /** Accessible name for the primary content landmark. */
  mainAriaLabel?: string;
}

export function AppShell({
  sidebar,
  search,
  header,
  children,
  footer,
  className,
  portalAriaLabel,
  mainContentId = 'main-content',
  skipToContentLabel = 'Skip to main content',
  headerAriaLabel = 'Portal header',
  mainAriaLabel = 'Main content',
}: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen bg-surface', className)} aria-label={portalAriaLabel}>
      <a
        href={`#${mainContentId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
      >
        {skipToContentLabel}
      </a>
      <SidebarNav {...sidebar} />
      <div className="flex flex-1 flex-col">
        <header
          aria-label={headerAriaLabel}
          className="border-b border-surface-faint bg-white px-6 py-4 md:px-8"
        >
          {search && <TopSearchBar {...search} />}
          {header}
        </header>
        <main
          id={mainContentId}
          aria-label={mainAriaLabel}
          tabIndex={-1}
          className="flex-1 overflow-auto px-6 py-6 md:px-8 md:py-8 focus:outline-none"
        >
          <div className="mx-auto max-w-container">{children}</div>
        </main>
        {footer}
      </div>
    </div>
  );
}

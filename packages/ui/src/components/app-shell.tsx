import * as React from 'react';
import { useState } from 'react';
import { Menu } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('flex min-h-screen bg-surface relative overflow-x-hidden', className)} aria-label={portalAriaLabel}>
      <a
        href={`#${mainContentId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
      >
        {skipToContentLabel}
      </a>

      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-all duration-300 animate-in-fade"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Nav Container */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform lg:translate-x-0 lg:static lg:z-auto transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarNav {...sidebar} onCloseMobile={() => setIsOpen(false)} isMobileOpen={isOpen} />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <header
          aria-label={headerAriaLabel}
          className="border-b border-surface-faint bg-white px-4 py-4 md:px-6 flex items-center gap-3.5"
        >
          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden shadow-sm transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div className="flex-1 min-w-0">
            {search && <TopSearchBar {...search} />}
          </div>
          {header}
        </header>

        <main
          id={mainContentId}
          aria-label={mainAriaLabel}
          tabIndex={-1}
          className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8 focus:outline-none"
        >
          <div className="mx-auto max-w-container">{children}</div>
        </main>
        {footer}
      </div>
    </div>
  );
}

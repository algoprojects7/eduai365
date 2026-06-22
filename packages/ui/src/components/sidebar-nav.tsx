import { X, type LucideIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/cn';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  type?: 'item' | 'section';
}

export interface SidebarNavProps {
  items: SidebarNavItem[];
  footerItems?: SidebarNavItem[];
  brand?: React.ReactNode;
  subtitle?: string;
  userCard?: React.ReactNode;
  actionButton?: React.ReactNode;
  className?: string;
  /** Accessible name for the sidebar landmark. */
  ariaLabel?: string;
  /** Accessible name for the primary navigation menu. */
  navAriaLabel?: string;
  onCloseMobile?: () => void;
  isMobileOpen?: boolean;
}

export function SidebarNav({
  items,
  footerItems,
  brand,
  subtitle,
  userCard,
  actionButton,
  className,
  ariaLabel = 'Portal navigation',
  navAriaLabel = 'Main menu',
  onCloseMobile,
  isMobileOpen,
}: SidebarNavProps) {
  return (
    <aside
      aria-label={ariaLabel}
      className={cn(
        'flex h-full w-60 flex-col border-r border-surface-faint bg-white lg:bg-surface-faint/50 px-4 py-6 shadow-xl lg:shadow-none',
        className,
      )}
    >
      <div className="mb-8 px-2 flex items-center justify-between">
        {brand ?? (
          <div>
            <p className="text-lg font-bold text-on-surface">eduAI365</p>
            {subtitle && (
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100 lg:hidden shadow-inner transition-colors"
            aria-label="Close sidebar menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav aria-label={navAriaLabel} className="flex flex-1 flex-col gap-1">
        {items.map((item) =>
          item.type === 'section' ? (
            <p
              key={item.id}
              className="mb-1 mt-4 px-3 text-label-md font-semibold uppercase tracking-wider text-on-surface-variant first:mt-0"
            >
              {item.label}
            </p>
          ) : (
            <SidebarNavLink
              key={item.id}
              {...item}
              onClick={() => {
                item.onClick?.();
                onCloseMobile?.();
              }}
            />
          ),
        )}
      </nav>

      {actionButton && <div className="my-4 px-2">{actionButton}</div>}

      {footerItems && footerItems.length > 0 && (
        <div
          aria-label="Secondary navigation"
          className="mt-auto flex flex-col gap-1 border-t border-gray-300/20 pt-4"
        >
          {footerItems.map((item) => (
            <SidebarNavLink
              key={item.id}
              {...item}
              onClick={() => {
                item.onClick?.();
                onCloseMobile?.();
              }}
            />
          ))}
        </div>
      )}

      {userCard && <div className="mt-4 px-2">{userCard}</div>}
    </aside>
  );
}

function SidebarNavLink({ label, icon: Icon, active, href, onClick }: SidebarNavItem) {
  const className = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-md font-medium transition-colors',
    active
      ? 'sidebar-active'
      : 'text-on-surface-variant hover:bg-white hover:text-on-surface',
  );

  const content = (
    <>
      {Icon ? <Icon className="h-5 w-5" strokeWidth={1.5} /> : null}
      {label}
    </>
  );

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (href) {
    return (
      <a href={href} className={className} onClick={handleLinkClick}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={cn(className, 'w-full text-left')} onClick={onClick}>
      {content}
    </button>
  );
}

'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from './button';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export interface NotificationBellProps {
  fetchNotifications: () => Promise<NotificationsListResponse>;
  markAsRead: (id: string) => Promise<void>;
  onNavigate?: (link: string) => void;
  pollIntervalMs?: number;
  className?: string;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell({
  fetchNotifications,
  markAsRead,
  onNavigate,
  pollIntervalMs = 60_000,
  className,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // Keep last known state when polling fails silently.
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  React.useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, pollIntervalMs]);

  React.useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await refresh();
    }
  }

  async function handleItemClick(notification: NotificationItem) {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Still allow navigation even if mark-read fails.
      }
    }

    setOpen(false);

    if (notification.link && onNavigate) {
      onNavigate(notification.link);
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => void handleToggle()}
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-surface-faint bg-white shadow-card">
          <div className="border-b border-surface-faint px-4 py-3">
            <p className="text-sm font-semibold text-on-surface">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-on-surface-variant">{unreadCount} unread</p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
                No notifications yet
              </p>
            ) : (
              <ul className="divide-y divide-surface-faint">
                {items.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors hover:bg-surface-faint',
                        !notification.read && 'bg-secondary/5',
                      )}
                      onClick={() => void handleItemClick(notification)}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                        )}
                        <div className={cn('min-w-0 flex-1', notification.read && 'pl-4')}>
                          <p className="truncate text-sm font-semibold text-on-surface">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-on-surface-variant">
                            {notification.body}
                          </p>
                          <p className="mt-1 text-[11px] text-on-surface-variant/80">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

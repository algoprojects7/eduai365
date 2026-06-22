'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AuthenticatedUser } from '@eduai365/shared-types';
import { AppShell, Footer, NotificationBell, type NotificationsListResponse } from '@eduai365/ui';
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Sparkles,
  UserCheck,
  UserPlus,
  Wallet,
  Award,
  MapPin,
  KeyRound,
  Users,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import { clearTokens } from '@/lib/auth';
import { getInitials } from '@/lib/format';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'children', label: 'My Children', icon: UserCheck, href: '/children' },
  { id: 'add-child', label: 'Add Child', icon: UserPlus, href: '/add-child' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages' },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList, href: '/assignments' },
  { id: 'fees', label: 'Fees', icon: Wallet, href: '/fees' },
  { id: 'exams', label: 'Exams', icon: ClipboardList, href: '/exams' },
  { id: 'results', label: 'Results', icon: Award, href: '/results' },
  { id: 'gps-tracking', label: 'GPS Tracking', icon: MapPin, href: '/gps-tracking' },
  { id: 'ai-alerts', label: 'AI Alerts', icon: Sparkles, href: '/ai-alerts' },
  { id: 'social', label: 'Social Network', icon: Users, href: '/comms/social' },
];

const FOOTER_LINK_GROUPS = [
  {
    title: 'Family',
    links: [
      { label: 'GPS Tracking', href: '#' },
      { label: 'Health Records', href: '#' },
      { label: 'Uniform Status', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact School', href: '#' },
    ],
  },
];

function ParentShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const me = await apiFetch<AuthenticatedUser>('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    clearTokens();
    router.push('/login');
  }

  const parentName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Parent';
  const initials = getInitials(user?.firstName, user?.lastName);

  return (
    <>
      <AppShell
        portalAriaLabel="eduAI365 Parent Portal"
        skipToContentLabel="Skip to parent dashboard content"
        mainContentId="parent-main-content"
        headerAriaLabel="Parent portal header"
        mainAriaLabel="Parent dashboard content"
        sidebar={{
          ariaLabel: 'Parent portal sidebar',
          navAriaLabel: 'Parent portal navigation',
          brand: (
            <div>
              <p className="text-lg font-bold text-on-surface">eduAI365</p>
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                Parent Portal
              </p>
            </div>
          ),
          items: NAV_ITEMS.map((item) => ({
            ...item,
            active: item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href),
            onClick: () => router.push(item.href),
          })),
          footerItems: [
            {
              id: 'change-password',
              label: 'Change Password',
              icon: KeyRound,
              onClick: () => router.push('/change-password'),
            },
            {
              id: 'logout',
              label: 'Logout',
              icon: LogOut,
              onClick: handleLogout,
            },
          ],
        }}
        search={{
          placeholder: 'Search children, messages, fees…',
          searchAriaLabel: 'Search children, messages, and fees',
          actions: (
            <div className="flex items-center gap-3" aria-label="Parent account tools">
              <NotificationBell
                fetchNotifications={() =>
                  apiFetch<NotificationsListResponse>('/notifications')
                }
                markAsRead={(id) =>
                  apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }).then(() => undefined)
                }
                onNavigate={(link) => router.push(link)}
              />
              <div
                className="flex items-center gap-3 rounded-lg border border-surface-faint bg-white px-3 py-2"
                aria-label={`Signed in as ${parentName}, parent or guardian`}
              >
                <div className="text-right">
                  <p className="text-body-md font-semibold text-on-surface">{parentName}</p>
                  <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    Parent / Guardian
                  </p>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary"
                  aria-hidden="true"
                >
                  {initials}
                </div>
              </div>
            </div>
          ),
        }}
        footer={
          <Footer
            brand={<p className="text-xl font-bold">eduAI365</p>}
            linkGroups={FOOTER_LINK_GROUPS}
            copyright="© 2024 eduAI365. All rights reserved."
          />
        }
      >
        {children}
      </AppShell>
    </>
  );
}

export function ParentShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ParentShellInner>{children}</ParentShellInner>
    </AuthGuard>
  );
}

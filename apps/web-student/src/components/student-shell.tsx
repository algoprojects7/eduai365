'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AiChatResponse, AuthenticatedUser } from '@eduai365/shared-types';
import { AppShell, AiCopilotPanel, Footer, NotificationBell, type NotificationsListResponse } from '@eduai365/ui';
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Wallet,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import { resolveCopilotRole } from '@/lib/ai-copilot';
import { clearTokens } from '@/lib/auth';
import { getInitials } from '@/lib/format';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard, href: '/dashboard' },
  { id: 'courses',     label: 'My Courses',   icon: BookOpen,        href: '/courses' },
  { id: 'assignments', label: 'Assignments',  icon: ClipboardList,   href: '/assignments' },
  { id: 'timetable',   label: 'Timetable',    icon: CalendarDays,    href: '/timetable' },
  { id: 'fees',        label: 'Fees',         icon: Wallet,          href: '/fees' },
  { id: 'results',     label: 'Results',      icon: Award,           href: '/results' },
  { id: 'attendance',  label: 'Attendance',   icon: CalendarDays,    href: '/attendance' },
];

const FOOTER_LINK_GROUPS = [
  {
    title: 'Learning',
    links: [
      { label: 'Library', href: '#' },
      { label: 'Clubs', href: '#' },
      { label: 'Resources', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact Teacher', href: '#' },
    ],
  },
];

function StudentShellInner({ children }: { children: React.ReactNode }) {
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

  const studentName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Student';
  const initials = getInitials(user?.firstName, user?.lastName);
  const copilotRole = resolveCopilotRole(user?.role, 'STUDENT');

  return (
    <>
      <AppShell
        portalAriaLabel="eduAI365 Student Portal"
        skipToContentLabel="Skip to student dashboard content"
        mainContentId="student-main-content"
        headerAriaLabel="Student portal header"
        mainAriaLabel="Student dashboard content"
        sidebar={{
          ariaLabel: 'Student portal sidebar',
          navAriaLabel: 'Student portal navigation',
          brand: (
            <div>
              <p className="text-lg font-bold text-on-surface">eduAI365</p>
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                Student Portal
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
          placeholder: 'Search courses, assignments, resources…',
          searchAriaLabel: 'Search student courses, assignments, and resources',
          actions: (
            <div className="flex items-center gap-3" aria-label="Student account tools">
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
                aria-label={`Signed in as ${studentName}, student`}
              >
                <div className="text-right">
                  <p className="text-body-md font-semibold text-on-surface">{studentName}</p>
                  <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    <GraduationCap className="mr-1 inline h-3 w-3" />
                    Student
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
      <AiCopilotPanel
        role={copilotRole}
        sendMessage={(message) =>
          apiFetch<AiChatResponse>('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ role: copilotRole, message }),
          })
        }
      />
    </>
  );
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <StudentShellInner>{children}</StudentShellInner>
    </AuthGuard>
  );
}

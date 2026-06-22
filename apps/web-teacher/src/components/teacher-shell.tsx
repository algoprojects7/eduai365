'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AiChatResponse, AuthenticatedUser } from '@eduai365/shared-types';
import { AppShell, AiCopilotPanel, Button, Footer, NotificationBell, type NotificationsListResponse } from '@eduai365/ui';
import {
  BookOpen,
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import { resolveCopilotRole } from '@/lib/ai-copilot';
import { clearTokens } from '@/lib/auth';
import { getInitials } from '@/lib/format';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'classes', label: 'My Classes', icon: Users, href: '/classes' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, href: '/attendance' },
  { id: 'gradebook', label: 'Gradebook', icon: BookOpen, href: '/gradebook' },
  { id: 'homework', label: 'Homework', icon: ClipboardList, href: '/homework' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages' },
  { id: 'social', label: 'Social Network', icon: Users, href: '/comms/social' },
];

const FOOTER_LINK_GROUPS = [
  {
    title: 'Teaching',
    links: [
      { label: 'Lesson Plans', href: '#' },
      { label: 'Resources', href: '#' },
      { label: 'Syllabus', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact Admin', href: '#' },
    ],
  },
];

function TeacherShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const me = await apiFetch<AuthenticatedUser>('/auth/me');
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
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

  const teacherName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Teacher';
  const initials = getInitials(user?.firstName, user?.lastName);
  const copilotRole = resolveCopilotRole(user?.role, 'TEACHER');

  return (
    <>
      <AppShell
        sidebar={{
          brand: (
            <div>
              <p className="text-lg font-bold text-on-surface">eduAI365</p>
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                Teacher Portal
              </p>
            </div>
          ),
          items: NAV_ITEMS.map((item) => ({
            ...item,
            active:
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)),
            onClick: () => router.push(item.href),
          })),
          actionButton: (
            <Button variant="ai" className="w-full" size="md" onClick={() => router.push('/dashboard')}>
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              AI Lesson Plan
            </Button>
          ),
          footerItems: [
            {
              id: 'help',
              label: 'Help Center',
              icon: CircleHelp,
              onClick: () => router.push('/dashboard'),
            },
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
          placeholder: 'Search students, classes, or homework…',
          actions: (
            <div className="flex items-center gap-3">
              <NotificationBell
                fetchNotifications={() =>
                  apiFetch<NotificationsListResponse>('/notifications')
                }
                markAsRead={(id) =>
                  apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }).then(() => undefined)
                }
                onNavigate={(link) => router.push(link)}
              />
              <div className="flex items-center gap-3 rounded-lg border border-surface-faint bg-white px-3 py-2">
                <div className="text-right">
                  <p className="text-body-md font-semibold text-on-surface">{teacherName}</p>
                  <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    Teacher
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
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

export function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TeacherShellInner>{children}</TeacherShellInner>
    </AuthGuard>
  );
}

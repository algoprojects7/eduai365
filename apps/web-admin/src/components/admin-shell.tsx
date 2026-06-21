'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  AppShell,
  AiCopilotFab,
  Button,
} from '@eduai365/ui';
import {
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Grid3X3,
  LayoutDashboard,
  Library,
  MessageSquare,
  Settings,
  UserPlus,
  Wallet,
  Zap,
} from 'lucide-react';
import { clearTokens } from '@/lib/auth';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'academics', label: 'Academics', icon: BookOpen, href: '/dashboard/academics' },
  { id: 'examinations', label: 'Examinations', icon: ClipboardList, href: '/dashboard/examinations' },
  { id: 'substitutions', label: 'Substitutions', icon: UserPlus, href: '/dashboard/substitutions' },
  { id: 'library', label: 'Library', icon: Library, href: '/dashboard/library' },
  { id: 'admissions', label: 'Admissions', icon: GraduationCap, href: '/dashboard/admissions' },
  { id: 'finance', label: 'Finance', icon: Wallet, href: '/dashboard/finance' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearTokens();
    router.push('/login');
  }

  return (
    <>
      <AppShell
        sidebar={{
          brand: (
            <div>
              <p className="text-lg font-bold text-on-surface">eduAI365 Admin</p>
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                Super Admin Portal
              </p>
            </div>
          ),
          items: NAV_ITEMS.map((item) => ({
            ...item,
            active: pathname === item.href,
            onClick: () => router.push(item.href),
          })),
          footerItems: [
            {
              id: 'settings',
              label: 'Settings',
              icon: Settings,
              active: pathname === '/dashboard/settings',
              onClick: () => router.push('/dashboard/settings'),
            },
          ],
          userCard: (
            <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-card">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
                AU
              </div>
              <div>
                <p className="text-body-md font-semibold text-on-surface">Admin User</p>
                <p className="text-label-md text-on-surface-variant">Global Access</p>
              </div>
            </div>
          ),
        }}
        search={{
          placeholder: 'Global system search…',
          actions: (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Messages">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Apps">
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <div className="ml-2 flex items-center gap-2 rounded-lg border border-surface-faint bg-white px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-body-md font-semibold text-on-surface">eduAI365</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/change-password')} className="ml-2">
                Change Password
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
                Logout
              </Button>
            </div>
          ),
        }}
      >
        {children}
      </AppShell>
      <AiCopilotFab />
    </>
  );
}

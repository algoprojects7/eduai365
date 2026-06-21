'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { AiChatResponse, AuthenticatedUser } from '@eduai365/shared-types';
import { localeLabels, locales, type Locale } from '@eduai365/i18n';
import {
  AppShell,
  AiCopilotPanel,
  Button,
  Footer,
  LanguageSwitcher,
  NotificationBell,
  type NotificationsListResponse,
} from '@eduai365/ui';
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  FileText,
  GraduationCap,
  IdCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Sparkles,
  TableProperties,
  UserPlus,
  UserSquare2,
  Wallet,
  Bus,
  HeartPulse,
  Library,
  MapPin,
  MessageSquare,
  Package,
  ShoppingBag,
  Users,
  BedDouble,
  Boxes,
  HardDrive,
  Network,
  ShieldAlert,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AuthGuard } from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import { resolveCopilotRole } from '@/lib/ai-copilot';
import { clearTokens } from '@/lib/auth';
import { getInitials } from '@/lib/format';
import type { SchoolProfile } from '@/types/school';

const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'students', labelKey: 'students', icon: GraduationCap, href: '/students' },
  { id: 'teachers', labelKey: 'teachers', icon: UserSquare2, href: '/teachers' },
  { id: 'admissions', labelKey: 'admissions', icon: UserPlus, href: '/admissions' },
  { id: 'timetable', labelKey: 'timetable', icon: TableProperties, href: '/timetable' },
  { id: 'exams', labelKey: 'exams', icon: ClipboardList, href: '/exams' },
  { id: 'calendar', labelKey: 'calendar', icon: CalendarDays, href: '/calendar' },
  { id: 'report-cards', labelKey: 'reportCards', icon: FileText, href: '/report-cards' },
  { id: 'reports', labelKey: 'reports', icon: BarChart3, href: '/reports' },
  { id: 'comms', labelKey: 'communication', icon: MessageSquare, href: '/comms' },
  { id: 'finance', labelKey: 'finance', icon: Wallet, href: '/finance' },
  { id: 'hr-employees', labelKey: 'employees', icon: IdCard, href: '/hr/employees' },
  { id: 'hr-leave', labelKey: 'leave', icon: CalendarDays, href: '/hr/leave' },
  { id: 'hr-payroll', labelKey: 'payroll', icon: Wallet, href: '/hr/payroll' },
  { id: 'hr-substitutions', labelKey: 'substitutions', icon: RefreshCw, href: '/hr/substitutions' },
  { id: 'hr-analytics', labelKey: 'hrAnalytics', icon: BarChart3, href: '/hr/analytics' },
  { id: 'ops-section', labelKey: 'operations', type: 'section' as const },
  { id: 'library', labelKey: 'library', icon: Library, href: '/operations/library' },
  { id: 'bookstore', labelKey: 'bookstore', icon: ShoppingBag, href: '/operations/bookstore' },
  { id: 'transport', labelKey: 'transport', icon: Bus, href: '/operations/transport' },
  { id: 'gps', labelKey: 'gps', icon: MapPin, href: '/operations/gps' },
  { id: 'health', labelKey: 'health', icon: HeartPulse, href: '/operations/health' },
  { id: 'clubs', labelKey: 'clubs', icon: Users, href: '/operations/clubs' },
  { id: 'uniform', labelKey: 'uniform', icon: Package, href: '/operations/uniform' },
  { id: 'extended-section', labelKey: 'extended', type: 'section' as const },
  { id: 'hostel', labelKey: 'hostel', icon: BedDouble, href: '/extended/hostel' },
  { id: 'inventory', labelKey: 'inventory', icon: Boxes, href: '/extended/inventory' },
  { id: 'assets', labelKey: 'assets', icon: HardDrive, href: '/extended/assets' },
  { id: 'alumni', labelKey: 'alumni', icon: Network, href: '/extended/alumni' },
  { id: 'ai-insights', labelKey: 'aiInsights', icon: Sparkles, href: '/ai' },
  { id: 'settings', labelKey: 'settings', icon: Settings, href: '/settings' },
];

function SchoolShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tSearch = useTranslations('search');
  const tFooter = useTranslations('footer');
  const tLanguage = useTranslations('language');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const [me, schoolProfile] = await Promise.all([
          apiFetch<AuthenticatedUser>('/auth/me'),
          apiFetch<SchoolProfile>('/school/profile'),
        ]);
        if (!cancelled) {
          setUser(me);
          setProfile(schoolProfile);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
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

  function handleLocaleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  const principalName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : 'Principal Sharma';
  const schoolName = profile?.name ?? 'Greenfield Academy';
  const initials = getInitials(user?.firstName, user?.lastName);
  const copilotRole = resolveCopilotRole(user?.role, 'PRINCIPAL');

  const footerLinkGroups = [
    {
      title: tFooter('platform'),
      links: [
        { label: tFooter('features'), href: '#' },
        { label: tFooter('admissions'), href: '#' },
        { label: tFooter('lmsIntegration'), href: '#' },
      ],
    },
    {
      title: tFooter('support'),
      links: [
        { label: tFooter('security'), href: '#' },
        { label: tFooter('privacyPolicy'), href: '#' },
        { label: tFooter('contactSupport'), href: '#' },
      ],
    },
  ];

  const disabledServices = profile?.settings?.disabledServices ?? [];
  const principalRestrictedModules = profile?.settings?.principalRestrictedModules ?? [];

  const isPrincipalLike =
    user?.role === 'PRINCIPAL' ||
    user?.role === 'VICE_PRINCIPAL' ||
    user?.role === 'SCHOOL_ADMIN' ||
    user?.role === 'SUPER_ADMIN';

  const activeDisabledServices = isPrincipalLike
    ? disabledServices
    : [...disabledServices, ...principalRestrictedModules];

  // Filter NAV_ITEMS to exclude disabled ones
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.href && activeDisabledServices.includes(item.id)) {
      return false;
    }
    return true;
  });

  // Hide section headers if all items under them are disabled
  const finalNavItems: typeof NAV_ITEMS = [];
  for (let i = 0; i < filteredNavItems.length; i++) {
    const item = filteredNavItems[i];
    if (!item) continue;
    if (item.type === 'section') {
      let hasActiveItems = false;
      for (let j = i + 1; j < filteredNavItems.length; j++) {
        const nextItem = filteredNavItems[j];
        if (!nextItem) continue;
        if (nextItem.type === 'section') break;
        if (nextItem.href) {
          hasActiveItems = true;
          break;
        }
      }
      if (!hasActiveItems) {
        continue;
      }
    }
    finalNavItems.push(item);
  }

  // Intercept access to disabled routes
  const isCurrentPathDisabled = NAV_ITEMS.some((item) => {
    if (!item.href || !activeDisabledServices.includes(item.id)) return false;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  // Determine if it was restricted at the platform level
  const isPlatformRestricted = NAV_ITEMS.some((item) => {
    if (!item.href || !disabledServices.includes(item.id)) return false;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return (
    <>
      <AppShell
        sidebar={{
          brand: (
            <div>
              <p className="text-lg font-bold text-on-surface">{tCommon('brand')}</p>
              <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                {tCommon('adminPortal')}
              </p>
            </div>
          ),
          items: finalNavItems.map((item) => ({
            ...item,
            label: tNav(item.labelKey),
            active:
              item.type !== 'section' &&
              (pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))),
            onClick: item.href ? () => router.push(item.href!) : undefined,
          })),
          footerItems: [
            {
              id: 'help',
              label: tNav('helpCenter'),
              icon: CircleHelp,
              onClick: () => router.push('/dashboard'),
            },
            {
              id: 'change-password',
              label: tNav('changePassword') || 'Change Password',
              icon: KeyRound,
              onClick: () => router.push('/change-password'),
            },
            {
              id: 'logout',
              label: tNav('logout'),
              icon: LogOut,
              onClick: handleLogout,
            },
          ],
        }}
        search={{
          placeholder: tSearch('placeholder'),
          actions: (
            <div className="flex items-center gap-3">
              <LanguageSwitcher
                locale={locale}
                locales={locales.map((code) => ({
                  code,
                  label: localeLabels[code],
                }))}
                onLocaleChange={handleLocaleChange}
                aria-label={tLanguage('label')}
              />
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
                  <p className="text-body-md font-semibold text-on-surface">{principalName}</p>
                  <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
                    {schoolName}
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
            brand={<p className="text-xl font-bold">{tCommon('brand')}</p>}
            linkGroups={footerLinkGroups}
            copyright={tFooter('copyright')}
          />
        }
      >
        {profileLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          </div>
        ) : isCurrentPathDisabled ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-surface bg-opacity-30 backdrop-blur-md rounded-2xl border border-surface-faint max-w-2xl mx-auto my-12 animate-in-fade">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-headline-md font-bold text-on-surface mb-2">Module Access Restricted</h2>
            <p className="text-body-md text-on-surface-variant max-w-md mb-6">
              {isPlatformRestricted
                ? 'This service has been disabled for your school by the platform Super Administrator. Please contact support if you require access.'
                : 'This service has been restricted for your role by the school administrator.'}
            </p>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        ) : (
          children
        )}
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

export function SchoolShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SchoolShellInner>{children}</SchoolShellInner>
    </AuthGuard>
  );
}

'use client';

import { useRouter } from '@/i18n/navigation';
import {
  Bus,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Grid3X3,
  Library,
  Wallet,
} from 'lucide-react';

const ACTIONS = [
  { id: 'admissions', label: 'Admissions', icon: GraduationCap, href: '/admissions' },
  { id: 'exams', label: 'Exams', icon: ClipboardList, href: '/exams' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/calendar' },
  { id: 'report-cards', label: 'Report Cards', icon: FileText, href: '/report-cards' },
  { id: 'payroll', label: 'Payroll', icon: Wallet, href: '/dashboard' },
  { id: 'library', label: 'Library', icon: Library, href: '/operations/library' },
  { id: 'transport', label: 'Transport', icon: Bus, href: '/dashboard' },
  { id: 'all-modules', label: 'All Modules', icon: Grid3X3, href: '/dashboard' },
];

export function QuickActionsGrid() {
  const router = useRouter();

  return (
    <div className="bento-card">
      <h3 className="text-title-lg font-semibold text-on-surface">Quick Actions</h3>
      <p className="mt-1 text-body-md text-on-surface-variant">Jump to frequently used modules</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-300/20 bg-surface-faint px-4 py-5 transition-colors hover:border-secondary/30 hover:bg-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <action.icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />
            </div>
            <span className="text-body-md font-medium text-on-surface">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

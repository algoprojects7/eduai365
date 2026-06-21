'use client';

import { KpiBentoCard } from '@eduai365/ui';
import { BookOpen, CalendarDays, ClipboardList, MessageSquare } from 'lucide-react';
import type { TeacherDashboard } from '@/types/teacher';

interface TeacherKpiRowProps {
  kpis: TeacherDashboard['kpis'];
}

export function TeacherKpiRow({ kpis }: TeacherKpiRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiBentoCard
        label="My Classes"
        value={kpis.totalClasses}
        icon={BookOpen}
        trend={{ value: 'This term', direction: 'neutral' }}
      />
      <KpiBentoCard
        label="Today's Periods"
        value={kpis.todayPeriods}
        icon={CalendarDays}
        trend={{ value: 'On schedule', direction: 'up' }}
      />
      <KpiBentoCard
        label="Pending Homework"
        value={kpis.pendingHomework}
        icon={ClipboardList}
        trend={{ value: 'Needs review', direction: 'neutral' }}
      />
      <KpiBentoCard
        label="Unread Messages"
        value={kpis.unreadMessages}
        icon={MessageSquare}
        trend={{ value: 'From parents', direction: 'neutral' }}
      />
    </div>
  );
}

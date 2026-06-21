'use client';

import { KpiBentoCard } from '@eduai365/ui';
import { CalendarCheck, IndianRupee, Users, UserSquare2 } from 'lucide-react';
import { formatInrLakhPair, formatPercent } from '@/lib/format';
import type { SchoolDashboard } from '@/types/school';

interface KpiRowProps {
  data: SchoolDashboard;
}

export function KpiRow({ data }: KpiRowProps) {
  const feeProgress = data.feesTarget > 0
    ? Math.round((data.feesCollected / data.feesTarget) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiBentoCard
        label="Enrolled Students"
        value={data.enrolledStudents.toLocaleString()}
        icon={Users}
        trend={{ value: '+12%', direction: 'up' }}
      />
      <KpiBentoCard
        label="Active Staff"
        value={data.activeStaff}
        icon={UserSquare2}
        trend={{ value: 'Stable', direction: 'neutral' }}
      />
      <KpiBentoCard
        label="Avg. Attendance"
        value={formatPercent(data.avgAttendance)}
        icon={CalendarCheck}
        trend={{ value: '-0.8%', direction: 'down' }}
      />
      <KpiBentoCard
        label="Fees Collected"
        value={formatInrLakhPair(data.feesCollected, data.feesTarget)}
        icon={IndianRupee}
        trend={{ value: `Target ${feeProgress}%`, direction: 'up' }}
      />
    </div>
  );
}

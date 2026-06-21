'use client';

import { KpiBentoCard, AiInsightCard } from '@eduai365/ui';
import { Brain, GraduationCap, Users, Wallet } from 'lucide-react';
import { formatCompactNumber, formatMrr } from '@/lib/format';
import type { PlatformDashboard } from '@/types/platform';

interface KpiRowProps {
  data: PlatformDashboard;
}

export function KpiRow({ data }: KpiRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiBentoCard
        label="Active Schools"
        value={data.activeSchools}
        icon={GraduationCap}
        trend={{ value: '+ 12%', direction: 'up' }}
      />
      <KpiBentoCard
        label="Total Students"
        value={data.totalStudents.toLocaleString()}
        icon={Users}
        trend={{ value: '+ 8.4%', direction: 'up' }}
      />
      <KpiBentoCard
        label="MRR"
        value={formatMrr(data.mrr)}
        icon={Wallet}
        trend={{ value: '+ $14k', direction: 'up' }}
      />
      <AiInsightCard
        title={formatCompactNumber(data.aiCalls)}
        description="Total AI operations processed across all tenant ecosystems this month."
        badge="AI OPERATIONS"
        className="flex flex-col justify-between"
      >
        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ai-violet/10">
            <Brain className="h-5 w-5 text-ai-violet" strokeWidth={1.5} />
          </div>
          <p className="text-label-md uppercase tracking-wider text-ai-violet">Neural throughput</p>
        </div>
      </AiInsightCard>
    </div>
  );
}

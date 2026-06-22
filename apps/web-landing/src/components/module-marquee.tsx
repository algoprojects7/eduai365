'use client';

import { useState } from 'react';
import { cn } from '@eduai365/ui';
import {
  Brain,
  GraduationCap,
  BookOpen,
  Cpu,
  LineChart,
  Award,
  Briefcase,
  FlaskConical,
  Globe,
  Users,
  Library,
  Landmark,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react';

const MODULES: { label: string; icon: LucideIcon }[] = [
  { label: 'AI Research Hub', icon: FlaskConical },
  { label: 'LMS & Syllabus AI', icon: BookOpen },
  { label: 'Course Registration', icon: GraduationCap },
  { label: 'AI Predictive Analytics', icon: LineChart },
  { label: 'Scholarships & Grants', icon: Award },
  { label: 'Career Placement', icon: Briefcase },
  { label: 'Global Admissions', icon: Globe },
  { label: 'Smart Campus IoT', icon: Cpu },
  { label: 'Alumni Network', icon: Users },
  { label: 'AI Academic Advisor', icon: Brain },
  { label: 'Library & Archiving', icon: Library },
  { label: 'Finance & Endowment', icon: Landmark },
  { label: 'Social Network', icon: MessagesSquare },
];

function ModuleChip({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <div className="marquee-chip text-on-surface">
      <Icon className="h-4 w-4 text-ai-electric" strokeWidth={1.5} aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function MarqueeGroup({
  modules,
  duplicate = false,
}: {
  modules: typeof MODULES;
  duplicate?: boolean;
}) {
  return (
    <div className="marquee-group" aria-hidden={duplicate || undefined}>
      {modules.map((module) => (
        <ModuleChip key={`${duplicate ? 'dup' : 'orig'}-${module.label}`} {...module} />
      ))}
    </div>
  );
}

export function ModuleMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="section-white relative overflow-hidden py-6" aria-label="Platform modules">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface to-transparent" />
      <div
        className={cn('marquee-viewport relative z-20', paused && 'marquee-paused')}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="marquee-track">
          <MarqueeGroup modules={MODULES} />
          <MarqueeGroup modules={MODULES} duplicate />
        </div>
      </div>
    </section>
  );
}

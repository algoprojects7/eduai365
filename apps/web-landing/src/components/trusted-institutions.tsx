'use client';

import { Circle, Mountain, Shield } from 'lucide-react';
import { Badge, CinematicCard, RevealOnScroll } from '@eduai365/ui';
import type { SchoolSummary } from '@/lib/schools';
import type { TenantPlan } from '@eduai365/shared-types';

const PLAN_BADGE: Record<TenantPlan, { label: string; className: string }> = {
  PRO: { label: 'PRO', className: 'border-0 bg-gh-ghost-blue text-secondary' },
  ENTERPRISE: {
    label: 'ENTERPRISE',
    className: 'border-0 bg-primary-fixed text-primary-container',
  },
  CORE: { label: 'CORE', className: 'border-0 bg-surface-faint text-on-surface-variant' },
};

const CARD_TONES = ['bento-card-violet', 'bento-card-sky', 'bento-card-khaki'] as const;

function SchoolIcon({ slug }: { slug: string }) {
  const box = 'icon-gh-box h-10 w-10';
  if (slug.includes('summit')) {
    return (
      <div className={box}>
        <Mountain className="h-5 w-5 text-on-surface" strokeWidth={1.75} />
      </div>
    );
  }
  if (slug.includes('jude')) {
    return (
      <div className={box}>
        <Circle className="h-4 w-4 fill-ai-electric text-ai-electric" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <div className={box}>
      <Shield className="h-5 w-5 text-on-surface" strokeWidth={1.75} />
    </div>
  );
}

function SchoolCard({ school, tone }: { school: SchoolSummary; tone: string }) {
  const planBadge = PLAN_BADGE[school.plan];

  return (
    <CinematicCard
      variant="solid"
      tilt
      glow={false}
      className={`flex h-full flex-col gap-4 rounded-2xl p-6 ${tone}`}
    >
      <></>
      {/* <div className="flex items-start justify-between gap-3">
        <SchoolIcon slug={school.slug} />
        <Badge className={planBadge.className}>{planBadge.label}</Badge>
      </div>
      <div>
        <h3 className="text-title-lg font-semibold text-on-surface">{school.name}</h3>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {school.studentCount.toLocaleString()} Students
        </p>
      </div> */}
    </CinematicCard>
  );
}

interface TrustedInstitutionsProps {
  schools: SchoolSummary[];
}

export function TrustedInstitutions({ schools }: TrustedInstitutionsProps) {
  return (
    <section id="solutions" className="section-muted relative px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-4 text-center">
          <div>
            <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
              Trusted by leading institutions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-body-lg text-on-surface-variant">
              Join Schools, and Coaching Centres that run everyday operations in one calm, easy place.
            </p>
          </div>
        </RevealOnScroll>

        {/* <div className="grid gap-4 md:grid-cols-3">
          {schools.map((school, index) => (
            <RevealOnScroll key={school.id} delay={index * 0.08}>
              <SchoolCard
                school={school}
                tone={CARD_TONES[index % CARD_TONES.length] ?? 'bento-card-sky'}
              />
            </RevealOnScroll>
          ))}
        </div> */}
      </div>
    </section>
  );
}

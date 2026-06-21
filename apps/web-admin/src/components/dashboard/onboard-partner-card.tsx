'use client';

import { Button, DarkBentoCard } from '@eduai365/ui';
import { ArrowRight, Building2, Sparkles } from 'lucide-react';

export function OnboardPartnerCard() {
  return (
    <div className="relative h-full">
      <DarkBentoCard glow className="relative flex h-full flex-col justify-between bg-cinematic-dark text-white">
        <div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <Building2 className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-title-lg font-semibold">Onboard New Educational Partner</h3>
          <p className="mt-2 text-body-md leading-relaxed text-white/75">
            Deploy a fresh, isolated instance for a new school or district within seconds.
          </p>
        </div>
        <Button variant="ghost" className="mt-6 w-fit border-white/20 bg-white text-on-surface hover:bg-white/90">
          Initialize Tenant
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DarkBentoCard>
      <button
        type="button"
        aria-label="AI assistant"
        className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-ai-gradient text-white shadow-ai-glow-strong"
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

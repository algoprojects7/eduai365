'use client';

import {
  ShieldCheck,
  FileCheck2,
  Building,
  BrainCircuit,
  GraduationCap,
  BookOpen,
  FlaskConical,
  Award,
  ExternalLink,
} from 'lucide-react';
import { RevealOnScroll } from '@eduai365/ui';
import type { SchoolSummary } from '@/lib/schools';

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'MCA Registered Company' },
  { icon: FileCheck2, label: 'GST Registered' },
  { icon: Building, label: 'Enterprise & IT Services Company' },
  { icon: BrainCircuit, label: 'AI & ERP Development Specialists' },
];

const FOUNDER_STATS = [
  { value: '18+', label: 'Years Experience' },
  { value: '20+', label: 'Publications' },
  { value: '5', label: 'Patents' },
  { value: '500+', label: 'Projects Guided' },
];

interface TrustedInstitutionsProps {
  schools: SchoolSummary[];
}

export function TrustedInstitutions({ schools }: TrustedInstitutionsProps) {
  return (
    <section id="solutions" className="section-muted relative px-4 py-20 md:px-8 md:py-24">
      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center">
          <div>
            <p className="text-label-md font-semibold uppercase tracking-wider text-ai-electric mb-3">
              Trusted Foundation
            </p>
            <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
              Developed by<br />
              <span className="text-gradient-ai">Algoguido Technologies Private Limited</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-body-lg text-on-surface-variant">
              A verified, registered technology company building the future of AI-powered
              education management in India.
            </p>
          </div>
        </RevealOnScroll>

        {/* Trust Badges */}
        <RevealOnScroll className="mb-14">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TRUST_BADGES.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 shadow-sm"
                >
                  <Icon className="h-4.5 w-4.5 text-secondary" strokeWidth={1.5} />
                  <span className="text-body-md font-medium text-on-surface">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </RevealOnScroll>

        {/* Founder Profile Card */}
        <RevealOnScroll className="mx-auto max-w-4xl">
          <article className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
              {/* Left: Founder Info */}
              <div className="md:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ai-violet/10">
                    <GraduationCap className="h-4 w-4 text-ai-violet" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-ai-violet">
                    Leadership
                  </span>
                </div>

                <h3 className="text-headline-md font-bold text-on-surface">
                  Dr. Mostaque Md. Morshedur Hassan
                </h3>
                <p className="mt-1 text-body-lg font-semibold text-secondary">
                  Director cum Founder, Algoguido Technologies Pvt. Ltd.
                </p>

                <div className="mt-5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/60" strokeWidth={1.5} />
                    <p className="text-body-md text-on-surface-variant">
                      PhD in Computer Science, Gauhati University (2019)
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/60" strokeWidth={1.5} />
                    <p className="text-body-md text-on-surface-variant">
                      Pursuing Post-Doctoral Fellowship, Eudoxia Research University, USA
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/60" strokeWidth={1.5} />
                    <p className="text-body-md text-on-surface-variant">
                      Former Principal Data Scientist & Instructor, UpGrad Education
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/60" strokeWidth={1.5} />
                    <p className="text-body-md text-on-surface-variant">
                      Research: AI, Deep Learning, Network Security, GANs & Fuzzy Logic
                    </p>
                  </div>
                </div>

                <blockquote className="mt-6 border-l-2 border-ai-violet/30 pl-4 italic text-body-md text-on-surface-variant">
                  &ldquo;Bridging theoretical AI with practical engineering — one algorithm at a time.&rdquo;
                </blockquote>

                <a
                  href="https://dr-mostaq.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-body-md font-semibold text-secondary hover:text-secondary-container transition-colors"
                >
                  View Full Profile
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Right: Stats Grid */}
              <div className="md:col-span-2 flex items-center">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {FOUNDER_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-gray-100 bg-surface-faint p-4 text-center"
                    >
                      <p className="text-headline-md font-bold text-on-surface">{stat.value}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                  {/* Citations badge */}
                  <div className="col-span-2 rounded-xl border border-ai-violet/15 bg-ai-violet/5 p-4 text-center">
                    <p className="text-headline-md font-bold text-ai-violet">157+</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                      Google Scholar Citations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </RevealOnScroll>
      </div>
    </section>
  );
}

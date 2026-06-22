'use client';

import { motion } from 'framer-motion';
import {
  ClipboardMinus,
  Users,
  ShieldCheck,
  BrainCircuit,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react';
import { RevealOnScroll } from '@eduai365/ui';

interface PainPoint {
  icon: LucideIcon;
  title: string;
  desc: string;
  glowFrom: string;
  glowTo: string;
}

const PAIN_POINTS: PainPoint[] = [
  {
    icon: ClipboardMinus,
    title: 'Reduce Administrative Workload',
    desc: 'Automate attendance, report cards, fee collection, payroll, and communication — freeing your staff to focus on what matters.',
    glowFrom: 'from-blue-500/20',
    glowTo: 'to-cyan-500/10',
  },
  {
    icon: Users,
    title: 'Improve Parent Engagement',
    desc: 'Real-time notifications, student progress tracking, and direct communication channels that keep parents connected.',
    glowFrom: 'from-violet-500/20',
    glowTo: 'to-purple-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Enhance Student Safety',
    desc: 'GPS-enabled transport monitoring and location-based alerts give parents and administrators peace of mind.',
    glowFrom: 'from-emerald-500/20',
    glowTo: 'to-teal-500/10',
  },
  {
    icon: BrainCircuit,
    title: 'AI-Powered Academic Planning',
    desc: 'Generate lesson plans, optimize timetables, and identify at-risk students early with built-in artificial intelligence.',
    glowFrom: 'from-amber-500/20',
    glowTo: 'to-orange-500/10',
  },
  {
    icon: MessagesSquare,
    title: 'Campus-wide Social Platform',
    desc: 'A dedicated platform for sharing constructive ideas, thoughts, queries, and peer-to-peer support among students, teachers, and staff.',
    glowFrom: 'from-pink-500/20',
    glowTo: 'to-rose-500/10',
  },
];

export function WhySchoolsChoose() {
  return (
    <section id="why-choose" className="section-white relative px-4 py-20 md:px-8 md:py-28 overflow-hidden">
      {/* Decorative background glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-25"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, rgba(27,100,241,0.06) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-label-md font-semibold uppercase tracking-wider text-ai-electric mb-3">
            Outcomes That Matter
          </p>
          <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
            Why Schools Choose{' '}
            <span className="text-gradient-ai">eduAI365</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-on-surface-variant">
            Schools don&apos;t buy modules — they buy results. Here&apos;s how eduAI365
            transforms everyday school operations.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PAIN_POINTS.map((point, index) => {
            const Icon = point.icon;
            return (
              <RevealOnScroll key={point.title} delay={index * 0.08}>
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm hover:shadow-card transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle gradient glow on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${point.glowFrom} ${point.glowTo} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    aria-hidden
                  />

                  <div className="relative z-10">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ai-violet/15 to-ai-electric/10">
                      <Icon className="h-6 w-6 text-ai-violet" strokeWidth={1.5} aria-hidden />
                    </div>
                    <h3 className="text-title-lg font-bold text-on-surface">{point.title}</h3>
                    <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
                      {point.desc}
                    </p>
                  </div>
                </motion.article>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}

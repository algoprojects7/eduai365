'use client';

import { motion } from 'framer-motion';
import {
  BrainCircuit,
  MapPin,
  School,
  Building2,
  Handshake,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';
import { RevealOnScroll } from '@eduai365/ui';

const DIFFERENTIATORS = [
  {
    icon: BrainCircuit,
    title: 'AI Native',
    desc: 'AI is not an add-on — it is the foundation. Every module is powered by intelligent automation.',
  },
  {
    icon: MapPin,
    title: 'GPS Tracking',
    desc: 'Real-time transport tracking and GPS-enabled student safety via shoe chips — unmatched in the market.',
  },
  {
    icon: School,
    title: 'School + Coaching Centre Support',
    desc: 'Purpose-built for both K-12 schools and coaching centres with flexible workflows.',
  },
  {
    icon: Building2,
    title: 'Multi-Campus Ready',
    desc: 'Manage multiple campuses, branches, and locations from a single unified dashboard.',
  },
  {
    icon: Handshake,
    title: 'Franchise Network Support',
    desc: 'Built-in franchise management for education networks expanding across regions.',
  },
  {
    icon: IndianRupee,
    title: 'Indian Education Workflow Focus',
    desc: 'Designed for Indian schools — CBSE, ICSE, State Boards, with local compliance built in.',
  },
];

export function CompetitiveEdge() {
  return (
    <section className="section-white relative px-4 py-20 md:px-8 md:py-24 overflow-hidden">
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[600px] rounded-full opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, rgba(27,100,241,0.08) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-label-md font-semibold uppercase tracking-wider text-ai-electric mb-3">
            Competitive Advantage
          </p>
          <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-on-surface md:text-display-lg">
            Why{' '}
            <span className="text-gradient-ai">eduAI365</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-on-surface-variant">
            When schools compare platforms, eduAI365 stands out with capabilities
            that no other School ERP in India offers.
          </p>
        </RevealOnScroll>

        <div className="mx-auto max-w-4xl grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map((item, index) => {
            const Icon = item.icon;
            return (
              <RevealOnScroll key={item.title} delay={index * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-card hover:border-secondary/30 transition-all duration-300"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="text-body-lg font-bold text-on-surface">{item.title}</h3>
                    <p className="mt-1.5 text-body-md leading-relaxed text-on-surface-variant">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}

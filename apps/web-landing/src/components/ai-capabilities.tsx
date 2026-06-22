'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  BarChart3,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  MessageSquareText,
  FileBarChart,
  LayoutDashboard,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { RevealOnScroll } from '@eduai365/ui';

interface AiFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const AI_FEATURES: AiFeature[] = [
  {
    icon: FileText,
    title: 'AI Lesson Plan Generator',
    desc: 'Auto-generate curriculum-aligned lesson plans with learning objectives, activities, and assessments.',
  },
  {
    icon: BarChart3,
    title: 'AI Attendance Analytics',
    desc: 'Detect patterns, flag irregularities, and forecast attendance trends across classes and sections.',
  },
  {
    icon: TrendingUp,
    title: 'AI Performance Prediction',
    desc: 'Predict academic outcomes and identify students who may need early intervention.',
  },
  {
    icon: CalendarClock,
    title: 'AI Timetable Generator',
    desc: 'Conflict-free scheduling for rooms, faculty, and sections — generated in seconds.',
  },
  {
    icon: AlertTriangle,
    title: 'AI Student Risk Detection',
    desc: 'Anomaly detection and intelligent alerts to catch at-risk students before it\'s too late.',
  },
  {
    icon: MessageSquareText,
    title: 'AI Communication Assistant',
    desc: 'Smart notification drafting, parent message suggestions, and automated announcement broadcasts.',
  },
  {
    icon: FileBarChart,
    title: 'AI Report Generation',
    desc: 'Automated report cards, performance summaries, and administrative reports with zero manual effort.',
  },
  {
    icon: LayoutDashboard,
    title: 'AI School Dashboard',
    desc: 'Real-time predictive analytics, anomaly detection, performance forecasting, and intelligent recommendations.',
  },
];

export function AiCapabilities() {
  return (
    <section className="cinematic-dark-shell relative px-4 py-20 md:px-8 md:py-28 overflow-hidden">
      <div className="cinematic-aurora opacity-60" aria-hidden />
      <div className="cinematic-grid-overlay" aria-hidden />

      <div className="relative z-10 mx-auto max-w-container">
        <RevealOnScroll className="mx-auto mb-14 max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-ai-cyan/15 px-3.5 py-1 text-xs font-semibold text-ai-cyan uppercase tracking-wider mb-4">
            <Sparkles className="h-3 w-3" />
            AI-Native Platform
          </div>
          <h2 className="text-headline-lg font-bold tracking-[-0.01em] text-gradient-cinematic md:text-display-lg">
            Built-in AI Capabilities
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-lg text-white/60">
            Not just another school ERP. eduAI365 is built AI-first — with intelligent
            features woven into every module, setting it apart from generic platforms.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AI_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <RevealOnScroll key={feature.title} delay={index * 0.06}>
                <motion.article
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:border-ai-cyan/30 hover:bg-white/8 transition-all duration-300"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-ai-cyan/10">
                    <Icon className="h-5 w-5 text-ai-cyan" strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 className="text-title-md font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-body-md leading-relaxed text-white/55">
                    {feature.desc}
                  </p>
                </motion.article>
              </RevealOnScroll>
            );
          })}
        </div>

        <RevealOnScroll className="mt-14 text-center">
          <p className="text-body-lg text-white/50">
            <span className="text-ai-cyan font-bold text-headline-md">8</span>{' '}
            AI-powered capabilities.{' '}
            <span className="text-ai-cyan font-bold text-headline-md">1</span>{' '}
            unified intelligence layer.{' '}
            <span className="font-semibold text-white/80">Zero complexity.</span>
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}

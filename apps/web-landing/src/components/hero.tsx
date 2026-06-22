'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { buttonVariants, cn, heroStagger } from '@eduai365/ui';
import { HeroBackground } from '@/components/hero-background';
import { HeroParticles } from '@/components/hero-particles';
import { HeroVisualFallback } from '@/components/hero-visual-fallback';
import { WebGLErrorBoundary } from '@/components/webgl-error-boundary';
import { useMotionReady } from '@/hooks/use-motion-ready';
import { useWebGLAvailable } from '@/hooks/use-webgl-available';

const HeroScene = dynamic(
  () => import('./hero-scene').then((mod) => mod.HeroScene),
  { ssr: false, loading: () => null },
);

const STATS = [
  { value: 'Scale-Ready', label: 'Built for Institutions of Every Size' },
  { value: 'Multi-School', label: 'Designed for Multi-School Deployments' },
  { value: '27+', label: 'Integrated School Management Modules' },
];

export function Hero() {
  const motionReady = useMotionReady();
  const webglAvailable = useWebGLAvailable();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.05 });

  return (
    <section
      ref={containerRef}
      className="cinematic-dark-shell relative isolate min-h-[100svh] overflow-hidden"
    >
      <div className="cinematic-aurora" aria-hidden />
      <div className="cinematic-grid-overlay" aria-hidden />
      <HeroBackground />
      <HeroParticles isVisible={isInView} />

      {webglAvailable !== true && <HeroVisualFallback />}

      {webglAvailable === true && (
        <div
          className="pointer-events-none absolute inset-0 z-[4] min-h-[400px] w-full"
          aria-hidden
        >
          <WebGLErrorBoundary fallback={<HeroVisualFallback />}>
            <HeroScene isVisible={isInView} />
          </WebGLErrorBoundary>
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-container flex-col items-center justify-center px-4 pb-28 pt-24 text-center md:px-8 md:pt-28">
        <motion.div
          key={motionReady ? 'animated' : 'static'}
          variants={heroStagger.container}
          initial={motionReady ? 'initial' : false}
          animate="animate"
          className="flex flex-col items-center"
        >
          <motion.div variants={heroStagger.item}>
            <div className="premium-badge mb-8 inline-flex items-center gap-2 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-ai-cyan" aria-hidden />
              <span className="text-label-md font-medium text-ai-cyan">
                The Complete AI-Powered School Operating System
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={heroStagger.item}
            className="max-w-5xl text-[2.75rem] font-extrabold leading-[1.1] tracking-[-0.03em] md:text-[3.5rem] md:leading-[1.05]"
          >
            <span className="block text-gradient-cinematic">The Complete AI-Powered</span>
            <span className="block text-gradient-cinematic">
              School <span className="text-gradient-ai">Operating System</span>
            </span>
          </motion.h1>

          <motion.p
            variants={heroStagger.item}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/60 md:max-w-2xl md:text-lg"
          >
            Manage Admissions, Academics, Attendance, Finance, Transport, Communication,
            and AI-Powered Insights — from a Single Unified Platform.
          </motion.p>

          <motion.div
            variants={heroStagger.item}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#demo"
              className={cn(buttonVariants({ variant: 'ai', size: 'pill' }), 'px-8 py-3 text-base font-semibold')}
            >
              Book a Live Demo
            </a>
          </motion.div>



          <motion.div
            variants={heroStagger.item}
            className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-3 md:gap-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="glass-stat-chip px-3 py-4 md:px-4 md:py-5">
                <p className="text-2xl font-semibold tabular-nums text-white md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/50 md:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <a
          href="#features"
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-float-peaceful flex-col items-center gap-1 text-white/40 transition-colors hover:text-ai-cyan"
          aria-label="Scroll to features"
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">Explore</span>
          <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
        </a>
      </div>
    </section>
  );
}

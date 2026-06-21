'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import * as React from 'react';
import { cn } from '../lib/cn';
import { cardHover3d, staggerContainer, staggerItem } from '../motion/presets';

export interface CinematicCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'glass-dark' | 'solid' | 'ai';
  glow?: boolean;
  tilt?: boolean;
  stagger?: boolean;
}

const variantClasses: Record<NonNullable<CinematicCardProps['variant']>, string> = {
  glass: 'glass-panel-3d border-white/15 bg-white/[0.07] text-white',
  'glass-dark': 'glass-panel-dark text-white',
  solid: 'rounded-2xl border border-surface-faint bg-white text-on-surface shadow-card',
  ai: 'ai-glow-border border-ai-violet/40 bg-cinematic-card/80 text-white',
};

export function CinematicCard({
  children,
  className,
  variant = 'solid',
  glow = false,
  tilt = true,
  stagger = false,
}: CinematicCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
  const glareX = useSpring(useMotionValue(50), { stiffness: 300, damping: 30 });
  const glareY = useSpring(useMotionValue(50), { stiffness: 300, damping: 30 });

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18) 0%, transparent 60%)`;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rotateX.set((y - 0.5) * -12);
    rotateY.set((x - 0.5) * 12);
    glareX.set(x * 100);
    glareY.set(y * 100);
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  };

  const content = (
    <motion.div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 md:p-6',
        variantClasses[variant],
        glow && 'shadow-ai-glow',
        tilt && 'transform-gpu',
        className,
      )}
      style={
        tilt
          ? {
              rotateX,
              rotateY,
              transformPerspective: 1200,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
      onPointerMove={tilt ? handlePointerMove : undefined}
      onPointerLeave={tilt ? handlePointerLeave : undefined}
      {...(tilt ? cardHover3d : {})}
    >
      {tilt && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glareBackground }}
          aria-hidden
        />
      )}
      {stagger ? (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="relative z-20">
          {React.Children.map(children, (child) => (
            <motion.div variants={staggerItem}>{child}</motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="relative z-20">{children}</div>
      )}
    </motion.div>
  );

  return content;
}

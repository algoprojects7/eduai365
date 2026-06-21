'use client';

import { motion, useInView } from 'framer-motion';
import * as React from 'react';
import { cn } from '../lib/cn';
import { revealOnScroll } from '../motion/presets';

export interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  amount?: number;
}

const directionOffset = {
  up: { y: 28, x: 0 },
  down: { y: -28, x: 0 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

export function RevealOnScroll({
  children,
  className,
  delay = 0,
  direction = 'up',
  amount = 0.12,
}: RevealOnScrollProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const offset = directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{ opacity: 1, x: offset.x, y: offset.y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 1, x: offset.x, y: offset.y }}
      transition={{ ...revealOnScroll.transition, delay: inView ? delay : 0 }}
    >
      {children}
    </motion.div>
  );
}

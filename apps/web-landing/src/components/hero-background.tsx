'use client';

import { motion } from 'framer-motion';

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <div className="absolute -right-[10%] top-[8%] h-[min(380px,50vw)] w-[min(380px,50vw)] rounded-full bg-[rgba(27,100,241,0.18)] blur-3xl" />
      <div className="absolute -left-[8%] bottom-[15%] h-[min(320px,42vw)] w-[min(320px,42vw)] rounded-full bg-[rgba(124,58,237,0.14)] blur-3xl" />
      <motion.div
        className="absolute right-[12%] top-[55%] h-24 w-24 rounded-full bg-[rgba(34,211,238,0.12)]"
        animate={{ y: [0, -12, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

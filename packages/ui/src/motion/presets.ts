export const pageTransition = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
} as const;

export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  whileTap: { scale: 0.98 },
} as const;

export const cardHover3d = {
  whileHover: {
    y: -6,
    scale: 1.01,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  whileTap: { scale: 0.99 },
} as const;

export const aiPulse = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(124, 58, 237, 0.2)',
      '0 0 40px rgba(124, 58, 237, 0.55)',
      '0 0 20px rgba(124, 58, 237, 0.2)',
    ],
  },
  transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
};

export const aiPulseSubtle = {
  animate: {
    boxShadow: [
      '0 0 12px rgba(27, 100, 241, 0.15)',
      '0 0 28px rgba(124, 58, 237, 0.35)',
      '0 0 12px rgba(27, 100, 241, 0.15)',
    ],
  },
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
};

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
} as const;

export const staggerItem = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
} as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
} as const;

export const revealOnScroll = {
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
} as const;

export const heroStagger = {
  container: {
    initial: {},
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  },
  item: {
    initial: { opacity: 0, y: 24 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
    },
  },
} as const;

export const floatAnimation = {
  animate: { y: [-8, 8, -8] },
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
} as const;

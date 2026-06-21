/** Design tokens — source of truth from docs/design.md */
export const colors = {
  surface: '#f8f9ff',
  surfaceFaint: '#F5F5F7',
  primary: '#000519',
  primaryContainer: '#0B1D42',
  secondary: '#0052d2',
  secondaryContainer: '#276bf7',
  tertiary: '#0a0022',
  tertiaryContainer: '#290062',
  aiElectric: '#1B64F1',
  aiViolet: '#7C3AED',
  aiCyan: '#22D3EE',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#45464e',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  cinematicDark: '#0B1120',
  cinematicCard: '#131B2E',
  cinematicNavy: '#050A1E',
} as const;

export const typography = {
  displayLg: { fontSize: '48px', lineHeight: '56px', fontWeight: 700, letterSpacing: '-0.02em' },
  headlineLg: { fontSize: '32px', lineHeight: '40px', fontWeight: 700, letterSpacing: '-0.01em' },
  headlineMd: { fontSize: '24px', lineHeight: '32px', fontWeight: 600 },
  titleLg: { fontSize: '20px', lineHeight: '28px', fontWeight: 600 },
  bodyLg: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
  bodyMd: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
  labelMd: { fontSize: '12px', lineHeight: '16px', fontWeight: 500, letterSpacing: '0.05em' },
} as const;

export const spacing = {
  base: 4,
  gutter: 24,
  marginDesktop: 32,
  marginMobile: 16,
  containerMax: 1440,
} as const;

export const elevation = {
  level0: 'transparent',
  level1: colors.surfaceFaint,
  level2: '0px 4px 20px rgba(11, 29, 66, 0.05)',
  level3: '0px 8px 32px rgba(11, 29, 66, 0.12)',
  cinematic: '0 20px 60px rgba(0, 0, 0, 0.4)',
  aiGlow: '0 0 24px rgba(124, 58, 237, 0.25)',
  aiGlowStrong: '0 0 48px rgba(27, 100, 241, 0.45)',
} as const;

export const motion = {
  durationFast: 150,
  durationNormal: 300,
  durationSlow: 600,
  durationCinematic: 1200,
  easingPremium: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easingSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const breakpoints = {
  mobile: 767,
  tablet: 768,
  desktop: 1024,
} as const;

export type ColorToken = keyof typeof colors;

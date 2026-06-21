/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          faint: '#F5F5F7',
          variant: '#d3e4fe',
          container: {
            lowest: '#ffffff',
            low: '#eff4ff',
            DEFAULT: '#e5eeff',
            high: '#dce9ff',
            highest: '#d3e4fe',
          },
        },
        'on-surface': {
          DEFAULT: '#0b1c30',
          variant: '#45464e',
        },
        primary: {
          DEFAULT: '#000519',
          container: '#0b1d42',
          foreground: '#ffffff',
          fixed: '#dae2ff',
        },
        secondary: {
          DEFAULT: '#0052d2',
          container: '#276bf7',
          foreground: '#ffffff',
        },
        tertiary: {
          DEFAULT: '#0a0022',
          container: '#290062',
          foreground: '#ffffff',
        },
        ai: {
          electric: '#1B64F1',
          violet: '#7C3AED',
        },
        success: {
          DEFAULT: '#10B981',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#ffffff',
        },
        error: {
          DEFAULT: '#EF4444',
          foreground: '#ffffff',
        },
        cinematic: {
          dark: '#0B1120',
          card: '#131B2E',
          navy: '#050A1E',
        },
        'ai-cyan': '#22D3EE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '80px', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'title-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        'body-md': ['14px', { lineHeight: '20px' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      maxWidth: {
        container: '1440px',
      },
      spacing: {
        gutter: '24px',
        'margin-desktop': '32px',
        'margin-mobile': '16px',
      },
      boxShadow: {
        card: '0px 4px 20px rgba(11, 29, 66, 0.05)',
        popover: '0px 8px 32px rgba(11, 29, 66, 0.12)',
        'ai-glow': '0 0 24px rgba(124, 58, 237, 0.25)',
        'ai-glow-strong': '0 0 40px rgba(27, 100, 241, 0.35)',
        cinematic: '0 20px 60px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #0052d2 0%, #7C3AED 100%)',
        'hero-gradient': 'linear-gradient(180deg, #050A1E 0%, #0B1D42 100%)',
        'ai-card-gradient':
          'linear-gradient(135deg, rgba(27, 100, 241, 0.08) 0%, rgba(124, 58, 237, 0.12) 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'float-y': 'float-y 6s ease-in-out infinite',
        'aurora-spin': 'aurora-spin 25s linear infinite',
        'pulse-glow-cinematic': 'pulse-glow-cinematic 3s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.55)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'aurora-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-glow-cinematic': {
          '0%, 100%': { boxShadow: '0 0 24px rgba(124, 58, 237, 0.25)' },
          '50%': { boxShadow: '0 0 48px rgba(27, 100, 241, 0.45)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      perspective: {
        cinematic: '1200px',
      },
    },
  },
  plugins: [],
};

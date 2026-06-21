export const chartColors = {
  primary: '#1B64F1',
  secondary: '#0052d2',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  aiViolet: '#7C3AED',
  muted: '#c5c6cf',
  grid: 'rgba(11, 29, 66, 0.06)',
} as const;

export const chartTheme = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  colors: chartColors,
  tooltip: {
    contentStyle: {
      borderRadius: '8px',
      border: '1px solid rgba(11, 29, 66, 0.08)',
      boxShadow: '0px 4px 20px rgba(11, 29, 66, 0.08)',
    },
  },
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: chartColors.grid,
  },
} as const;

export const rechartsAxisProps = {
  tick: { fill: '#45464e', fontSize: 12 },
  axisLine: { stroke: 'rgba(11, 29, 66, 0.1)' },
  tickLine: false,
} as const;

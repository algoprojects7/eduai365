import * as React from 'react';
import { cn } from '../lib/cn';

export interface DarkModuleShellProps {
  children: React.ReactNode;
  className?: string;
}

/** Cinematic dark shell for Payroll, Leave, Substitution modules */
export function DarkModuleShell({ children, className }: DarkModuleShellProps) {
  return (
    <div className={cn('cinematic-dark-shell', className)}>
      <div className="cinematic-grid-overlay" aria-hidden />
      {children}
    </div>
  );
}

export function DarkBentoCard({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'glass-panel-dark rounded-2xl border border-white/10 p-5 transition-all duration-300 md:p-6',
        glow && 'shadow-ai-glow animate-pulse-glow-cinematic',
        'hover:-translate-y-0.5 hover:shadow-cinematic',
        className,
      )}
    >
      {children}
    </div>
  );
}

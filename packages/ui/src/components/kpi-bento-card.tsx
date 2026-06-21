import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import { cardHover3d } from '../motion/presets';
import { cn } from '../lib/cn';

export interface KpiBentoCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  iconClassName?: string;
  className?: string;
  children?: React.ReactNode;
}

export function KpiBentoCard({
  label,
  value,
  icon: Icon,
  trend,
  iconClassName,
  className,
  children,
}: KpiBentoCardProps) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-success'
      : trend?.direction === 'down'
        ? 'text-error'
        : 'text-on-surface-variant';

  return (
    <motion.div
      className={cn('bento-card-interactive perspective-cinematic', className)}
      {...cardHover3d}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-label-md uppercase tracking-wider text-on-surface-variant">{label}</p>
          <p className="text-headline-lg font-bold tabular-nums">{value}</p>
          {trend && (
            <p className={cn('text-body-md font-medium', trendColor)}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low',
              iconClassName,
            )}
          >
            <Icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}

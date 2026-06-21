import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import * as React from 'react';
import { aiPulse } from '../motion/presets';
import { cn } from '../lib/cn';
import { Badge } from './badge';
import { Button } from './button';

export interface AiInsightCardProps {
  title: string;
  description: React.ReactNode;
  badge?: string;
  confidence?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'light' | 'dark';
  className?: string;
  children?: React.ReactNode;
}

export function AiInsightCard({
  title,
  description,
  badge = 'AI ANALYSIS ACTIVE',
  confidence,
  actionLabel,
  onAction,
  variant = 'light',
  className,
  children,
}: AiInsightCardProps) {
  const isDark = variant === 'dark';

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-lg p-5 md:p-6',
        isDark
          ? 'bg-cinematic-card text-white shadow-cinematic'
          : 'ai-glow-border bg-white',
        className,
      )}
      {...(isDark ? {} : { animate: aiPulse.animate, transition: aiPulse.transition })}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isDark ? 'bg-ai-violet/20' : 'bg-ai-violet/10',
            )}
          >
            <Sparkles className="h-5 w-5 text-ai-violet" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-title-lg font-semibold">{title}</h3>
            <Badge variant="ai" className="mt-1">
              {badge}
            </Badge>
          </div>
        </div>
        {confidence && (
          <span className="text-body-md font-medium text-ai-electric">{confidence}</span>
        )}
      </div>

      <p className={cn('mt-4 text-body-md leading-relaxed', isDark ? 'text-white/80' : 'text-on-surface-variant')}>
        {description}
      </p>

      {children}

      {actionLabel && (
        <Button
          variant={isDark ? 'ai' : 'ghost'}
          size="sm"
          className="mt-4"
          onClick={onAction}
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}

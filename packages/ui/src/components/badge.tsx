import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-surface-container text-on-surface',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        info: 'bg-ai-electric/10 text-ai-electric',
        ai: 'bg-ai-violet/10 text-ai-violet',
        outline: 'border border-gray-300/50 text-on-surface-variant',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({
  status,
  className,
}: {
  status: 'active' | 'pending' | 'processed' | 'critical' | 'warning' | 'inactive';
  className?: string;
}) {
  const map = {
    active: 'success' as const,
    processed: 'success' as const,
    pending: 'warning' as const,
    warning: 'warning' as const,
    critical: 'error' as const,
    inactive: 'outline' as const,
  };
  const labels = {
    active: 'Active',
    processed: 'Processed',
    pending: 'Pending',
    warning: 'Warning',
    critical: 'Critical',
    inactive: 'Inactive',
  };
  return (
    <Badge variant={map[status]} className={className}>
      {labels[status]}
    </Badge>
  );
}

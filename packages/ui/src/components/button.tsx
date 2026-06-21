import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-electric focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'btn-shimmer bg-secondary text-white hover:bg-secondary-container shadow-card hover:shadow-ai-glow',
        secondary: 'btn-shimmer bg-primary-container text-white hover:opacity-90 shadow-card',
        ai: 'btn-shimmer bg-ai-gradient text-white shadow-ai-glow hover:shadow-ai-glow-strong hover:scale-[1.02]',
        ghost: 'border border-gray-300/50 bg-transparent text-on-surface hover:bg-surface-faint',
        'ghost-glass':
          'border border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/30',
        destructive: 'bg-error text-white hover:opacity-90',
        link: 'text-secondary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        pill: 'h-10 rounded-full px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };

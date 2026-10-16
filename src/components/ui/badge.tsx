import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border border-sky-500/30 bg-sky-500/15 text-sky-300 shadow-sm shadow-sky-500/10',
        secondary:
          'border border-slate-700 bg-slate-800 text-slate-300',
        destructive:
          'border border-rose-500/30 bg-rose-500/15 text-rose-300 shadow-sm shadow-rose-500/10',
        success:
          'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/10',
        warning:
          'border border-amber-500/30 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/10',
        purple:
          'border border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-sm shadow-purple-500/10',
        cyan:
          'border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/10',
        outline:
          'text-slate-200 border border-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

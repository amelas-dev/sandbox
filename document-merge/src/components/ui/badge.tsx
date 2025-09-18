import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default'
          ? 'border-transparent bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
          : 'border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200',
        className,
      )}
      {...props}
    />
  );
}

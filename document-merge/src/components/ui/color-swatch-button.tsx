import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColorSwatchButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  color?: string | null;
  label: string;
  active?: boolean;
  showCheck?: boolean;
}

function getSwatchStyle(color: string | null | undefined, style?: React.CSSProperties) {
  if (color) {
    return {
      backgroundColor: color,
      ...style,
    } satisfies React.CSSProperties;
  }

  return {
    backgroundImage:
      'linear-gradient(135deg, rgba(100,116,139,0.35) 0%, rgba(100,116,139,0.35) 48%, transparent 50%, transparent 100%)',
    backgroundColor: '#f8fafc',
    ...style,
  } satisfies React.CSSProperties;
}

export const ColorSwatchButton = React.forwardRef<HTMLButtonElement, ColorSwatchButtonProps>(
  ({ color, label, active, showCheck = true, className, style, onClick, disabled, ...props }, ref) => {
    return (
      <button
        type='button'
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:focus-visible:ring-offset-slate-900',
          active
            ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
            : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-slate-600 dark:hover:ring-offset-slate-900',
          className,
        )}
        style={getSwatchStyle(color ?? null, style)}
        aria-pressed={active}
        {...props}
      >
        <span className='sr-only'>{label}</span>
        {showCheck && active ? (
          <Check className='h-4 w-4 text-white mix-blend-difference drop-shadow' aria-hidden='true' />
        ) : null}
      </button>
    );
  },
);

ColorSwatchButton.displayName = 'ColorSwatchButton';

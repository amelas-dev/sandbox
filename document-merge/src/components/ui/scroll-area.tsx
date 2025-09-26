import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden group/scrollbar', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner className="bg-slate-100 dark:bg-slate-800" />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none rounded-full bg-transparent p-0.5 opacity-0 transition-all duration-200 ease-out',
      'group-hover/scrollbar:opacity-100 group-focus-within/scrollbar:opacity-100 group-active/scrollbar:opacity-100',
      'group-hover/scrollbar:bg-slate-200/70 group-focus-within/scrollbar:bg-slate-200/70 dark:group-hover/scrollbar:bg-slate-700/50 dark:group-focus-within/scrollbar:bg-slate-700/50',
      'data-[state=visible]:opacity-100 data-[state=hidden]:pointer-events-none',
      orientation === 'vertical'
        ? 'h-full w-2.5 border-l border-l-transparent p-0.5'
        : 'h-2.5 w-full flex-col border-t border-t-transparent p-0.5',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.Thumb
      className="relative flex-1 rounded-full bg-slate-400/60 transition-colors duration-200 dark:bg-slate-500/60 hover:bg-brand-500/60 focus-visible:bg-brand-500/70"
    />
  </ScrollAreaPrimitive.Scrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

export { ScrollArea, ScrollBar };
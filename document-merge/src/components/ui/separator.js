import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';
const Separator = React.forwardRef(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (_jsx(SeparatorPrimitive.Root, { ref: ref, decorative: decorative, orientation: orientation, className: cn('shrink-0 bg-slate-200 dark:bg-slate-800', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className), ...props })));
Separator.displayName = SeparatorPrimitive.Root.displayName;
export { Separator };

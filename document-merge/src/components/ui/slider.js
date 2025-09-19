import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
const Slider = React.forwardRef(({ className, ...props }, ref) => (_jsxs(SliderPrimitive.Root, { ref: ref, className: cn('relative flex w-full touch-none select-none items-center', className), ...props, children: [_jsx(SliderPrimitive.Track, { className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", children: _jsx(SliderPrimitive.Range, { className: "absolute h-full bg-brand-500" }) }), _jsx(SliderPrimitive.Thumb, { className: "block h-4 w-4 rounded-full border border-brand-600 bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2" })] })));
Slider.displayName = SliderPrimitive.Root.displayName;
export { Slider };

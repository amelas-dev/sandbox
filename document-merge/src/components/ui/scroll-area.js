import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';
const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(ScrollAreaPrimitive.Root, { ref: ref, className: cn('relative overflow-hidden', className), ...props, children: [_jsx(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded inherit", children: children }), _jsx(ScrollAreaPrimitive.Scrollbar, { className: "flex touch-none select-none rounded-full bg-slate-100 p-0.5 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700", orientation: "vertical", children: _jsx(ScrollAreaPrimitive.Thumb, { className: "relative flex-1 rounded-full bg-slate-400 dark:bg-slate-600" }) }), _jsx(ScrollAreaPrimitive.Corner, { className: "bg-slate-100 dark:bg-slate-800" })] })));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
export { ScrollArea };

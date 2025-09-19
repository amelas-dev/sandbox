import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Clipboard, PenSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function MergeTagView({ node, extension, updateAttributes, editor }) {
    const { fieldKey, label } = node.attrs;
    const options = extension.options;
    const sample = React.useMemo(() => options.sampleProvider?.(fieldKey) ?? '', [options, fieldKey]);
    const displayLabel = label || fieldKey;
    const isValid = options.isFieldValid ? options.isFieldValid(fieldKey) : true;
    const handleEditLabel = () => {
        const next = window.prompt('Merge tag label', displayLabel);
        if (next) {
            updateAttributes({ label: next });
        }
    };
    const handleCopy = async () => {
        await navigator.clipboard.writeText(`{{${fieldKey}}}`);
    };
    const handleRemove = () => {
        const position = editor.state.selection.from;
        if (options.onRemove) {
            options.onRemove(position);
            return;
        }
        editor.commands.command(({ tr }) => {
            tr.deleteRange(position - node.nodeSize + 1, position);
            return true;
        });
    };
    return (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(TooltipTrigger, { asChild: true, children: _jsx("span", { "data-merge-tag": fieldKey, className: cn('inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs shadow-sm transition hover:border-brand-500 dark:border-brand-900/60 dark:bg-brand-950/40', isValid
                                        ? 'border-brand-200 bg-brand-50 text-brand-700'
                                        : 'border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-200'), children: `{{${displayLabel}}}` }) }) }), _jsxs(DropdownMenuContent, { align: "start", className: "w-48", children: [_jsxs(DropdownMenuItem, { onSelect: handleEditLabel, children: [_jsx(PenSquare, { className: "mr-2 h-4 w-4" }), " Edit label"] }), _jsxs(DropdownMenuItem, { onSelect: handleCopy, children: [_jsx(Clipboard, { className: "mr-2 h-4 w-4" }), " Copy as text"] }), _jsxs(DropdownMenuItem, { onSelect: handleRemove, className: "text-red-600", children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), " Remove"] })] })] }), _jsx(TooltipContent, { children: sample ? `Sample: ${sample}` : 'No sample value' })] }) }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, Heading1, Heading2, Heading3, Highlighter, Italic, Link as LinkIcon, Link2Off, List, ListOrdered, Palette, Pilcrow, Quote, Redo2, RemoveFormatting, Strikethrough, Underline, Undo2, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
const ToolbarButton = React.forwardRef(({ label, isActive, children, className, ...props }, ref) => (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs(Button, { ref: ref, type: 'button', variant: 'ghost', size: 'sm', "aria-pressed": isActive, className: cn('h-9 w-9 rounded-lg border border-transparent p-0 text-slate-600 shadow-sm hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800', isActive &&
                    'border-brand-500 bg-brand-50 text-brand-700 hover:bg-brand-50 dark:border-brand-400/70 dark:bg-brand-950/40 dark:text-brand-200', className), ...props, children: [children, _jsx("span", { className: 'sr-only', children: label })] }) }), _jsx(TooltipContent, { children: label })] })));
ToolbarButton.displayName = 'ToolbarButton';
const HEADING_OPTIONS = [
    { label: 'Paragraph', value: 'paragraph', icon: Pilcrow },
    { label: 'Heading 1', value: 'heading-1', icon: Heading1, level: 1 },
    { label: 'Heading 2', value: 'heading-2', icon: Heading2, level: 2 },
    { label: 'Heading 3', value: 'heading-3', icon: Heading3, level: 3 },
];
const TEXT_COLORS = [
    { label: 'Default', value: '', swatch: 'bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700' },
    { label: 'Slate', value: '#0f172a', swatch: 'bg-slate-900' },
    { label: 'Gray', value: '#475569', swatch: 'bg-slate-600' },
    { label: 'Brand', value: '#7c3aed', swatch: 'bg-brand-600' },
    { label: 'Blue', value: '#2563eb', swatch: 'bg-blue-600' },
    { label: 'Emerald', value: '#059669', swatch: 'bg-emerald-600' },
    { label: 'Rose', value: '#db2777', swatch: 'bg-rose-500' },
    { label: 'Orange', value: '#ea580c', swatch: 'bg-orange-500' },
];
const HIGHLIGHT_COLORS = [
    { label: 'None', value: '', swatch: 'bg-transparent border border-dashed border-slate-300 dark:border-slate-700' },
    { label: 'Lemon', value: '#fef08a', swatch: 'bg-yellow-200' },
    { label: 'Sky', value: '#bae6fd', swatch: 'bg-sky-200' },
    { label: 'Mint', value: '#bbf7d0', swatch: 'bg-emerald-200' },
    { label: 'Lilac', value: '#e9d5ff', swatch: 'bg-violet-200' },
    { label: 'Rose', value: '#fecdd3', swatch: 'bg-rose-200' },
    { label: 'Slate', value: '#cbd5f5', swatch: 'bg-indigo-100' },
];
export function TextFormattingToolbar({ editor, className }) {
    const [linkMenuOpen, setLinkMenuOpen] = React.useState(false);
    const [linkValue, setLinkValue] = React.useState('');
    React.useEffect(() => {
        if (!editor)
            return;
        if (linkMenuOpen) {
            const current = editor.getAttributes('link').href;
            setLinkValue(current ?? '');
        }
    }, [editor, linkMenuOpen]);
    if (!editor) {
        return null;
    }
    const activeHeading = HEADING_OPTIONS.find((option) => {
        if (option.value === 'paragraph') {
            return editor.isActive('paragraph');
        }
        return editor.isActive('heading', { level: option.level });
    }) ?? HEADING_OPTIONS[0];
    const ActiveHeadingIcon = activeHeading.icon;
    const textColor = editor.getAttributes('textStyle').color ?? '';
    const highlightColor = editor.getAttributes('highlight').color ?? '';
    const canUndo = editor.can().chain().undo().run();
    const canRedo = editor.can().chain().redo().run();
    const applyHeading = (option) => {
        if (option.value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        }
        else {
            editor.chain().focus().setHeading({ level: option.level }).run();
        }
    };
    const applyTextColor = (color) => {
        if (!color) {
            editor.chain().focus().unsetColor().run();
            return;
        }
        editor.chain().focus().setColor(color).run();
    };
    const applyHighlight = (color) => {
        if (!color) {
            editor.chain().focus().unsetHighlight().run();
            return;
        }
        editor.chain().focus().setHighlight({ color }).run();
    };
    const handleSetLink = (event) => {
        event.preventDefault();
        const value = linkValue.trim();
        if (!value) {
            editor.chain().focus().unsetLink().run();
            setLinkMenuOpen(false);
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
        setLinkMenuOpen(false);
    };
    const handleUnsetLink = () => {
        editor.chain().focus().unsetLink().run();
        setLinkMenuOpen(false);
    };
    const isAlignActive = (alignment) => {
        return editor.isActive({ textAlign: alignment });
    };
    return (_jsx(TooltipProvider, { delayDuration: 100, children: _jsxs("div", { className: cn('flex w-full flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70', className), children: [_jsxs("div", { className: 'flex items-center gap-1', children: [_jsx(ToolbarButton, { label: 'Undo', onClick: () => editor.chain().focus().undo().run(), disabled: !canUndo, children: _jsx(Undo2, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Redo', onClick: () => editor.chain().focus().redo().run(), disabled: !canRedo, children: _jsx(Redo2, { className: 'h-4 w-4' }) })] }), _jsx(Separator, { orientation: 'vertical', className: 'h-6' }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { type: 'button', variant: 'outline', size: 'sm', className: 'h-9 gap-2 rounded-lg border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100', children: [_jsx(ActiveHeadingIcon, { className: 'h-4 w-4' }), _jsx("span", { children: activeHeading.label })] }) }), _jsx(DropdownMenuContent, { className: 'w-44 p-2', children: HEADING_OPTIONS.map((option) => (_jsxs(DropdownMenuItem, { onSelect: () => {
                                    applyHeading(option);
                                }, className: cn('flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800', activeHeading.value === option.value &&
                                    'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'), children: [_jsx(option.icon, { className: 'h-4 w-4' }), _jsx("span", { children: option.label })] }, option.value))) })] }), _jsx(Separator, { orientation: 'vertical', className: 'h-6' }), _jsxs("div", { className: 'flex items-center gap-1', children: [_jsx(ToolbarButton, { label: 'Bold', isActive: editor.isActive('bold'), onClick: () => editor.chain().focus().toggleBold().run(), children: _jsx(Bold, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Italic', isActive: editor.isActive('italic'), onClick: () => editor.chain().focus().toggleItalic().run(), children: _jsx(Italic, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Underline', isActive: editor.isActive('underline'), onClick: () => editor.chain().focus().toggleUnderline().run(), children: _jsx(Underline, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Strikethrough', isActive: editor.isActive('strike'), onClick: () => editor.chain().focus().toggleStrike().run(), children: _jsx(Strikethrough, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Inline code', isActive: editor.isActive('code'), onClick: () => editor.chain().focus().toggleCode().run(), children: _jsx(Code, { className: 'h-4 w-4' }) })] }), _jsx(Separator, { orientation: 'vertical', className: 'h-6' }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(ToolbarButton, { label: 'Text color', children: _jsx(Palette, { className: 'h-4 w-4' }) }) }), _jsxs(DropdownMenuContent, { className: 'w-56 p-2', children: [_jsx("div", { className: 'mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500', children: "Text color" }), _jsx("div", { className: 'grid grid-cols-4 gap-2', children: TEXT_COLORS.map((option) => (_jsxs(DropdownMenuItem, { onSelect: () => {
                                            applyTextColor(option.value);
                                        }, className: cn('flex cursor-pointer flex-col items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800', option.value && textColor === option.value &&
                                            'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200', !option.value && !textColor &&
                                            'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'), children: [_jsx("span", { className: cn('flex h-7 w-7 items-center justify-center rounded-full', option.swatch, !option.value && 'text-xs font-semibold text-slate-400 dark:text-slate-500'), children: !option.value && 'A' }), _jsx("span", { children: option.label })] }, option.label))) })] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(ToolbarButton, { label: 'Highlight color', children: _jsx(Highlighter, { className: 'h-4 w-4' }) }) }), _jsxs(DropdownMenuContent, { className: 'w-56 p-2', children: [_jsx("div", { className: 'mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500', children: "Highlight" }), _jsx("div", { className: 'grid grid-cols-4 gap-2', children: HIGHLIGHT_COLORS.map((option) => (_jsxs(DropdownMenuItem, { onSelect: () => {
                                            applyHighlight(option.value);
                                        }, className: cn('flex cursor-pointer flex-col items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800', option.value && highlightColor === option.value &&
                                            'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200', !option.value && !highlightColor &&
                                            'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'), children: [_jsx("span", { className: cn('h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700', option.swatch, !option.value && 'flex items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-500'), children: !option.value && '×' }), _jsx("span", { children: option.label })] }, option.label))) })] })] }), _jsx(Separator, { orientation: 'vertical', className: 'h-6' }), _jsxs("div", { className: 'flex items-center gap-1', children: [_jsx(ToolbarButton, { label: 'Align left', isActive: isAlignActive('left'), onClick: () => editor.chain().focus().setTextAlign('left').run(), children: _jsx(AlignLeft, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Align center', isActive: isAlignActive('center'), onClick: () => editor.chain().focus().setTextAlign('center').run(), children: _jsx(AlignCenter, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Align right', isActive: isAlignActive('right'), onClick: () => editor.chain().focus().setTextAlign('right').run(), children: _jsx(AlignRight, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Justify', isActive: isAlignActive('justify'), onClick: () => editor.chain().focus().setTextAlign('justify').run(), children: _jsx(AlignJustify, { className: 'h-4 w-4' }) })] }), _jsx(Separator, { orientation: 'vertical', className: 'h-6' }), _jsxs("div", { className: 'flex items-center gap-1', children: [_jsx(ToolbarButton, { label: 'Bullet list', isActive: editor.isActive('bulletList'), onClick: () => editor.chain().focus().toggleBulletList().run(), children: _jsx(List, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Numbered list', isActive: editor.isActive('orderedList'), onClick: () => editor.chain().focus().toggleOrderedList().run(), children: _jsx(ListOrdered, { className: 'h-4 w-4' }) }), _jsx(ToolbarButton, { label: 'Blockquote', isActive: editor.isActive('blockquote'), onClick: () => editor.chain().focus().toggleBlockquote().run(), children: _jsx(Quote, { className: 'h-4 w-4' }) })] }), _jsx(Separator, { orientation: 'vertical', className: 'h-6' }), _jsxs(DropdownMenu, { open: linkMenuOpen, onOpenChange: setLinkMenuOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(ToolbarButton, { label: 'Insert link', isActive: editor.isActive('link'), children: _jsx(LinkIcon, { className: 'h-4 w-4' }) }) }), _jsx(DropdownMenuContent, { className: 'w-72 p-4', children: _jsxs("form", { className: 'space-y-3', onSubmit: handleSetLink, children: [_jsxs("div", { className: 'space-y-1', children: [_jsx(Label, { htmlFor: 'link-input', children: "Link URL" }), _jsx(Input, { id: 'link-input', value: linkValue, autoFocus: true, onChange: (event) => setLinkValue(event.target.value), placeholder: 'https://example.com' })] }), _jsxs("div", { className: 'flex items-center justify-between gap-2', children: [_jsx(Button, { type: 'submit', size: 'sm', className: 'flex-1', children: "Apply" }), _jsx(Button, { type: 'button', size: 'sm', variant: 'outline', onClick: handleUnsetLink, className: 'flex-1', children: "Remove" })] })] }) })] }), _jsx(ToolbarButton, { label: 'Remove link', disabled: !editor.isActive('link'), onClick: () => editor.chain().focus().unsetLink().run(), children: _jsx(Link2Off, { className: 'h-4 w-4' }) }), _jsx(Separator, { orientation: 'vertical', className: 'h-6' }), _jsx(ToolbarButton, { label: 'Clear formatting', onClick: () => editor.chain().focus().unsetAllMarks().clearNodes().run(), children: _jsx(RemoveFormatting, { className: 'h-4 w-4' }) })] }) }));
}

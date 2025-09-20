import * as React from 'react';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  Link2Off,
  List,
  ListOrdered,
  Palette,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface TextFormattingToolbarProps {
  editor: Editor | null;
  className?: string;
}

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isActive?: boolean;
  children: React.ReactNode;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ label, isActive, children, className, ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          type='button'
          variant='ghost'
          size='sm'
          aria-pressed={isActive}
          className={cn(
            'h-9 w-9 rounded-lg border border-transparent p-0 text-slate-600 shadow-sm hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800',
            isActive &&
              'border-brand-500 bg-brand-50 text-brand-700 hover:bg-brand-50 dark:border-brand-400/70 dark:bg-brand-950/40 dark:text-brand-200',
            className,
          )}
          {...props}
        >
          {children}
          <span className='sr-only'>{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ),
);
ToolbarButton.displayName = 'ToolbarButton';

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' as const, icon: Pilcrow },
  { label: 'Heading 1', value: 'heading-1' as const, icon: Heading1, level: 1 },
  { label: 'Heading 2', value: 'heading-2' as const, icon: Heading2, level: 2 },
  { label: 'Heading 3', value: 'heading-3' as const, icon: Heading3, level: 3 },
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

export function TextFormattingToolbar({ editor, className }: TextFormattingToolbarProps) {
  const [linkMenuOpen, setLinkMenuOpen] = React.useState(false);
  const [linkValue, setLinkValue] = React.useState('');

  React.useEffect(() => {
    if (!editor) return;
    if (linkMenuOpen) {
      const current = editor.getAttributes('link').href as string | undefined;
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

  const textColor = (editor.getAttributes('textStyle').color as string | undefined) ?? '';
  const highlightColor = (editor.getAttributes('highlight').color as string | undefined) ?? '';
  const canUndo = editor.can().chain().undo().run();
  const canRedo = editor.can().chain().redo().run();

  const applyHeading = (option: (typeof HEADING_OPTIONS)[number]) => {
    if (option.value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level: option.level as 1 | 2 | 3 }).run();
    }
  };

  const applyTextColor = (color: string) => {
    if (!color) {
      editor.chain().focus().unsetColor().run();
      return;
    }
    editor.chain().focus().setColor(color).run();
  };

  const applyHighlight = (color: string) => {
    if (!color) {
      editor.chain().focus().unsetHighlight().run();
      return;
    }
    editor.chain().focus().setHighlight({ color }).run();
  };

  const handleSetLink = (event: React.FormEvent<HTMLFormElement>) => {
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

  const isAlignActive = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    return editor.isActive({ textAlign: alignment });
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className={cn(
          'flex w-full flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70',
          className,
        )}
      >
        <div className='flex items-center gap-1'>
          <ToolbarButton
            label='Undo'
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!canUndo}
          >
            <Undo2 className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Redo'
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!canRedo}
          >
            <Redo2 className='h-4 w-4' />
          </ToolbarButton>
        </div>
        <Separator orientation='vertical' className='h-6' />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-9 gap-2 rounded-lg border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            >
              <ActiveHeadingIcon className='h-4 w-4' />
              <span>{activeHeading.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-44 p-2'>
            {HEADING_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => {
                  applyHeading(option);
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800',
                  activeHeading.value === option.value &&
                    'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200',
                )}
              >
                <option.icon className='h-4 w-4' />
                <span>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation='vertical' className='h-6' />
        <div className='flex items-center gap-1'>
          <ToolbarButton
            label='Bold'
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Italic'
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Underline'
            isActive={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Strikethrough'
            isActive={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Inline code'
            isActive={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className='h-4 w-4' />
          </ToolbarButton>
        </div>
        <Separator orientation='vertical' className='h-6' />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ToolbarButton label='Text color'>
              <Palette className='h-4 w-4' />
            </ToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56 p-2'>
            <div className='mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500'>Text color</div>
            <div className='grid grid-cols-4 gap-2'>
              {TEXT_COLORS.map((option) => (
                <DropdownMenuItem
                  key={option.label}
                  onSelect={() => {
                    applyTextColor(option.value);
                  }}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                    option.value && textColor === option.value &&
                      'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200',
                    !option.value && !textColor &&
                      'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full',
                      option.swatch,
                      !option.value && 'text-xs font-semibold text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {!option.value && 'A'}
                  </span>
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ToolbarButton label='Highlight color'>
              <Highlighter className='h-4 w-4' />
            </ToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56 p-2'>
            <div className='mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500'>Highlight</div>
            <div className='grid grid-cols-4 gap-2'>
              {HIGHLIGHT_COLORS.map((option) => (
                <DropdownMenuItem
                  key={option.label}
                  onSelect={() => {
                    applyHighlight(option.value);
                  }}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                    option.value && highlightColor === option.value &&
                      'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200',
                    !option.value && !highlightColor &&
                      'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200',
                  )}
                >
                  <span
                    className={cn(
                      'h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700',
                      option.swatch,
                      !option.value && 'flex items-center justify-center text-xs font-semibold text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {!option.value && '×'}
                  </span>
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation='vertical' className='h-6' />
        <div className='flex items-center gap-1'>
          <ToolbarButton
            label='Align left'
            isActive={isAlignActive('left')}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Align center'
            isActive={isAlignActive('center')}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Align right'
            isActive={isAlignActive('right')}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Justify'
            isActive={isAlignActive('justify')}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <AlignJustify className='h-4 w-4' />
          </ToolbarButton>
        </div>
        <Separator orientation='vertical' className='h-6' />
        <div className='flex items-center gap-1'>
          <ToolbarButton
            label='Bullet list'
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Numbered list'
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton
            label='Blockquote'
            isActive={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className='h-4 w-4' />
          </ToolbarButton>
        </div>
        <Separator orientation='vertical' className='h-6' />
        <DropdownMenu open={linkMenuOpen} onOpenChange={setLinkMenuOpen}>
          <DropdownMenuTrigger asChild>
            <ToolbarButton label='Insert link' isActive={editor.isActive('link')}>
              <LinkIcon className='h-4 w-4' />
            </ToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-72 p-4'>
            <form className='space-y-3' onSubmit={handleSetLink}>
              <div className='space-y-1'>
                <Label htmlFor='link-input'>Link URL</Label>
                <Input
                  id='link-input'
                  value={linkValue}
                  autoFocus
                  onChange={(event) => setLinkValue(event.target.value)}
                  placeholder='https://example.com'
                />
              </div>
              <div className='flex items-center justify-between gap-2'>
                <Button type='submit' size='sm' className='flex-1'>
                  Apply
                </Button>
                <Button type='button' size='sm' variant='outline' onClick={handleUnsetLink} className='flex-1'>
                  Remove
                </Button>
              </div>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton
          label='Remove link'
          disabled={!editor.isActive('link')}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Link2Off className='h-4 w-4' />
        </ToolbarButton>
        <Separator orientation='vertical' className='h-6' />
        <ToolbarButton
          label='Clear formatting'
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting className='h-4 w-4' />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  );
}

import * as React from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Clipboard, EyeOff, PenSquare, Trash2 } from 'lucide-react';
import type { MergeTagAttributes } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MergeTagOptions {
  sampleProvider?: (fieldKey: string) => string;
  isFieldValid?: (fieldKey: string) => boolean;
  onRemove?: (position: number) => void;
}

export function MergeTagView({
  node,
  extension,
  updateAttributes,
  editor,
}: NodeViewProps) {
  const { fieldKey, label, suppressIfEmpty } = node.attrs as MergeTagAttributes;
  const options = extension.options as MergeTagOptions;
  const sample = React.useMemo(
    () => options.sampleProvider?.(fieldKey) ?? '',
    [options, fieldKey],
  );
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

  return (
    <NodeViewWrapper as='span' data-merge-tag={fieldKey}>
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs shadow-sm transition hover:border-brand-500 dark:border-brand-900/60 dark:bg-brand-950/40',
                    isValid
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-200',
                  )}
                >
                  {`{{${displayLabel}}}`}
                </span>
              </TooltipTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-48'>
              <DropdownMenuItem onSelect={handleEditLabel}>
                <PenSquare className='mr-2 h-4 w-4' /> Edit label
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleCopy}>
                <Clipboard className='mr-2 h-4 w-4' /> Copy as text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                className='cursor-pointer'
                checked={Boolean(suppressIfEmpty)}
                onCheckedChange={(checked) => updateAttributes({ suppressIfEmpty: checked === true })}
              >
                <EyeOff className='mr-2 h-4 w-4' /> Suppress if empty
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleRemove}
                className='text-red-600'
              >
                <Trash2 className='mr-2 h-4 w-4' /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipContent>
            {sample ? `Sample: ${sample}` : 'No sample value'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </NodeViewWrapper>
  );
}

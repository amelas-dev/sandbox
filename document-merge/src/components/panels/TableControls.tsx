import * as React from 'react';
import type { Editor } from '@tiptap/core';
import { CellSelection } from '@tiptap/pm/tables';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eraser,
  Heading3,
  LayoutPanelLeft,
  LayoutPanelTop,
  PaintBucket,
  Palette,
  Rows3,
  Sparkles,
  Table as TableIcon,
  TableCellsMerge,
  TableCellsSplit,
  TableColumnsSplit,
  TableRowsSplit,
  TableProperties,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColorSwatchButton } from '@/components/ui/color-swatch-button';
import { cn } from '@/lib/utils';
import {
  DEFAULT_TABLE_BORDER_COLOR,
  DEFAULT_TABLE_BORDER_STYLE,
  DEFAULT_TABLE_BORDER_WIDTH,
  DEFAULT_TABLE_STRIPE_COLOR,
  type PremiumTableAttributes,
  type PremiumTableCellAttributes,
  type TableBorderStyle,
  type TableStripeOption,
  type TableStyleOption,
} from '@/editor/extensions/premium-table';

interface TableControlsProps {
  editor: Editor | null;
}

const INSERT_GRID_ROWS = 8;
const INSERT_GRID_COLUMNS = 8;

const BORDER_COLOR_PALETTE = [
  '#0f172a',
  '#1e293b',
  '#334155',
  '#475569',
  '#64748b',
  '#2563eb',
  '#7c3aed',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#cbd5f5',
  '#e2e8f0',
  '#f8fafc',
];

const STRIPE_COLOR_PALETTE = [
  'rgba(148, 163, 184, 0.12)',
  'rgba(99, 102, 241, 0.16)',
  'rgba(59, 130, 246, 0.16)',
  'rgba(14, 165, 233, 0.16)',
  'rgba(16, 185, 129, 0.16)',
  'rgba(249, 115, 22, 0.16)',
  'rgba(236, 72, 153, 0.16)',
  'rgba(79, 70, 229, 0.16)',
  '#f1f5f9',
  '#fef3c7',
];

const CELL_BACKGROUND_PALETTE = [
  '#ffffff',
  '#f8fafc',
  '#f1f5f9',
  '#e0f2fe',
  '#dbeafe',
  '#e0f2f1',
  '#dcfce7',
  '#fef3c7',
  '#fee2e2',
  '#fde68a',
  '#fae8ff',
  '#fdf2f8',
];

const buttonClass =
  'inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800';

function normalizeString(value: unknown | null | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function extractCellAttributes(
  editor: Editor,
): PremiumTableCellAttributes {
  const cellAttrs = (editor.getAttributes('tableCell') as PremiumTableCellAttributes) ?? {};
  if (Object.keys(cellAttrs).length > 0) {
    return cellAttrs;
  }
  const headerAttrs = (editor.getAttributes('tableHeader') as PremiumTableCellAttributes) ?? {};
  return headerAttrs;
}

export function TableControls({ editor }: TableControlsProps) {
  const [insertOpen, setInsertOpen] = React.useState(false);
  const [withHeaderRow, setWithHeaderRow] = React.useState(true);
  const [hoveredRows, setHoveredRows] = React.useState(3);
  const [hoveredCols, setHoveredCols] = React.useState(3);
  const [, forceUpdate] = React.useReducer((count: number) => count + 1, 0);

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    const handleUpdate = () => forceUpdate();
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  const tableActive = Boolean(editor?.isActive('table'));
  const canManager = editor?.can();
  const selection = editor?.state.selection;
  const cellSelection = selection instanceof CellSelection ? selection : null;
  const multiCellSelection = Boolean(cellSelection && cellSelection.ranges.length > 1);

  const tableAttributes = tableActive
    ? ((editor?.getAttributes('table') as Partial<PremiumTableAttributes>) ?? {})
    : ({} as Partial<PremiumTableAttributes>);
  const cellAttributes = editor && tableActive ? extractCellAttributes(editor) : ({} as PremiumTableCellAttributes);

  const borderColor = normalizeString(tableAttributes.borderColor) ?? DEFAULT_TABLE_BORDER_COLOR;
  const borderWidth = normalizeString(tableAttributes.borderWidth) ?? DEFAULT_TABLE_BORDER_WIDTH;
  const borderStyle = (normalizeString(tableAttributes.borderStyle) as TableBorderStyle | undefined) ?? DEFAULT_TABLE_BORDER_STYLE;
  const tableStyle = (normalizeString(tableAttributes.tableStyle) as TableStyleOption | undefined) ?? 'grid';
  const stripe = (normalizeString(tableAttributes.stripe) as TableStripeOption | undefined) ?? 'none';
  const stripeColor = normalizeString(tableAttributes.stripeColor) ?? DEFAULT_TABLE_STRIPE_COLOR;
  const cellBackground = normalizeString(cellAttributes.backgroundColor) ?? '';

  const canAddRowBefore = tableActive && Boolean(canManager?.addRowBefore?.());
  const canAddRowAfter = tableActive && Boolean(canManager?.addRowAfter?.());
  const canAddColumnBefore = tableActive && Boolean(canManager?.addColumnBefore?.());
  const canAddColumnAfter = tableActive && Boolean(canManager?.addColumnAfter?.());
  const canDeleteRow = tableActive && Boolean(canManager?.deleteRow?.());
  const canDeleteColumn = tableActive && Boolean(canManager?.deleteColumn?.());
  const canDeleteTable = tableActive && Boolean(canManager?.deleteTable?.());
  const canMerge = tableActive && Boolean(canManager?.mergeCells?.());
  const canSplit = tableActive && Boolean(canManager?.splitCell?.());
  const canToggleHeaderRow = tableActive && Boolean(canManager?.toggleHeaderRow?.());
  const canToggleHeaderColumn = tableActive && Boolean(canManager?.toggleHeaderColumn?.());
  const canToggleHeaderCell = tableActive && Boolean(canManager?.toggleHeaderCell?.());

  const handleOpenChange = (next: boolean) => {
    setInsertOpen(next);
    if (!next) {
      setHoveredRows(3);
      setHoveredCols(3);
    }
  };

  const handleInsertTable = (rows: number, cols: number) => {
    if (!editor) {
      return;
    }
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow })
      .run();
    setInsertOpen(false);
    setHoveredRows(3);
    setHoveredCols(3);
  };

  const handleSetTableAttributes = (next: Partial<PremiumTableAttributes>) => {
    if (!editor || !tableActive) {
      return;
    }
    editor.chain().focus().updateAttributes('table', next).run();
  };

  const handleSetCellBackground = (value: string | null) => {
    if (!editor || !tableActive) {
      return;
    }
    editor.chain().focus().setCellAttribute('backgroundColor', value).run();
  };

  const statusMessage = !editor
    ? 'Switch to edit mode to access table tools.'
    : !tableActive
      ? 'Place the cursor inside a table to enable structure and styling controls.'
      : multiCellSelection
        ? 'Actions apply to the highlighted cells.'
        : 'Actions apply to the current cell.';

  return (
    <div className='space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>Premium table editor</p>
          <p className='text-xs text-slate-500 dark:text-slate-400'>Insert tables and fine-tune layout, lines, and fills.</p>
        </div>
        <Popover open={insertOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn(buttonClass, 'whitespace-nowrap')}
              disabled={!editor}
            >
              <TableIcon className='h-4 w-4' />
              Insert table
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto space-y-3 p-4'>
            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>Size</p>
              <div className='flex flex-col gap-1'>
                {Array.from({ length: INSERT_GRID_ROWS }).map((_, rowIndex) => (
                  <div key={`row-${rowIndex}`} className='flex gap-1'>
                    {Array.from({ length: INSERT_GRID_COLUMNS }).map((__, colIndex) => {
                      const active = rowIndex < hoveredRows && colIndex < hoveredCols;
                      return (
                        <button
                          key={`cell-${rowIndex}-${colIndex}`}
                          type='button'
                          onMouseEnter={() => {
                            setHoveredRows(rowIndex + 1);
                            setHoveredCols(colIndex + 1);
                          }}
                          onClick={() => handleInsertTable(rowIndex + 1, colIndex + 1)}
                          className={cn(
                            'h-6 w-6 rounded border transition',
                            active
                              ? 'border-brand-500 bg-brand-500/80'
                              : 'border-slate-200 bg-slate-100 hover:border-brand-400 hover:bg-brand-100/60',
                          )}
                        >
                          <span className='sr-only'>Insert {rowIndex + 1} by {colIndex + 1} table</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                {hoveredRows} × {hoveredCols} cells · {withHeaderRow ? 'Header row included' : 'No header row'}
              </p>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Header row</span>
              <Button
                type='button'
                variant={withHeaderRow ? 'default' : 'outline'}
                size='sm'
                onClick={() => setWithHeaderRow((value) => !value)}
              >
                {withHeaderRow ? 'On' : 'Off'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className='grid gap-3 lg:grid-cols-2'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>Structure</p>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canAddRowBefore}
              onClick={() => editor?.chain().focus().addRowBefore().run()}
            >
              <ArrowUp className='h-4 w-4' />
              Row above
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canAddRowAfter}
              onClick={() => editor?.chain().focus().addRowAfter().run()}
            >
              <ArrowDown className='h-4 w-4' />
              Row below
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canAddColumnBefore}
              onClick={() => editor?.chain().focus().addColumnBefore().run()}
            >
              <ArrowLeft className='h-4 w-4' />
              Column left
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canAddColumnAfter}
              onClick={() => editor?.chain().focus().addColumnAfter().run()}
            >
              <ArrowRight className='h-4 w-4' />
              Column right
            </Button>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canDeleteRow}
              onClick={() => editor?.chain().focus().deleteRow().run()}
            >
              <TableRowsSplit className='h-4 w-4' />
              Delete row
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canDeleteColumn}
              onClick={() => editor?.chain().focus().deleteColumn().run()}
            >
              <TableColumnsSplit className='h-4 w-4' />
              Delete column
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn(buttonClass, 'text-red-600 dark:text-red-400')}
              disabled={!canDeleteTable}
              onClick={() => editor?.chain().focus().deleteTable().run()}
            >
              <Trash2 className='h-4 w-4' />
              Delete table
            </Button>
          </div>
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>Headers & cells</p>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canToggleHeaderRow}
              onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
            >
              <LayoutPanelTop className='h-4 w-4' />
              Header row
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canToggleHeaderColumn}
              onClick={() => editor?.chain().focus().toggleHeaderColumn().run()}
            >
              <LayoutPanelLeft className='h-4 w-4' />
              Header column
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canToggleHeaderCell}
              onClick={() => editor?.chain().focus().toggleHeaderCell().run()}
            >
              <Heading3 className='h-4 w-4' />
              Header cell
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canMerge}
              onClick={() => editor?.chain().focus().mergeCells().run()}
            >
              <TableCellsMerge className='h-4 w-4' />
              Merge
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!canSplit}
              onClick={() => editor?.chain().focus().splitCell().run()}
            >
              <TableCellsSplit className='h-4 w-4' />
              Split
            </Button>
          </div>
        </div>
      </div>

      <Separator className='bg-slate-200 dark:bg-slate-800' />

      <div className='grid gap-3 lg:grid-cols-2'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>
            <TableProperties className='h-4 w-4' />
            <span>Lines & layout</span>
          </div>
          <div className='space-y-2'>
            <div className='space-y-1'>
              <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Line style</span>
              <ToggleGroup
                type='single'
                value={tableStyle}
                onValueChange={(value) => value && handleSetTableAttributes({ tableStyle: value as TableStyleOption })}
                className='flex flex-wrap gap-1'
              >
                <ToggleGroupItem value='grid'>Grid</ToggleGroupItem>
                <ToggleGroupItem value='rows'>Rows</ToggleGroupItem>
                <ToggleGroupItem value='outline'>Outline</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className='space-y-1'>
              <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Line weight</span>
              <ToggleGroup
                type='single'
                value={borderWidth}
                onValueChange={(value) => value && handleSetTableAttributes({ borderWidth: value })}
                className='flex gap-1'
              >
                <ToggleGroupItem value='1px'>Thin</ToggleGroupItem>
                <ToggleGroupItem value='2px'>Medium</ToggleGroupItem>
                <ToggleGroupItem value='3px'>Bold</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className='space-y-1'>
              <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Line pattern</span>
              <ToggleGroup
                type='single'
                value={borderStyle}
                onValueChange={(value) => value && handleSetTableAttributes({ borderStyle: value as TableBorderStyle })}
                className='flex gap-1'
              >
                <ToggleGroupItem value='solid'>Solid</ToggleGroupItem>
                <ToggleGroupItem value='dashed'>Dashed</ToggleGroupItem>
                <ToggleGroupItem value='none'>None</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>
            <Palette className='h-4 w-4' />
            <span>Border color</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {BORDER_COLOR_PALETTE.map((color) => (
              <ColorSwatchButton
                key={color}
                color={color}
                label={`Apply border color ${color}`}
                active={borderColor.toLowerCase() === color.toLowerCase()}
                onClick={() => handleSetTableAttributes({ borderColor: color })}
                disabled={!tableActive}
                className='h-7 w-7'
              />
            ))}
          </div>
        </div>
      </div>

      <div className='grid gap-3 lg:grid-cols-2'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>
            <Rows3 className='h-4 w-4' />
            <span>Row banding</span>
          </div>
          <ToggleGroup
            type='single'
            value={stripe}
            onValueChange={(value) => value && handleSetTableAttributes({ stripe: value as TableStripeOption })}
            className='flex gap-1'
          >
            <ToggleGroupItem value='none'>Off</ToggleGroupItem>
            <ToggleGroupItem value='rows'>Rows</ToggleGroupItem>
          </ToggleGroup>
            <div className='space-y-1'>
              <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>Stripe color</span>
              <div className='flex flex-wrap gap-2'>
                {STRIPE_COLOR_PALETTE.map((color) => (
                  <ColorSwatchButton
                    key={color}
                    color={color}
                    label={`Apply stripe color ${color}`}
                    active={stripeColor.toLowerCase() === color.toLowerCase()}
                    onClick={() => handleSetTableAttributes({ stripeColor: color })}
                    disabled={!tableActive}
                    className='h-7 w-7'
                  />
                ))}
              </div>
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>
            <PaintBucket className='h-4 w-4' />
            <span>Cell fill</span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {CELL_BACKGROUND_PALETTE.map((color) => (
              <ColorSwatchButton
                key={color}
                color={color}
                label={`Fill cells with ${color}`}
                active={cellBackground.toLowerCase() === color.toLowerCase()}
                onClick={() => handleSetCellBackground(color)}
                disabled={!tableActive}
                className='h-7 w-7'
              />
            ))}
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={buttonClass}
              disabled={!tableActive || !cellBackground}
              onClick={() => handleSetCellBackground(null)}
            >
              <Eraser className='h-4 w-4' />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400'>
        <span>{statusMessage}</span>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className={buttonClass}
          disabled={!tableActive}
          onClick={() =>
            handleSetTableAttributes({
              tableStyle: 'grid',
              borderColor: DEFAULT_TABLE_BORDER_COLOR,
              borderWidth: DEFAULT_TABLE_BORDER_WIDTH,
              borderStyle: DEFAULT_TABLE_BORDER_STYLE,
              stripe: 'none',
              stripeColor: DEFAULT_TABLE_STRIPE_COLOR,
            })
          }
        >
          <Sparkles className='h-4 w-4' />
          Reset style
        </Button>
      </div>
    </div>
  );
}


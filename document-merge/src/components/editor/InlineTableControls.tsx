import * as React from 'react';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Heading3,
  EyeOff,
  LayoutPanelLeft,
  LayoutPanelTop,
  Plus,
  Rows3,
  Sparkles,
  TableCellsMerge,
  TableCellsSplit,
  TableColumnsSplit,
  TableRowsSplit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_TABLE_BORDER_COLOR,
  DEFAULT_TABLE_BORDER_STYLE,
  DEFAULT_TABLE_BORDER_WIDTH,
  DEFAULT_TABLE_STRIPE_COLOR,
  type PremiumTableAttributes,
  type TableBorderStyle,
  type TableStripeOption,
  type TableStyleOption,
} from '@/editor/extensions/premium-table';

const HOVER_THRESHOLD = 8;
const CONTROL_OFFSET = 18;
const MENU_WIDTH = 276;
const MENU_HEIGHT_ESTIMATE = 360;

interface RowControlState {
  anchorCell: HTMLTableCellElement;
  table: HTMLTableElement;
  boundary: 'before' | 'after';
  selectionPos: number;
}

interface ColumnControlState {
  anchorCell: HTMLTableCellElement;
  table: HTMLTableElement;
  boundary: 'before' | 'after';
  selectionPos: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  selectionPos: number;
}

const TABLE_STYLE_OPTIONS: Array<{ label: string; value: TableStyleOption }> = [
  { label: 'Grid lines', value: 'grid' },
  { label: 'Row bands', value: 'rows' },
  { label: 'Outline only', value: 'outline' },
];

const BORDER_STYLE_OPTIONS: Array<{ label: string; value: TableBorderStyle }> = [
  { label: 'Solid borders', value: 'solid' },
  { label: 'Dashed borders', value: 'dashed' },
  { label: 'No borders', value: 'none' },
];

const BORDER_COLOR_PRESETS = [
  { label: 'Slate', value: DEFAULT_TABLE_BORDER_COLOR },
  { label: 'Midnight', value: '#475569' },
  { label: 'Brand blue', value: '#2563eb' },
];

const FILL_COLOR_PRESETS: Array<{ label: string; value: string | null }> = [
  { label: 'No fill', value: null },
  { label: 'Soft gray', value: '#f1f5f9' },
  { label: 'Soft blue', value: '#e0f2fe' },
  { label: 'Soft green', value: '#dcfce7' },
  { label: 'Soft gold', value: '#fef3c7' },
];

const STRIPE_OPTIONS: Array<{ label: string; value: TableStripeOption }> = [
  { label: 'Stripe rows', value: 'rows' },
  { label: 'No stripes', value: 'none' },
];

const ALIGN_OPTIONS = [
  { label: 'Align left', value: 'left' as const, icon: AlignLeft },
  { label: 'Align center', value: 'center' as const, icon: AlignCenter },
  { label: 'Align right', value: 'right' as const, icon: AlignRight },
];

export interface InlineTableControlsProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLElement>;
}

/**
 * Inline table controls enable users to insert rows/columns and access a full
 * context menu directly from the table canvas without relying on the
 * properties sidebar.
 */
export function InlineTableControls({ editor, containerRef }: InlineTableControlsProps) {
  const [rowControl, setRowControl] = React.useState<RowControlState | null>(null);
  const [columnControl, setColumnControl] = React.useState<ColumnControlState | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [, forceGeometryUpdate] = React.useReducer((count: number) => count + 1, 0);

  const rowControlRef = React.useRef<RowControlState | null>(null);
  const columnControlRef = React.useRef<ColumnControlState | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    rowControlRef.current = rowControl;
  }, [rowControl]);

  React.useEffect(() => {
    columnControlRef.current = columnControl;
  }, [columnControl]);

  const computeRowHover = React.useCallback(
    (event: PointerEvent, cell: HTMLTableCellElement, table: HTMLTableElement): RowControlState | null => {
      const cellRect = cell.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const withinVerticalBounds =
        event.clientY >= tableRect.top - HOVER_THRESHOLD && event.clientY <= tableRect.bottom + HOVER_THRESHOLD;

      if (!withinVerticalBounds) {
        return null;
      }

      const distanceTop = Math.abs(event.clientY - cellRect.top);
      const distanceBottom = Math.abs(event.clientY - cellRect.bottom);
      const nearTop =
        distanceTop <= HOVER_THRESHOLD || (cellRect.top <= tableRect.top + 1 && event.clientY <= cellRect.top);
      const nearBottom =
        distanceBottom <= HOVER_THRESHOLD || (cellRect.bottom >= tableRect.bottom - 1 && event.clientY >= cellRect.bottom);

      if (!nearTop && !nearBottom) {
        return null;
      }

      const boundary: 'before' | 'after' =
        nearTop && (!nearBottom || distanceTop <= distanceBottom) ? 'before' : 'after';

      const sampleX = Math.min(cellRect.left + 8, cellRect.right - 2);
      const sampleY = Math.min(cellRect.top + 8, cellRect.bottom - 2);
      const coords = editor.view.posAtCoords({ left: sampleX, top: sampleY });

      if (!coords) {
        return null;
      }

      return {
        anchorCell: cell,
        table,
        boundary,
        selectionPos: coords.pos,
      };
    },
    [editor],
  );

  const computeColumnHover = React.useCallback(
    (event: PointerEvent, cell: HTMLTableCellElement, table: HTMLTableElement): ColumnControlState | null => {
      const cellRect = cell.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      const withinHorizontalBounds =
        event.clientX >= tableRect.left - HOVER_THRESHOLD && event.clientX <= tableRect.right + HOVER_THRESHOLD;

      if (!withinHorizontalBounds) {
        return null;
      }

      const distanceLeft = Math.abs(event.clientX - cellRect.left);
      const distanceRight = Math.abs(event.clientX - cellRect.right);
      const nearLeft =
        distanceLeft <= HOVER_THRESHOLD || (cellRect.left <= tableRect.left + 1 && event.clientX <= cellRect.left);
      const nearRight =
        distanceRight <= HOVER_THRESHOLD || (cellRect.right >= tableRect.right - 1 && event.clientX >= cellRect.right);

      if (!nearLeft && !nearRight) {
        return null;
      }

      const boundary: 'before' | 'after' =
        nearLeft && (!nearRight || distanceLeft <= distanceRight) ? 'before' : 'after';

      const sampleX = Math.min(cellRect.left + 8, cellRect.right - 2);
      const sampleY = Math.min(cellRect.top + 8, cellRect.bottom - 2);
      const coords = editor.view.posAtCoords({ left: sampleX, top: sampleY });

      if (!coords) {
        return null;
      }

      return {
        anchorCell: cell,
        table,
        boundary,
        selectionPos: coords.pos,
      };
    },
    [editor],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.closest('[data-inline-table-control]')) {
        return;
      }

      const cell = target.closest('td, th') as HTMLTableCellElement | null;
      const table = cell?.closest('table') as HTMLTableElement | null;

      if (!cell || !table) {
        if (rowControlRef.current) {
          setRowControl(null);
        }
        if (columnControlRef.current) {
          setColumnControl(null);
        }
        return;
      }

      const nextRow = computeRowHover(event, cell, table);
      const prevRow = rowControlRef.current;

      if (nextRow) {
        if (!prevRow || prevRow.anchorCell !== nextRow.anchorCell || prevRow.boundary !== nextRow.boundary) {
          setRowControl(nextRow);
        }
      } else if (prevRow) {
        setRowControl(null);
      }

      const nextColumn = computeColumnHover(event, cell, table);
      const prevColumn = columnControlRef.current;

      if (nextColumn) {
        if (
          !prevColumn ||
          prevColumn.anchorCell !== nextColumn.anchorCell ||
          prevColumn.boundary !== nextColumn.boundary
        ) {
          setColumnControl(nextColumn);
        }
      } else if (prevColumn) {
        setColumnControl(null);
      }
    };

    const handlePointerLeave = () => {
      if (!contextMenu) {
        setRowControl(null);
        setColumnControl(null);
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const cell = target.closest('td, th') as HTMLTableCellElement | null;
      if (!cell) {
        return;
      }
      const table = cell.closest('table');
      if (!table) {
        return;
      }

      event.preventDefault();

      const coords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
      if (!coords) {
        return;
      }

      editor.chain().focus().setTextSelection(coords.pos).run();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const clampedX = Math.min(event.clientX, viewportWidth - MENU_WIDTH - 8);
      const clampedY = Math.min(event.clientY, viewportHeight - MENU_HEIGHT_ESTIMATE - 8);

      setContextMenu({
        x: Math.max(8, clampedX),
        y: Math.max(8, clampedY),
        selectionPos: coords.pos,
      });
      setRowControl(null);
      setColumnControl(null);
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [computeColumnHover, computeRowHover, containerRef, contextMenu, editor]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const scroller = container.parentElement;

    const handleScrollOrResize = () => {
      if (!rowControlRef.current && !columnControlRef.current) {
        return;
      }
      forceGeometryUpdate();
    };

    scroller?.addEventListener('scroll', handleScrollOrResize, { passive: true });
    container.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      scroller?.removeEventListener('scroll', handleScrollOrResize);
      container.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [containerRef]);

  React.useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setContextMenu(null);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    const handleBlur = () => setContextMenu(null);

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('blur', handleBlur);
    };
  }, [contextMenu]);

  let rowButtonPosition: { top: number; left: number } | null = null;
  if (rowControl) {
    const container = containerRef.current;
    if (container && rowControl.anchorCell.isConnected) {
      const containerRect = container.getBoundingClientRect();
      const tableRect = rowControl.table.getBoundingClientRect();
      const cellRect = rowControl.anchorCell.getBoundingClientRect();
      const boundaryY = rowControl.boundary === 'before' ? cellRect.top : cellRect.bottom;

      const top = boundaryY - containerRect.top;
      const left = Math.max(6, tableRect.left - containerRect.left - CONTROL_OFFSET);

      rowButtonPosition = { top, left };
    }
  }

  let columnButtonPosition: { top: number; left: number } | null = null;
  if (columnControl) {
    const container = containerRef.current;
    if (container && columnControl.anchorCell.isConnected) {
      const containerRect = container.getBoundingClientRect();
      const tableRect = columnControl.table.getBoundingClientRect();
      const cellRect = columnControl.anchorCell.getBoundingClientRect();
      const boundaryX = columnControl.boundary === 'before' ? cellRect.left : cellRect.right;

      const left = boundaryX - containerRect.left;
      const top = Math.max(6, tableRect.top - containerRect.top - CONTROL_OFFSET);

      columnButtonPosition = { top, left };
    }
  }

  const handleInsertRow = React.useCallback(() => {
    if (!rowControl) {
      return;
    }
    let chain = editor.chain().focus();
    chain = chain.setTextSelection(rowControl.selectionPos);
    chain = rowControl.boundary === 'before' ? chain.addRowBefore() : chain.addRowAfter();
    chain.run();
    setRowControl(null);
  }, [editor, rowControl]);

  const handleInsertColumn = React.useCallback(() => {
    if (!columnControl) {
      return;
    }
    let chain = editor.chain().focus();
    chain = chain.setTextSelection(columnControl.selectionPos);
    chain = columnControl.boundary === 'before' ? chain.addColumnBefore() : chain.addColumnAfter();
    chain.run();
    setColumnControl(null);
  }, [editor, columnControl]);

  const tableAttributes = (editor.getAttributes('table') as Partial<PremiumTableAttributes>) ?? {};
  const currentTableStyle = (tableAttributes.tableStyle as TableStyleOption | undefined) ?? 'grid';
  const currentBorderStyle = (tableAttributes.borderStyle as TableBorderStyle | undefined) ?? DEFAULT_TABLE_BORDER_STYLE;
  const currentBorderColor = (tableAttributes.borderColor as string | undefined) ?? DEFAULT_TABLE_BORDER_COLOR;
  const currentStripe = (tableAttributes.stripe as TableStripeOption | undefined) ?? 'none';

  const cellAttributes = editor.getAttributes('tableCell') as { backgroundColor?: string | null };
  const currentFill = (cellAttributes?.backgroundColor as string | null | undefined) ?? null;
  const rowAttributes = editor.getAttributes('tableRow') as { suppressIfEmpty?: boolean };
  const suppressRowWhenEmpty = Boolean(rowAttributes?.suppressIfEmpty);

  const tableActive = editor.isActive('table');
  const canManager = editor.can();

  const runWithSelection = React.useCallback(
    (apply: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
      if (!contextMenu) {
        return;
      }
      let chain = editor.chain().focus();
      chain = chain.setTextSelection(contextMenu.selectionPos);
      apply(chain).run();
      setContextMenu(null);
    },
    [contextMenu, editor],
  );

  return (
    <>
      <div className='pointer-events-none absolute inset-0'>
        {rowButtonPosition && (
          <button
            type='button'
            data-inline-table-control
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleInsertRow();
            }}
            className={cn(
              'pointer-events-auto absolute z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg transition hover:-translate-y-1/2 hover:scale-110 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:shadow-slate-900/40',
            )}
            style={{ top: rowButtonPosition.top, left: rowButtonPosition.left }}
            aria-label={rowControl?.boundary === 'before' ? 'Insert row above' : 'Insert row below'}
          >
            <Plus className='h-4 w-4' />
          </button>
        )}
        {columnButtonPosition && (
          <button
            type='button'
            data-inline-table-control
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleInsertColumn();
            }}
            className={cn(
              'pointer-events-auto absolute z-20 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg transition hover:-translate-x-1/2 hover:scale-110 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:shadow-slate-900/40',
            )}
            style={{ top: columnButtonPosition.top, left: columnButtonPosition.left }}
            aria-label={columnControl?.boundary === 'before' ? 'Insert column to the left' : 'Insert column to the right'}
          >
            <Plus className='h-4 w-4' />
          </button>
        )}
      </div>

      {contextMenu ? (
        <div
          ref={menuRef}
          className='fixed z-50 w-[276px] rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40'
          style={{ top: contextMenu.y, left: contextMenu.x }}
          role='menu'
        >
          <ContextMenuSection title='Insert'>
            <ContextMenuButton
              icon={ArrowUp}
              label='Insert row above'
              disabled={!tableActive || !canManager.addRowBefore?.()}
              onSelect={() => runWithSelection((chain) => chain.addRowBefore())}
            />
            <ContextMenuButton
              icon={ArrowDown}
              label='Insert row below'
              disabled={!tableActive || !canManager.addRowAfter?.()}
              onSelect={() => runWithSelection((chain) => chain.addRowAfter())}
            />
            <ContextMenuButton
              icon={ArrowLeft}
              label='Insert column left'
              disabled={!tableActive || !canManager.addColumnBefore?.()}
              onSelect={() => runWithSelection((chain) => chain.addColumnBefore())}
            />
            <ContextMenuButton
              icon={ArrowRight}
              label='Insert column right'
              disabled={!tableActive || !canManager.addColumnAfter?.()}
              onSelect={() => runWithSelection((chain) => chain.addColumnAfter())}
            />
          </ContextMenuSection>

          <MenuSeparator />

          <ContextMenuSection title='Delete'>
            <ContextMenuButton
              icon={TableRowsSplit}
              label='Delete row'
              tone='danger'
              disabled={!tableActive || !canManager.deleteRow?.()}
              onSelect={() => runWithSelection((chain) => chain.deleteRow())}
            />
            <ContextMenuButton
              icon={TableColumnsSplit}
              label='Delete column'
              tone='danger'
              disabled={!tableActive || !canManager.deleteColumn?.()}
              onSelect={() => runWithSelection((chain) => chain.deleteColumn())}
            />
            <ContextMenuButton
              icon={Trash2}
              label='Delete table'
              tone='danger'
              disabled={!tableActive || !canManager.deleteTable?.()}
              onSelect={() => runWithSelection((chain) => chain.deleteTable())}
            />
          </ContextMenuSection>

          <MenuSeparator />

          <ContextMenuSection title='Visibility'>
            <ContextMenuCheckbox
              label='Suppress row when empty'
              icon={EyeOff}
              checked={suppressRowWhenEmpty}
              onToggle={() =>
                runWithSelection((chain) =>
                  chain.updateAttributes('tableRow', { suppressIfEmpty: !suppressRowWhenEmpty }),
                )
              }
            />
          </ContextMenuSection>

          <MenuSeparator />

          <ContextMenuSection title='Structure'>
            <ContextMenuButton
              icon={TableCellsMerge}
              label='Merge cells'
              disabled={!tableActive || !canManager.mergeCells?.()}
              onSelect={() => runWithSelection((chain) => chain.mergeCells())}
            />
            <ContextMenuButton
              icon={TableCellsSplit}
              label='Split cells'
              disabled={!tableActive || !canManager.splitCell?.()}
              onSelect={() => runWithSelection((chain) => chain.splitCell())}
            />
            <ContextMenuButton
              icon={LayoutPanelTop}
              label='Header row'
              disabled={!tableActive || !canManager.toggleHeaderRow?.()}
              onSelect={() => runWithSelection((chain) => chain.toggleHeaderRow())}
            />
            <ContextMenuButton
              icon={LayoutPanelLeft}
              label='Header column'
              disabled={!tableActive || !canManager.toggleHeaderColumn?.()}
              onSelect={() => runWithSelection((chain) => chain.toggleHeaderColumn())}
            />
            <ContextMenuButton
              icon={Heading3}
              label='Header cell'
              disabled={!tableActive || !canManager.toggleHeaderCell?.()}
              onSelect={() => runWithSelection((chain) => chain.toggleHeaderCell())}
            />
          </ContextMenuSection>

          <MenuSeparator />

          <ContextMenuSection title='Table formatting'>
            {TABLE_STYLE_OPTIONS.map((option) => (
              <ContextMenuButton
                key={option.value}
                icon={Rows3}
                label={option.label}
                active={currentTableStyle === option.value}
                onSelect={() =>
                  runWithSelection((chain) => chain.updateAttributes('table', { tableStyle: option.value }))
                }
              />
            ))}
            {BORDER_STYLE_OPTIONS.map((option) => (
              <ContextMenuButton
                key={option.value}
                icon={Sparkles}
                label={option.label}
                active={currentBorderStyle === option.value}
                onSelect={() =>
                  runWithSelection((chain) => chain.updateAttributes('table', { borderStyle: option.value }))
                }
              />
            ))}
            <div className='px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>
              Border color
            </div>
            <div className='flex flex-wrap gap-2 px-2 pb-1 pt-1'>
              {BORDER_COLOR_PRESETS.map((preset) => (
                <ColorSwatch
                  key={preset.value}
                  label={preset.label}
                  value={preset.value}
                  active={currentBorderColor.toLowerCase() === preset.value.toLowerCase()}
                  onSelect={() =>
                    runWithSelection((chain) => chain.updateAttributes('table', { borderColor: preset.value }))
                  }
                />
              ))}
            </div>
            <ContextMenuButton
              icon={Sparkles}
              label='Reset table style'
              onSelect={() =>
                runWithSelection((chain) =>
                  chain.updateAttributes('table', {
                    tableStyle: 'grid',
                    borderColor: DEFAULT_TABLE_BORDER_COLOR,
                    borderWidth: DEFAULT_TABLE_BORDER_WIDTH,
                    borderStyle: DEFAULT_TABLE_BORDER_STYLE,
                    stripe: 'none',
                    stripeColor: DEFAULT_TABLE_STRIPE_COLOR,
                  }),
                )
              }
            />
          </ContextMenuSection>

          <MenuSeparator />

          <ContextMenuSection title='Row banding'>
            {STRIPE_OPTIONS.map((preset) => (
              <ContextMenuButton
                key={preset.value}
                icon={Rows3}
                label={preset.label}
                active={currentStripe === preset.value}
                onSelect={() =>
                  runWithSelection((chain) => chain.updateAttributes('table', { stripe: preset.value }))
                }
              />
            ))}
          </ContextMenuSection>

          <MenuSeparator />

          <ContextMenuSection title='Cell fill'>
            <div className='flex flex-wrap gap-2 px-2 pb-1 pt-1'>
              {FILL_COLOR_PRESETS.map((preset) => (
                <ColorSwatch
                  key={preset.label}
                  label={preset.label}
                  value={preset.value}
                  active={(currentFill ?? '') === (preset.value ?? '')}
                  onSelect={() =>
                    runWithSelection((chain) =>
                      preset.value
                        ? chain.setCellAttribute('backgroundColor', preset.value)
                        : chain.setCellAttribute('backgroundColor', null),
                    )
                  }
                />
              ))}
            </div>
          </ContextMenuSection>

          <MenuSeparator />

          <ContextMenuSection title='Text alignment'>
            {ALIGN_OPTIONS.map((option) => (
              <ContextMenuButton
                key={option.value}
                icon={option.icon}
                label={option.label}
                active={editor.isActive({ textAlign: option.value })}
                onSelect={() => runWithSelection((chain) => chain.setTextAlign(option.value))}
              />
            ))}
          </ContextMenuSection>
        </div>
      ) : null}
    </>
  );
}

function MenuSeparator() {
  return <div className='my-2 h-px bg-slate-200 dark:bg-slate-800' />;
}

function ContextMenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <div className='px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'>
        {title}
      </div>
      <div className='space-y-1'>
        {children}
      </div>
    </div>
  );
}

function ContextMenuCheckbox({
  label,
  icon: Icon,
  checked,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:bg-slate-800',
        checked && 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
      )}
      role='menuitemcheckbox'
      aria-checked={checked}
    >
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded border border-slate-300 text-transparent transition dark:border-slate-600',
          checked
            ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-400'
            : 'bg-white dark:bg-slate-900',
        )}
        aria-hidden='true'
      >
        {checked ? <Check className='h-3 w-3' /> : null}
      </span>
      <Icon className='h-4 w-4 text-slate-400 dark:text-slate-500' aria-hidden='true' />
      <span className='flex-1'>{label}</span>
    </button>
  );
}
function ContextMenuButton({
  icon: Icon,
  label,
  onSelect,
  disabled,
  active,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  active?: boolean;
  tone?: 'danger';
}) {
  return (
    <button
      type='button'
      onClick={() => {
        if (disabled) {
          return;
        }
        onSelect();
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:bg-slate-800',
        disabled && 'cursor-not-allowed opacity-50',
        active && 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
        tone === 'danger' && !disabled && 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
      )}
      role='menuitem'
      aria-disabled={disabled || undefined}
    >
      <Icon className='h-4 w-4' />
      <span className='flex-1'>{label}</span>
    </button>
  );
}

function ColorSwatch({
  label,
  value,
  onSelect,
  active,
}: {
  label: string;
  value: string | null;
  onSelect: () => void;
  active?: boolean;
}) {
  const style = value
    ? { backgroundColor: value }
    : {
        backgroundImage:
          'linear-gradient(135deg, rgba(100,116,139,0.4) 0%, rgba(100,116,139,0.4) 48%, transparent 50%, transparent 100%)',
        backgroundColor: '#f8fafc',
      };

  return (
    <button
      type='button'
      onClick={onSelect}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-[10px] font-semibold uppercase tracking-wide shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:shadow-slate-900/40',
        active
          ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
          : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-slate-600 dark:hover:ring-offset-slate-900',
      )}
      style={style}
    >
      <span className='sr-only'>{label}</span>
    </button>
  );
}



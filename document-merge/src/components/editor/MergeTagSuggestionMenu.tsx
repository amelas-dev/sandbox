import * as React from 'react';
import { createPortal } from 'react-dom';
import type { DatasetField } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatFieldType } from '@/lib/field-utils';

interface MergeTagSuggestionMenuProps {
  open: boolean;
  anchor: { left: number; right: number; top: number; bottom: number };
  fields: DatasetField[];
  highlightedIndex: number;
  onHover: (index: number) => void;
  onSelect: (field: DatasetField) => void;
  query: string;
}

const MENU_WIDTH = 280;
const MENU_MAX_HEIGHT = 240;

/**
 * Floating listbox that surfaces dataset fields when users type the '@' trigger
 * inside the document designer.
 */
export function MergeTagSuggestionMenu({
  open,
  anchor,
  fields,
  highlightedIndex,
  onHover,
  onSelect,
  query,
}: MergeTagSuggestionMenuProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let left = anchor.left;
  const padding = 12;

  if (left + MENU_WIDTH > viewportWidth - padding) {
    left = Math.max(padding, viewportWidth - MENU_WIDTH - padding);
  }

  const spaceAbove = anchor.top;
  const spaceBelow = viewportHeight - anchor.bottom;
  let top = anchor.bottom + 8;
  let origin: 'top' | 'bottom' = 'top';

  if (spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow) {
    top = Math.max(padding, anchor.top - MENU_MAX_HEIGHT - 8);
    origin = 'bottom';
  } else if (top + MENU_MAX_HEIGHT > viewportHeight - padding) {
    top = Math.max(padding, viewportHeight - MENU_MAX_HEIGHT - padding);
  }

  const activeOptionId =
    fields.length > 0 ? `merge-tag-suggestion-${highlightedIndex}` : undefined;

  const listContent = fields.length > 0 ? (
    <ul className='max-h-60 overflow-auto py-1' role='presentation'>
      {fields.map((field, index) => {
        const isActive = index === highlightedIndex;
        const optionId = `merge-tag-suggestion-${index}`;
        return (
          <li key={field.key}>
            <button
              type='button'
              role='option'
              id={optionId}
              aria-selected={isActive}
              className={cn(
                'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition',
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60',
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onMouseEnter={() => onHover(index)}
              onClick={() => onSelect(field)}
            >
              <span className='flex min-w-0 flex-1 flex-col'>
                <span className='truncate font-medium'>{field.label}</span>
                <span className='text-xs text-slate-500 dark:text-slate-400'>
                  {formatFieldType(field.type) || 'Custom field'}
                </span>
              </span>
              <span className='shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500'>
                {field.key}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  ) : (
    <div className='px-3 py-4 text-sm text-slate-500 dark:text-slate-400'>
      {query.trim().length > 0 ? (
        <>
          No fields match&nbsp;
          <span className='font-semibold text-slate-600 dark:text-slate-300'>
            {query}
          </span>
        </>
      ) : (
        'No fields available in the current dataset.'
      )}
    </div>
  );

  const content = (
    <div
      className='pointer-events-auto'
      style={{
        position: 'fixed',
        top,
        left,
        width: MENU_WIDTH,
        zIndex: 60,
      }}
    >
      <div
        className='overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90'
        role='listbox'
        aria-label='Merge tags'
        aria-activedescendant={activeOptionId}
        style={{ transformOrigin: `${origin} left` }}
      >
        {listContent}
        <div className='border-t border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-500'>
          Enter to insert / Esc to dismiss
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

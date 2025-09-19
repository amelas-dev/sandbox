import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore, selectFieldPalette, selectPreviewRow } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface FieldPaletteProps {
  onInsertField: (fieldKey: string) => void;
}

function FieldChip({ fieldKey, label, onInsert }: { fieldKey: string; label: string; onInsert: () => void }) {
  const previewRow = useAppStore(selectPreviewRow);
  const value = previewRow ? String(previewRow[fieldKey] ?? '') : '';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${fieldKey}`,
    data: { fieldKey },
  });
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={setNodeRef}
            type="button"
            onDoubleClick={onInsert}
            className={cn(
              'group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900',
              isDragging && 'border-brand-500 ring-2 ring-brand-500',
            )}
            style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
            {...listeners}
            {...attributes}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <GripVertical className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
              <span className="min-w-0 break-words text-left font-medium text-slate-700 dark:text-slate-200">{label}</span>
            </span>
            <Badge variant="outline" className="shrink-0 whitespace-nowrap">
              {`{{${fieldKey}}}`}
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">Sample value: {value || '—'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FieldPalette({ onInsertField }: FieldPaletteProps) {
  const fields = useAppStore(selectFieldPalette);
  const filter = useAppStore((state) => state.mergeTagFilter);
  const setFilter = useAppStore((state) => state.setMergeTagFilter);

  const filteredFields = React.useMemo(() => {
    if (!filter) return fields;
    const query = filter.toLowerCase();
    return fields.filter((field) => field.label.toLowerCase().includes(query) || field.key.toLowerCase().includes(query));
  }, [fields, filter]);

  if (!fields.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">Import a dataset to begin</div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Drag fields onto the canvas to create smart merge tags. You can also double-click a field to insert it at the cursor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" />
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search fields…"
          className="border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
        {filter && (
          <Button variant="ghost" size="sm" onClick={() => setFilter('')} className="ml-auto h-6 px-2 text-xs">
            Clear
          </Button>
        )}
      </div>
      <ScrollArea className="mt-4 flex-1">
        <div className="flex flex-col gap-3 pr-2">
          {filteredFields.map((field) => (
            <FieldChip key={field.key} fieldKey={field.key} label={field.label} onInsert={() => onInsertField(field.key)} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

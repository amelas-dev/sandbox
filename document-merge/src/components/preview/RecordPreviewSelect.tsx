import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export function RecordPreviewSelect() {
  const dataset = useAppStore((state) => state.dataset);
  const previewIndex = useAppStore((state) => state.previewIndex);
  const setPreviewIndex = useAppStore((state) => state.setPreviewIndex);

  const optionLabels = React.useMemo(() => {
    if (!dataset) {
      return [] as string[];
    }

    const fieldKeys = dataset.fields.map((field) => field.key);

    if (!fieldKeys.length) {
      return dataset.rows.map((_row, index) => `Row ${index + 1}`);
    }

    const baseLabels = dataset.rows.map((row, index) => {
      for (const key of fieldKeys) {
        const rawValue = row[key];

        if (rawValue === null || rawValue === undefined) {
          continue;
        }

        const formatted = String(rawValue).trim();

        if (formatted.length > 0) {
          return formatted;
        }
      }

      return `Row ${index + 1}`;
    });

    const labelCounts = new Map<string, number>();

    return baseLabels.map((label) => {
      const currentCount = labelCounts.get(label) ?? 0;
      const nextCount = currentCount + 1;
      labelCounts.set(label, nextCount);

      if (currentCount === 0) {
        return label;
      }

      return `${label} (${nextCount})`;
    });
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:w-auto">
        <ChevronDown className="h-4 w-4 opacity-0" />
        <span>No dataset loaded</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex w-full items-center sm:w-auto">
      <select
        className={cn(
          'w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900',
        )}
        value={previewIndex}
        onChange={(event) => setPreviewIndex(Number(event.target.value))}
      >
        {optionLabels.map((label, index) => (
          <option key={index} value={index}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-slate-400" />
    </div>
  );
}

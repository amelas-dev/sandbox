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

  const totalRows = optionLabels.length;
  const hasRows = totalRows > 0;
  const clampedIndex = hasRows
    ? Math.min(Math.max(previewIndex, 0), totalRows - 1)
    : 0;
  const isFirst = !hasRows || clampedIndex === 0;
  const isLast = !hasRows || clampedIndex === totalRows - 1;

  const buttonClassName = (disabled: boolean) =>
    cn(
      'inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900',
      disabled
        ? 'text-slate-400 dark:text-slate-500'
        : 'text-slate-700 hover:border-brand-500 hover:text-brand-600 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-200',
    );

  const handlePrevious = () => {
    if (!isFirst) {
      setPreviewIndex(clampedIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setPreviewIndex(clampedIndex + 1);
    }
  };

  return (
    <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex items-center gap-2 sm:w-auto">
        <button
          type="button"
          className={buttonClassName(isFirst)}
          onClick={handlePrevious}
          disabled={isFirst}
          aria-label="Select previous record"
        >
          Previous
        </button>
        <div className="relative inline-flex w-full items-center sm:w-auto">
          <select
            className={cn(
              'w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900',
            )}
            value={hasRows ? clampedIndex : ''}
            onChange={(event) => setPreviewIndex(Number(event.target.value))}
            aria-label="Select record to preview"
            disabled={!hasRows}
          >
            {optionLabels.map((label, index) => (
              <option key={index} value={index}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-slate-400" />
        </div>
        <button
          type="button"
          className={buttonClassName(isLast)}
          onClick={handleNext}
          disabled={isLast}
          aria-label="Select next record"
        >
          Next
        </button>
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {hasRows
          ? `Record ${clampedIndex + 1} of ${totalRows}`
          : 'No records available'}
      </span>
    </div>
  );
}

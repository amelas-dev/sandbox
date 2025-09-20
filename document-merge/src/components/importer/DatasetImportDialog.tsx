import * as React from 'react';
import { UploadCloud, FileDown, Database, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import {
  parseCsvFile,
  parseCsvString,
  parseJsonFile,
  parseXlsxFile,
  datasetPreview,
} from '@/lib/dataset';
import type { DatasetImportResult } from '@/lib/types';

const SAMPLE_CSV = `InvestorName,Email,AddressLine1,City,State,Zip,InvestmentAmount,InvestmentDate,LogoUrl
Alexandra Chen,alexandra@example.com,123 Market St,San Francisco,CA,94103,250000,2024-07-01,https://example.com/logos/ac.png
Jordan Patel,jordan@example.com,77 Fleet Pl,Brooklyn,NY,11201,1000000,2025-01-15,https://example.com/logos/jp.png
Priya Singh,priya@example.com,9 King Rd,Seattle,WA,98101,500000,2025-03-22,https://example.com/logos/ps.png`;

const PREVIEW_ROW_LIMIT = 100;

export function DatasetImportDialog() {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error' | 'preview' | 'success'>('idle');
  const [message, setMessage] = React.useState<string>('');
  const [previewResult, setPreviewResult] = React.useState<DatasetImportResult | null>(null);
  const dataset = useAppStore((state) => state.dataset);
  const setDataset = useAppStore((state) => state.setDataset);
  const clearDataset = useAppStore((state) => state.clearDataset);
  const importIssues = useAppStore((state) => state.importIssues);
  const headerReport = useAppStore((state) => state.headerReport);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const activeDataset = previewResult?.dataset ?? dataset;
  const activeHeaderReport = previewResult?.headerReport ?? headerReport;
  const activeImportIssues = previewResult?.issues ?? importIssues;
  const totalRows = activeDataset?.rows.length ?? 0;
  const previewRowCount = activeDataset ? Math.min(PREVIEW_ROW_LIMIT, totalRows) : 0;
  const previewingNewDataset = Boolean(previewResult);

  const resetFileInput = React.useCallback(() => {
    const input = fileInputRef.current;
    if (input) {
      input.value = '';
    }
  }, []);

  React.useEffect(() => {
    if (!open) {
      setStatus('idle');
      setMessage('');
      setPreviewResult(null);
      resetFileInput();
    }
  }, [open, resetFileInput]);

  const handleClearDataset = React.useCallback(() => {
    setPreviewResult(null);
    setStatus('idle');
    setMessage('');
    clearDataset();
    resetFileInput();
  }, [clearDataset, resetFileInput]);

  const isLoading = status === 'loading';

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.ceil(size / 1024)} KB`;
  };

  const handleImport = async (file: File) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      setStatus('error');
      setMessage('File is larger than 10 MB. Please upload a smaller dataset.');
      return;
    }
    setStatus('loading');
    try {
      let result: DatasetImportResult;
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') {
        result = await parseCsvFile(file);
      } else if (extension === 'json') {
        result = await parseJsonFile(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        result = await parseXlsxFile(file);
      } else {
        throw new Error('Unsupported file type. Please upload CSV, JSON, or XLSX.');
      }
      const sizeLabel = file.size ? ` (${formatFileSize(file.size)})` : '';
      setPreviewResult(result);
      setStatus('preview');
      setMessage(
        `Previewing ${result.dataset.rows.length} records from ${file.name}${sizeLabel}. Review the first ${Math.min(
          PREVIEW_ROW_LIMIT,
          result.dataset.rows.length,
        )} rows below, then import when ready.`,
      );
    } catch (error) {
      console.error(error);
      setStatus('error');
      setPreviewResult(null);
      setMessage(error instanceof Error ? error.message : 'Unable to import dataset.');
    } finally {
      resetFileInput();
    }
  };

  const handleSample = () => {
    const result = parseCsvString(SAMPLE_CSV, {
      name: 'Sample Investors',
      importedAt: new Date().toISOString(),
    });
    setPreviewResult(result);
    setStatus('preview');
    setMessage(
      `Previewing the sample investor dataset. Review the first ${Math.min(
        PREVIEW_ROW_LIMIT,
        result.dataset.rows.length,
      )} rows below, then import when ready.`,
    );
  };

  const handleConfirmImport = () => {
    if (!previewResult) return;
    setDataset(previewResult);
    setStatus('success');
    const source = previewResult.dataset.sourceMeta;
    const sourceLabel = source?.name ? ` from ${source.name}` : '';
    const sizeLabel = source?.size ? ` (${formatFileSize(source.size)})` : '';
    setMessage(`Imported ${previewResult.dataset.rows.length} records${sourceLabel}${sizeLabel}.`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UploadCloud className="h-4 w-4" /> Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import dataset</DialogTitle>
          <DialogDescription>
            Upload a CSV, JSON array, or Excel workbook containing investor information. We will detect column names and preview
            the first rows for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <label
              htmlFor="dataset-upload"
              className="relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-brand-500 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <input
                ref={fileInputRef}
                id="dataset-upload"
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                className="hidden"
                disabled={isLoading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleImport(file);
                  }
                }}
              />
              <div className="flex flex-col items-center">
                {isLoading ? (
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-500" />
                ) : (
                  <UploadCloud className="mb-3 h-8 w-8 text-brand-500" />
                )}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag & drop or click to upload</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">CSV, JSON, XLSX up to 10 MB</span>
              </div>
            </label>
            <div className="flex gap-3">
              <Button onClick={handleSample} variant="subtle" className="gap-2" disabled={isLoading}>
                <Database className="h-4 w-4" /> Load sample data
              </Button>
              {(dataset || previewResult) && (
                <Button
                  variant="ghost"
                  className="gap-2 text-red-600 hover:text-red-700"
                  onClick={handleClearDataset}
                  disabled={isLoading}
                >
                  <AlertTriangle className="h-4 w-4" /> Clear current dataset
                </Button>
              )}
            </div>
            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" /> {message}
              </div>
            )}
            {status === 'preview' && (
              <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200">
                <UploadCloud className="mt-0.5 h-4 w-4" />
                <div className="space-y-1">
                  <p>{message}</p>
                  <p className="text-xs text-brand-600/80 dark:text-brand-200/80">
                    Importing will replace the dataset currently used in the document editor.
                  </p>
                </div>
              </div>
            )}
            {status === 'success' && message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                {message}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Header normalization</h3>
              <ScrollArea className="mt-2 max-h-32">
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  {activeHeaderReport.length ? (
                    activeHeaderReport.map((entry) => (
                      <div key={entry.original} className="flex items-center justify-between rounded-lg border border-slate-200/60 px-2 py-1 dark:border-slate-800/60">
                        <span>{entry.original}</span>
                        <Badge variant="outline">{entry.normalized}</Badge>
                      </div>
                    ))
                  ) : (
                    <p>No dataset loaded yet.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Import log</h3>
              <ScrollArea className="mt-2 max-h-32 text-xs text-slate-500 dark:text-slate-400">
                {activeImportIssues.length ? (
                  <ul className="space-y-1">
                    {activeImportIssues.map((issue) => (
                      <li key={`${issue.row}-${issue.field}`} className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Row {issue.row}: {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No issues detected.</p>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
        {activeDataset && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preview</h3>
                  {previewingNewDataset && (
                    <Badge className="border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200" variant="outline">
                      Pending import
                    </Badge>
                  )}
                </div>
                <p>
                  {activeDataset.fields.length} fields • {activeDataset.rows.length} rows
                  {activeDataset.sourceMeta?.name ? ` • ${activeDataset.sourceMeta.name}` : ''}
                  {activeDataset.sourceMeta?.size ? ` • ${formatFileSize(activeDataset.sourceMeta.size)}` : ''}
                </p>
              </div>
              <Badge variant="outline">
                {totalRows === 0
                  ? 'No rows to preview'
                  : totalRows > PREVIEW_ROW_LIMIT
                    ? `Showing first ${previewRowCount} of ${totalRows} rows`
                    : `Showing ${previewRowCount} row${totalRows === 1 ? '' : 's'}`}
              </Badge>
            </div>
            <ScrollArea className="max-h-[28rem]">
              <div className="min-w-full">
                <table className="w-full table-auto border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100/90 text-[11px] uppercase tracking-wide text-slate-500 backdrop-blur dark:bg-slate-800/80">
                    <tr>
                      <th className="w-12 border border-slate-200 px-2 py-1 font-semibold text-slate-500 dark:border-slate-700">
                        #
                      </th>
                      {activeDataset.fields.map((field) => (
                        <th
                          key={field.key}
                          className="border border-slate-200 px-3 py-2 font-semibold text-slate-600 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate" title={field.label}>
                              {field.label}
                            </span>
                            <Badge
                              variant="outline"
                              className="shrink-0 rounded-full border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                            >
                              {field.type}
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datasetPreview(activeDataset, PREVIEW_ROW_LIMIT).map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-900/70"
                      >
                        <td className="border border-slate-200 px-2 py-1 text-slate-500 dark:border-slate-800">
                          {rowIndex + 1}
                        </td>
                        {activeDataset.fields.map((field) => {
                          const value = row[field.key];
                          const text = value === null || value === undefined ? '' : String(value);
                          return (
                            <td
                              key={field.key}
                              className="border border-slate-200 px-3 py-2 align-top text-slate-700 dark:border-slate-800 dark:text-slate-200"
                              title={text}
                            >
                              {text ? (
                                <span className="block whitespace-pre-wrap break-words">{text}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="vertical" />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Close
          </Button>
          <Button variant="subtle" onClick={handleSample} className="gap-2">
            <FileDown className="h-4 w-4" /> Use sample dataset
          </Button>
          <Button onClick={handleConfirmImport} className="gap-2" disabled={!previewResult || isLoading}>
            <CheckCircle2 className="h-4 w-4" /> Import dataset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

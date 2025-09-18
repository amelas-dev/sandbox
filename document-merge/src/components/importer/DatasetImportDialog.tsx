import * as React from 'react';
import { UploadCloud, FileDown, Database, AlertTriangle } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function DatasetImportDialog() {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [message, setMessage] = React.useState<string>('');
  const dataset = useAppStore((state) => state.dataset);
  const setDataset = useAppStore((state) => state.setDataset);
  const clearDataset = useAppStore((state) => state.clearDataset);
  const importIssues = useAppStore((state) => state.importIssues);
  const headerReport = useAppStore((state) => state.headerReport);

  const handleImport = async (file: File) => {
    setStatus('loading');
    try {
      let result: DatasetImportResult;
      if (file.name.endsWith('.csv')) {
        result = await parseCsvFile(file);
      } else if (file.name.endsWith('.json')) {
        result = await parseJsonFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        result = await parseXlsxFile(file);
      } else {
        throw new Error('Unsupported file type. Please upload CSV, JSON, or XLSX.');
      }
      setDataset(result);
      setStatus('success');
      setMessage(`Imported ${result.dataset.rows.length} records from ${file.name}.`);
      setOpen(false);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to import dataset.');
    }
  };

  const handleSample = () => {
    const result = parseCsvString(SAMPLE_CSV, {
      name: 'Sample Investors',
      importedAt: new Date().toISOString(),
    });
    setDataset(result);
    setStatus('success');
    setMessage('Loaded sample investor dataset.');
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
              className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-brand-500 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <input
                id="dataset-upload"
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleImport(file);
                  }
                }}
              />
              <UploadCloud className="mb-3 h-8 w-8 text-brand-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag & drop or click to upload</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">CSV, JSON, XLSX up to 10 MB</span>
            </label>
            <div className="flex gap-3">
              <Button onClick={handleSample} variant="subtle" className="gap-2">
                <Database className="h-4 w-4" /> Load sample data
              </Button>
              {dataset && (
                <Button variant="ghost" className="gap-2 text-red-600 hover:text-red-700" onClick={() => clearDataset()}>
                  <AlertTriangle className="h-4 w-4" /> Clear current dataset
                </Button>
              )}
            </div>
            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" /> {message}
              </div>
            )}
            {status === 'success' && (
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-200">
                {message}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Header normalization</h3>
              <ScrollArea className="mt-2 max-h-32">
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  {headerReport.length ? (
                    headerReport.map((entry) => (
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
                {importIssues.length ? (
                  <ul className="space-y-1">
                    {importIssues.map((issue) => (
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
        {dataset && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preview</h3>
              <Badge>{dataset.rows.length} rows</Badge>
            </div>
            <ScrollArea className="max-h-64">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                  <tr>
                    {dataset.fields.map((field) => (
                      <th key={field.key} className="truncate border border-slate-200 px-2 py-1 font-semibold dark:border-slate-700">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasetPreview(dataset, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-900/70">
                      {dataset.fields.map((field) => (
                        <td key={field.key} className="truncate border border-slate-200 px-2 py-1 dark:border-slate-800">
                          {String(row[field.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button variant="subtle" onClick={handleSample} className="gap-2">
            <FileDown className="h-4 w-4" /> Use sample dataset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

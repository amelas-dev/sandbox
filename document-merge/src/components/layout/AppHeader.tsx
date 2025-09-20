import * as React from 'react';
import { FileText, Save, Upload, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DatasetImportDialog } from '@/components/importer/DatasetImportDialog';
import { RecordPreviewSelect } from '@/components/preview/RecordPreviewSelect';
import { useAppStore } from '@/store/useAppStore';
import { exportTemplate, importTemplate } from '@/lib/template-sharing';
import { GenerateDocumentsDialog } from '@/components/exporter/GenerateDocumentsDialog';
import { Badge } from '@/components/ui/badge';

/**
 * Top-level navigation for dataset management, preview selection, and document
 * generation actions.
 */
export function AppHeader() {
  const template = useAppStore((state) => state.template);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const dataset = useAppStore((state) => state.dataset);
  const [openGenerate, setOpenGenerate] = React.useState(false);

  const datasetSummary = React.useMemo(() => {
    if (!dataset) {
      return null;
    }
    const { fields, rows, sourceMeta } = dataset;
    const name = sourceMeta?.name ?? 'Active dataset';
    const importedAt = sourceMeta?.importedAt
      ? new Date(sourceMeta.importedAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null;
    return { name, fields: fields.length, rows: rows.length, importedAt };
  }, [dataset]);

  const handleExportTemplate = () => {
    void exportTemplate(template);
  };

  const handleImportTemplate = async () => {
    const result = await importTemplate();
    if (result) {
      updateTemplate(result);
    }
  };

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg sm:h-10 sm:w-10">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50 md:text-xl">Investor Document Studio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Design once, personalize for every investor.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {datasetSummary && (
          <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-100">{datasetSummary.name}</span>
              <Badge variant="outline">{datasetSummary.rows} records</Badge>
              <Badge variant="outline">{datasetSummary.fields} fields</Badge>
            </div>
            {datasetSummary.importedAt && (
              <span>Imported {datasetSummary.importedAt}</span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <RecordPreviewSelect />
          <DatasetImportDialog />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <Settings2 className="h-4 w-4" /> Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={handleExportTemplate}>
                <Save className="mr-2 h-4 w-4" /> Export template
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleImportTemplate}>
                <Upload className="mr-2 h-4 w-4" /> Import template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="w-full gap-2 sm:w-auto"
            disabled={!dataset}
            onClick={() => setOpenGenerate(true)}
          >
            <FileText className="h-4 w-4" /> Generate
          </Button>
        </div>
      </div>
      <GenerateDocumentsDialog open={openGenerate} onOpenChange={setOpenGenerate} />
    </header>
  );
}

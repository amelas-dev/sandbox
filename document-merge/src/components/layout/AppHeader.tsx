import * as React from 'react';
import { FileText, Save, Upload, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DatasetImportDialog } from '@/components/importer/DatasetImportDialog';
import { RecordPreviewSelect } from '@/components/preview/RecordPreviewSelect';
import { useAppStore } from '@/store/useAppStore';
import { exportTemplate, importTemplate } from '@/lib/template-sharing';
import { GenerateDocumentsDialog } from '@/components/exporter/GenerateDocumentsDialog';

export function AppHeader() {
  const template = useAppStore((state) => state.template);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const dataset = useAppStore((state) => state.dataset);
  const [openGenerate, setOpenGenerate] = React.useState(false);

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
    <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Investor Document Studio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Design once, personalize for every investor.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <RecordPreviewSelect />
        <DatasetImportDialog />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
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
          className="gap-2"
          disabled={!dataset}
          onClick={() => setOpenGenerate(true)}
        >
          <FileText className="h-4 w-4" /> Generate
        </Button>
      </div>
      <GenerateDocumentsDialog open={openGenerate} onOpenChange={setOpenGenerate} />
    </header>
  );
}

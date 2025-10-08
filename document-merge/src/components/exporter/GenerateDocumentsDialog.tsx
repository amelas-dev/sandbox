import * as React from 'react';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useAppStore,
  selectDataset,
  selectGenerationOptions,
  selectPreviewRow,
  selectTemplate,
} from '@/store/useAppStore';
import { buildGenerationArtifacts, renderFilename } from '@/lib/merge';
import { exportArtifacts } from '@/lib/exporters';
import type { GenerationFilter, GenerationOptions } from '@/lib/types';

interface GenerateDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateDocumentsDialog({ open, onOpenChange }: GenerateDocumentsDialogProps) {
  const dataset = useAppStore(selectDataset);
  const template = useAppStore(selectTemplate);
  const generationOptions = useAppStore(selectGenerationOptions);
  const previewRow = useAppStore(selectPreviewRow);
  const updateGenerationOptions = useAppStore((state) => state.updateGenerationOptions);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [status, setStatus] = React.useState<string>('');
  const filterValue = generationOptions.filter?.value;
  const filterValueInput = filterValue == null ? '' : String(filterValue);

  const effectiveOptions = React.useMemo<GenerationOptions>(() => {
    const normalizedFilter =
      generationOptions.range === 'filtered' && generationOptions.filter
        ? generationOptions.filter
        : undefined;
    const normalizedSelection =
      generationOptions.range === 'selection' ? generationOptions.selection : undefined;

    return {
      ...generationOptions,
      filter: normalizedFilter,
      selection: normalizedSelection,
    };
  }, [generationOptions]);

  const sampleName = React.useMemo(() => {
    if (!dataset || !previewRow) {
      return undefined;
    }
    return renderFilename(generationOptions.filenamePattern, previewRow, 'document');
  }, [dataset, previewRow, generationOptions.filenamePattern]);

  const handleGenerate = async () => {
    if (!dataset) {
      setStatus('Import a dataset before generating documents.');
      return;
    }
    setIsGenerating(true);
    setStatus('Preparing documents…');
    try {
      const artifacts = await buildGenerationArtifacts(dataset, template, effectiveOptions);
      if (!artifacts.length) {
        setStatus('No records match the selected range or filter.');
        setIsGenerating(false);
        return;
      }
      await exportArtifacts(artifacts, effectiveOptions.format);
      setStatus(`Generated ${artifacts.length} document${artifacts.length > 1 ? 's' : ''}.`);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setStatus('Unable to generate documents. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate personalized documents</DialogTitle>
          <DialogDescription>Select the format, record range, and naming convention for your exports.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-400">Format</Label>
              <ToggleGroup
                type="single"
                value={generationOptions.format}
                onValueChange={(value) => value && updateGenerationOptions({ format: value as typeof generationOptions.format })}
                className="mt-2"
              >
                <ToggleGroupItem value="pdf">PDF</ToggleGroupItem>
                <ToggleGroupItem value="docx">DOCX</ToggleGroupItem>
                <ToggleGroupItem value="html">HTML</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-slate-400">Record range</Label>
              <ToggleGroup
                type="single"
                value={generationOptions.range}
                onValueChange={(value) => value && updateGenerationOptions({ range: value as typeof generationOptions.range })}
                className="mt-2"
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="selection">Selection</ToggleGroupItem>
                <ToggleGroupItem value="filtered">Filtered</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {generationOptions.range === 'filtered' && dataset && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Field</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900"
                      value={generationOptions.filter?.field ?? dataset.fields[0]?.key}
                      onChange={(event) =>
                        updateGenerationOptions({
                          filter: {
                            ...(generationOptions.filter ?? { op: 'eq', value: '' }),
                            field: event.target.value,
                          },
                        })
                      }
                    >
                      {dataset.fields.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Operator</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900"
                      value={generationOptions.filter?.op ?? 'eq'}
                      onChange={(event) =>
                        updateGenerationOptions({
                          filter: {
                            ...(generationOptions.filter ?? { field: dataset.fields[0]?.key ?? '', value: '' }),
                            op: event.target.value as GenerationFilter['op'],
                          },
                        })
                      }
                    >
                      <option value="eq">Equals</option>
                      <option value="neq">Does not equal</option>
                      <option value="gt">Greater than</option>
                      <option value="lt">Less than</option>
                      <option value="contains">Contains</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    value={filterValueInput}
                    onChange={(event) =>
                      updateGenerationOptions({
                        filter: {
                          ...(generationOptions.filter ?? { field: dataset.fields[0]?.key ?? '', op: 'eq' }),
                          value: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <Label>File name pattern</Label>
              <Input
                value={generationOptions.filenamePattern}
                onChange={(event) => updateGenerationOptions({ filenamePattern: event.target.value })}
                placeholder="Welcome_{{InvestorName}}"
              />
              {sampleName && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Example: {sampleName}</p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use merge tags like <code>{`{{InvestorName}}`}</code> to personalize file names.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> We create one document per record and automatically zip them if more than one file is generated.
              </p>
            </div>
            {status && <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">{status}</div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !dataset} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

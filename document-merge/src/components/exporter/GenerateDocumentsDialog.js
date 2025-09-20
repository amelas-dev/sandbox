import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore, selectDataset, selectGenerationOptions, selectTemplate } from '@/store/useAppStore';
import { buildGenerationArtifacts } from '@/lib/merge';
import { exportArtifacts } from '@/lib/exporters';
export function GenerateDocumentsDialog({ open, onOpenChange }) {
    const dataset = useAppStore(selectDataset);
    const template = useAppStore(selectTemplate);
    const generationOptions = useAppStore(selectGenerationOptions);
    const updateGenerationOptions = useAppStore((state) => state.updateGenerationOptions);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [status, setStatus] = React.useState('');
    const filterValue = generationOptions.filter?.value;
    const filterValueInput = filterValue == null ? '' : String(filterValue);
    const handleGenerate = async () => {
        if (!dataset) {
            setStatus('Import a dataset before generating documents.');
            return;
        }
        setIsGenerating(true);
        setStatus('Preparing documents…');
        try {
            const artifacts = await buildGenerationArtifacts(dataset, template, generationOptions);
            if (!artifacts.length) {
                setStatus('No records match the selected range or filter.');
                setIsGenerating(false);
                return;
            }
            await exportArtifacts(artifacts, generationOptions.format);
            setStatus(`Generated ${artifacts.length} document${artifacts.length > 1 ? 's' : ''}.`);
            onOpenChange(false);
        }
        catch (error) {
            console.error(error);
            setStatus('Unable to generate documents. Please try again.');
        }
        finally {
            setIsGenerating(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Generate personalized documents" }), _jsx(DialogDescription, { children: "Select the format, record range, and naming convention for your exports." })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Format" }), _jsxs(ToggleGroup, { type: "single", value: generationOptions.format, onValueChange: (value) => value && updateGenerationOptions({ format: value }), className: "mt-2", children: [_jsx(ToggleGroupItem, { value: "pdf", children: "PDF" }), _jsx(ToggleGroupItem, { value: "docx", children: "DOCX" }), _jsx(ToggleGroupItem, { value: "html", children: "HTML" })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Record range" }), _jsxs(ToggleGroup, { type: "single", value: generationOptions.range, onValueChange: (value) => value && updateGenerationOptions({ range: value }), className: "mt-2", children: [_jsx(ToggleGroupItem, { value: "all", children: "All" }), _jsx(ToggleGroupItem, { value: "selection", children: "Selection" }), _jsx(ToggleGroupItem, { value: "filtered", children: "Filtered" })] })] }), generationOptions.range === 'filtered' && dataset && (_jsxs("div", { className: "space-y-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { children: "Field" }), _jsx("select", { className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900", value: generationOptions.filter?.field ?? dataset.fields[0]?.key, onChange: (event) => updateGenerationOptions({
                                                                filter: {
                                                                    ...(generationOptions.filter ?? { op: 'eq', value: '' }),
                                                                    field: event.target.value,
                                                                },
                                                            }), children: dataset.fields.map((field) => (_jsx("option", { value: field.key, children: field.label }, field.key))) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Operator" }), _jsxs("select", { className: "mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900", value: generationOptions.filter?.op ?? 'eq', onChange: (event) => updateGenerationOptions({
                                                                filter: {
                                                                    ...(generationOptions.filter ?? { field: dataset.fields[0]?.key ?? '', value: '' }),
                                                                    op: event.target.value,
                                                                },
                                                            }), children: [_jsx("option", { value: "eq", children: "Equals" }), _jsx("option", { value: "neq", children: "Does not equal" }), _jsx("option", { value: "gt", children: "Greater than" }), _jsx("option", { value: "lt", children: "Less than" }), _jsx("option", { value: "contains", children: "Contains" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Value" }), _jsx(Input, { value: filterValueInput, onChange: (event) => updateGenerationOptions({
                                                        filter: {
                                                            ...(generationOptions.filter ?? { field: dataset.fields[0]?.key ?? '', op: 'eq' }),
                                                            value: event.target.value,
                                                        },
                                                    }) })] })] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "File name pattern" }), _jsx(Input, { value: generationOptions.filenamePattern, onChange: (event) => updateGenerationOptions({ filenamePattern: event.target.value }), placeholder: "Welcome_{{InvestorName}}" }), _jsxs("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: ["Use merge tags like ", _jsx("code", { children: `{{InvestorName}}` }), " to personalize file names."] })] }), _jsx("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300", children: _jsxs("p", { className: "flex items-center gap-2", children: [_jsx(Wand2, { className: "h-4 w-4" }), " We create one document per record and automatically zip them if more than one file is generated."] }) }), status && _jsx("div", { className: "rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900", children: status })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }), _jsxs(Button, { onClick: handleGenerate, disabled: isGenerating || !dataset, className: "gap-2", children: [isGenerating ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(FileText, { className: "h-4 w-4" }), " Generate"] })] })] }) }));
}

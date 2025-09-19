import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("header", { className: "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "flex items-start gap-3 sm:items-center", children: [_jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg sm:h-10 sm:w-10", children: _jsx(FileText, { className: "h-5 w-5" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h1", { className: "text-lg font-semibold text-slate-900 dark:text-slate-50 md:text-xl", children: "Investor Document Studio" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Design once, personalize for every investor." })] })] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3", children: [_jsx(RecordPreviewSelect, {}), _jsx(DatasetImportDialog, {})] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "w-full gap-2 sm:w-auto", children: [_jsx(Settings2, { className: "h-4 w-4" }), " Template"] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [_jsxs(DropdownMenuItem, { onSelect: handleExportTemplate, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), " Export template"] }), _jsxs(DropdownMenuItem, { onSelect: handleImportTemplate, children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), " Import template"] })] })] }), _jsxs(Button, { className: "w-full gap-2 sm:w-auto", disabled: !dataset, onClick: () => setOpenGenerate(true), children: [_jsx(FileText, { className: "h-4 w-4" }), " Generate"] })] })] }), _jsx(GenerateDocumentsDialog, { open: openGenerate, onOpenChange: setOpenGenerate })] }));
}

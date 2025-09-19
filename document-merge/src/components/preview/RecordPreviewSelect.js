import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
export function RecordPreviewSelect() {
    const dataset = useAppStore((state) => state.dataset);
    const previewIndex = useAppStore((state) => state.previewIndex);
    const setPreviewIndex = useAppStore((state) => state.setPreviewIndex);
    if (!dataset) {
        return (_jsxs("div", { className: "flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:w-auto", children: [_jsx(ChevronDown, { className: "h-4 w-4 opacity-0" }), _jsx("span", { children: "No dataset loaded" })] }));
    }
    return (_jsxs("div", { className: "relative inline-flex w-full items-center sm:w-auto", children: [_jsx("select", { className: cn('w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900'), value: previewIndex, onChange: (event) => setPreviewIndex(Number(event.target.value)), children: dataset.rows.map((_row, index) => {
                    const labelField = dataset.fields.find((field) => /name/i.test(field.key))?.key;
                    const label = labelField ? String(dataset.rows[index][labelField] ?? `Record ${index + 1}`) : `Record ${index + 1}`;
                    return (_jsx("option", { value: index, children: `${index + 1}. ${label}` }, index));
                }) }), _jsx(ChevronDown, { className: "pointer-events-none absolute right-2 h-4 w-4 text-slate-400" })] }));
}

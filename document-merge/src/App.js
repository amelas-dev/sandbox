import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { FieldPalette } from '@/components/panels/FieldPalette';
import { DocumentDesigner } from '@/components/editor/DocumentDesigner';
import { TextFormattingToolbar } from '@/components/editor/TextFormattingToolbar';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { Badge } from '@/components/ui/badge';
import { useAppStore, selectFieldPalette } from '@/store/useAppStore';
const FOOTER_TIPS = [
    'Click a field to drop a merge tag at your cursor.',
    'Use Cmd/Ctrl+E to open the quick merge tag inserter.',
    'Right-click any merge tag to rename, copy, or remove it.',
    'Use the properties panel to adjust page size, margins, and zoom.',
];
export default function App() {
    const dataset = useAppStore((state) => state.dataset);
    const template = useAppStore((state) => state.template);
    const previewIndex = useAppStore((state) => state.previewIndex);
    const autosaveEnabled = useAppStore((state) => state.preferences.autosave);
    const fields = useAppStore(selectFieldPalette);
    const [editor, setEditor] = React.useState(null);
    const [saveState, setSaveState] = React.useState(autosaveEnabled ? 'saved' : 'idle');
    const [lastSavedAt, setLastSavedAt] = React.useState(null);
    const [stats, setStats] = React.useState({
        words: 0,
        characters: 0,
    });
    const saveTimerRef = React.useRef();
    const handleEditorReady = React.useCallback((instance) => {
        setEditor(instance);
    }, []);
    const fieldLookup = React.useMemo(() => {
        const map = new Map();
        fields.forEach((field) => {
            map.set(field.key, field.label);
        });
        return map;
    }, [fields]);
    const insertMergeTag = React.useCallback((fieldKey) => {
        if (!editor)
            return;
        const label = fieldLookup.get(fieldKey) ?? fieldKey;
        editor
            .chain()
            .focus()
            .insertContent({ type: 'mergeTag', attrs: { fieldKey, label } })
            .run();
    }, [editor, fieldLookup]);
    const handleInsertField = React.useCallback((fieldKey) => {
        insertMergeTag(fieldKey);
    }, [insertMergeTag]);
    React.useEffect(() => {
        if (!autosaveEnabled) {
            setSaveState('idle');
            return;
        }
        setSaveState('saving');
        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = window.setTimeout(() => {
            setSaveState('saved');
            setLastSavedAt(Date.now());
        }, 1000);
        return () => {
            if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
            }
        };
    }, [template, autosaveEnabled]);
    React.useEffect(() => {
        if (!editor)
            return;
        const updateStats = () => {
            const storage = editor.storage.characterCount;
            const characters = storage?.characters() ?? 0;
            const words = storage?.words() ?? 0;
            setStats({ characters, words });
        };
        updateStats();
        editor.on('update', updateStats);
        return () => {
            editor.off('update', updateStats);
        };
    }, [editor]);
    React.useEffect(() => {
        if (template.styles.theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [template.styles.theme]);
    React.useEffect(() => {
        document.body.style.fontFamily = template.styles.fontFamily;
        return () => {
            document.body.style.fontFamily = '';
        };
    }, [template.styles.fontFamily]);
    const footerTip = React.useMemo(() => {
        if (!fields.length) {
            return 'Import a dataset to unlock merge tags and personalized exports.';
        }
        return FOOTER_TIPS[previewIndex % FOOTER_TIPS.length];
    }, [fields.length, previewIndex]);
    return (_jsx("div", { className: 'min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100/60 pb-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950', children: _jsxs("div", { className: 'mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:gap-8', children: [_jsx(AppHeader, {}), _jsxs("div", { className: 'grid flex-1 grid-cols-1 items-start gap-4 lg:[grid-template-columns:320px_minmax(0,1fr)] xl:[grid-template-columns:320px_minmax(0,1fr)_360px] 2xl:[grid-template-columns:340px_minmax(0,1fr)_380px]', children: [_jsxs("aside", { className: 'order-1 flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:sticky lg:top-24 lg:max-h-[calc(100vh-12rem)]', children: [_jsxs("div", { className: 'mb-4 flex flex-wrap items-center justify-between gap-2', children: [_jsx("h2", { className: 'text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400', children: "Field palette" }), dataset && (_jsxs(Badge, { variant: 'outline', children: [dataset.fields.length, " fields"] }))] }), _jsx(FieldPalette, { onInsertField: handleInsertField })] }), _jsxs("main", { className: 'order-2 flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:min-h-[560px]', children: [_jsxs("div", { className: 'flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:px-6', children: [_jsx("span", { children: "Document designer" }), _jsxs("span", { className: 'flex items-center gap-1 whitespace-nowrap', children: [_jsxs("span", { children: ["Page ", template.page.size] }), _jsx("span", { "aria-hidden": 'true', children: "\u2022" }), _jsx("span", { className: 'capitalize', children: template.page.orientation })] })] }), editor && (_jsx("div", { className: 'border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60 sm:px-6', children: _jsx(TextFormattingToolbar, { editor: editor, className: 'bg-white/95 dark:bg-slate-900/80' }) })), _jsx("div", { className: 'flex-1', children: _jsx(DocumentDesigner, { onEditorReady: handleEditorReady, className: 'h-full' }) })] }), _jsxs("aside", { className: 'order-3 flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:col-span-2 lg:flex-row lg:gap-6 lg:py-6 xl:col-span-1 xl:flex-col xl:gap-0 xl:py-5', children: [_jsx("div", { className: 'mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:mb-0 lg:w-44 xl:mb-4 xl:w-full', children: "Properties" }), _jsx("div", { className: 'flex-1', children: _jsx(PropertiesPanel, {}) })] })] }), _jsxs("footer", { className: 'flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-sm shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 md:flex-row md:items-center md:justify-between', children: [_jsxs("div", { className: 'flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300', children: [_jsxs("span", { children: ["Words: ", _jsx("strong", { children: stats.words })] }), _jsxs("span", { children: ["Characters: ", _jsx("strong", { children: stats.characters })] }), _jsxs("span", { children: ["Canvas: ", template.page.size, " \u2022 ", template.page.orientation] }), dataset && _jsxs("span", { children: [dataset.rows.length, " records"] })] }), _jsxs("div", { className: 'flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400', children: [autosaveEnabled ? (_jsxs("span", { children: [saveState === 'saving' ? 'Saving…' : 'All changes saved', saveState === 'saved' && lastSavedAt
                                            ? ` • ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                            : null] })) : (_jsx("span", { children: "Autosave disabled" })), _jsx("span", { className: 'hidden md:inline', "aria-hidden": 'true', children: "\u2022" }), _jsx("span", { className: 'max-w-md text-ellipsis text-slate-600 dark:text-slate-300 md:text-right', children: footerTip })] })] })] }) }));
}

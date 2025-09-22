import * as React from 'react';
import type { Editor } from '@tiptap/core';
import { AppHeader } from '@/components/layout/AppHeader';
import { FieldPalette } from '@/components/panels/FieldPalette';
import { DocumentDesigner } from '@/components/editor/DocumentDesigner';
import { DocumentPreview } from '@/components/preview/DocumentPreview';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAppStore, selectFieldPalette } from '@/store/useAppStore';
import type { CanvasMode } from '@/lib/types';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';

/**
 * Rotating guidance surfaced in the footer to help first-time users discover
 * the editor's capabilities.
 */
const FOOTER_TIPS = [
  'Click a field to drop a merge tag at your cursor.',
  'Use Cmd/Ctrl+E to open the quick merge tag inserter.',
  'Right-click any merge tag to rename, copy, or remove it.',
  'Use the properties panel to adjust page size, margins, and zoom.',
];

/**
 * High-level layout that wires together dataset import, the Tiptap designer,
 * and the document generation workflow.
 */
export default function App() {
  const dataset = useAppStore((state) => state.dataset);
  const template = useAppStore((state) => state.template);
  const previewIndex = useAppStore((state) => state.previewIndex);
  const autosaveEnabled = useAppStore((state) => state.preferences.autosave);
  const fields = useAppStore(selectFieldPalette);
  const canvasMode = useAppStore((state) => state.canvasMode);
  const setCanvasMode = useAppStore((state) => state.setCanvasMode);
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>(
    autosaveEnabled ? 'saved' : 'idle',
  );
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [stats, setStats] = React.useState<{
    words: number;
    characters: number;
  }>({
    words: 0,
    characters: 0,
  });
  const saveTimerRef = React.useRef<number | undefined>();

  const handleEditorReady = React.useCallback((instance: Editor) => {
    setEditor(instance);
  }, []);
  const handleModeChange = React.useCallback((value: string) => {
    if (value === 'edit' || value === 'preview') {
      setCanvasMode(value as CanvasMode);
    }
  }, [setCanvasMode]);


  const fieldLookup = React.useMemo(() => {
    const map = new Map<string, string>();
    fields.forEach((field) => {
      map.set(field.key, field.label);
    });
    return map;
  }, [fields]);

  const insertMergeTag = React.useCallback(
    (fieldKey: string) => {
      if (!editor) return;
      const label = fieldLookup.get(fieldKey) ?? fieldKey;
      editor
        .chain()
        .focus()
        .insertContent({ type: 'mergeTag', attrs: { fieldKey, label } })
        .run();
    },
    [editor, fieldLookup],
  );

  const handleInsertField = React.useCallback(
    (fieldKey: string) => {
      insertMergeTag(fieldKey);
    },
    [insertMergeTag],
  );

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
    if (!editor) return;
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
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [template.styles.theme]);

  React.useEffect(() => {
    const defaultFont = "'Roboto', system-ui, sans-serif";
    document.body.style.fontFamily = defaultFont;
    ensureGoogleFontsLoaded(['Roboto']);
    return () => {
      document.body.style.fontFamily = defaultFont;
    };
  }, []);

  const footerTip = React.useMemo(() => {
    if (!fields.length) {
      return 'Import a dataset to unlock merge tags and personalized exports.';
    }
    return FOOTER_TIPS[previewIndex % FOOTER_TIPS.length];
  }, [fields.length, previewIndex]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100/60 pb-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
      <div className='mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:gap-8'>
        <AppHeader />
        <div className='grid flex-1 grid-cols-1 items-start gap-4 lg:[grid-template-columns:320px_minmax(0,1fr)] xl:[grid-template-columns:320px_minmax(0,1fr)_360px] 2xl:[grid-template-columns:340px_minmax(0,1fr)_380px]'>
          <aside className='order-1 flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:sticky lg:top-24 lg:h-[calc(100vh-12rem)] lg:max-h-[calc(100vh-12rem)]'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
              <h2 className='text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>
                Field palette
              </h2>
              {dataset && (
                <Badge variant='outline'>
                  {dataset.fields.length} fields
                </Badge>
              )}
            </div>
            <FieldPalette onInsertField={handleInsertField} />
          </aside>
          <main className='order-2 flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:min-h-[560px]'>
            <div className='flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:px-6'>
              <div className='flex flex-wrap items-center gap-3'>
                <span>Document workspace</span>
                <ToggleGroup
                  type='single'
                  value={canvasMode}
                  onValueChange={handleModeChange}
                  aria-label='Document mode'
                  className='flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-semibold tracking-wider text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                >
                  <ToggleGroupItem value='edit' className='px-3 py-1 text-[11px] uppercase data-[state=on]:bg-brand-500 data-[state=on]:text-white'>Edit template</ToggleGroupItem>
                  <ToggleGroupItem value='preview' className='px-3 py-1 text-[11px] uppercase data-[state=on]:bg-brand-500 data-[state=on]:text-white'>Preview</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <span className='flex items-center gap-1 whitespace-nowrap'>
                <span>Page {template.page.size}</span>
                <span aria-hidden='true'>/</span>
                <span className='capitalize'>
                  {template.page.orientation}
                </span>
              </span>
            </div>
            <div className='flex-1'>
              {canvasMode === 'preview' ? (
                <DocumentPreview className='h-full' />
              ) : (
                <DocumentDesigner onEditorReady={handleEditorReady} className='h-full' />
              )}
            </div>
          </main>
          <aside className='order-3 flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:col-span-2 lg:flex-row lg:gap-6 lg:py-6 xl:col-span-1 xl:flex-col xl:gap-0 xl:py-5'>
            <div className='mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:mb-0 lg:w-44 xl:mb-4 xl:w-full'>
              Properties
            </div>
            <div className='flex-1'>
              <PropertiesPanel editor={canvasMode === 'edit' ? editor : null} />
            </div>
          </aside>
        </div>
        <footer className='flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-sm shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300'>
            <span>
              Words: <strong>{stats.words}</strong>
            </span>
            <span>
              Characters: <strong>{stats.characters}</strong>
            </span>
            <span>
              Canvas: {template.page.size} • {template.page.orientation}
            </span>
            {dataset && <span>{dataset.rows.length} records</span>}
          </div>
          <div className='flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400'>
            {autosaveEnabled ? (
              <span>
                {saveState === 'saving' ? 'Saving…' : 'All changes saved'}
                {saveState === 'saved' && lastSavedAt
                  ? ` • ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : null}
              </span>
            ) : (
              <span>Autosave disabled</span>
            )}
            <span className='hidden md:inline' aria-hidden='true'>
              •
            </span>
            <span className='max-w-md text-ellipsis text-slate-600 dark:text-slate-300 md:text-right'>
              {footerTip}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

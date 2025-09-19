import * as React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Editor } from '@tiptap/core';
import { AppHeader } from '@/components/layout/AppHeader';
import { FieldPalette } from '@/components/panels/FieldPalette';
import { DocumentDesigner } from '@/components/editor/DocumentDesigner';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { Badge } from '@/components/ui/badge';
import { useAppStore, selectFieldPalette } from '@/store/useAppStore';

interface DraggedFieldState {
  key: string;
  label: string;
}

const DROPPABLE_ID = 'designer-canvas';

const FOOTER_TIPS = [
  'Double-click a field to drop a merge tag at your cursor.',
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
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const [draggedField, setDraggedField] = React.useState<DraggedFieldState | null>(null);
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>(
    autosaveEnabled ? 'saved' : 'idle',
  );
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [stats, setStats] = React.useState<{ words: number; characters: number }>({
    words: 0,
    characters: 0,
  });
  const saveTimerRef = React.useRef<number | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleEditorReady = React.useCallback((instance: Editor) => {
    setEditor(instance);
  }, []);

  const fieldLookup = React.useMemo(() => {
    const map = new Map<string, string>();
    fields.forEach((field) => {
      map.set(field.key, field.label);
    });
    return map;
  }, [fields]);

  const insertMergeTag = React.useCallback(
    (fieldKey: string, coordinates?: { x: number; y: number }) => {
      if (!editor) return;
      const label = fieldLookup.get(fieldKey) ?? fieldKey;
      let inserted = false;
      if (coordinates) {
        const resolved = editor.view.posAtCoords({ left: coordinates.x, top: coordinates.y });
        if (resolved?.pos != null) {
          editor
            .chain()
            .focus()
            .insertContentAt(resolved.pos, {
              type: 'mergeTag',
              attrs: { fieldKey, label },
            })
            .run();
          inserted = true;
        }
      }
      if (!inserted) {
        editor
          .chain()
          .focus()
          .insertContent({ type: 'mergeTag', attrs: { fieldKey, label } })
          .run();
      }
    },
    [editor, fieldLookup],
  );

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const fieldKey = event.active.data.current?.fieldKey as string | undefined;
      if (!fieldKey) return;
      const label = fieldLookup.get(fieldKey) ?? fieldKey;
      setDraggedField({ key: fieldKey, label });
    },
    [fieldLookup],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const fieldKey = event.active.data.current?.fieldKey as string | undefined;
      if (fieldKey && event.over?.id === DROPPABLE_ID) {
  const sensorEvent = (event as any).sensorEvent as PointerEvent | undefined;
        if (sensorEvent && 'clientX' in sensorEvent && 'clientY' in sensorEvent) {
          insertMergeTag(fieldKey, { x: sensorEvent.clientX, y: sensorEvent.clientY });
        } else {
          insertMergeTag(fieldKey);
        }
      }
      setDraggedField(null);
    },
    [insertMergeTag],
  );

  const handleDragCancel = React.useCallback(() => {
    setDraggedField(null);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100/60 pb-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:gap-8">
        <AppHeader />
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid flex-1 grid-cols-1 items-start gap-4 lg:[grid-template-columns:320px_minmax(0,1fr)] xl:[grid-template-columns:320px_minmax(0,1fr)_360px] 2xl:[grid-template-columns:340px_minmax(0,1fr)_380px]">
            <aside className="order-1 flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:sticky lg:top-24 lg:max-h-[calc(100vh-12rem)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Field palette
                </h2>
                {dataset && <Badge variant="outline">{dataset.fields.length} fields</Badge>}
              </div>
              <FieldPalette onInsertField={handleInsertField} />
            </aside>
            <main className="order-2 flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:min-h-[560px]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:px-6">
                <span>Document designer</span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span>Page {template.page.size}</span>
                  <span aria-hidden="true">•</span>
                  <span className="capitalize">{template.page.orientation}</span>
                </span>
              </div>
              <div className="flex-1">
                <DocumentDesigner droppableId={DROPPABLE_ID} onEditorReady={handleEditorReady} className="h-full" />
              </div>
            </main>
            <aside className="order-3 flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:col-span-2 lg:flex-row lg:gap-6 lg:py-6 xl:col-span-1 xl:flex-col xl:gap-0 xl:py-5">
              <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:mb-0 lg:w-44 xl:mb-4 xl:w-full">
                Properties
              </div>
              <div className="flex-1">
                <PropertiesPanel />
              </div>
            </aside>
          </div>
          <DragOverlay dropAnimation={null}>
            {draggedField ? (
              <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 shadow-lg">
                <span>{draggedField.label}</span>
                <Badge variant="outline">{`{{${draggedField.key}}}`}</Badge>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <footer className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-sm shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300">
            <span>Words: <strong>{stats.words}</strong></span>
            <span>Characters: <strong>{stats.characters}</strong></span>
            <span>
              Canvas: {template.page.size} • {template.page.orientation}
            </span>
            {dataset && <span>{dataset.rows.length} records</span>}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400">
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
            <span className="hidden md:inline" aria-hidden="true">
              •
            </span>
            <span className="max-w-md text-ellipsis text-slate-600 dark:text-slate-300 md:text-right">
              {footerTip}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

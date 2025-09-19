import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import CharacterCount from '@tiptap/extension-character-count';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { useAppStore, selectDataset, selectTemplate } from '@/store/useAppStore';
import { MergeTag } from '@/editor/merge-tag-node';
import { getSampleValue } from '@/lib/dataset';
import type { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';

const PAGE_DIMENSIONS: Record<'Letter' | 'A4', { width: number; height: number }> = {
  Letter: { width: 816, height: 1056 },
  A4: { width: 794, height: 1123 },
};

function ptsToPx(value: number) {
  return (value / 72) * 96;
}

export interface DocumentDesignerProps {
  className?: string;
  onEditorReady?: (editor: Editor) => void;
  droppableId?: string;
}

export function DocumentDesigner({ className, onEditorReady, droppableId = 'designer-canvas' }: DocumentDesignerProps) {
  const dataset = useAppStore(selectDataset);
  const template = useAppStore(selectTemplate);
  const previewIndex = useAppStore((state) => state.previewIndex);
  const setTemplateContent = useAppStore((state) => state.setTemplateContent);
  const zoom = useAppStore((state) => state.zoom);
  const showGrid = useAppStore((state) => state.showGrid);
  const { setNodeRef } = useDroppable({ id: droppableId });

  const mergeTagExtension = React.useMemo(
    () =>
      MergeTag.configure({
        sampleProvider: (fieldKey: string) => getSampleValue(dataset, fieldKey, previewIndex),
        isFieldValid: (fieldKey: string) =>
          dataset ? dataset.fields.some((field) => field.key === fieldKey) : true,
      }),
    [dataset, previewIndex],
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: true }),
        Placeholder.configure({ placeholder: 'Compose your investor-ready narrative…' }),
        Link.configure({ openOnClick: false, autolink: true }),
        Underline,
        Highlight,
        Image.configure({ allowBase64: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Color,
        TextStyle,
        Dropcursor,
        Gapcursor,
        CharacterCount.configure(),
        mergeTagExtension,
      ],
      content: template.content,
      editorProps: {
        attributes: {
          class:
            'min-h-[800px] prose prose-slate max-w-none focus:outline-none dark:prose-invert prose-headings:font-semibold',
        },
        handleDOMEvents: {
          keydown: (_view, event) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
              event.preventDefault();
              const firstField = dataset?.fields[0];
              if (firstField) {
                editor?.chain().focus().command(({ tr: _tr }) => {
                  editor.commands.insertContent({ type: 'mergeTag', attrs: { fieldKey: firstField.key, label: firstField.label } });
                  return true;
                });
              }
              return true;
            }
            return false;
          },
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        setTemplateContent(currentEditor.getJSON());
      },
    },
    [mergeTagExtension],
  );

  React.useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  React.useEffect(() => {
    if (editor && template) {
      const current = editor.getJSON();
      if (JSON.stringify(current) !== JSON.stringify(template.content)) {
        editor.commands.setContent(template.content, false);
      }
    }
  }, [editor, template]);

  const page = template.page;
  const dimensions = PAGE_DIMENSIONS[page.size];
  const pageWidth = page.orientation === 'portrait' ? dimensions.width : dimensions.height;
  const pageHeight = page.orientation === 'portrait' ? dimensions.height : dimensions.width;
  const padding = {
    paddingTop: ptsToPx(page.margins.top),
    paddingRight: ptsToPx(page.margins.right),
    paddingBottom: ptsToPx(page.margins.bottom),
    paddingLeft: ptsToPx(page.margins.left),
  } as React.CSSProperties;

  const baseStyles = React.useMemo<React.CSSProperties>(
    () => ({
      fontFamily: template.styles.fontFamily,
      fontSize: `${template.styles.baseFontSize}px`,
      lineHeight: 1.6,
      color: template.styles.theme === 'dark' ? 'rgb(226 232 240)' : 'inherit',
    }),
    [template.styles.fontFamily, template.styles.baseFontSize, template.styles.theme],
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-auto bg-slate-100/70 p-4 sm:p-6',
        className,
      )}
    >
      <div
        className={cn(
          'relative max-w-full rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950',
        )}
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      >
        {showGrid && (
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
        )}
        <div className="absolute inset-0 overflow-auto">
          <div style={{ ...padding, ...baseStyles }} className="relative h-full w-full">
            <EditorContent editor={editor} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center text-xs text-slate-400">
          <span>
            Zoom {Math.round(zoom * 100)}% · {page.size} {page.orientation}
          </span>
        </div>
      </div>
    </div>
  );
}

import * as React from 'react';
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
import { getDocumentBaseStyles, getPageDimensions, getPagePadding } from '@/lib/template-style';

export interface DocumentDesignerProps {
  className?: string;
  onEditorReady?: (editor: Editor) => void;
}

/**
 * Configure and render the Tiptap-powered document designer with merge tag
 * support and zoom/grid controls sourced from application state.
 */
export function DocumentDesigner({ className, onEditorReady }: DocumentDesignerProps) {
  const dataset = useAppStore(selectDataset);
  const template = useAppStore(selectTemplate);
  const previewIndex = useAppStore((state) => state.previewIndex);
  const setTemplateContent = useAppStore((state) => state.setTemplateContent);
  const zoom = useAppStore((state) => state.zoom);
  const showGrid = useAppStore((state) => state.showGrid);
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
                editor?.chain().focus().command(() => {
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

  const pageDimensions = React.useMemo(() => getPageDimensions(template.page), [template.page]);
  const padding = React.useMemo(() => getPagePadding(template.page.margins), [template.page.margins]);
  const baseStyles = React.useMemo<React.CSSProperties>(
    () => getDocumentBaseStyles(template),
    [template],
  );
  const page = template.page;
  const { width: pageWidth, height: pageHeight } = pageDimensions;


  return (
    <div
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
          <div
            style={{ ...padding, ...baseStyles }}
            className="relative h-full w-full"
            data-document-typography
          >
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

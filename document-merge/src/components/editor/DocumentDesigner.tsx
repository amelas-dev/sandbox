import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import {
  PremiumTable,
  PremiumTableCell,
  PremiumTableHeader,
  PremiumTableRow,
} from '@/editor/extensions/premium-table';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { useAppStore, selectDataset, selectTemplate } from '@/store/useAppStore';
import { MergeTag } from '@/editor/merge-tag-node';
import { InlineTableControls } from './InlineTableControls';
import { ListStyleBullet, ListStyleOrdered } from '@/editor/extensions/list-style';
import { ExtendedTextStyle } from '@/editor/extensions/text-style';
import { getSampleValue } from '@/lib/dataset';
import type { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';
import { getDocumentBaseStyles, getPageDimensions, getPagePadding } from '@/lib/template-style';
import type { PageBackgroundOption } from '@/lib/types';

function extractPrimaryFamily(fontStack: string): string {
  if (!fontStack) {
    return '';
  }
  const first = fontStack.split(',')[0]?.trim() ?? '';
  return first.replace(/^['"]/, '').replace(/['"]$/, '');
}

const PAGE_BACKGROUND_CLASSES: Record<PageBackgroundOption, string> = {
  white: 'bg-white dark:bg-slate-950',
  transparent: 'bg-transparent',
  softGray: 'bg-slate-50 dark:bg-slate-900/80',
  linen: 'bg-[#fef8f1] dark:bg-slate-900/70',
};

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

  const editorContainerRef = React.useRef<HTMLDivElement | null>(null);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: {}, bulletList: false, orderedList: false }),
        Placeholder.configure({ placeholder: 'Compose your investor-ready narrative…' }),
        Link.configure({ openOnClick: false, autolink: true }),
        Underline,
        Highlight.configure({ multicolor: true }),
        Image.configure({ allowBase64: true }),
        PremiumTable.configure({ resizable: true }),
        PremiumTableRow,
        PremiumTableCell,
        PremiumTableHeader,
        ListStyleBullet.configure({ keepMarks: true, keepAttributes: true }),
        ListStyleOrdered.configure({ keepMarks: true, keepAttributes: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Color,
        ExtendedTextStyle,
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
  const baseStyles = React.useMemo(() => getDocumentBaseStyles(template), [template]);
  const page = template.page;
  const appearance = template.appearance ?? { background: 'white', dropShadow: true, pageBorder: true, stylePreset: 'professional' } as const;
  const backgroundClass = PAGE_BACKGROUND_CLASSES[appearance.background] ?? PAGE_BACKGROUND_CLASSES.white;
  const pageShellClass = cn(
    'relative max-w-full rounded-2xl transition-all duration-150',
    appearance.pageBorder ? 'border border-slate-200 dark:border-slate-800' : 'border border-transparent',
    appearance.dropShadow ? 'shadow-xl shadow-slate-200/70 dark:shadow-black/40' : 'shadow-none',
    backgroundClass,
  );

  const { width: pageWidth, height: pageHeight } = pageDimensions;

  React.useEffect(() => {
    const families = [
      extractPrimaryFamily(template.styles.fontFamily),
      extractPrimaryFamily(template.styles.headingFontFamily),
    ].filter((family) => family.length > 0);
    if (families.length) {
      ensureGoogleFontsLoaded(families);
    }
  }, [template.styles.fontFamily, template.styles.headingFontFamily]);


  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-auto scrollbar-sleek bg-slate-100/70 p-4 sm:p-6',
        className,
      )}
    >
      <div
        className={pageShellClass}
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
        <div className="absolute inset-0 overflow-auto scrollbar-sleek">
          <div
            ref={editorContainerRef}
            style={{ ...padding, ...baseStyles }}
            className="relative h-full w-full"
            data-document-typography
          >
            <EditorContent editor={editor} />
            {editor ? <InlineTableControls editor={editor} containerRef={editorContainerRef} /> : null}
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

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { EnhancedImage, DEFAULT_IMAGE_BORDER_COLOR } from '@/editor/extensions/enhanced-image';
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
import { InlineImageControls } from './InlineImageControls';
import { ListStyleBullet, ListStyleOrdered } from '@/editor/extensions/list-style';
import { ExtendedTextStyle } from '@/editor/extensions/text-style';
import { getSampleValue } from '@/lib/dataset';
import type { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';
import { getDocumentBaseStyles, getPageDimensions, getPagePadding } from '@/lib/template-style';
import type { PageBackgroundOption } from '@/lib/types';
import { NodeSelection } from '@tiptap/pm/state';

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
        EnhancedImage.configure({ allowBase64: true }),
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
                  editor.commands.insertContent({
                    type: 'mergeTag',
                    attrs: { fieldKey: firstField.key, label: firstField.label, suppressIfEmpty: false },
                  });
                  return true;
                });
              }
              return true;
            }
            return false;
          },
          click: (view, event) => {
            const target = event.target as HTMLElement | null;
            if (!target) {
              return false;
            }

            const image = target.closest('img[data-editor-image]');
            if (!image) {
              return false;
            }

            event.preventDefault();

            let pos: number | null = null;
            try {
              pos = view.posAtDOM(image, 0);
            } catch (error) {
              console.error('Failed to resolve image position for selection', error);
              pos = null;
            }

            if (pos === null) {
              return false;
            }

            const { state } = view;
            const transaction = state.tr.setSelection(NodeSelection.create(state.doc, pos));
            view.dispatch(transaction);
            view.focus();

            return true;
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
    if (!editor) {
      return;
    }

    const container = editorContainerRef.current;
    if (!container) {
      return;
    }

    const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    const readFileAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Unable to read image.'));
          }
        };
        reader.onerror = () => {
          reject(reader.error ?? new Error('Unable to read image.'));
        };
        reader.readAsDataURL(file);
      });

    const buildImageAttributes = (src: string, alt?: string | null) => ({
      src,
      alt: alt && alt.trim().length > 0 ? alt.trim() : null,
      title: null,
      widthPercent: 60,
      alignment: 'inline' as const,
      borderRadius: 8,
      borderWidth: 0,
      borderColor: DEFAULT_IMAGE_BORDER_COLOR,
      shadow: true,
    });

    const sanitizeFileAlt = (file: File) =>
      file.name
        .replace(/\.[^./]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();

    const pickFirstUri = (value: string) => {
      const lines = value.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed.startsWith('#')) {
          continue;
        }
        return trimmed;
      }
      return '';
    };

    const isLikelyImageSource = (value: string) =>
      /^data:image\//i.test(value) || /^(https?:|blob:)/i.test(value);

    const getDropPosition = (event: DragEvent) => {
      const view = editor.view;
      const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
      return coords?.pos ?? view.state.selection.to;
    };

    const insertImageAt = (position: number, src: string, alt?: string | null) => {
      editor
        .chain()
        .focus()
        .insertContentAt(position, { type: 'image', attrs: buildImageAttributes(src, alt) })
        .run();
      return editor.state.selection.to;
    };

    const collectImageFiles = (transfer: DataTransfer) => {
      const files: File[] = [];
      if (transfer.items) {
        for (let index = 0; index < transfer.items.length; index += 1) {
          const item = transfer.items[index];
          if (!item || item.kind !== 'file') {
            continue;
          }
          const file = item.getAsFile();
          if (file && file.type.startsWith('image/')) {
            files.push(file);
          }
        }
      }
      if (files.length === 0) {
        for (let index = 0; index < transfer.files.length; index += 1) {
          const file = transfer.files.item(index);
          if (file && file.type.startsWith('image/')) {
            files.push(file);
          }
        }
      }
      return files;
    };

    const containsType = (transfer: DataTransfer, type: string) => {
      for (let index = 0; index < transfer.types.length; index += 1) {
        if (transfer.types[index] === type) {
          return true;
        }
      }
      return false;
    };

    const handleDragOver = (event: DragEvent) => {
      const transfer = event.dataTransfer;
      if (!transfer) {
        return;
      }

      const hasImageFile = collectImageFiles(transfer).length > 0;
      const hasImageUrl = containsType(transfer, 'text/uri-list');
      if (hasImageFile || hasImageUrl) {
        event.preventDefault();
        transfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (event: DragEvent) => {
      const transfer = event.dataTransfer;
      if (!transfer) {
        return;
      }

      const dropPosition = getDropPosition(event);
      const imageFiles = collectImageFiles(transfer);

      if (imageFiles.length > 0) {
        event.preventDefault();

        const processFiles = async () => {
          let nextPosition = dropPosition;
          for (const file of imageFiles) {
            if (file.size > MAX_IMAGE_FILE_SIZE) {
              console.warn('Skipped image larger than 5 MB.');
              continue;
            }
            try {
              const dataUrl = await readFileAsDataUrl(file);
              nextPosition = insertImageAt(nextPosition, dataUrl, sanitizeFileAlt(file));
            } catch (error) {
              console.error('Failed to load dropped image', error);
            }
          }
        };

        void processFiles();
        return;
      }

      const uriList = transfer.getData('text/uri-list');
      const plainText = transfer.getData('text/plain');
      const candidate = pickFirstUri(uriList || plainText);

      if (candidate.length > 0 && isLikelyImageSource(candidate)) {
        event.preventDefault();
        insertImageAt(dropPosition, candidate);
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [editor]);

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
            {editor ? (
              <>
                <InlineTableControls editor={editor} containerRef={editorContainerRef} />
                <InlineImageControls editor={editor} containerRef={editorContainerRef} />
              </>
            ) : null}
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

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
import { MergeTagSuggestionMenu } from './MergeTagSuggestionMenu';
import { ListStyleBullet, ListStyleOrdered } from '@/editor/extensions/list-style';
import { ExtendedTextStyle } from '@/editor/extensions/text-style';
import { getSampleValue } from '@/lib/dataset';
import type { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';
import { getDocumentBaseStyles, getPageDimensions, getPagePadding } from '@/lib/template-style';
import { filterFieldsByQuery } from '@/lib/field-utils';
import type { DatasetField, PageBackgroundOption } from '@/lib/types';
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

interface MergeTagMenuState {
  range: { from: number; to: number };
  query: string;
  coords: { left: number; right: number; top: number; bottom: number };
}

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
  const fields = React.useMemo<DatasetField[]>(() => dataset?.fields ?? [], [dataset]);
  const [mergeTagMenu, setMergeTagMenu] = React.useState<MergeTagMenuState | null>(null);
  const mergeTagMenuRef = React.useRef<MergeTagMenuState | null>(mergeTagMenu);
  React.useEffect(() => {
    mergeTagMenuRef.current = mergeTagMenu;
  }, [mergeTagMenu]);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const highlightedIndexRef = React.useRef(0);
  React.useEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);
  const filteredFieldsRef = React.useRef<DatasetField[]>([]);
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

  const handleSelectField = React.useCallback(
    (field: DatasetField) => {
      const menu = mergeTagMenuRef.current;
      if (!editor || !menu) {
        return;
      }
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: menu.range.from, to: menu.range.to },
          {
            type: 'mergeTag',
            attrs: {
              fieldKey: field.key,
              label: field.label,
              suppressIfEmpty: false,
            },
          },
        )
        .run();
      setMergeTagMenu(null);
    },
    [editor],
  );

  const handleSelectFieldRef = React.useRef(handleSelectField);
  React.useEffect(() => {
    handleSelectFieldRef.current = handleSelectField;
  }, [handleSelectField]);

  const filteredFields = React.useMemo(() => {
    if (!mergeTagMenu) {
      return [] as DatasetField[];
    }
    return filterFieldsByQuery(fields, mergeTagMenu.query).slice(0, 20);
  }, [fields, mergeTagMenu]);

  React.useEffect(() => {
    filteredFieldsRef.current = filteredFields;
  }, [filteredFields]);

  React.useEffect(() => {
    if (!mergeTagMenu) {
      filteredFieldsRef.current = [];
    }
  }, [mergeTagMenu]);

  const lastQueryRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!mergeTagMenu) {
      lastQueryRef.current = null;
      setHighlightedIndex(0);
      return;
    }
    if (mergeTagMenu.query !== lastQueryRef.current) {
      lastQueryRef.current = mergeTagMenu.query;
      setHighlightedIndex(0);
    }
  }, [mergeTagMenu]);

  React.useEffect(() => {
    if (!mergeTagMenu || filteredFields.length === 0) {
      return;
    }
    if (highlightedIndex >= filteredFields.length) {
      setHighlightedIndex(filteredFields.length - 1);
    }
  }, [filteredFields, highlightedIndex, mergeTagMenu]);

  const updateSuggestionState = React.useCallback(() => {
    if (!editor) {
      return;
    }

    if (!fields.length) {
      if (mergeTagMenuRef.current) {
        setMergeTagMenu(null);
      }
      return;
    }

    const { state } = editor;
    const { from, empty } = state.selection;

    if (!empty) {
      if (mergeTagMenuRef.current) {
        setMergeTagMenu(null);
      }
      return;
    }

    const lookupLimit = 200;
    const textBefore = state.doc.textBetween(
      Math.max(0, from - lookupLimit),
      from,
      '\n',
      ' ',
    );
    const match = /(?:^|[\s\u00A0([{])@([^\s@]*)$/i.exec(textBefore);

    if (!match) {
      if (mergeTagMenuRef.current) {
        setMergeTagMenu(null);
      }
      return;
    }

    const query = match[1] ?? '';
    const start = from - query.length - 1;
    if (start < 0) {
      if (mergeTagMenuRef.current) {
        setMergeTagMenu(null);
      }
      return;
    }

    let coords: MergeTagMenuState['coords'] | null = null;
    try {
      coords = editor.view.coordsAtPos(from);
    } catch {
      coords = null;
    }

    if (!coords) {
      if (mergeTagMenuRef.current) {
        setMergeTagMenu(null);
      }
      return;
    }

    setMergeTagMenu((previous) => {
      if (
        previous &&
        previous.range.from === start &&
        previous.range.to === from &&
        previous.query === query &&
        previous.coords.left === coords.left &&
        previous.coords.right === coords.right &&
        previous.coords.top === coords.top &&
        previous.coords.bottom === coords.bottom
      ) {
        return previous;
      }
      return {
        range: { from: start, to: from },
        query,
        coords,
      };
    });
  }, [editor, fields.length]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const run = () => updateSuggestionState();
    const dismiss = () => setMergeTagMenu(null);

    editor.on('selectionUpdate', run);
    editor.on('transaction', run);
    editor.on('focus', run);
    editor.on('blur', dismiss);

    return () => {
      editor.off('selectionUpdate', run);
      editor.off('transaction', run);
      editor.off('focus', run);
      editor.off('blur', dismiss);
    };
  }, [editor, updateSuggestionState]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    if (!fields.length) {
      setMergeTagMenu(null);
      return;
    }
    if (mergeTagMenuRef.current) {
      updateSuggestionState();
    }
  }, [editor, fields.length, updateSuggestionState]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const dom = editor.view.dom;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        const firstField = fields[0];
        if (firstField) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'mergeTag',
              attrs: {
                fieldKey: firstField.key,
                label: firstField.label,
                suppressIfEmpty: false,
              },
            })
            .run();
        }
        return;
      }

      const menu = mergeTagMenuRef.current;
      if (!menu) {
        return;
      }

      const items = filteredFieldsRef.current;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (items.length > 0) {
          const next = (highlightedIndexRef.current + 1) % items.length;
          setHighlightedIndex(next);
        }
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (items.length > 0) {
          const total = items.length;
          const next = (highlightedIndexRef.current - 1 + total) % total;
          setHighlightedIndex(next);
        }
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (items.length === 0) {
          return;
        }
        event.preventDefault();
        const target = items[highlightedIndexRef.current] ?? items[0];
        if (target) {
          handleSelectFieldRef.current(target);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setMergeTagMenu(null);
      }
    };

    dom.addEventListener('keydown', handleKeyDown);
    return () => {
      dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, fields]);

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
        'relative flex h-full w-full items-center justify-center overflow-auto scrollbar-sleek bg-slate-100/70 px-4 pb-4 pt-[10%] sm:px-6 sm:pb-6 sm:pt-[10%]',
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
            <MergeTagSuggestionMenu
              open={Boolean(mergeTagMenu)}
              anchor={mergeTagMenu?.coords ?? { left: 0, right: 0, top: 0, bottom: 0 }}
              fields={filteredFields}
              highlightedIndex={
                filteredFields.length > 0
                  ? Math.min(highlightedIndex, filteredFields.length - 1)
                  : 0
              }
              onHover={(index) => setHighlightedIndex(index)}
              onSelect={handleSelectField}
              query={mergeTagMenu?.query ?? ''}
            />
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

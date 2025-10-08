import * as React from 'react';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  FlipHorizontal,
  FlipVertical,
  ImagePlus,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Sparkles,
  Square,
  StretchHorizontal,
  Text,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedImageAttributes, ImageAlignment } from '@/editor/extensions/enhanced-image';
import { DEFAULT_IMAGE_BORDER_COLOR } from '@/editor/extensions/enhanced-image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ImageSourceForm,
  type ImageSourceSubmitValue,
  type ImageSourceValue,
} from '@/components/editor/ImageSourceForm';

interface ImageContextMenuState {
  x: number;
  y: number;
  pos: number;
  attrs: EnhancedImageAttributes;
}

interface InlineImageControlsProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLElement>;
}

const QUICK_WIDTH_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '40%', value: 40 },
  { label: '60%', value: 60 },
  { label: '80%', value: 80 },
  { label: '100%', value: 100 },
];

const ALIGNMENT_OPTIONS: Array<{ label: string; value: ImageAlignment; icon: React.ComponentType<{ className?: string }> }> = [
  { label: 'Inline', value: 'inline', icon: Square },
  { label: 'Left', value: 'left', icon: AlignLeft },
  { label: 'Center', value: 'center', icon: AlignCenter },
  { label: 'Right', value: 'right', icon: AlignRight },
  { label: 'Full width', value: 'full', icon: StretchHorizontal },
];

const normalizeRotation = (value: number) => {
  let normalized = value % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
};

/**
 * Provides quick-access formatting for images via right-click in the editor canvas.
 */
export function InlineImageControls({ editor, containerRef }: InlineImageControlsProps) {
  const [menu, setMenu] = React.useState<ImageContextMenuState | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [imageEditorOpen, setImageEditorOpen] = React.useState(false);
  const [imageEditorSource, setImageEditorSource] = React.useState<ImageSourceValue | null>(null);
  const [imageEditorAlt, setImageEditorAlt] = React.useState('');
  const [imageEditorError, setImageEditorError] = React.useState<string | null>(null);
  const [imageEditorInitialFocus, setImageEditorInitialFocus] = React.useState<'file' | 'alt'>('file');

  const closeMenu = React.useCallback(() => setMenu(null), []);

  const updateAttributes = React.useCallback(
    (next: Partial<EnhancedImageAttributes>) => {
      const { state } = editor;
      const selection = state.selection;

      const targetPos = menu?.pos
        ?? (selection instanceof NodeSelection && selection.node.type.name === 'image'
          ? selection.from
          : null);

      if (targetPos === null) {
        return;
      }

      editor
        .chain()
        .focus()
        .command(({ state, tr, dispatch }) => {
          const node = state.doc.nodeAt(targetPos);
          if (!node || node.type.name !== 'image') {
            return false;
          }
          const attrs = { ...node.attrs, ...next };
          tr.setSelection(NodeSelection.create(state.doc, targetPos));
          tr.setNodeMarkup(targetPos, undefined, attrs);
          if (dispatch) {
            dispatch(tr);
          }
          return true;
        })
        .run();
    },
    [editor, menu],
  );

  const handleImageEditorOpenChange = React.useCallback(
    (open: boolean) => {
      setImageEditorOpen(open);
      if (!open) {
        setImageEditorError(null);
        setImageEditorSource(null);
        editor.view.focus();
      }
    },
    [editor],
  );

  const openImageEditor = React.useCallback((attrs: EnhancedImageAttributes, focus: 'file' | 'alt') => {
    setImageEditorSource(attrs.src ? { file: null, src: attrs.src } : null);
    setImageEditorAlt(attrs.alt ?? '');
    setImageEditorError(null);
    setImageEditorInitialFocus(focus);
    setImageEditorOpen(true);
  }, []);

  const handleImageEditorSubmit = React.useCallback(
    ({ src, alt }: ImageSourceSubmitValue) => {
      const trimmedAlt = alt.trim();
      updateAttributes({ src, alt: trimmedAlt.length > 0 ? trimmedAlt : null });
      handleImageEditorOpenChange(false);
    },
    [handleImageEditorOpenChange, updateAttributes],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const image = target.closest('img[data-editor-image]') as HTMLImageElement | null;
      if (!image) {
        return;
      }

      event.preventDefault();

      let pos: number;
      try {
        pos = editor.view.posAtDOM(image, 0);
      } catch {
        return;
      }

      const node = editor.view.state.doc.nodeAt(pos);
      if (!node || node.type.name !== 'image') {
        return;
      }

      const { state, view } = editor;
      const selection = NodeSelection.create(state.doc, pos);
      view.dispatch(state.tr.setSelection(selection));
      view.focus();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const clampedX = Math.min(event.clientX, viewportWidth - 280);
      const clampedY = Math.min(event.clientY, viewportHeight - 220);

      setMenu({
        x: Math.max(8, clampedX),
        y: Math.max(8, clampedY),
        pos,
        attrs: node.attrs as EnhancedImageAttributes,
      });
    };

    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [containerRef, editor]);

  React.useEffect(() => {
    if (!menu) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    const handleUpdate = () => {
      const { state } = editor;
      const selection = state.selection;
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') {
        closeMenu();
        return;
      }
      setMenu((prev) => (prev ? { ...prev, attrs: selection.node.attrs as EnhancedImageAttributes } : prev));
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [closeMenu, editor, menu]);

  let menuContent: React.ReactNode = null;

  if (menu) {
    const { attrs } = menu;

    const handleReplace = () => {
      openImageEditor(attrs, 'file');
      closeMenu();
    };

    const handleAltText = () => {
      openImageEditor(attrs, 'alt');
      closeMenu();
    };

    const handleShadowToggle = () => {
      updateAttributes({ shadow: !attrs.shadow });
    };

    const handleRoundedToggle = () => {
      updateAttributes({ borderRadius: attrs.borderRadius > 4 ? 0 : 12 });
    };

    const handleDelete = () => {
      editor.chain().focus().deleteSelection().run();
      closeMenu();
    };

    const handleAlignment = (alignment: ImageAlignment) => {
      updateAttributes({ alignment });
    };

    const handleWidth = (value: number) => {
      updateAttributes({ widthPercent: value });
    };

    menuContent = (
      <div
        ref={menuRef}
        className={cn(
          'pointer-events-auto absolute z-50 w-64 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95'
        )}
        style={{ top: menu.y, left: menu.x }}
      >
        <div className='flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300'>
          <div className='grid grid-cols-2 gap-2'>
            <button
              type='button'
              onClick={handleReplace}
              className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left font-medium transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:hover:border-brand-400 dark:hover:text-brand-200'
            >
              <RefreshCcw className='h-4 w-4' /> Replace image
            </button>
            <button
              type='button'
              onClick={handleAltText}
              className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left font-medium transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:hover:border-brand-400 dark:hover:text-brand-200'
            >
              <Text className='h-4 w-4' /> Alt text
            </button>
            <button
              type='button'
              onClick={handleShadowToggle}
              className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left font-medium transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:hover:border-brand-400 dark:hover:text-brand-200'
            >
              <Sparkles className='h-4 w-4' /> {attrs.shadow ? 'Disable shadow' : 'Enable shadow'}
            </button>
            <button
              type='button'
              onClick={handleRoundedToggle}
              className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left font-medium transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:hover:border-brand-400 dark:hover:text-brand-200'
            >
              <ImagePlus className='h-4 w-4' /> {attrs.borderRadius > 4 ? 'Square corners' : 'Rounded corners'}
            </button>
          </div>
          <div>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Alignment</p>
            <div className='flex flex-wrap gap-2'>
              {ALIGNMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = attrs.alignment === option.value;
                return (
                  <button
                    key={option.value}
                    type='button'
                    onClick={() => handleAlignment(option.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
                      isActive
                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:border-brand-400 dark:text-brand-100'
                        : 'border-slate-200 text-slate-500 hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200',
                    )}
                  >
                    <Icon className='h-3.5 w-3.5' /> {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Size presets</p>
            <div className='flex flex-wrap gap-2'>
              {QUICK_WIDTH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleWidth(option.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    Math.round(attrs.widthPercent) === option.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:border-brand-400 dark:text-brand-100'
                      : 'border-slate-200 text-slate-500 hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className='flex items-center justify-between'>
            <button
              type='button'
              onClick={() => {
                updateAttributes({
                  widthPercent: 60,
                  alignment: 'inline',
                  borderRadius: 8,
                  borderWidth: 0,
                  borderColor: DEFAULT_IMAGE_BORDER_COLOR,
                  shadow: true,
                });
              }}
              className='text-xs font-semibold text-slate-500 underline-offset-2 transition hover:text-brand-600 hover:underline dark:text-slate-400 dark:hover:text-brand-300'
            >
              Reset formatting
            </button>
            <button
              type='button'
              onClick={handleDelete}
              className='flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10'
            >
              <Trash2 className='h-3.5 w-3.5' /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!menuContent && !imageEditorOpen) {
    return null;
  }

  return (
    <>
      {menuContent}
      <Dialog open={imageEditorOpen} onOpenChange={handleImageEditorOpenChange}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Update image</DialogTitle>
            <DialogDescription>
              Swap the image source or alt text without leaving the editor canvas.
            </DialogDescription>
          </DialogHeader>
          <div className='mt-6'>
            <ImageSourceForm
              source={imageEditorSource}
              alt={imageEditorAlt}
              error={imageEditorError}
              onSourceChange={setImageEditorSource}
              onAltChange={setImageEditorAlt}
              onErrorChange={setImageEditorError}
              onSubmit={handleImageEditorSubmit}
              submitLabel='Update image'
              initialFocus={imageEditorInitialFocus}
              secondaryActions={
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='rounded-xl'
                  onClick={() => handleImageEditorOpenChange(false)}
                >
                  Cancel
                </Button>
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

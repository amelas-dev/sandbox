import * as React from 'react';
import { generateHTML } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ListStyleBullet, ListStyleOrdered } from '@/editor/extensions/list-style';
import { ensureGoogleFontsLoaded } from '@/lib/google-font-loader';
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
import { ExtendedTextStyle } from '@/editor/extensions/text-style';
import { useAppStore, selectDataset, selectTemplate } from '@/store/useAppStore';
import { getDocumentBaseStyles, getPageDimensions, getPagePadding } from '@/lib/template-style';
import type { PageBackgroundOption } from '@/lib/types';
import { MergeTag } from '@/editor/merge-tag-node';
import type { MergeTagAttributes } from '@/lib/types';
import { getSampleValue } from '@/lib/dataset';
import { cn } from '@/lib/utils';

interface DocumentPreviewProps {
  className?: string;
}

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

export function DocumentPreview({ className }: DocumentPreviewProps) {
  const template = useAppStore(selectTemplate);
  const dataset = useAppStore(selectDataset);
  const previewIndex = useAppStore((state) => state.previewIndex);
  const zoom = useAppStore((state) => state.zoom);

  const pageDimensions = React.useMemo(() => getPageDimensions(template.page), [template.page]);
  const padding = React.useMemo(() => getPagePadding(template.page.margins), [template.page.margins]);
  const baseStyles = React.useMemo(() => getDocumentBaseStyles(template), [template]);
  const appearance = template.appearance ?? { background: 'white', dropShadow: true, pageBorder: true, stylePreset: 'professional' } as const;
  const backgroundClass = PAGE_BACKGROUND_CLASSES[appearance.background] ?? PAGE_BACKGROUND_CLASSES.white;
  const pageShellClass = cn(
    'relative max-w-full rounded-2xl transition-all duration-150',
    appearance.pageBorder ? 'border border-slate-200 dark:border-slate-800' : 'border border-transparent',
    appearance.dropShadow ? 'shadow-xl shadow-slate-200/70 dark:shadow-black/40' : 'shadow-none',
    backgroundClass,
  );
  React.useEffect(() => {
    const families = [
      extractPrimaryFamily(template.styles.fontFamily),
      extractPrimaryFamily(template.styles.headingFontFamily),
    ].filter((family) => family.length > 0);
    if (families.length) {
      ensureGoogleFontsLoaded(families);
    }
  }, [template.styles.fontFamily, template.styles.headingFontFamily]);
  const html = React.useMemo(() => {
    if (!template.content) {
      return '';
    }

    const previewMergeTag = MergeTag.extend({
      renderHTML({ HTMLAttributes }) {
        const attrs = HTMLAttributes as MergeTagAttributes;
        const value = getSampleValue(dataset, attrs.fieldKey, previewIndex);
        const label = attrs.label ?? attrs.fieldKey;
        if (!value) {
          return [
            'span',
            { class: 'text-slate-400 italic dark:text-slate-500' },
            label,
          ];
        }
        return ['span', { class: 'text-slate-900 dark:text-slate-100' }, value];
      },
    });

    const extensions = [
      StarterKit.configure({ history: false, bulletList: false, orderedList: false }),
      Link.configure({ openOnClick: true, autolink: true }),
      Underline,
      Highlight,
      Image.configure({ allowBase64: true }),
      PremiumTable.configure({ resizable: true }),
      PremiumTableRow,
      PremiumTableCell,
      PremiumTableHeader,
      ListStyleBullet,
      ListStyleOrdered,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      ExtendedTextStyle,
      previewMergeTag,
    ];

    try {
      return generateHTML(template.content as JSONContent, extensions);
    } catch (error) {
      console.error('Failed to generate preview HTML', error);
      return '<p>Unable to render preview.</p>';
    }
  }, [dataset, previewIndex, template.content]);

  if (!dataset || !dataset.rows.length) {
    return (
      <div className={cn('flex h-full items-center justify-center bg-slate-100/70 p-6 text-center text-sm text-slate-500 dark:bg-slate-900/80 dark:text-slate-400', className)}>
        <div className='max-w-sm space-y-2'>
          <p className='text-base font-semibold text-slate-700 dark:text-slate-200'>No dataset available</p>
          <p>Import investor data to preview the personalized document, or switch back to edit mode to continue designing the template.</p>
        </div>
      </div>
    );
  }

  const { width, height } = pageDimensions;

  return (
    <div className={cn('relative flex h-full w-full items-center justify-center overflow-auto scrollbar-sleek bg-slate-100/70 p-4 sm:p-6 dark:bg-slate-900/80', className)}
    >
      <div
        className={pageShellClass}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
        aria-label='Document preview'
      >
        <div className='absolute inset-0 overflow-auto scrollbar-sleek'>
          <div
            style={{ ...padding, ...baseStyles }}
            className='relative h-full w-full min-h-[800px] prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold'
            data-document-typography
          >
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  );
}


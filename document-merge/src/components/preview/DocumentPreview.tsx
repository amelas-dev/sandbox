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
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { useAppStore, selectDataset, selectPreviewRow, selectTemplate } from '@/store/useAppStore';
import { getDocumentBaseStyles, getPageDimensions, getPagePadding } from '@/lib/template-style';
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

export function DocumentPreview({ className }: DocumentPreviewProps) {
  const template = useAppStore(selectTemplate);
  const dataset = useAppStore(selectDataset);
  const previewRow = useAppStore(selectPreviewRow);
  const previewIndex = useAppStore((state) => state.previewIndex);
  const zoom = useAppStore((state) => state.zoom);

  const pageDimensions = React.useMemo(() => getPageDimensions(template.page), [template.page]);
  const padding = React.useMemo(() => getPagePadding(template.page.margins), [template.page.margins]);
  const baseStyles = React.useMemo(() => getDocumentBaseStyles(template), [template]);
  React.useEffect(() => {
    const families = [
      extractPrimaryFamily(template.styles.fontFamily),
      extractPrimaryFamily(template.styles.headingFontFamily),
    ].filter((family) => family.length > 0);
    if (families.length) {
      ensureGoogleFontsLoaded(families);
    }
  }, [template.styles.fontFamily, template.styles.headingFontFamily]);

  const recordSummary = React.useMemo(() => {
    if (!dataset || !dataset.rows.length) {
      return 'No dataset loaded';
    }
    const total = dataset.rows.length;
    const current = Math.min(previewIndex + 1, total);
    const candidateKeys = dataset.fields.map((field) => field.key);
    let label: string | undefined;
    if (previewRow) {
      for (const key of candidateKeys) {
        const value = previewRow[key];
        if (value === undefined || value === null) {
          continue;
        }
        const text = String(value).trim();
        if (text) {
          label = text;
          break;
        }
      }
    }
    return label ? `Record ${current} of ${total} • ${label}` : `Record ${current} of ${total}`;
  }, [dataset, previewIndex, previewRow]);

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
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ListStyleBullet,
      ListStyleOrdered,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      TextStyle,
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
    <div className={cn('relative flex h-full w-full items-center justify-center overflow-auto bg-slate-100/70 p-4 sm:p-6 dark:bg-slate-900/80', className)}>
      <div
        className='relative max-w-full rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950'
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
        aria-label='Document preview'
      >
        <div className='absolute inset-x-0 top-3 flex justify-center px-4'>
          <span className='rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow dark:bg-slate-700/80'>
            {recordSummary}
          </span>
        </div>
        <div className='absolute inset-0 overflow-auto'>
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

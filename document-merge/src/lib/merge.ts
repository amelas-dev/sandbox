import type { JSONContent } from '@tiptap/core';
import type { Dataset, GenerationOptions, MergeTagAttributes, TemplateDoc } from './types';
import { escapeHtml } from '@/lib/utils';

const MERGE_TAG_REGEX = /{{\s*([\w.]+)\s*}}/g;

function getNestedValue(record: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, record);
}

function formatMergeValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

const BLOCK_SUPPRESSION_TARGETS = new Set(['paragraph', 'heading', 'blockquote', 'listItem']);

interface PruneResult {
  node: JSONContent | null;
  hasMergeValue: boolean;
  containsMerge: boolean;
  suppressible: number;
  suppressed: number;
}

function cloneNodeShallow(node: JSONContent): JSONContent {
  const copy: JSONContent = { ...node };
  if (node.attrs && typeof node.attrs === 'object') {
    copy.attrs = { ...(node.attrs as Record<string, unknown>) };
  }
  if (Array.isArray(node.marks)) {
    copy.marks = node.marks.map((mark) => (typeof mark === 'object' && mark !== null ? { ...mark } : mark));
  }
  return copy;
}

function pruneNode(node: JSONContent, record: Record<string, unknown>): PruneResult {
  if (!node) {
    return { node: null, hasMergeValue: false, containsMerge: false, suppressible: 0, suppressed: 0 };
  }

  if (node.type === 'text') {
    return {
      node: cloneNodeShallow(node),
      hasMergeValue: false,
      containsMerge: false,
      suppressible: 0,
      suppressed: 0,
    };
  }

  if (node.type === 'hardBreak') {
    return {
      node: cloneNodeShallow(node),
      hasMergeValue: false,
      containsMerge: false,
      suppressible: 0,
      suppressed: 0,
    };
  }

  if (node.type === 'mergeTag') {
    const attrs = (node.attrs ?? {}) as MergeTagAttributes;
    const rawValue = formatMergeValue(getNestedValue(record, attrs.fieldKey));
    const trimmed = rawValue.trim();
    const suppressible = attrs.suppressIfEmpty ? 1 : 0;
    const hasValue = trimmed.length > 0;
    return {
      node: suppressible && !hasValue ? null : cloneNodeShallow(node),
      hasMergeValue: hasValue,
      containsMerge: true,
      suppressible,
      suppressed: suppressible && !hasValue ? 1 : 0,
    };
  }

  const copy = cloneNodeShallow(node);
  const children = Array.isArray(node.content) ? node.content : [];

  if (!children.length) {
    return {
      node: copy,
      hasMergeValue: false,
      containsMerge: false,
      suppressible: 0,
      suppressed: 0,
    };
  }

  const prunedChildren: JSONContent[] = [];
  let totalSuppressible = 0;
  let totalSuppressed = 0;
  let anyMergeValue = false;
  let containsMerge = false;

  for (const child of children) {
    const result = pruneNode(child, record);
    totalSuppressible += result.suppressible;
    totalSuppressed += result.suppressed;
    anyMergeValue ||= result.hasMergeValue;
    containsMerge ||= result.containsMerge;
    if (result.node) {
      prunedChildren.push(result.node);
    }
  }

  copy.content = prunedChildren;

  const nodeType = node.type ?? '';
  const allFlaggedSuppressed = totalSuppressible > 0 && totalSuppressible === totalSuppressed;
  let shouldDrop = false;

  if (nodeType === 'tableRow') {
    const attrs = (copy.attrs ?? {}) as { suppressIfEmpty?: boolean };
    if (attrs.suppressIfEmpty && !anyMergeValue) {
      shouldDrop = true;
    }
  } else if (BLOCK_SUPPRESSION_TARGETS.has(nodeType) && allFlaggedSuppressed && !anyMergeValue) {
    shouldDrop = true;
  } else if ((nodeType === 'bulletList' || nodeType === 'orderedList') && prunedChildren.length === 0) {
    shouldDrop = true;
  } else if ((nodeType === 'table' || nodeType === 'tbody') && prunedChildren.length === 0) {
    shouldDrop = true;
  }

  if (shouldDrop) {
    return {
      node: null,
      hasMergeValue: anyMergeValue,
      containsMerge,
      suppressible: totalSuppressible,
      suppressed: totalSuppressed,
    };
  }

  return {
    node: copy,
    hasMergeValue: anyMergeValue,
    containsMerge,
    suppressible: totalSuppressible,
    suppressed: totalSuppressed,
  };
}

export function pruneTemplateContent(content: unknown, record?: Record<string, unknown>): JSONContent {
  if (!record || !content || typeof content !== 'object') {
    return content as JSONContent;
  }

  const source = content as JSONContent;
  const root = cloneNodeShallow(source);
  const children = Array.isArray(source.content) ? source.content : [];
  const prunedChildren: JSONContent[] = [];

  for (const child of children) {
    const result = pruneNode(child, record);
    if (result.node) {
      prunedChildren.push(result.node);
    }
  }

  root.content = prunedChildren;
  return root;
}


/**
 * Options to control merge tag substitution behaviour.
 */
export interface SubstituteMergeTagOptions {
  htmlEscape?: boolean;
}

const DEFAULT_SUBSTITUTE_OPTIONS: Required<SubstituteMergeTagOptions> = {
  htmlEscape: true,
};

/**
 * Replace {{ field }} tokens with values from the provided record. Values are
 * HTML escaped by default to prevent template injection when rendering in the
 * browser.
 */
export function substituteMergeTags(
  text: string,
  record: Record<string, unknown>,
  options?: SubstituteMergeTagOptions,
): string {
  const resolved = { ...DEFAULT_SUBSTITUTE_OPTIONS, ...(options ?? {}) } satisfies Required<SubstituteMergeTagOptions>;
  return text.replace(MERGE_TAG_REGEX, (_match, key) => {
    const value = formatMergeValue(getNestedValue(record, key.trim()));
    return resolved.htmlEscape ? escapeHtml(value) : value;
  });
}

export function renderFilename(pattern: string, record: Record<string, unknown>, fallback = 'document'): string {
  const base = substituteMergeTags(pattern, record, { htmlEscape: false }).trim() || fallback;
  return base
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function filterRows(dataset: Dataset, options: GenerationOptions): number[] {
  if (options.range === 'selection') {
    return options.selection?.length ? options.selection : [];
  }
  if (options.range === 'filtered' && options.filter) {
    const { field, op, value } = options.filter;
    return dataset.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        const fieldValue = row[field];
        switch (op) {
          case 'eq':
            return fieldValue === value;
          case 'neq':
            return fieldValue !== value;
          case 'gt':
            return Number(fieldValue) > Number(value);
          case 'lt':
            return Number(fieldValue) < Number(value);
          case 'contains':
            return String(fieldValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase());
          default:
            return false;
        }
      })
      .map(({ index }) => index);
  }
  return dataset.rows.map((_, index) => index);
}

export async function expandTemplateToHtml(
  template: TemplateDoc,
  record: Record<string, unknown>,
): Promise<string> {
  const [{ generateHTML }, StarterKitModule, TextAlignModule, UnderlineModule, LinkModule, ImageModule, TableModule, TableRowModule, TableHeaderModule, TableCellModule, ColorModule, TextStyleModule, HighlightModule, MergeTagModule] = await Promise.all([
    import('@tiptap/react'),
    import('@tiptap/starter-kit'),
    import('@tiptap/extension-text-align'),
    import('@tiptap/extension-underline'),
    import('@tiptap/extension-link'),
    import('@tiptap/extension-image'),
    import('@tiptap/extension-table'),
    import('@tiptap/extension-table-row'),
    import('@tiptap/extension-table-header'),
    import('@tiptap/extension-table-cell'),
    import('@tiptap/extension-color'),
    import('@tiptap/extension-text-style'),
    import('@tiptap/extension-highlight'),
    import('../editor/merge-tag-node'),
  ]);

  const html = generateHTML(template.content, [
    StarterKitModule.default.configure({ history: false }),
    TextAlignModule.default.configure({ types: ['heading', 'paragraph'] }),
    UnderlineModule.default,
    LinkModule.default.configure({ openOnClick: false }),
    ImageModule.default,
    TableModule.default.configure({ resizable: true }),
    TableRowModule.default,
    TableHeaderModule.default,
    TableCellModule.default,
    ColorModule.default,
    TextStyleModule.default,
    HighlightModule.default,
    MergeTagModule.MergeTag,
  ]);
  return substituteMergeTags(html, record);
}

export interface GenerationArtifact {
  filename: string;
  html: string;
}

export async function buildGenerationArtifacts(
  dataset: Dataset,
  template: TemplateDoc,
  options: GenerationOptions,
): Promise<GenerationArtifact[]> {
  const indexes = filterRows(dataset, options);
  const artifacts: GenerationArtifact[] = [];
  for (const index of indexes) {
    const row = dataset.rows[index];
    const filename = renderFilename(options.filenamePattern, row, `document_${index + 1}`);
    const html = await expandTemplateToHtml(template, row);
    artifacts.push({ filename, html });
  }
  return artifacts;
}

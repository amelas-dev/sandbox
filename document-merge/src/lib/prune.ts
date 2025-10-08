import type { JSONContent } from '@tiptap/core';
import type { MergeTagAttributes } from './types';

export function getNestedValue(record: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, record);
}

export function formatMergeValue(value: unknown): string {
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

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { MergeTagAttributes } from '@/lib/types';
import { MergeTagView } from './merge-tag-view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mergeTag: {
      insertMergeTag: (attrs: MergeTagAttributes) => ReturnType;
    };
  }
}

export interface MergeTagOptions {
  sampleProvider?: (fieldKey: string) => string;
  isFieldValid?: (fieldKey: string) => boolean;
  onRemove?: (position: number) => void;
}

export const MergeTag = Node.create<MergeTagOptions>({
  name: 'mergeTag',
  addOptions() {
    return {
      sampleProvider: undefined,
      isFieldValid: undefined,
      onRemove: undefined,
    } as MergeTagOptions;
  },
  group: 'inline',
  inline: true,
  atom: false,
  draggable: false,
  selectable: false,

  addAttributes() {
    return {
      fieldKey: {
        default: '',
      },
      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-tag]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as MergeTagAttributes & { class?: string };
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-merge-tag': attrs.fieldKey,
        class: `merge-tag inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-2 py-1 font-mono text-xs text-brand-700`,
      }),
      `{{ ${attrs.label ?? attrs.fieldKey} }}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MergeTagView);
  },

  addCommands() {
    return {
      insertMergeTag:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

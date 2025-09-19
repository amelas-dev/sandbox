import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MergeTagView } from './merge-tag-view';
export const MergeTag = Node.create({
    name: 'mergeTag',
    addOptions() {
        return {
            sampleProvider: undefined,
            isFieldValid: undefined,
            onRemove: undefined,
        };
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
        const attrs = HTMLAttributes;
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
            insertMergeTag: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
        };
    },
});

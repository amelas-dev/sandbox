import { Node } from '@tiptap/core';
import type { MergeTagAttributes } from '@/lib/types';
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
export declare const MergeTag: Node<MergeTagOptions, any>;

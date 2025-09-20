import type { Editor } from '@tiptap/core';
export interface TextFormattingToolbarProps {
    editor: Editor | null;
    className?: string;
}
export declare function TextFormattingToolbar({ editor, className }: TextFormattingToolbarProps): import("react/jsx-runtime").JSX.Element;

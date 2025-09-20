import type { Editor } from '@tiptap/core';
export interface DocumentDesignerProps {
    className?: string;
    onEditorReady?: (editor: Editor) => void;
}
export declare function DocumentDesigner({ className, onEditorReady }: DocumentDesignerProps): import("react/jsx-runtime").JSX.Element;

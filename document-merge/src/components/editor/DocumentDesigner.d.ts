import type { Editor } from '@tiptap/core';
export interface DocumentDesignerProps {
    className?: string;
    onEditorReady?: (editor: Editor) => void;
    droppableId?: string;
}
export declare function DocumentDesigner({ className, onEditorReady, droppableId }: DocumentDesignerProps): import("react/jsx-runtime").JSX.Element;

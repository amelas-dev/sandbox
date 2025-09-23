import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { ExtendedTextStyle } from '@/editor/extensions/text-style';

function createEditor() {
  return new Editor({
    content: '<p>Sample</p>',
    extensions: [
      StarterKit.configure({ textStyle: false }),
      ExtendedTextStyle,
    ],
  });
}

describe('ExtendedTextStyle', () => {
  it('applies inline typography styles to textStyle marks', () => {
    const editor = createEditor();

    try {
      editor
        .chain()
        .focus()
        .selectAll()
        .setMark('textStyle', {
          fontFamily: 'Inter',
          fontSize: '18px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        })
        .run();

      const container = document.createElement('div');
      container.innerHTML = editor.getHTML();
      const span = container.querySelector('span');

      expect(span).not.toBeNull();
      expect(span?.style.fontFamily).toBe('Inter');
      expect(span?.style.fontSize).toBe('18px');
      expect(span?.style.letterSpacing).toBe('1.5px');
      expect(span?.style.textTransform).toBe('uppercase');
    } finally {
      editor.destroy();
    }
  });

  it('omits typography styles when attributes are cleared', () => {
    const editor = createEditor();

    try {
      editor.chain().focus().selectAll().setMark('textStyle', { fontSize: '20px' }).run();
      editor.chain().focus().selectAll().setMark('textStyle', { fontSize: null }).run();
      editor.commands.removeEmptyTextStyle();

      const container = document.createElement('div');
      container.innerHTML = editor.getHTML();

      expect(container.querySelector('span')).toBeNull();
    } finally {
      editor.destroy();
    }
  });
});

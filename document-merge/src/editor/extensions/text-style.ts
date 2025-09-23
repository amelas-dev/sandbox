import TextStyle from '@tiptap/extension-text-style';

function asStyle(property: string, value: unknown) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return {};
  }
  return {
    style: `${property}: ${value}`,
  };
}

export const ExtendedTextStyle = TextStyle.extend({
  addAttributes() {
    const parent = this.parent?.() ?? {};

    return {
      ...parent,
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily || null,
        renderHTML: (attributes) => asStyle('font-family', attributes.fontFamily),
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => asStyle('font-size', attributes.fontSize),
      },
      letterSpacing: {
        default: null,
        parseHTML: (element) => element.style.letterSpacing || null,
        renderHTML: (attributes) => asStyle('letter-spacing', attributes.letterSpacing),
      },
      textTransform: {
        default: null,
        parseHTML: (element) => element.style.textTransform || null,
        renderHTML: (attributes) => asStyle('text-transform', attributes.textTransform),
      },
    };
  },
});

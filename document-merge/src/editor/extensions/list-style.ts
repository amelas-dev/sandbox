
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';

export const ListStyleBullet = BulletList.extend({
  addAttributes() {
    const parent = this.parent?.();
    return {
      ...(parent ?? {}),
      listStyle: {
        default: null,
        parseHTML: (element) => element.style.listStyleType || element.getAttribute('data-list-style') || null,
        renderHTML: (attributes) => {
          if (!attributes.listStyle) {
            return {};
          }
          return {
            style: `list-style-type: ${attributes.listStyle}`,
            'data-list-style': attributes.listStyle,
          };
        },
      },
    };
  },
});

export const ListStyleOrdered = OrderedList.extend({
  addAttributes() {
    const parent = this.parent?.();
    return {
      ...(parent ?? {}),
      listStyle: {
        default: null,
        parseHTML: (element) => element.style.listStyleType || element.getAttribute('data-list-style') || null,
        renderHTML: (attributes) => {
          if (!attributes.listStyle) {
            return {};
          }
          return {
            style: `list-style-type: ${attributes.listStyle}`,
            'data-list-style': attributes.listStyle,
          };
        },
      },
    };
  },
});

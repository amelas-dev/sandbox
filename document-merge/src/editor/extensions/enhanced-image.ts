import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export type ImageAlignment = 'inline' | 'left' | 'center' | 'right' | 'full';

export interface EnhancedImageAttributes {
  src: string;
  alt?: string | null;
  title?: string | null;
  widthPercent: number;
  alignment: ImageAlignment;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
}

export const DEFAULT_IMAGE_BORDER_COLOR = 'rgba(15, 23, 42, 0.12)';

export const EnhancedImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => ({ src: attributes.src }),
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes) =>
          attributes.alt && attributes.alt.length > 0 ? { alt: attributes.alt } : { alt: null },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('title'),
        renderHTML: (attributes) =>
          attributes.title && attributes.title.length > 0 ? { title: attributes.title } : { title: null },
      },
      widthPercent: {
        default: 60,
        parseHTML: (element) => {
          const widthAttr = element.getAttribute('data-width-percent');
          if (widthAttr) {
            const numeric = Number.parseFloat(widthAttr);
            if (Number.isFinite(numeric)) {
              return Math.max(10, Math.min(100, numeric));
            }
          }
          const styleWidth = element.style.width;
          if (styleWidth && styleWidth.endsWith('%')) {
            const numeric = Number.parseFloat(styleWidth.replace('%', ''));
            if (Number.isFinite(numeric)) {
              return Math.max(10, Math.min(100, numeric));
            }
          }
          return 60;
        },
        renderHTML: (attributes) => ({ 'data-width-percent': attributes.widthPercent }),
      },
      alignment: {
        default: 'inline',
        parseHTML: (element) =>
          (element.getAttribute('data-align') as ImageAlignment | null) ?? 'inline',
        renderHTML: (attributes) => ({ 'data-align': attributes.alignment }),
      },
      borderRadius: {
        default: 8,
        parseHTML: (element) => {
          const radiusAttr = element.getAttribute('data-border-radius');
          if (radiusAttr) {
            const numeric = Number.parseFloat(radiusAttr);
            if (Number.isFinite(numeric)) {
              return Math.max(0, numeric);
            }
          }
          const styleRadius = element.style.borderRadius;
          if (styleRadius?.endsWith('px')) {
            const numeric = Number.parseFloat(styleRadius.replace('px', ''));
            if (Number.isFinite(numeric)) {
              return Math.max(0, numeric);
            }
          }
          return 8;
        },
        renderHTML: (attributes) => ({ 'data-border-radius': attributes.borderRadius }),
      },
      borderWidth: {
        default: 0,
        parseHTML: (element) => {
          const widthAttr = element.getAttribute('data-border-width');
          if (widthAttr) {
            const numeric = Number.parseFloat(widthAttr);
            if (Number.isFinite(numeric)) {
              return Math.max(0, numeric);
            }
          }
          const styleWidth = element.style.borderWidth;
          if (styleWidth?.endsWith('px')) {
            const numeric = Number.parseFloat(styleWidth.replace('px', ''));
            if (Number.isFinite(numeric)) {
              return Math.max(0, numeric);
            }
          }
          return 0;
        },
        renderHTML: (attributes) => ({ 'data-border-width': attributes.borderWidth }),
      },
      borderColor: {
        default: DEFAULT_IMAGE_BORDER_COLOR,
        parseHTML: (element) => element.getAttribute('data-border-color') ?? DEFAULT_IMAGE_BORDER_COLOR,
        renderHTML: (attributes) => ({ 'data-border-color': attributes.borderColor }),
      },
      shadow: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-shadow') !== 'false',
        renderHTML: (attributes) => ({ 'data-shadow': attributes.shadow ? 'true' : 'false' }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { widthPercent, alignment, borderRadius, borderWidth, borderColor, shadow, ...rest } = HTMLAttributes as Partial<
      EnhancedImageAttributes
    > & Record<string, unknown>;

    const styleFragments: string[] = [];

    if (typeof widthPercent === 'number' && Number.isFinite(widthPercent)) {
      styleFragments.push(`width: ${Math.max(10, Math.min(100, widthPercent))}%`);
    }
    styleFragments.push('height: auto');

    const effectiveRadius = typeof borderRadius === 'number' ? Math.max(0, borderRadius) : 0;
    if (effectiveRadius > 0) {
      styleFragments.push(`border-radius: ${effectiveRadius}px`);
    }

    const effectiveBorderWidth = typeof borderWidth === 'number' ? Math.max(0, borderWidth) : 0;
    if (effectiveBorderWidth > 0) {
      styleFragments.push(`border-width: ${effectiveBorderWidth}px`);
      styleFragments.push('border-style: solid');
      styleFragments.push(`border-color: ${borderColor ?? DEFAULT_IMAGE_BORDER_COLOR}`);
    } else {
      styleFragments.push('border-width: 0');
      styleFragments.push('border-style: none');
    }

    if (shadow) {
      styleFragments.push('box-shadow: 0 10px 35px rgba(15, 23, 42, 0.15)');
    } else {
      styleFragments.push('box-shadow: none');
    }

    const classList: string[] = [];
    if (typeof rest.class === 'string' && rest.class.length > 0) {
      classList.push(rest.class);
    }

    switch (alignment) {
      case 'left':
        classList.push('dm-image-align-left');
        break;
      case 'right':
        classList.push('dm-image-align-right');
        break;
      case 'center':
        classList.push('dm-image-align-center');
        break;
      case 'full':
        classList.push('dm-image-align-full');
        break;
      default:
        classList.push('dm-image-inline');
        break;
    }

    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, rest, {
        class: classList.join(' ').trim(),
        style: styleFragments.join('; '),
        'data-editor-image': 'true',
      }),
    ];
  },
});

export default EnhancedImage;

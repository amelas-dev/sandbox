import type { CSSProperties } from 'react';
import type { TemplateDoc } from '@/lib/types';

type DocumentStyleProperties = CSSProperties &
  Record<
    | '--dm-body-color'
    | '--dm-heading-font-family'
    | '--dm-heading-weight'
    | '--dm-heading-color'
    | '--dm-heading-transform'
    | '--dm-paragraph-spacing'
    | '--dm-link-color'
    | '--dm-highlight-color'
    | '--dm-bullet-style'
    | '--dm-number-style',
    string
  >;

const PAGE_DIMENSIONS: Record<'Letter' | 'A4', { width: number; height: number }> = {
  Letter: { width: 816, height: 1056 },
  A4: { width: 794, height: 1123 },
};

export function getPageDimensions(page: TemplateDoc['page']): { width: number; height: number } {
  const dimensions = PAGE_DIMENSIONS[page.size];
  if (!dimensions) {
    return PAGE_DIMENSIONS.Letter;
  }
  const portrait = page.orientation === 'portrait';
  return portrait
    ? { width: dimensions.width, height: dimensions.height }
    : { width: dimensions.height, height: dimensions.width };
}

function ptsToPx(value: number) {
  return (value / 72) * 96;
}

export function getPagePadding(margins: TemplateDoc['page']['margins']): CSSProperties {
  return {
    paddingTop: ptsToPx(margins.top),
    paddingRight: ptsToPx(margins.right),
    paddingBottom: ptsToPx(margins.bottom),
    paddingLeft: ptsToPx(margins.left),
  } satisfies CSSProperties;
}

function resolveBodyColor(styles: TemplateDoc['styles']): string {
  if (styles.theme === 'dark' && styles.textColor === '#0f172a') {
    return '#e2e8f0';
  }
  return styles.textColor;
}

function resolveHeadingColor(styles: TemplateDoc['styles']): string {
  if (styles.theme === 'dark' && styles.headingColor === '#111827') {
    return '#f8fafc';
  }
  return styles.headingColor;
}

export function getDocumentBaseStyles(template: TemplateDoc): DocumentStyleProperties {
  const textColor = resolveBodyColor(template.styles);
  const headingColor = resolveHeadingColor(template.styles);

  return {
    fontFamily: template.styles.fontFamily,
    fontSize: `${template.styles.baseFontSize}px`,
    lineHeight: template.styles.lineHeight,
    letterSpacing: `${template.styles.letterSpacing}px`,
    textTransform: template.styles.textTransform,
    textAlign: template.styles.paragraphAlign,
    color: textColor,
    '--dm-body-color': textColor,
    '--dm-heading-font-family': template.styles.headingFontFamily,
    '--dm-heading-weight': template.styles.headingWeight,
    '--dm-heading-color': headingColor,
    '--dm-heading-transform': template.styles.headingTransform,
    '--dm-paragraph-spacing': `${template.styles.paragraphSpacing}px`,
    '--dm-link-color': template.styles.linkColor,
    '--dm-highlight-color': template.styles.highlightColor,
    '--dm-bullet-style': template.styles.bulletStyle,
    '--dm-number-style': template.styles.numberedStyle,
  } satisfies DocumentStyleProperties;
}

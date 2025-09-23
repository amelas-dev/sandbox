import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import type { Node } from '@tiptap/core';

type AttributeRecord = Record<string, unknown>;

export type TableStyleOption = 'grid' | 'rows' | 'outline';
export type TableStripeOption = 'none' | 'rows';
export type TableBorderStyle = 'solid' | 'dashed' | 'none';

export interface PremiumTableAttributes {
  tableStyle: TableStyleOption;
  borderColor: string;
  borderWidth: string;
  borderStyle: TableBorderStyle;
  stripe: TableStripeOption;
  stripeColor: string;
}

export interface PremiumTableCellAttributes {
  backgroundColor?: string | null;
}

export const DEFAULT_TABLE_BORDER_COLOR = '#e2e8f0';
export const DEFAULT_TABLE_BORDER_WIDTH = '1px';
export const DEFAULT_TABLE_BORDER_STYLE: TableBorderStyle = 'solid';
export const DEFAULT_TABLE_STRIPE_COLOR = 'rgba(148, 163, 184, 0.12)';

function sanitizeCssValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function composeStyle(...styles: Array<string | undefined>): string | undefined {
  const cleaned = styles
    .map((style) => (style ? style.trim().replace(/;$/, '') : ''))
    .filter((style) => style.length > 0);
  if (!cleaned.length) {
    return undefined;
  }
  return `${cleaned.join('; ')};`;
}

function resolveParentAttributes<T extends Node['config']['addAttributes']>(
  context: ThisParameterType<NonNullable<T>>,
): AttributeRecord | undefined {
  const parent = (context.parent as (() => AttributeRecord) | undefined)?.call(context);
  return parent ?? undefined;
}

export const PremiumTable = Table.extend({
  addOptions() {
    const parent = this.parent?.();
    const parentAttributes = parent?.HTMLAttributes ?? {};
    const className = [parentAttributes.class, 'dm-table'].filter(Boolean).join(' ');
    return {
      ...(parent ?? {}),
      HTMLAttributes: {
        ...parentAttributes,
        class: className,
      },
    };
  },

  addAttributes() {
    const parent = resolveParentAttributes(this);
    return {
      ...(parent ?? {}),
      tableStyle: {
        default: 'grid' as TableStyleOption,
        parseHTML: (element: HTMLElement) =>
          (element.getAttribute('data-table-style') as TableStyleOption | null) ?? 'grid',
        renderHTML: (attributes: { tableStyle?: TableStyleOption }) => ({
          'data-table-style': attributes.tableStyle ?? 'grid',
        }),
      },
      borderColor: {
        default: DEFAULT_TABLE_BORDER_COLOR,
        parseHTML: (element: HTMLElement) => {
          const data = sanitizeCssValue(element.getAttribute('data-border-color'));
          const fromStyle = sanitizeCssValue(element.style.getPropertyValue('--dm-table-border-color'));
          return data ?? fromStyle ?? DEFAULT_TABLE_BORDER_COLOR;
        },
        renderHTML: (attributes: { borderColor?: string }) => {
          const color = sanitizeCssValue(attributes.borderColor) ?? DEFAULT_TABLE_BORDER_COLOR;
          return {
            'data-border-color': color,
            style: `--dm-table-border-color: ${color}`,
          };
        },
      },
      borderWidth: {
        default: DEFAULT_TABLE_BORDER_WIDTH,
        parseHTML: (element: HTMLElement) => {
          const data = sanitizeCssValue(element.getAttribute('data-border-width'));
          const fromStyle = sanitizeCssValue(element.style.getPropertyValue('--dm-table-border-width'));
          return data ?? fromStyle ?? DEFAULT_TABLE_BORDER_WIDTH;
        },
        renderHTML: (attributes: { borderWidth?: string }) => {
          const width = sanitizeCssValue(attributes.borderWidth) ?? DEFAULT_TABLE_BORDER_WIDTH;
          return {
            'data-border-width': width,
            style: `--dm-table-border-width: ${width}`,
          };
        },
      },
      borderStyle: {
        default: DEFAULT_TABLE_BORDER_STYLE,
        parseHTML: (element: HTMLElement) => {
          const data = sanitizeCssValue(element.getAttribute('data-border-style'));
          const fromStyle = sanitizeCssValue(element.style.getPropertyValue('--dm-table-border-style'));
          return (data as TableBorderStyle | undefined) ??
            (fromStyle as TableBorderStyle | undefined) ??
            DEFAULT_TABLE_BORDER_STYLE;
        },
        renderHTML: (attributes: { borderStyle?: TableBorderStyle }) => {
          const styleValue = attributes.borderStyle ?? DEFAULT_TABLE_BORDER_STYLE;
          return {
            'data-border-style': styleValue,
            style: `--dm-table-border-style: ${styleValue}`,
          };
        },
      },
      stripe: {
        default: 'none' as TableStripeOption,
        parseHTML: (element: HTMLElement) =>
          (element.getAttribute('data-table-stripe') as TableStripeOption | null) ?? 'none',
        renderHTML: (attributes: { stripe?: TableStripeOption }) => ({
          'data-table-stripe': attributes.stripe ?? 'none',
        }),
      },
      stripeColor: {
        default: DEFAULT_TABLE_STRIPE_COLOR,
        parseHTML: (element: HTMLElement) => {
          const data = sanitizeCssValue(element.getAttribute('data-stripe-color'));
          const fromStyle = sanitizeCssValue(element.style.getPropertyValue('--dm-table-stripe-color'));
          return data ?? fromStyle ?? DEFAULT_TABLE_STRIPE_COLOR;
        },
        renderHTML: (attributes: { stripeColor?: string }) => {
          const color = sanitizeCssValue(attributes.stripeColor) ?? DEFAULT_TABLE_STRIPE_COLOR;
          return {
            'data-stripe-color': color,
            style: `--dm-table-stripe-color: ${color}`,
          };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const { tableStyle, stripe, borderColor, borderWidth, borderStyle, stripeColor, style, ...rest } =
      HTMLAttributes as Partial<PremiumTableAttributes> & { style?: string } & Record<string, unknown>;
    const parent = this.parent?.({ node, HTMLAttributes: rest });
    if (!parent) {
      return ['table', rest, ['tbody', 0]];
    }
    const [tagName, attrs, ...children] = parent as [string, AttributeRecord, ...unknown[]];

    const composedStyle = composeStyle(
      typeof attrs.style === 'string' ? attrs.style : undefined,
      typeof style === 'string' ? style : undefined,
      sanitizeCssValue(borderColor) ? `--dm-table-border-color: ${borderColor}` : undefined,
      sanitizeCssValue(borderWidth) ? `--dm-table-border-width: ${borderWidth}` : undefined,
      sanitizeCssValue(borderStyle) ? `--dm-table-border-style: ${borderStyle}` : undefined,
      sanitizeCssValue(stripeColor) ? `--dm-table-stripe-color: ${stripeColor}` : undefined,
    );

    const nextAttributes: AttributeRecord = {
      ...attrs,
      'data-table-style': tableStyle ?? 'grid',
      'data-table-stripe': stripe ?? 'none',
      'data-border-color': sanitizeCssValue(borderColor) ?? DEFAULT_TABLE_BORDER_COLOR,
      'data-border-width': sanitizeCssValue(borderWidth) ?? DEFAULT_TABLE_BORDER_WIDTH,
      'data-border-style': sanitizeCssValue(borderStyle) ?? DEFAULT_TABLE_BORDER_STYLE,
      'data-stripe-color': sanitizeCssValue(stripeColor) ?? DEFAULT_TABLE_STRIPE_COLOR,
    };

    if (composedStyle) {
      nextAttributes.style = composedStyle;
    }

    return [tagName, nextAttributes, ...children];
  },
});

function createCellExtension(base: typeof TableCell | typeof TableHeader) {
  return base.extend({
    addAttributes() {
      const parent = resolveParentAttributes(this);
      return {
        ...(parent ?? {}),
        backgroundColor: {
          default: null,
          parseHTML: (element: HTMLElement) =>
            sanitizeCssValue(element.getAttribute('data-cell-background')) ||
            sanitizeCssValue(element.style.backgroundColor) ||
            null,
          renderHTML: (attributes: { backgroundColor?: string | null }) => {
            const color = sanitizeCssValue(attributes.backgroundColor);
            if (!color) {
              return {};
            }
            return {
              'data-cell-background': color,
              style: `background-color: ${color}`,
            };
          },
        },
      };
    },

    renderHTML({ HTMLAttributes }) {
      const { backgroundColor, style, ...rest } = HTMLAttributes as PremiumTableCellAttributes &
        Record<string, unknown> & { style?: string };
      const parent = this.parent?.({ HTMLAttributes: rest });
      if (!parent) {
        const tag = base.name === 'tableHeader' ? 'th' : 'td';
        const attrs = composeStyle(typeof style === 'string' ? style : undefined, undefined);
        return [
          tag,
          {
            ...(rest ?? {}),
            ...(backgroundColor ? { 'data-cell-background': backgroundColor } : {}),
            ...(attrs ? { style: attrs } : {}),
          },
          0,
        ];
      }

      const [tagName, attrs, ...children] = parent as [string, AttributeRecord, ...unknown[]];
      const composedStyle = composeStyle(
        typeof attrs.style === 'string' ? attrs.style : undefined,
        typeof style === 'string' ? style : undefined,
        sanitizeCssValue(backgroundColor) ? `background-color: ${backgroundColor}` : undefined,
      );

      const nextAttributes: AttributeRecord = {
        ...attrs,
      };

      if (composedStyle) {
        nextAttributes.style = composedStyle;
      }

      if (sanitizeCssValue(backgroundColor)) {
        nextAttributes['data-cell-background'] = backgroundColor;
      } else if ('data-cell-background' in nextAttributes) {
        delete nextAttributes['data-cell-background'];
      }

      return [tagName, nextAttributes, ...children];
    },
  });
}

export const PremiumTableCell = createCellExtension(TableCell);
export const PremiumTableHeader = createCellExtension(TableHeader);
export const PremiumTableRow = TableRow;


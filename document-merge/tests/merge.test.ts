import { describe, expect, it } from 'vitest';
import type { JSONContent } from '@tiptap/core';
import { filterRows, pruneTemplateContent, renderFilename, substituteMergeTags } from '../src/lib/merge';
import type { Dataset } from '../src/lib/types';

describe('substituteMergeTags', () => {
  it('replaces tokens with record values, handling nested paths and dates', () => {
    const record = {
      InvestorName: 'Alexandra Chen',
      details: {
        city: 'San Francisco',
      },
      InvestmentDate: new Date('2024-07-01T00:00:00Z'),
    };
    const template = 'Hi {{ InvestorName }} from {{ details.city }} — {{ InvestmentDate }}!';
    expect(substituteMergeTags(template, record)).toBe('Hi Alexandra Chen from San Francisco — 2024-07-01!');
  });

  it('removes missing keys without throwing', () => {
    expect(substituteMergeTags('Hello {{ Missing }}', {})).toBe('Hello ');
  });

  it('escapes HTML entities by default', () => {
    const record = { note: '<script>alert(1)</script>' };
    const template = 'Safe: {{ note }}';
    expect(substituteMergeTags(template, record)).toBe('Safe: &lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('pruneTemplateContent', () => {
  it('drops paragraphs that contain suppressed merge tags with no data', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'mergeTag', attrs: { fieldKey: 'AddressLine2', suppressIfEmpty: true } },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Next line stays' }],
        },
      ],
    };

    const record = { AddressLine2: '' } as Record<string, unknown>;
    const pruned = pruneTemplateContent(content, record);

    expect(content.content?.length).toBe(2);
    expect(pruned.content?.length).toBe(1);
    expect(pruned.content?.[0]?.type).toBe('paragraph');
    expect(pruned.content?.[0]?.content?.[0]?.type).toBe('text');

    const withValue = pruneTemplateContent(content, { AddressLine2: 'Suite 200' });
    expect(withValue.content?.length).toBe(2);
  });

  it('removes suppressible table rows when all cells resolve to empty values', () => {
    const tableDoc: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'text', text: 'Amount' }] },
                { type: 'tableHeader', content: [{ type: 'text', text: 'Notes' }] },
              ],
            },
            {
              type: 'tableRow',
              attrs: { suppressIfEmpty: true },
              content: [
                { type: 'tableCell', content: [{ type: 'mergeTag', attrs: { fieldKey: 'Amount' } }] },
                { type: 'tableCell', content: [{ type: 'mergeTag', attrs: { fieldKey: 'Notes', suppressIfEmpty: true } }] },
              ],
            },
          ],
        },
      ],
    };

    const emptyRecord = { Amount: null, Notes: '' } as Record<string, unknown>;
    const prunedEmpty = pruneTemplateContent(tableDoc, emptyRecord);
    const tableAfter = prunedEmpty.content?.[0];
    expect(tableAfter?.type).toBe('table');
    expect(tableAfter?.content?.length).toBe(1);

    const valuedRecord = { Amount: 0, Notes: 'Paid in full' } as Record<string, unknown>;
    const prunedWithValues = pruneTemplateContent(tableDoc, valuedRecord);
    expect(prunedWithValues.content?.[0]?.content?.length).toBe(2);
  });
});

describe('expandTemplateToHtml', () => {
  const baseTemplate: TemplateDoc = {
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Line 1' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Optional: ' },
            { type: 'mergeTag', attrs: { fieldKey: 'AddressLine2', suppressIfEmpty: true } },
          ],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'text', text: 'Item' }] },
                { type: 'tableHeader', content: [{ type: 'text', text: 'Value' }] },
              ],
            },
            {
              type: 'tableRow',
              attrs: { suppressIfEmpty: true },
              content: [
                { type: 'tableCell', content: [{ type: 'mergeTag', attrs: { fieldKey: 'ItemName', suppressIfEmpty: true } }] },
                { type: 'tableCell', content: [{ type: 'mergeTag', attrs: { fieldKey: 'ItemValue', suppressIfEmpty: true } }] },
              ],
            },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'Line 3' }] },
      ],
    } satisfies JSONContent,
    page: {
      size: 'Letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
    },
    appearance: {
      background: 'white',
      dropShadow: false,
      pageBorder: false,
      stylePreset: 'professional',
    },
    styles: {
      fontFamily: 'Inter',
      baseFontSize: 12,
      theme: 'light',
      textColor: '#111827',
      headingFontFamily: 'Inter',
      headingWeight: '700',
      headingColor: '#111827',
      headingTransform: 'none',
      textTransform: 'none',
      paragraphAlign: 'left',
      lineHeight: 1.5,
      paragraphSpacing: 1,
      letterSpacing: 0,
      bulletStyle: 'disc',
      numberedStyle: 'decimal',
      linkColor: '#2563eb',
      highlightColor: '#fef3c7',
    },
  };

  it('omits suppressed nodes when generating HTML for export', async () => {
    const emptyRecord = { AddressLine2: '', ItemName: '', ItemValue: '' } as Record<string, unknown>;
    const result = await expandTemplateToHtml(baseTemplate, emptyRecord);

    expect(result).toContain('<p>Line 1</p>');
    expect(result).toContain('<p>Line 3</p>');
    expect(result).not.toContain('Optional:');
    expect(result).not.toContain('<p></p>');
    expect(result).not.toMatch(/<tr>\s*<\/tr>/);

    const populatedRecord = {
      AddressLine2: 'Suite 200',
      ItemName: 'Renewal',
      ItemValue: '$250',
    } as Record<string, unknown>;
    const populatedResult = await expandTemplateToHtml(baseTemplate, populatedRecord);

    expect(populatedResult).toContain('Optional: ');
    expect(populatedResult).toContain('Suite 200');
    expect(populatedResult).toMatch(/>Renewal<\/span>/);
    expect(populatedResult).toMatch(/>\$250<\/span>/);
  });
});

describe('renderFilename', () => {
  it('substitutes merge tags and sanitizes invalid filename characters', () => {
    const record = {
      InvestorName: 'Alex / Co',
      InvestmentDate: '2024-07-01',
    };
    const filename = renderFilename('Welcome_{{InvestorName}}_{{InvestmentDate}}', record, 'fallback');
    expect(filename).toBe('Welcome_Alex _ Co_2024-07-01');
  });

  it('falls back when the pattern resolves to an empty string', () => {
    const filename = renderFilename('{{Unknown}}', {}, 'document');
    expect(filename).toBe('document');
  });
});

describe('filterRows', () => {
  const dataset = {
    fields: [{ key: 'Name', label: 'Name', type: 'string' as const }],
    rows: [
      { Name: 'Alpha' },
      { Name: 'Bravo' },
      { Name: 'Charlie' },
    ],
  } satisfies Dataset;

  it('returns only the explicitly selected indexes when range is selection', () => {
    const options = {
      format: 'pdf' as const,
      range: 'selection' as const,
      filenamePattern: '{{Name}}',
      selection: [2, 0],
    };

    expect(filterRows(dataset, options)).toEqual([2, 0]);
  });

  it('returns an empty array when selection is missing for selection range', () => {
    const options = {
      format: 'pdf' as const,
      range: 'selection' as const,
      filenamePattern: '{{Name}}',
    };

    expect(filterRows(dataset, options)).toEqual([]);
  });
});

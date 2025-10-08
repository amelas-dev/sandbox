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

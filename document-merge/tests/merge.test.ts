import { describe, expect, it } from 'bun:test';
import { renderFilename, substituteMergeTags } from '../src/lib/merge';

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

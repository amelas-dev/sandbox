import { describe, expect, it } from 'vitest';
import { parseCsvString, parseJsonText } from '../src/lib/dataset';

describe('parseCsvString', () => {
  it('normalizes headers and builds dataset rows', () => {
    const csv = `Name, Name ,Amount\nAlice,Alpha,1000\nEvelyn,Emerald,2000,extra`; // final column triggers issue
    const result = parseCsvString(csv);

    expect(result.dataset.fields.map((field) => field.key)).toEqual(['name', 'name_1', 'amount']);
    expect(result.dataset.rows).toHaveLength(2);
    expect(result.dataset.rows[0]?.name).toBe('Alice');
    expect(result.dataset.rows[0]?.amount).toBe('1000');
    expect(result.headerReport[1]?.normalized).toBe('name_1');
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('enforces configurable row limits', () => {
    const csv = `Name\nAda\nGrace`;
    expect(() => parseCsvString(csv, undefined, { maxRows: 1 })).toThrow(/row count limit/);
  });

  it('truncates oversized cell values and records an issue', () => {
    const csv = `Note\n${'x'.repeat(6)}`;
    const result = parseCsvString(csv, undefined, { maxCellLength: 3 });
    expect(result.dataset.rows[0]?.note).toBe('xxx');
    expect(result.issues[0]?.message).toContain('3');
  });
});

describe('parseJsonText', () => {
  it('rejects non-object entries', async () => {
    await expect(parseJsonText('["ok", 42]')).rejects.toThrow(/not an object/);
  });
});

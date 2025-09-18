import { describe, expect, it } from 'bun:test';
import { parseCsvString } from '../src/lib/dataset';

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
});

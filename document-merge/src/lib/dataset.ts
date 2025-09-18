import type { Dataset, DatasetField, DatasetImportResult, FieldType } from './types';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const CURRENCY_REGEX = /^\$?\s?-?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?$/;

/**
 * Normalize a header into a unique key safe for use as a merge field.
 */
export function normalizeHeader(label: string, taken: Set<string>): string {
  const base = label
    .trim()
    .replace(/[^\p{L}0-9]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
    .toLowerCase() || 'field';
  let key = base;
  let counter = 1;
  while (taken.has(key)) {
    key = `${base}_${counter++}`;
  }
  taken.add(key);
  return key;
}

/**
 * Determine the best field type from a sample value.
 */
export function detectFieldType(value: unknown): FieldType {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 'string';
    if (ISO_DATE_REGEX.test(trimmed) || !Number.isNaN(Date.parse(trimmed))) {
      return 'date';
    }
    if (CURRENCY_REGEX.test(trimmed)) {
      return 'currency';
    }
    if (!Number.isNaN(Number(trimmed.replace(/[$,]/g, '')))) {
      return 'number';
    }
    if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
      return 'boolean';
    }
  }
  return 'string';
}

/**
 * Inspect column data to infer its type.
 */
export function inferFieldType(samples: unknown[]): FieldType {
  const counts: Record<FieldType, number> = {
    string: 0,
    number: 0,
    date: 0,
    boolean: 0,
    currency: 0,
  };
  samples.forEach((sample) => {
    const type = detectFieldType(sample);
    counts[type] += 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as FieldType) ?? 'string';
}

export interface NormalizeHeadersResult {
  fields: DatasetField[];
  headerReport: Array<{ original: string; normalized: string }>;
}

export function normalizeHeaders(headers: string[]): NormalizeHeadersResult {
  const taken = new Set<string>();
  const fields: DatasetField[] = [];
  const report: Array<{ original: string; normalized: string }> = [];
  headers.forEach((label) => {
    const key = normalizeHeader(label, taken);
    fields.push({ key, label: label.trim() || key, type: 'string' });
    report.push({ original: label, normalized: key });
  });
  return { fields, headerReport: report };
}

export interface RawRecord {
  [key: string]: unknown;
}

/**
 * Build a dataset object by inferring field types and preserving meta.
 */
export function buildDataset(
  records: RawRecord[],
  headers: NormalizeHeadersResult,
  meta?: Dataset['sourceMeta'],
): Dataset {
  const columnSamples: Record<string, unknown[]> = {};
  records.forEach((record) => {
    headers.fields.forEach((field) => {
      const value = record[field.key];
      if (!columnSamples[field.key]) {
        columnSamples[field.key] = [];
      }
      if (value !== undefined && value !== null && columnSamples[field.key].length < 20) {
        columnSamples[field.key].push(value);
      }
    });
  });
  const fields = headers.fields.map((field) => ({
    ...field,
    type: inferFieldType(columnSamples[field.key] ?? []),
  }));
  return {
    fields,
    rows: records,
    sourceMeta: meta ?? { importedAt: new Date().toISOString() },
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((value) => value.replace(/\r?\n/g, '\n').trim());
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let buffer = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    buffer += char;
    if (char === '"') {
      const prev = text[i - 1];
      if (inQuotes && text[i + 1] === '"') {
        buffer += '"';
        i += 1;
      } else if (prev !== '\\') {
        inQuotes = !inQuotes;
      }
    }
    if ((char === '\n' || i === text.length - 1) && !inQuotes) {
      const line = buffer.trimEnd();
      if (line) {
        rows.push(parseCsvLine(line));
      }
      buffer = '';
    }
  }
  return rows.filter((row) => row.some((cell) => cell.length > 0));
}

export function parseCsvString(content: string, meta?: Dataset['sourceMeta']): DatasetImportResult {
  const rows = parseCsvText(content);
  if (!rows.length) {
    throw new Error('No rows found in CSV.');
  }
  const [headerRow, ...dataRows] = rows;
  const headerInfo = normalizeHeaders(headerRow);
  const issues = [] as DatasetImportResult['issues'];
  const records: RawRecord[] = dataRows.map((cells, rowIndex) => {
    const record: RawRecord = {};
    headerInfo.fields.forEach((field, fieldIndex) => {
      record[field.key] = cells[fieldIndex] ?? '';
    });
    if (cells.length > headerInfo.fields.length) {
      issues.push({
        row: rowIndex + 2,
        field: headerInfo.fields[headerInfo.fields.length - 1]?.label ?? 'unknown',
        message: 'Extra columns detected in row.',
      });
    }
    return record;
  });
  const dataset = buildDataset(records, headerInfo, meta);
  return { dataset, issues, headerReport: headerInfo.headerReport };
}

export async function parseCsvFile(file: File): Promise<DatasetImportResult> {
  const text = await file.text();
  return parseCsvString(text, {
    name: file.name,
    size: file.size,
    importedAt: new Date().toISOString(),
  });
}

export async function parseJsonText(content: string, meta?: Dataset['sourceMeta']): Promise<DatasetImportResult> {
  const value = JSON.parse(content);
  if (!Array.isArray(value)) {
    throw new Error('JSON must be an array of records.');
  }
  if (!value.length) {
    throw new Error('JSON array is empty.');
  }
  const headers = Object.keys(value[0]);
  const headerInfo = normalizeHeaders(headers);
  const records: RawRecord[] = value.map((entry) => {
    const record: RawRecord = {};
    headerInfo.fields.forEach((field) => {
      record[field.key] = entry[field.label] ?? entry[field.key] ?? '';
    });
    return record;
  });
  const dataset = buildDataset(records, headerInfo, meta);
  return { dataset, issues: [], headerReport: headerInfo.headerReport };
}

export async function parseJsonFile(file: File): Promise<DatasetImportResult> {
  const text = await file.text();
  return parseJsonText(text, {
    name: file.name,
    size: file.size,
    importedAt: new Date().toISOString(),
  });
}

export async function parseXlsxFile(file: File): Promise<DatasetImportResult> {
  const buffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: false,
    defval: '',
  });
  const meta = { name: file.name, size: file.size, importedAt: new Date().toISOString() };
  return parseJsonText(JSON.stringify(json), meta);
}

export function datasetPreview(dataset: Dataset, limit = 100): Array<Record<string, unknown>> {
  return dataset.rows.slice(0, limit);
}

export function getSampleValue(dataset: Dataset | undefined, fieldKey: string, index: number): string {
  if (!dataset) return '';
  const row = dataset.rows[index] ?? dataset.rows[0];
  if (!row) return '';
  const value = row[fieldKey];
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return value.toLocaleString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

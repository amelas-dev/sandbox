import type { Dataset, DatasetField, DatasetImportResult, FieldType } from './types';
import { createNullPrototypeRecord } from '@/lib/guards';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const CURRENCY_REGEX = /^\$?\s?-?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?$/;

const DEFAULT_PARSING_LIMITS = {
  maxRows: 5000,
  maxColumns: 200,
  maxHeaderLength: 120,
  maxCellLength: 10000,
} as const;

export interface DatasetParsingOptions {
  maxRows?: number;
  maxColumns?: number;
  maxHeaderLength?: number;
  maxCellLength?: number;
}

function resolveParsingLimits(options?: DatasetParsingOptions) {
  return {
    ...DEFAULT_PARSING_LIMITS,
    ...(options ?? {}),
  } satisfies Required<DatasetParsingOptions>;
}

function ensureWithinLimit(name: string, value: number, limit: number | undefined) {
  if (typeof limit === 'number' && value > limit) {
    throw new Error(`The imported dataset exceeds the supported ${name} limit (${limit}).`);
  }
}

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

function sanitizeHeaderLabel(label: string, limits: Required<DatasetParsingOptions>) {
  ensureWithinLimit('header length', label.length, limits.maxHeaderLength);
  return label;
}

export function normalizeHeaders(headers: string[], options?: DatasetParsingOptions): NormalizeHeadersResult {
  const limits = resolveParsingLimits(options);
  ensureWithinLimit('column count', headers.length, limits.maxColumns);
  const taken = new Set<string>();
  const fields: DatasetField[] = [];
  const report: Array<{ original: string; normalized: string }> = [];
  headers.forEach((label) => {
    sanitizeHeaderLabel(label, limits);
    const key = normalizeHeader(label, taken);
    const trimmedLabel = label.trim();
    fields.push({ key, label: trimmedLabel || key, type: 'string', sourceLabel: label });
    report.push({ original: label, normalized: key });
  });
  return { fields, headerReport: report };
}

export interface RawRecord {
  [key: string]: unknown;
}

function sanitizeCellValue(
  value: unknown,
  limits: Required<DatasetParsingOptions>,
  issues: DatasetImportResult['issues'],
  row: number,
  fieldLabel: string,
): unknown {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    const normalized = value.split(String.fromCharCode(0)).join('').trimEnd();
    if (normalized.length > limits.maxCellLength) {
      issues.push({
        row,
        field: fieldLabel,
        message: `Value exceeded ${limits.maxCellLength} characters and was truncated.`,
      });
      return normalized.slice(0, limits.maxCellLength);
    }
    return normalized;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
    return value;
  }
  if (Array.isArray(value) || (typeof value === 'object' && value)) {
    try {
      return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }
  return String(value);
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
  return result.map((value) => value.replace(/\r?\n/g, '\n'));
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

export function parseCsvString(
  content: string,
  meta?: Dataset['sourceMeta'],
  options?: DatasetParsingOptions,
): DatasetImportResult {
  const limits = resolveParsingLimits(options);
  const rows = parseCsvText(content);
  if (!rows.length) {
    throw new Error('No rows found in CSV.');
  }
  const [headerRow, ...dataRows] = rows;
  ensureWithinLimit('column count', headerRow.length, limits.maxColumns);
  ensureWithinLimit('row count', dataRows.length, limits.maxRows);
  const headerInfo = normalizeHeaders(headerRow, limits);
  const issues = [] as DatasetImportResult['issues'];
  const records: RawRecord[] = dataRows.map((cells, rowIndex) => {
    const record = createNullPrototypeRecord<RawRecord>();
    headerInfo.fields.forEach((field, fieldIndex) => {
      const raw = cells[fieldIndex];
      record[field.key] = sanitizeCellValue(raw ?? '', limits, issues, rowIndex + 2, field.label);
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

export async function parseCsvFile(file: File, options?: DatasetParsingOptions): Promise<DatasetImportResult> {
  const text = await file.text();
  return parseCsvString(
    text,
    {
      name: file.name,
      size: file.size,
      importedAt: new Date().toISOString(),
    },
    options,
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectHeadersFromRecords(records: Array<Record<string, unknown>>): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(key);
      }
    });
  });
  return ordered;
}

export async function parseJsonText(
  content: string,
  meta?: Dataset['sourceMeta'],
  options?: DatasetParsingOptions,
): Promise<DatasetImportResult> {
  const limits = resolveParsingLimits(options);
  const value = JSON.parse(content);
  if (!Array.isArray(value)) {
    throw new Error('JSON must be an array of records.');
  }
  ensureWithinLimit('row count', value.length, limits.maxRows);
  if (!value.length) {
    throw new Error('JSON array is empty.');
  }
  const recordsAsObjects = value.map((entry, index) => {
    if (!isPlainObject(entry)) {
      throw new Error(`JSON entry at index ${index} is not an object.`);
    }
    return entry;
  });
  const headers = collectHeadersFromRecords(recordsAsObjects);
  const headerInfo = normalizeHeaders(headers, limits);
  const issues: DatasetImportResult['issues'] = [];
  const records: RawRecord[] = recordsAsObjects.map((entry, rowIndex) => {
    const record = createNullPrototypeRecord<RawRecord>();
    headerInfo.fields.forEach((field) => {
      const candidateKeys = [field.sourceLabel, field.label, field.key];
      let raw: unknown;
      for (const candidate of candidateKeys) {
        if (!candidate) continue;
        if (Object.prototype.hasOwnProperty.call(entry, candidate)) {
          raw = entry[candidate];
          break;
        }
      }
      record[field.key] = sanitizeCellValue(raw, limits, issues, rowIndex + 1, field.label);
    });
    return record;
  });
  const dataset = buildDataset(records, headerInfo, meta);
  return { dataset, issues, headerReport: headerInfo.headerReport };
}

export async function parseJsonFile(
  file: File,
  options?: DatasetParsingOptions,
): Promise<DatasetImportResult> {
  const text = await file.text();
  return parseJsonText(
    text,
    {
      name: file.name,
      size: file.size,
      importedAt: new Date().toISOString(),
    },
    options,
  );
}

export async function parseXlsxFile(
  file: File,
  options?: DatasetParsingOptions,
): Promise<DatasetImportResult> {
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
  return parseJsonText(JSON.stringify(json), meta, options);
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
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

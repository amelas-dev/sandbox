import type { Dataset, DatasetField, DatasetImportResult, FieldType } from './types';
/**
 * Normalize a header into a unique key safe for use as a merge field.
 */
export declare function normalizeHeader(label: string, taken: Set<string>): string;
/**
 * Determine the best field type from a sample value.
 */
export declare function detectFieldType(value: unknown): FieldType;
/**
 * Inspect column data to infer its type.
 */
export declare function inferFieldType(samples: unknown[]): FieldType;
export interface NormalizeHeadersResult {
    fields: DatasetField[];
    headerReport: Array<{
        original: string;
        normalized: string;
    }>;
}
export declare function normalizeHeaders(headers: string[]): NormalizeHeadersResult;
export interface RawRecord {
    [key: string]: unknown;
}
/**
 * Build a dataset object by inferring field types and preserving meta.
 */
export declare function buildDataset(records: RawRecord[], headers: NormalizeHeadersResult, meta?: Dataset['sourceMeta']): Dataset;
export declare function parseCsvString(content: string, meta?: Dataset['sourceMeta']): DatasetImportResult;
export declare function parseCsvFile(file: File): Promise<DatasetImportResult>;
export declare function parseJsonText(content: string, meta?: Dataset['sourceMeta']): Promise<DatasetImportResult>;
export declare function parseJsonFile(file: File): Promise<DatasetImportResult>;
export declare function parseXlsxFile(file: File): Promise<DatasetImportResult>;
export declare function datasetPreview(dataset: Dataset, limit?: number): Array<Record<string, unknown>>;
export declare function getSampleValue(dataset: Dataset | undefined, fieldKey: string, index: number): string;

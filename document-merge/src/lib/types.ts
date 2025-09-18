export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'currency';

export interface DatasetField {
  key: string;
  label: string;
  type: FieldType;
}

export interface Dataset {
  fields: DatasetField[];
  rows: Array<Record<string, unknown>>;
  sourceMeta?: {
    name?: string;
    size?: number;
    importedAt: string;
  };
}

export type PageSize = 'Letter' | 'A4';
export type Orientation = 'portrait' | 'landscape';

export interface TemplateDoc {
  content: any;
  page: {
    size: PageSize;
    orientation: Orientation;
    margins: { top: number; right: number; bottom: number; left: number };
  };
  styles: {
    fontFamily: string;
    baseFontSize: number;
    theme: 'light' | 'dark';
  };
}

export interface GenerationFilter {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
  value: unknown;
}

export interface GenerationOptions {
  format: 'pdf' | 'docx' | 'html';
  range: 'all' | 'selection' | 'filtered';
  filter?: GenerationFilter;
  selection?: number[];
  filenamePattern: string;
}

export interface MergeTagAttributes {
  fieldKey: string;
  label?: string;
}

export interface PersistedState {
  dataset?: Dataset;
  template: TemplateDoc;
  preferences: {
    autosave: boolean;
    ephemeralDataset: boolean;
    lastPreviewIndex: number;
  };
}

export interface ImportIssue {
  row: number;
  field: string;
  message: string;
}

export interface DatasetImportResult {
  dataset: Dataset;
  issues: ImportIssue[];
  headerReport: Array<{ original: string; normalized: string }>;
}

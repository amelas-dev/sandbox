export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'currency';

export interface DatasetField {
  key: string;
  label: string;
  type: FieldType;
  /**
   * Original header text as it appeared in the imported file. This lets us
   * reconcile values even if display labels are trimmed or normalized.
   */
  sourceLabel?: string;
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

export type ParagraphAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextTransformOption = 'none' | 'uppercase' | 'capitalize';
export type HeadingWeight = '400' | '500' | '600' | '700' | '800';
export type BulletStyle = 'disc' | 'circle' | 'square';
export type NumberedStyle = 'decimal' | 'lower-alpha' | 'upper-roman';

export interface TemplateTypography {
  fontFamily: string;
  baseFontSize: number;
  theme: 'light' | 'dark';
  textColor: string;
  headingFontFamily: string;
  headingWeight: HeadingWeight;
  headingColor: string;
  headingTransform: TextTransformOption;
  textTransform: TextTransformOption;
  paragraphAlign: ParagraphAlignment;
  lineHeight: number;
  paragraphSpacing: number;
  letterSpacing: number;
  bulletStyle: BulletStyle;
  numberedStyle: NumberedStyle;
  linkColor: string;
  highlightColor: string;
}

export interface TemplateDoc {
  content: unknown;
  page: {
    size: PageSize;
    orientation: Orientation;
    margins: { top: number; right: number; bottom: number; left: number };
  };
  styles: TemplateTypography;
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

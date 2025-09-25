import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Dataset,
  DatasetImportResult,
  GenerationOptions,
  PersistedState,
  TemplateDoc,
  CanvasMode,
  TemplateUpdate,
} from '@/lib/types';

/**
 * Baseline template used when the application first loads or when a template
 * import fails validation.
 */
const DEFAULT_TEMPLATE: TemplateDoc = {
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Investor Welcome Brief' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Dear ' },
          { type: 'mergeTag', attrs: { fieldKey: 'InvestorName', label: 'InvestorName' } },
          { type: 'text', text: ',' },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'We are thrilled to have you as part of our investor family. Below is a snapshot of your investment details.',
          },
        ],
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'text', text: 'Investment Amount' }] },
              { type: 'tableHeader', content: [{ type: 'text', text: 'Investment Date' }] },
              { type: 'tableHeader', content: [{ type: 'text', text: 'Primary Contact' }] },
            ],
          },
          {
            type: 'tableRow',
            content: [
              { type: 'tableCell', content: [{ type: 'mergeTag', attrs: { fieldKey: 'InvestmentAmount', label: 'InvestmentAmount' } }] },
              { type: 'tableCell', content: [{ type: 'mergeTag', attrs: { fieldKey: 'InvestmentDate', label: 'InvestmentDate' } }] },
              { type: 'tableCell', content: [{ type: 'mergeTag', attrs: { fieldKey: 'Email', label: 'Email' } }] },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Warm regards,',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'The Investor Relations Team' }],
      },
    ],
  },
  page: {
    size: 'Letter',
    orientation: 'portrait',
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
  },
  appearance: {
    background: 'white',
    dropShadow: true,
    pageBorder: true,
    stylePreset: 'professional',
  },
  styles: {
    fontFamily: 'Inter, system-ui, sans-serif',
    baseFontSize: 14,
    theme: 'light',
    textColor: '#0f172a',
    headingFontFamily: 'Inter, system-ui, sans-serif',
    headingWeight: '700',
    headingColor: '#111827',
    headingTransform: 'none',
    textTransform: 'none',
    paragraphAlign: 'left',
    lineHeight: 1.6,
    paragraphSpacing: 16,
    letterSpacing: 0,
    bulletStyle: 'disc',
    numberedStyle: 'decimal',
    linkColor: '#2563eb',
    highlightColor: '#fef08a',
  },
};
function withTemplateDefaults(template?: TemplateDoc): TemplateDoc {
  if (!template) {
    return DEFAULT_TEMPLATE;
  }
  return {
    ...DEFAULT_TEMPLATE,
    ...template,
    page: {
      ...DEFAULT_TEMPLATE.page,
      ...(template.page ?? DEFAULT_TEMPLATE.page),
      margins: {
        ...DEFAULT_TEMPLATE.page.margins,
        ...(template.page?.margins ?? DEFAULT_TEMPLATE.page.margins),
      },
    },
    styles: {
      ...DEFAULT_TEMPLATE.styles,
      ...(template.styles ?? DEFAULT_TEMPLATE.styles),
    },
    appearance: {
      ...DEFAULT_TEMPLATE.appearance,
      ...(template.appearance ?? DEFAULT_TEMPLATE.appearance),
    },
    content: template.content ?? DEFAULT_TEMPLATE.content,
  };
}



/**
 * Default document generation options presented to the user.
 */
const DEFAULT_OPTIONS: GenerationOptions = {
  format: 'pdf',
  range: 'all',
  filenamePattern: 'Welcome_{{InvestorName}}',
};

const memoryStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * Root state definition for the Investor Document Studio. All UI panels derive
 * their data and actions from this store to keep behaviour predictable across
 * the application.
 */
interface AppState {
  dataset?: Dataset;
  importIssues: DatasetImportResult['issues'];
  headerReport: DatasetImportResult['headerReport'];
  template: TemplateDoc;
  preferences: PersistedState['preferences'];
  previewIndex: number;
  canvasMode: CanvasMode;
  mergeTagFilter: string;
  selection: number[];
  zoom: number;
  showGrid: boolean;
  generationOptions: GenerationOptions;
  setDataset: (result: DatasetImportResult) => void;
  clearDataset: () => void;
  updateTemplate: (update: TemplateUpdate) => void;
  setTemplateContent: (content: TemplateDoc['content']) => void;
  setPreviewIndex: (index: number) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setMergeTagFilter: (value: string) => void;
  setSelection: (indexes: number[]) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  updateGenerationOptions: (update: Partial<GenerationOptions>) => void;
  updatePreferences: (update: Partial<PersistedState['preferences']>) => void;
}

const isBrowser = typeof window !== 'undefined';

/**
 * Primary Zustand store with persistence to localStorage. When running in a
 * non-browser environment the store transparently falls back to an in-memory
 * shim so server-side rendering and tests can execute safely.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      dataset: undefined,
      importIssues: [],
      headerReport: [],
      template: DEFAULT_TEMPLATE,
      preferences: {
        autosave: true,
        ephemeralDataset: false,
        lastPreviewIndex: 0,
      },
      previewIndex: 0,
      canvasMode: 'edit',
      mergeTagFilter: '',
      selection: [],
      zoom: 1,
      showGrid: false,
      generationOptions: DEFAULT_OPTIONS,
      setDataset: (result) =>
        set(() => ({
          dataset: result.dataset,
          importIssues: result.issues,
          headerReport: result.headerReport,
          previewIndex: 0,
          selection: [],
        })),
      clearDataset: () =>
        set((state) => ({
          dataset: undefined,
          importIssues: [],
          headerReport: [],
          previewIndex: 0,
          canvasMode: 'edit',
          selection: [],
          preferences: {
            ...state.preferences,
            lastPreviewIndex: 0,
          },
        })),
      updateTemplate: (update) =>
        set((state) => ({
          template: {
            ...state.template,
            ...update,
            page: { ...state.template.page, ...update.page },
            styles: { ...state.template.styles, ...update.styles },
            appearance: { ...state.template.appearance, ...update.appearance },
          },
        })),
      setTemplateContent: (content) =>
        set((state) => ({
          template: {
            ...state.template,
            content,
          },
        })),
      setPreviewIndex: (index) =>
        set((state) => ({
          previewIndex: index,
          preferences: { ...state.preferences, lastPreviewIndex: index },
        })),
      setCanvasMode: (mode) => set({ canvasMode: mode }),
      setMergeTagFilter: (value) => set({ mergeTagFilter: value }),
      setSelection: (indexes) => set({ selection: indexes }),
      setZoom: (zoom) => set({ zoom }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      updateGenerationOptions: (update) =>
        set((state) => ({
          generationOptions: { ...state.generationOptions, ...update },
        })),
      updatePreferences: (update) =>
        set((state) => ({
          preferences: { ...state.preferences, ...update },
        })),
    }),
    {
      name: 'document-merge-state',
      storage: createJSONStorage<PersistedState>(() => (isBrowser ? window.localStorage : memoryStorage)),
      partialize: (state) =>
        ({
          dataset: state.preferences.ephemeralDataset ? undefined : state.dataset,
          template: state.template,
          preferences: state.preferences,
        } satisfies PersistedState),
      merge: (persisted: Partial<PersistedState> | undefined, current) => ({
        ...current,
        ...persisted,
        template: withTemplateDefaults(persisted?.template ?? current.template),
        preferences: { ...current.preferences, ...(persisted?.preferences ?? {}) },
        dataset: persisted?.dataset ?? current.dataset,
      }),
    },
  ),
);

/**
 * Return the available dataset fields for the merge tag palette.
 */
export function selectFieldPalette(state: AppState) {
  return state.dataset?.fields ?? [];
}

/**
 * Return the active preview row, falling back to the first dataset row if the
 * requested index is out of range.
 */
export function selectPreviewRow(state: AppState) {
  if (!state.dataset) return undefined;
  return state.dataset.rows[state.previewIndex] ?? state.dataset.rows[0];
}

/** Expose the editable template document. */
export function selectTemplate(state: AppState) {
  return state.template;
}

/** Retrieve the active dataset, if any. */
export function selectDataset(state: AppState) {
  return state.dataset;
}

/** Return the persisted generation options. */
export function selectGenerationOptions(state: AppState) {
  return state.generationOptions;
}

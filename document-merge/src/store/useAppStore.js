import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
const DEFAULT_TEMPLATE = {
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
    styles: {
        fontFamily: 'Inter, system-ui, sans-serif',
        baseFontSize: 14,
        theme: 'light',
    },
};
const DEFAULT_OPTIONS = {
    format: 'pdf',
    range: 'all',
    filenamePattern: 'Welcome_{{InvestorName}}',
};
const memoryStorage = {
    getItem: (_key) => null,
    setItem: (_key, _value) => undefined,
    removeItem: (_key) => undefined,
};
const isBrowser = typeof window !== 'undefined';
export const useAppStore = create()(persist((set, get) => ({
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
    mergeTagFilter: '',
    selection: [],
    zoom: 1,
    showGrid: false,
    generationOptions: DEFAULT_OPTIONS,
    setDataset: (result) => set(() => ({
        dataset: result.dataset,
        importIssues: result.issues,
        headerReport: result.headerReport,
        previewIndex: 0,
        selection: [],
    })),
    clearDataset: () => set((state) => ({
        dataset: undefined,
        importIssues: [],
        headerReport: [],
        previewIndex: 0,
        selection: [],
        preferences: {
            ...state.preferences,
            lastPreviewIndex: 0,
        },
    })),
    updateTemplate: (update) => set((state) => ({
        template: {
            ...state.template,
            ...update,
            page: { ...state.template.page, ...update.page },
            styles: { ...state.template.styles, ...update.styles },
        },
    })),
    setTemplateContent: (content) => set((state) => ({
        template: {
            ...state.template,
            content,
        },
    })),
    setPreviewIndex: (index) => set((state) => ({
        previewIndex: index,
        preferences: { ...state.preferences, lastPreviewIndex: index },
    })),
    setMergeTagFilter: (value) => set({ mergeTagFilter: value }),
    setSelection: (indexes) => set({ selection: indexes }),
    setZoom: (zoom) => set({ zoom }),
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
    updateGenerationOptions: (update) => set((state) => ({
        generationOptions: { ...state.generationOptions, ...update },
    })),
    updatePreferences: (update) => set((state) => ({
        preferences: { ...state.preferences, ...update },
    })),
}), {
    name: 'document-merge-state',
    storage: createJSONStorage(() => (isBrowser ? window.localStorage : memoryStorage)),
    partialize: (state) => ({
        dataset: state.preferences.ephemeralDataset ? undefined : state.dataset,
        template: state.template,
        preferences: state.preferences,
    }),
    merge: (persisted, current) => ({
        ...current,
        ...persisted,
        template: persisted?.template ?? current.template,
        preferences: { ...current.preferences, ...(persisted?.preferences ?? {}) },
        dataset: persisted?.dataset ?? current.dataset,
    }),
}));
export function selectFieldPalette(state) {
    return state.dataset?.fields ?? [];
}
export function selectPreviewRow(state) {
    if (!state.dataset)
        return undefined;
    return state.dataset.rows[state.previewIndex] ?? state.dataset.rows[0];
}
export function selectTemplate(state) {
    return state.template;
}
export function selectDataset(state) {
    return state.dataset;
}
export function selectGenerationOptions(state) {
    return state.generationOptions;
}

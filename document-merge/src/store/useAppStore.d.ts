import type { Dataset, DatasetImportResult, GenerationOptions, PersistedState, TemplateDoc } from '@/lib/types';
interface AppState {
    dataset?: Dataset;
    importIssues: DatasetImportResult['issues'];
    headerReport: DatasetImportResult['headerReport'];
    template: TemplateDoc;
    preferences: PersistedState['preferences'];
    previewIndex: number;
    mergeTagFilter: string;
    selection: number[];
    zoom: number;
    showGrid: boolean;
    generationOptions: GenerationOptions;
    setDataset: (result: DatasetImportResult) => void;
    clearDataset: () => void;
    updateTemplate: (update: Partial<TemplateDoc>) => void;
    setTemplateContent: (content: any) => void;
    setPreviewIndex: (index: number) => void;
    setMergeTagFilter: (value: string) => void;
    setSelection: (indexes: number[]) => void;
    setZoom: (zoom: number) => void;
    toggleGrid: () => void;
    updateGenerationOptions: (update: Partial<GenerationOptions>) => void;
    updatePreferences: (update: Partial<PersistedState['preferences']>) => void;
}
export declare const useAppStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AppState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AppState, PersistedState>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AppState) => void) => () => void;
        onFinishHydration: (fn: (state: AppState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AppState, PersistedState>>;
    };
}>;
export declare function selectFieldPalette(state: AppState): import("@/lib/types").DatasetField[];
export declare function selectPreviewRow(state: AppState): Record<string, unknown>;
export declare function selectTemplate(state: AppState): TemplateDoc;
export declare function selectDataset(state: AppState): Dataset;
export declare function selectGenerationOptions(state: AppState): GenerationOptions;
export {};

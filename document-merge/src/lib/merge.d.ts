import type { Dataset, GenerationOptions, TemplateDoc } from './types';
export declare function substituteMergeTags(text: string, record: Record<string, unknown>): string;
export declare function renderFilename(pattern: string, record: Record<string, unknown>, fallback?: string): string;
export declare function filterRows(dataset: Dataset, options: GenerationOptions): number[];
export declare function expandTemplateToHtml(template: TemplateDoc, record: Record<string, unknown>, dataset: Dataset): Promise<string>;
export interface GenerationArtifact {
    filename: string;
    html: string;
}
export declare function buildGenerationArtifacts(dataset: Dataset, template: TemplateDoc, options: GenerationOptions): Promise<GenerationArtifact[]>;

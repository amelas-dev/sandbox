import type { TemplateDoc } from '@/lib/types';
export declare function exportTemplate(template: TemplateDoc): Promise<void>;
export declare function importTemplate(): Promise<TemplateDoc | undefined>;

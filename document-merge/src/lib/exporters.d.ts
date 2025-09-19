import type { GenerationArtifact } from '@/lib/merge';
export declare function exportArtifacts(artifacts: GenerationArtifact[], format: 'pdf' | 'docx' | 'html'): Promise<void>;

import type { TemplateDoc } from '@/lib/types';
import { assertTemplateDoc } from '@/lib/guards';

/**
 * Trigger a download of the current template as a formatted JSON file.
 */
export async function exportTemplate(template: TemplateDoc) {
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `template-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

/**
 * Prompt the user for a JSON template and validate its structure before
 * returning it to the caller.
 */
export async function importTemplate(): Promise<TemplateDoc | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    const cleanup = () => {
      input.value = '';
      input.remove();
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        resolve(undefined);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const template = assertTemplateDoc(parsed);
          resolve(template);
        } catch (error) {
          console.error('Unable to parse template', error);
          resolve(undefined);
        } finally {
          cleanup();
        }
      };
      reader.onerror = () => {
        console.error('Unable to read template');
        cleanup();
        resolve(undefined);
      };
      reader.readAsText(file);
    };

    document.body.appendChild(input);
    input.click();
  });
}

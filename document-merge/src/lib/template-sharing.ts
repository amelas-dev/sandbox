import type { TemplateDoc } from '@/lib/types';

export async function exportTemplate(template: TemplateDoc) {
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `template-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function importTemplate(): Promise<TemplateDoc | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(undefined);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = JSON.parse(String(reader.result));
          resolve(result as TemplateDoc);
        } catch (error) {
          console.error('Unable to parse template', error);
          resolve(undefined);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

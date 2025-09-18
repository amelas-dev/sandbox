import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { GenerationArtifact } from '@/lib/merge';

async function renderPdf(artifact: GenerationArtifact): Promise<Blob> {
  const [{ jsPDF }, { toPng }] = await Promise.all([import('jspdf'), import('html-to-image')]);
  const container = document.createElement('div');
  container.innerHTML = artifact.html;
  container.style.width = '794px';
  container.style.padding = '48px';
  container.style.background = 'white';
  container.style.color = 'black';
  container.classList.add('pdf-render-container');
  document.body.appendChild(container);
  const dataUrl = await toPng(container, { cacheBust: true, pixelRatio: 2 });
  document.body.removeChild(container);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth();
  const height = (pdf.internal.pageSize.getWidth() * container.clientHeight) / container.clientWidth;
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST');
  return pdf.output('blob');
}

async function renderDocx(artifact: GenerationArtifact): Promise<Blob> {
  const docx = await import('docx');
  const text = artifact.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const document = new docx.Document({
    sections: [
      {
        properties: {},
        children: [new docx.Paragraph({ text })],
      },
    ],
  });
  const buffer = await docx.Packer.toBlob(document);
  return buffer;
}

async function renderHtml(artifact: GenerationArtifact): Promise<Blob> {
  return new Blob([artifact.html], { type: 'text/html' });
}

export async function exportArtifacts(
  artifacts: GenerationArtifact[],
  format: 'pdf' | 'docx' | 'html',
): Promise<void> {
  const files: Array<{ name: string; blob: Blob }> = [];
  for (const artifact of artifacts) {
    const filenameBase = artifact.filename.replace(/\.[^.]+$/, '');
    if (format === 'pdf') {
      files.push({ name: `${filenameBase}.pdf`, blob: await renderPdf(artifact) });
    } else if (format === 'docx') {
      files.push({ name: `${filenameBase}.docx`, blob: await renderDocx(artifact) });
    } else {
      files.push({ name: `${filenameBase}.html`, blob: await renderHtml(artifact) });
    }
  }
  if (files.length === 1) {
    saveAs(files[0].blob, files[0].name);
    return;
  }
  const zip = new JSZip();
  files.forEach((file) => {
    zip.file(file.name, file.blob);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `documents-${new Date().toISOString().slice(0, 10)}.zip`);
}

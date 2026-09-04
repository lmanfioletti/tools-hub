// Utility to convert a PDF file to a high-resolution PNG data URL
// Uses pdfjs-dist to render the first page of the PDF to a canvas

import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker from CDN for simplicity in Next.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Converts a PDF data URL to a PNG data URL by rendering its first page at high resolution.
 * @param pdfDataUrl - a data:application/pdf;base64,... string
 * @param scale - rendering scale (default 4 for ~300 DPI from a typical PDF)
 * @returns PNG data URL string
 */
export async function pdfToImageDataUrl(pdfDataUrl: string, scale = 4): Promise<string> {
  // Extract base64 data from data URL
  const base64 = pdfDataUrl.split(',')[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas.toDataURL('image/png');
}

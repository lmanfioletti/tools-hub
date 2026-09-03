import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { EmployeeData, TemplateConfig, ElementConfig, PAGE_WIDTH_PT, PAGE_HEIGHT_PT } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────

function convertImageToPng(src: string, circular = false): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for remote URLs, not blob: or data: URLs
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const canvas = document.createElement('canvas');

        if (circular) {
          const size = Math.min(w, h);
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d')!;
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, (w - size) / 2, (h - size) / 2, size, size, 0, 0, size, size);
        } else {
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d')!.drawImage(img, 0, 0);
        }

        const dataUrl = canvas.toDataURL('image/png');
        const bin = atob(dataUrl.split(',')[1]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        resolve(bytes.buffer);
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

function isPdfFile(bytes: ArrayBuffer): boolean {
  const u8 = new Uint8Array(bytes);
  return u8.length >= 4 && u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return rgb(
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255
  );
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  if (words.length === 0) return [text];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = line + ' ' + words[i];
    if (font.widthOfTextAtSize(test, fontSize) < maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

function toX(pct: number) { return (pct / 100) * PAGE_WIDTH_PT; }
function toY(pct: number) { return PAGE_HEIGHT_PT - (pct / 100) * PAGE_HEIGHT_PT; }
function toW(pct: number) { return (pct / 100) * PAGE_WIDTH_PT; }
function toH(pct: number) { return (pct / 100) * PAGE_HEIGHT_PT; }

// ─── Font cache for a single PDF document ────────────────────────────────

interface FontCache {
  helvetica: PDFFont;
  helveticaBold: PDFFont;
  times: PDFFont;
  timesBold: PDFFont;
  courier: PDFFont;
  courierBold: PDFFont;
  calibri?: PDFFont;
  calibriBold?: PDFFont;
  custom?: PDFFont;
}

async function buildFontCache(pdfDoc: PDFDocument, customFontBytes?: ArrayBuffer): Promise<FontCache> {
  const [helvetica, helveticaBold, times, timesBold, courier, courierBold] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.TimesRoman),
    pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    pdfDoc.embedFont(StandardFonts.Courier),
    pdfDoc.embedFont(StandardFonts.CourierBold),
  ]);

  let custom: PDFFont | undefined;
  if (customFontBytes) {
    try {
      custom = await pdfDoc.embedFont(customFontBytes);
    } catch (e) {
      console.warn('Could not embed custom font', e);
    }
  }

  let calibri: PDFFont | undefined;
  let calibriBold: PDFFont | undefined;
  try {
    const calibriBuf = await fetch('/fonts/Calibri-Regular.ttf').then(r => r.arrayBuffer());
    const calibriBoldBuf = await fetch('/fonts/Calibri-Bold.ttf').then(r => r.arrayBuffer());
    calibri = await pdfDoc.embedFont(calibriBuf);
    calibriBold = await pdfDoc.embedFont(calibriBoldBuf);
  } catch (e) {
    console.warn('Could not load Calibri font, falling back to Helvetica', e);
  }

  return { helvetica, helveticaBold, times, timesBold, courier, courierBold, calibri, calibriBold, custom };
}

function getFont(cfg: ElementConfig, fonts: FontCache): PDFFont {
  const bold = cfg.fontWeight === 'bold';
  switch (cfg.fontFamily) {
    case 'calibri': return (bold ? fonts.calibriBold : fonts.calibri) || (bold ? fonts.helveticaBold : fonts.helvetica);
    case 'custom': return fonts.custom || (bold ? fonts.helveticaBold : fonts.helvetica);
    case 'times': return bold ? fonts.timesBold : fonts.times;
    case 'courier': return bold ? fonts.courierBold : fonts.courier;
    default: return bold ? fonts.helveticaBold : fonts.helvetica;
  }
}

// ─── Main generator ─────────────────────────────────────────────────────

export async function generateBadgeZip(
  backgroundUrl: string,
  logoUrl: string,
  employees: EmployeeData[],
  templateConfig: TemplateConfig,
  customFontBytes?: ArrayBuffer
) {
  const zip = new JSZip();

  // Pre-load assets
  const bgRawBytes = await fetch(backgroundUrl).then(r => r.arrayBuffer());
  const bgIsPdf = isPdfFile(bgRawBytes);
  const logoPngBuf = await convertImageToPng(logoUrl);

  for (const emp of employees) {
    const pdfDoc = await PDFDocument.create();
    const fonts = await buildFontCache(pdfDoc, customFontBytes);

    // Embed background
    let bgPdfPage: any = null;
    let bgImage: any = null;
    if (bgIsPdf) {
      const [page] = await pdfDoc.embedPdf(bgRawBytes, [0]);
      bgPdfPage = page;
    } else {
      const bgPng = await convertImageToPng(backgroundUrl);
      bgImage = await pdfDoc.embedPng(bgPng);
    }

    // Embed logo & photo
    const logoImage = await pdfDoc.embedPng(logoPngBuf);
    let photoImage: any = null;
    if (emp.photoUrl) {
      const circular = templateConfig.front.photo?.circular ?? true;
      const photoPng = await convertImageToPng(emp.photoUrl, circular);
      photoImage = await pdfDoc.embedPng(photoPng);
    }

    // Data map
    const dataMap: Record<string, string> = {
      name: emp.name.toUpperCase(),
      jobTitle: emp.jobTitle.toUpperCase(),
      cpf: `CPF: ${emp.cpf}`,
      unop: `UNOP ${emp.unop}`,
      hospital: emp.hospital.toUpperCase(),
    };

    // ═══════ Render a side ═══════
    const renderSide = (side: 'front' | 'back') => {
      const page = pdfDoc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);

      if (bgImage) page.drawImage(bgImage, { x: 0, y: 0, width: PAGE_WIDTH_PT, height: PAGE_HEIGHT_PT });
      else if (bgPdfPage) page.drawPage(bgPdfPage, { x: 0, y: 0, width: PAGE_WIDTH_PT, height: PAGE_HEIGHT_PT });

      for (const [key, cfg] of Object.entries(templateConfig[side])) {
        const x = toX(cfg.xPercent);
        const w = toW(cfg.widthPercent);
        const h = toH(cfg.heightPercent);
        const yTop = toY(cfg.yPercent);

        if (cfg.type === 'image') {
          const img = key === 'logo' ? logoImage : (key === 'photo' && side === 'front' ? photoImage : null);
          if (!img) continue;
          const dims = img.scaleToFit(w, h);
          const cx = x + (w - dims.width) / 2;
          const cy = yTop - h + (h - dims.height) / 2;
          page.drawImage(img, { x: cx, y: cy, width: dims.width, height: dims.height });
        } else {
          const text = dataMap[key] || '';
          if (!text) continue;
          const font = getFont(cfg, fonts);
          const color = hexToRgb(cfg.fontColor);
          const fontSize = cfg.fontSize;
          const lineH = fontSize * 1.05;
          const lines = wrapText(text, font, fontSize, w);
          const totalH = lines.length * lineH;
          let lineY = yTop - (h - totalH) / 2 - fontSize;

          for (const line of lines) {
            const lineW = font.widthOfTextAtSize(line, fontSize);
            page.drawText(line, { x: x + (w - lineW) / 2, y: lineY, size: fontSize, font, color });
            lineY -= lineH;
          }
        }
      }
    };

    renderSide('front');
    renderSide('back');

    const pdfBytes = await pdfDoc.save();
    zip.file(`Cracha_${emp.name.replace(/\s+/g, '_')}.pdf`, pdfBytes);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'Crachas.zip');
}

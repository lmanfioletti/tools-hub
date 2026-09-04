import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  EmployeeData, TemplateConfig, ElementConfig,
  BadgeSize, badgeSizeToPixels, cutMarginPixels
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed: ' + src));
    img.src = src;
  });
}

function hexToRGBA(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgb(${r},${g},${b})`;
}

// Map fontFamily ids to CSS font names
const FONT_CSS_MAP: Record<string, string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  times: "'Times New Roman', Times, serif",
  courier: "'Courier New', Courier, monospace",
  calibri: 'Calibri, sans-serif',
  custom: 'CustomBadgeFont, sans-serif',
};

// Wrap text into lines that fit within maxWidth (canvas measureText)
function wrapTextCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  if (words.length === 0) return [text];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = line + ' ' + words[i];
    if (ctx.measureText(test).width < maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

// ─── Main Generator (PNG output) ────────────────────────────────────────

export async function generateBadgeZip(
  backgroundUrl: string,
  logoUrl: string,
  employees: EmployeeData[],
  templateConfig: TemplateConfig,
  customFontBytes?: ArrayBuffer,
  badgeSize?: BadgeSize
) {
  const zip = new JSZip();

  const size = badgeSize || { widthCm: 5.5, heightCm: 9 };
  const { widthPx, heightPx } = badgeSizeToPixels(size);
  const margin = cutMarginPixels(); // ~35px at 300dpi for 0.3cm

  // Total canvas = badge + margin on each side
  const canvasW = widthPx + margin * 2;
  const canvasH = heightPx + margin * 2;

  // Pre-load assets
  const bgImg = await loadImage(backgroundUrl);
  const logoImg = await loadImage(logoUrl);

  // Register custom font via FontFace if bytes provided and not yet registered
  if (customFontBytes) {
    try {
      const font = new FontFace('CustomBadgeFont', customFontBytes);
      await font.load();
      document.fonts.add(font);
    } catch (_) { /* already registered or unsupported */ }
  }

  // Ensure Calibri is available (try loading from /fonts/)
  try {
    const calibriResp = await fetch('/fonts/Calibri-Regular.ttf');
    if (calibriResp.ok) {
      const buf = await calibriResp.arrayBuffer();
      const f = new FontFace('Calibri', buf);
      await f.load();
      document.fonts.add(f);
    }
    const calibriBoldResp = await fetch('/fonts/Calibri-Bold.ttf');
    if (calibriBoldResp.ok) {
      const buf = await calibriBoldResp.arrayBuffer();
      const f = new FontFace('Calibri', buf, { weight: 'bold' });
      await f.load();
      document.fonts.add(f);
    }
  } catch (_) { /* fallback to system fonts */ }

  for (const emp of employees) {
    // Pre-load photo
    let photoImg: HTMLImageElement | null = null;
    if (emp.photoUrl) {
      photoImg = await loadImage(emp.photoUrl);
    }

    const dataMap: Record<string, string> = {
      name: emp.name.toUpperCase(),
      jobTitle: emp.jobTitle.toUpperCase(),
      cpf: `CPF: ${emp.cpf}`,
      unop: `UNOP ${emp.unop}`,
      hospital: emp.hospital.toUpperCase(),
    };

    // ═══════ Render a side ═══════
    const renderSide = (side: 'front' | 'back'): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d')!;

      // Fill the whole canvas with white (background for margin area)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Draw dashed cut margin lines (light gray) around the badge area
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(margin, margin, widthPx, heightPx);
      ctx.setLineDash([]);

      // Draw small corner crop marks for precise cutting
      const markLen = Math.round(margin * 0.6);
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      // Top-left
      ctx.beginPath();
      ctx.moveTo(margin - markLen, margin); ctx.lineTo(margin, margin);
      ctx.moveTo(margin, margin - markLen); ctx.lineTo(margin, margin);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(margin + widthPx, margin - markLen); ctx.lineTo(margin + widthPx, margin);
      ctx.moveTo(margin + widthPx, margin); ctx.lineTo(margin + widthPx + markLen, margin);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(margin - markLen, margin + heightPx); ctx.lineTo(margin, margin + heightPx);
      ctx.moveTo(margin, margin + heightPx); ctx.lineTo(margin, margin + heightPx + markLen);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(margin + widthPx, margin + heightPx); ctx.lineTo(margin + widthPx + markLen, margin + heightPx);
      ctx.moveTo(margin + widthPx, margin + heightPx); ctx.lineTo(margin + widthPx, margin + heightPx + markLen);
      ctx.stroke();

      // Draw background image stretched to the badge area
      ctx.drawImage(bgImg, margin, margin, widthPx, heightPx);

      // Render elements
      const sideConfig = templateConfig[side];
      for (const [key, cfg] of Object.entries(sideConfig)) {
        const x = margin + (cfg.xPercent / 100) * widthPx;
        const y = margin + (cfg.yPercent / 100) * heightPx;
        const w = (cfg.widthPercent / 100) * widthPx;
        const h = (cfg.heightPercent / 100) * heightPx;

        if (cfg.type === 'image') {
          const img = key === 'logo' ? logoImg : (key === 'photo' && side === 'front' ? photoImg : null);
          if (!img) continue;

          // Scale to fit
          const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          const cx = x + (w - dw) / 2;
          const cy = y + (h - dh) / 2;

          if (cfg.circular) {
            ctx.save();
            const radius = Math.min(dw, dh) / 2;
            ctx.beginPath();
            ctx.arc(cx + dw / 2, cy + dh / 2, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, cx, cy, dw, dh);
            ctx.restore();
          } else {
            ctx.drawImage(img, cx, cy, dw, dh);
          }
        } else {
          // Text rendering
          const text = dataMap[key] || '';
          if (!text) continue;

          const fontFamily = FONT_CSS_MAP[cfg.fontFamily] || FONT_CSS_MAP.helvetica;
          const weight = cfg.fontWeight === 'bold' ? 'bold' : 'normal';
          // Convert pt to px at 300 DPI: 1pt = 300/72 px ≈ 4.1667px
          const fontSizePx = cfg.fontSize * (300 / 72);
          ctx.font = `${weight} ${fontSizePx}px ${fontFamily}`;
          ctx.fillStyle = hexToRGBA(cfg.fontColor);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const lines = wrapTextCanvas(ctx, text, w);
          const lineH = fontSizePx * 1.15;
          const totalH = lines.length * lineH;
          let lineY = y + (h - totalH) / 2 + fontSizePx / 2;

          for (const line of lines) {
            ctx.fillText(line, x + w / 2, lineY);
            lineY += lineH;
          }
        }
      }

      return canvas;
    };

    const frontCanvas = renderSide('front');
    const backCanvas = renderSide('back');

    // Convert canvas to PNG blob
    const frontBlob = await new Promise<Blob>((resolve) =>
      frontCanvas.toBlob((b) => resolve(b!), 'image/png')
    );
    const backBlob = await new Promise<Blob>((resolve) =>
      backCanvas.toBlob((b) => resolve(b!), 'image/png')
    );

    const safeName = emp.name.replace(/\s+/g, '_');
    const folder = zip.folder(safeName)!;
    folder.file('frente.png', frontBlob);
    folder.file('verso.png', backBlob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'Crachas.zip');
}

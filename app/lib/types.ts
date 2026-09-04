// Shared types for the badge generator

export interface ElementConfig {
  xPercent: number;      // 0-100, from left edge
  yPercent: number;      // 0-100, from top edge
  widthPercent: number;  // 0-100, element width as % of badge
  heightPercent: number; // 0-100, element height as % of badge
  fontSize: number;      // PDF points (text only)
  fontColor: string;     // hex color (text only)
  fontWeight: 'normal' | 'bold';
  fontFamily: 'helvetica' | 'times' | 'courier' | 'calibri' | 'custom';
  type: 'text' | 'image';
  circular: boolean;     // circular crop (photo only)
  label: string;         // display name in editor
}

export interface TemplateConfig {
  front: Record<string, ElementConfig>;
  back: Record<string, ElementConfig>;
}

export interface EmployeeData {
  id: string;
  name: string;
  jobTitle: string;
  cpf: string;
  unop: string;
  hospital: string;
  photoUrl?: string;
}

// Badge size configuration (in cm)
export interface BadgeSize {
  widthCm: number;
  heightCm: number;
}

export const DEFAULT_BADGE_SIZE: BadgeSize = {
  widthCm: 5.5,
  heightCm: 9,
};

// Cut margin in cm (thin gray line around badge for cutting guidance)
export const CUT_MARGIN_CM = 0.3;

// Conversion: 1 cm = 28.3464566929 PDF points
const CM_TO_PT = 28.3464566929;

// Helper to compute page dimensions in points from a BadgeSize
export function badgeSizeToPoints(size: BadgeSize) {
  return {
    widthPt: size.widthCm * CM_TO_PT,
    heightPt: size.heightCm * CM_TO_PT,
  };
}

// High-res PNG rendering (pixels): 300 DPI
// 1 cm = 300/2.54 ≈ 118.11 px
const CM_TO_PX_300DPI = 300 / 2.54;

export function badgeSizeToPixels(size: BadgeSize) {
  return {
    widthPx: Math.round(size.widthCm * CM_TO_PX_300DPI),
    heightPx: Math.round(size.heightCm * CM_TO_PX_300DPI),
  };
}

export function cutMarginPixels() {
  return Math.round(CUT_MARGIN_CM * CM_TO_PX_300DPI);
}

// Legacy point-based constants (still used by TemplateEditor aspect ratio)
export const PAGE_WIDTH_PT = DEFAULT_BADGE_SIZE.widthCm * CM_TO_PT;  // ~155.9
export const PAGE_HEIGHT_PT = DEFAULT_BADGE_SIZE.heightCm * CM_TO_PT; // ~255.12

const textDefaults = {
  type: 'text' as const,
  circular: false,
  fontFamily: 'calibri' as const,
};

const imageDefaults = {
  type: 'image' as const,
  fontSize: 0,
  fontColor: '#000000',
  fontWeight: 'normal' as const,
  fontFamily: 'calibri' as const,
};

export const DEFAULT_TEMPLATE: TemplateConfig = {
  front: {
    logo: {
      ...imageDefaults,
      xPercent: 20, yPercent: 7.5, widthPercent: 60, heightPercent: 15,
      circular: false, label: 'Logo',
    },
    photo: {
      ...imageDefaults,
      xPercent: 25, yPercent: 25, widthPercent: 50, heightPercent: 35,
      circular: true, label: 'Foto',
    },
    name: {
      ...textDefaults,
      xPercent: 11, yPercent: 70, widthPercent: 78, heightPercent: 8,
      fontSize: 15, fontColor: '#ab8a1e', fontWeight: 'bold',
      label: 'Nome',
    },
    jobTitle: {
      ...textDefaults,
      xPercent: 11, yPercent: 80, widthPercent: 78, heightPercent: 6,
      fontSize: 11, fontColor: '#000000', fontWeight: 'normal',
      label: 'Cargo',
    },
  },
  back: {
    logo: {
      ...imageDefaults,
      xPercent: 20, yPercent: 7.5, widthPercent: 60, heightPercent: 15,
      circular: false, label: 'Logo',
    },
    cpf: {
      ...textDefaults,
      xPercent: 11, yPercent: 65, widthPercent: 78, heightPercent: 7,
      fontSize: 11, fontColor: '#000000', fontWeight: 'bold',
      label: 'CPF',
    },
    unop: {
      ...textDefaults,
      xPercent: 11, yPercent: 73, widthPercent: 78, heightPercent: 7,
      fontSize: 11, fontColor: '#000000', fontWeight: 'bold',
      label: 'UNOP',
    },
    hospital: {
      ...textDefaults,
      xPercent: 11, yPercent: 81, widthPercent: 78, heightPercent: 7,
      fontSize: 11, fontColor: '#000000', fontWeight: 'bold',
      label: 'Hospital',
    },
  },
};

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

// 5.9cm x 9.1cm in points
export const PAGE_WIDTH_PT = 5.9 * 28.3464566929;  // ~167.24
export const PAGE_HEIGHT_PT = 9.1 * 28.3464566929; // ~257.95

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

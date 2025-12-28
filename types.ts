export interface StyleDNA {
  name: string;
  strokeWidth: 'thin' | 'medium' | 'thick' | 'variable';
  cornerRoundness: 'sharp' | 'rounded' | 'circular';
  lineCap: 'butt' | 'round' | 'square';
  fillType: 'outline' | 'solid' | 'duotone';
  vibeKeywords: string[];
  complexity: number; // 1-10
  colorPalette: string[];
  description: string;
  isPixelArt: boolean;
}

export interface GeneratedIcon {
  name: string;
  svgContent: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  liked?: boolean;
}

export interface StylePreset {
  id: string;
  name: string;
  dna: StyleDNA;
}

export interface PresetCollection {
  id: string;
  name: string;
  presets: StylePreset[];
}

export interface UserProfile {
  codename: string;
  collections: PresetCollection[];
}

export enum AppState {
  LOGIN = 'LOGIN',
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW_DNA = 'REVIEW_DNA',
  GENERATING = 'GENERATING',
  FINISHED = 'FINISHED'
}

export const COMMON_ICONS = [
  "home", "search", "settings", "user", "heart", "camera", "mail", "trash", "edit", "share",
  "wifi", "battery", "folder", "calendar", "clock", "map", "bell", "lock", "unlock", "star",
  "music", "video", "image", "file", "download", "upload", "refresh", "power", "link", "external-link",
  "terminal", "code", "cpu", "database", "globe", "moon", "sun", "eye", "eye-off", "menu"
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'flat',
    name: 'Minimalist Flat',
    dna: {
      name: 'Minimalist Flat',
      strokeWidth: 'medium',
      cornerRoundness: 'rounded',
      lineCap: 'round',
      fillType: 'solid',
      vibeKeywords: ['clean', 'modern', 'geometric', 'minimal'],
      complexity: 2,
      colorPalette: ['#2D3748', '#4A5568', '#A0AEC0', '#F7FAFC'],
      description: 'Clean geometric shapes with solid fills. No outlines, high legibility, modern UI aesthetic.',
      isPixelArt: false
    }
  },
  {
    id: 'pixel',
    name: 'Retro Pixel Art',
    dna: {
      name: '8-Bit Retro',
      strokeWidth: 'thick',
      cornerRoundness: 'sharp',
      lineCap: 'square',
      fillType: 'outline',
      vibeKeywords: ['retro', 'gaming', 'nostalgic', '8-bit'],
      complexity: 4,
      colorPalette: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
      description: 'Authentic 8-bit style pixel art. Strict grid adherence, jagged edges, retro gaming console feel.',
      isPixelArt: true
    }
  },
  {
    id: 'sketch',
    name: 'Hand-Drawn Sketch',
    dna: {
      name: 'Paper Sketch',
      strokeWidth: 'variable',
      cornerRoundness: 'rounded',
      lineCap: 'round',
      fillType: 'outline',
      vibeKeywords: ['organic', 'rough', 'artistic', 'informal'],
      complexity: 6,
      colorPalette: ['#2C3E50', '#34495E', '#ECF0F1'],
      description: 'Loose, organic lines with variable width simulating ink on paper. Slight imperfections and overshoots.',
      isPixelArt: false
    }
  },
  {
    id: 'gradient',
    name: 'Corporate Gradient',
    dna: {
      name: 'Tech Gradient',
      strokeWidth: 'thin',
      cornerRoundness: 'circular',
      lineCap: 'round',
      fillType: 'duotone',
      vibeKeywords: ['corporate', 'futuristic', 'tech', 'gradient'],
      complexity: 3,
      colorPalette: ['#667EEA', '#764BA2', '#FFFFFF'],
      description: 'Sleek, professional tech aesthetic. Thin lines combined with soft duotone fills to suggest gradients.',
      isPixelArt: false
    }
  }
];
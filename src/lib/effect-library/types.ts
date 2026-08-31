import type { NleSoftware } from '@/types/breakdown';

export type LibraryKind = 'effect' | 'transition' | 'transform' | 'overlay' | 'compound';

export type LibraryCategory =
  | 'Blur'
  | 'Glow'
  | 'Sharpen'
  | 'Distortion'
  | 'Noise/Grain'
  | 'Color'
  | 'Lighting'
  | 'Text'
  | '3D'
  | 'Particle'
  | 'Screen'
  | 'Overlay'
  | 'Camera'
  | 'Transition'
  | 'Transform';

export type LibrarySubcategory =
  | 'Directional Blur'
  | 'Radial Blur'
  | 'Zoom Blur'
  | 'Gaussian Blur'
  | 'Glow'
  | 'Sharpen'
  | 'RGB Split'
  | 'Wave'
  | 'Grain'
  | 'Grade'
  | 'Flash'
  | 'Flare'
  | 'Kinetic Text'
  | 'Particle'
  | 'Scanline'
  | 'Letterbox'
  | 'Light Leak'
  | 'Shake'
  | 'Zoom'
  | 'Pan'
  | 'Rotate'
  | 'Whip Pan'
  | 'Match Cut'
  | 'Glitch'
  | 'Mask'
  | 'Spin'
  | 'Object'
  | 'Compound'
  | 'Rain'
  | 'Smoke'
  | 'Fog'
  | 'Bokeh'
  | 'HUD'
  | 'Grid'
  | 'CRT'
  | 'Frame'
  | '3D'
  | 'Pan'
  | 'Wave';

export interface LibraryParameter {
  name: string;
  range: string;
}

export interface SoftwareRecipe {
  software: NleSoftware;
  exactEffectName: string;
  steps: string[];
  parameterMapping: Record<string, string>;
  requiredAssets?: string[];
}

export interface CanonicalEffect {
  id: string;
  canonicalName: string;
  type: LibraryKind;
  category: LibraryCategory;
  subcategory: LibrarySubcategory;
  description: string;
  visualSignatures: string[];
  detectionKeywords: string[];
  aliases: string[];
  parameters: LibraryParameter[];
  layerOrder: string;
  similarEffects: string[];
  combinations: string[];
  minVisualClues: number;
  softwareRecipes: SoftwareRecipe[];
}

export interface DetectedLayer {
  role:
    | 'base'
    | 'transform'
    | 'camera'
    | 'effect'
    | 'overlay'
    | 'grade'
    | 'text'
    | 'audio';
  name: string;
  libraryId?: string;
  parameters: Record<string, string>;
}

export interface LibraryMatch {
  entry: CanonicalEffect;
  score: number;
  clueHits: string[];
  exact: boolean;
}

export interface UnknownVisual {
  id: string;
  at: string;
  sourceUrl: string;
  timestamp: number;
  description: string;
  primaryMatchId?: string;
  primaryMatchName?: string;
  confidence?: number;
}

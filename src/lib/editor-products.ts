import type { NleSoftware } from '@/types/breakdown';

export type EditorProductId =
  | 'after-effects'
  | 'premiere-pro'
  | 'capcut'
  | 'vn'
  | 'davinci-resolve'
  | 'scenenode';

export interface EditorProduct {
  id: EditorProductId;
  label: string;
  shortLabel: string;
  /** Maps to backend NLE for analysis + guide generation */
  nle: NleSoftware;
}

export const EDITOR_PRODUCTS: EditorProduct[] = [
  {
    id: 'after-effects',
    label: 'Adobe After Effects',
    shortLabel: 'After Effects',
    nle: 'After Effects',
  },
  {
    id: 'premiere-pro',
    label: 'Adobe Premiere Pro',
    shortLabel: 'Premiere Pro',
    nle: 'Premiere Pro',
  },
  { id: 'capcut', label: 'CapCut', shortLabel: 'CapCut', nle: 'CapCut' },
  { id: 'vn', label: 'VN', shortLabel: 'VN', nle: 'VN Editor' },
  {
    id: 'davinci-resolve',
    label: 'DaVinci Resolve',
    shortLabel: 'Resolve',
    nle: 'DaVinci Resolve',
  },
  {
    id: 'scenenode',
    label: 'SceneNode',
    shortLabel: 'SceneNode',
    nle: 'CapCut',
  },
];

export const DEFAULT_EDITOR_ID: EditorProductId = 'capcut';

export function getEditorProduct(id: EditorProductId): EditorProduct {
  return EDITOR_PRODUCTS.find((e) => e.id === id) ?? EDITOR_PRODUCTS[2];
}

export function editorIdFromNle(nle: NleSoftware): EditorProductId {
  const match = EDITOR_PRODUCTS.find((e) => e.nle === nle && e.id !== 'scenenode');
  return match?.id ?? 'capcut';
}

export function recreationGuideTitle(editorId: EditorProductId): string {
  const product = getEditorProduct(editorId);
  if (product.id === 'scenenode') return 'SceneNode Recreation Guide';
  if (product.id === 'vn') return 'VN Recreation Guide';
  return `${product.shortLabel} Recreation Guide`;
}

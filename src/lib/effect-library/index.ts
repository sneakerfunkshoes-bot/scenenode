export type {
  CanonicalEffect,
  DetectedLayer,
  LibraryCategory,
  LibraryKind,
  LibraryMatch,
  SoftwareRecipe,
  UnknownVisual,
} from './types';
export { EFFECT_LIBRARY, libraryById, libraryPromptIndex } from './catalog';
export {
  detectCompoundFromIds,
  matchLibraryId,
  matchLibraryText,
  matchLayersToLibrary,
} from './match';
export { enrichBreakdownWithLibrary, enrichEffectWithLibrary } from './apply';
export { enqueueUnknownVisual, listUnknownVisuals } from './unknown-queue';

import type {
  BreakdownEffect,
  DetectedEditLayer,
  NleSoftware,
  NleTutorialMap,
  TutorialStep,
  VideoBreakdownRecord,
} from '@/types/breakdown';
import { isGenericEffectName } from '@/lib/effect-naming';
import { EFFECT_LIBRARY, libraryById } from './catalog';
import { detectCompoundFromIds, matchLibraryId, matchLibraryText } from './match';
import { enqueueUnknownVisual } from './unknown-queue';
import type { CanonicalEffect } from './types';

const NLES: NleSoftware[] = [
  'After Effects',
  'Premiere Pro',
  'CapCut',
  'DaVinci Resolve',
  'VN Editor',
];

function emptyTutorials(): NleTutorialMap {
  return {
    'DaVinci Resolve': [],
    'Premiere Pro': [],
    'After Effects': [],
    CapCut: [],
    'VN Editor': [],
  };
}

function stepsFrom(details: string[]): TutorialStep[] {
  return details.map((detail, i) => ({
    order: i + 1,
    title: i === 0 ? 'Recreation' : `Step ${i + 1}`,
    detail,
  }));
}

function recipeFor(entry: CanonicalEffect, nle: NleSoftware) {
  return (
    entry.softwareRecipes.find((r) => r.software === nle) ??
    entry.softwareRecipes[0]
  );
}

function roleFor(entry: CanonicalEffect): DetectedEditLayer['role'] {
  if (entry.type === 'overlay') return 'overlay';
  if (entry.type === 'transform') return 'transform';
  if (entry.category === 'Camera') return 'camera';
  if (entry.category === 'Color') return 'grade';
  if (entry.category === 'Text') return 'text';
  return 'effect';
}

export function layersFromMatch(
  entry: CanonicalEffect,
  extra?: DetectedEditLayer[]
): DetectedEditLayer[] {
  const componentLayers: DetectedEditLayer[] = [];
  if (entry.type === 'compound') {
    for (const id of entry.combinations) {
      const child = libraryById(id);
      if (!child) continue;
      componentLayers.push({
        role: roleFor(child),
        name: child.canonicalName,
        libraryId: child.id,
        parameters: Object.fromEntries(child.parameters.map((p) => [p.name, p.range])),
      });
    }
  }

  const primary: DetectedEditLayer = {
    role: roleFor(entry),
    name: entry.canonicalName,
    libraryId: entry.id,
    parameters: Object.fromEntries(entry.parameters.map((p) => [p.name, p.range])),
  };

  const extras = (extra ?? []).filter(
    (l) => l.role !== 'base' && l.libraryId !== entry.id && l.name !== entry.canonicalName
  );

  return [
    { role: 'base', name: 'Base Footage', parameters: {} },
    ...(componentLayers.length ? componentLayers : [primary]),
    ...extras,
  ];
}

function paramMap(effect: BreakdownEffect): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of effect.parameters ?? []) {
    for (const [k, v] of Object.entries(p.values)) out[k] = String(v);
  }
  for (const layer of effect.layers ?? []) {
    for (const [k, v] of Object.entries(layer.parameters ?? {})) {
      out[k] = String(v);
    }
  }
  return out;
}

function tutorialsFromEntry(
  entry: CanonicalEffect,
  detected: Record<string, string>
): NleTutorialMap {
  const base = emptyTutorials();
  const detectedLine = Object.entries(detected)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
  for (const nle of NLES) {
    const recipe = recipeFor(entry, nle);
    if (!recipe) continue;
    const details = [
      `Use ${recipe.exactEffectName} in ${nle}.`,
      ...recipe.steps,
    ];
    if (detectedLine) details.push(`Match detected values — ${detectedLine}`);
    base[nle] = stepsFrom(details);
    if (base[nle][0]) base[nle][0].title = recipe.exactEffectName;
  }
  return base;
}

function preferredType(effect: BreakdownEffect): CanonicalEffect['type'] | undefined {
  if (effect.libraryType) return effect.libraryType;
  if (effect.type === 'Overlay') return 'overlay';
  if (effect.type === 'Transition') return 'transition';
  if (effect.type === 'Rotation' || effect.type === 'MotionBlur') return 'transform';
  return undefined;
}

function collectLayerIds(effect: BreakdownEffect): string[] {
  const ids: string[] = [];
  if (effect.libraryId) ids.push(effect.libraryId);
  for (const layer of effect.layers ?? []) {
    if (layer.libraryId) ids.push(layer.libraryId);
    const m = matchLibraryText(layer.name);
    if (m) ids.push(m.entry.id);
  }
  for (const row of effect.layerStack ?? []) {
    const m = matchLibraryText(row.name);
    if (m) ids.push(m.entry.id);
  }
  if (effect.overlayElements) {
    for (const bit of effect.overlayElements.split(/[,;/|]/)) {
      const m = matchLibraryText(bit);
      if (m) ids.push(m.entry.id);
    }
  }
  return Array.from(new Set(ids));
}

function unmatchedFrom(effect: BreakdownEffect, matchedIds: Set<string>): string[] {
  const leftovers: string[] = [...(effect.unmatchedVisuals ?? [])];
  const candidates = [
    ...(effect.layers ?? []).filter((l) => l.role !== 'base').map((l) => l.name),
    ...(effect.overlayElements ? effect.overlayElements.split(/[,;/|]/) : []),
  ];
  for (const raw of candidates) {
    const bit = raw.trim();
    if (!bit) continue;
    const m = matchLibraryText(bit);
    if (!m || !m.exact) leftovers.push(bit);
    else if (m.entry.id && !matchedIds.has(m.entry.id) && m.score < 20) leftovers.push(bit);
  }
  return Array.from(new Set(leftovers.map((s) => s.trim()).filter(Boolean)));
}

function resolveName(effect: BreakdownEffect, entry: CanonicalEffect): string {
  const current = (effect.name || '').trim();
  if (current && !isGenericEffectName(current)) return current;
  return entry.canonicalName;
}

export function enrichEffectWithLibrary(
  effect: BreakdownEffect,
  nle: NleSoftware
): BreakdownEffect {
  const hinted = matchLibraryId(effect.libraryId);
  const text = [
    effect.libraryId,
    effect.name,
    effect.description,
    effect.sceneContext,
    effect.overlayElements,
    effect.globalCC,
    ...(effect.layers ?? []).map((l) => l.name),
    ...(effect.layerStack ?? []).map((l) => l.name),
  ]
    .filter(Boolean)
    .join(' | ');

  const textMatch = matchLibraryText(text, preferredType(effect));
  const layerIds = collectLayerIds(effect);
  const compound = detectCompoundFromIds(layerIds);

  const entry =
    hinted ??
    compound ??
    (textMatch && (textMatch.exact || textMatch.score >= 18) ? textMatch.entry : undefined);

  if (!entry) {
    const unmatched = unmatchedFrom(effect, new Set());
    return {
      ...effect,
      unmatchedVisuals: unmatched.length
        ? unmatched
        : [effect.name || effect.description].filter(Boolean),
      confidence: effect.confidence ?? 0.4,
    };
  }

  const detected = paramMap(effect);
  const extraLayers = (effect.layers ?? []).filter(
    (l) => l.role !== 'base' && l.libraryId !== entry.id
  );
  const layers =
    effect.layers && effect.layers.length > 1
      ? effect.layers
      : layersFromMatch(entry, extraLayers);

  const matchedIds = new Set(
    [entry.id, ...entry.combinations, ...layers.map((l) => l.libraryId).filter(Boolean)] as string[]
  );
  const unmatched = unmatchedFrom({ ...effect, layers }, matchedIds);
  const recipes = tutorialsFromEntry(entry, detected);
  const recipe = recipeFor(entry, nle);
  const clueCount = textMatch?.clueHits.length ?? (hinted ? entry.minVisualClues : 2);
  const confidence = Math.min(
    1,
    Math.max(effect.confidence ?? 0, clueCount / Math.max(3, entry.minVisualClues))
  );

  return {
    ...effect,
    libraryId: entry.id,
    libraryType: entry.type,
    type:
      effect.type === 'Stutter' ||
      effect.type === 'CC' ||
      effect.type === 'Flash' ||
      effect.type === 'SFX'
        ? effect.type
        : entry.type === 'overlay'
          ? 'Overlay'
          : entry.type === 'transition'
            ? 'Transition'
            : entry.category === 'Color'
              ? 'CC'
              : effect.type,
    name: resolveName(effect, entry),
    layers,
    compoundComponents: entry.combinations.length ? entry.combinations : undefined,
    unmatchedVisuals: unmatched,
    confidence,
    tutorials: recipes,
    parameters: effect.parameters?.length
      ? effect.parameters
      : [
          {
            plugin: recipe?.exactEffectName || entry.canonicalName,
            values: Object.fromEntries(
              entry.parameters.map((p) => [p.name, detected[p.name] || p.range])
            ),
          },
        ],
  };
}

export async function enrichBreakdownWithLibrary(
  record: VideoBreakdownRecord,
  nle: NleSoftware
): Promise<VideoBreakdownRecord> {
  const effects = record.effects.map((fx) => enrichEffectWithLibrary(fx, nle));

  for (const fx of effects) {
    const leftover = (fx.unmatchedVisuals ?? []).filter(Boolean);
    if (!leftover.length) continue;
    const unknownBits = leftover.filter((bit) => {
      const m = matchLibraryText(bit);
      return !m || m.score < 18;
    });
    for (const bit of unknownBits) {
      try {
        await enqueueUnknownVisual({
          sourceUrl: record.videoUrl,
          timestamp: fx.timestamp,
          description: bit,
          primaryMatchId: fx.libraryId,
          primaryMatchName: fx.name,
          confidence: fx.confidence ?? (fx.libraryId ? 0.71 : 0.4),
        });
      } catch {
        /* queue is best-effort */
      }
    }
  }

  return { ...record, effects };
}

export function catalogSize(): number {
  return EFFECT_LIBRARY.length;
}

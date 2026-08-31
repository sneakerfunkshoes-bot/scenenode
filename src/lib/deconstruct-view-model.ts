import type {
  AnalyzedBeat,
  BeatEnvelopePoint,
  BeatSoundType,
  BreakdownEffect,
  VideoBreakdownRecord,
} from '@/types/breakdown';
import { formatTimestamp } from '@/lib/utils';

export type { BeatEnvelopePoint, BeatSoundType };

export interface ColorToneView {
  shadow: { hex: string; label: string };
  midtone: { hex: string; label: string };
  highlight: { hex: string; label: string };
  contrast: number;
  saturation: number;
  temperature?: number;
  tint?: number;
  curve: number[];
}

export interface BeatPeak {
  id: string;
  time: number;
  strength: number;
  beatType: BeatSoundType;
  similarityGroup: string;
  confidence: number;
}

export const BEAT_TYPE_META: Record<
  BeatSoundType,
  { label: string; color: string; shape: 'dot' | 'diamond' }
> = {
  kick: { label: 'Kick', color: '#fb7185', shape: 'dot' },
  snare: { label: 'Snare / Clap', color: '#38bdf8', shape: 'dot' },
  bass: { label: 'Bass', color: '#fbbf24', shape: 'dot' },
  accent: { label: 'Accent / Drop', color: '#34d399', shape: 'diamond' },
  other: { label: 'Other', color: '#a1a1aa', shape: 'dot' },
};

function typeFromTrigger(trigger: string, frequencyHz?: number): BeatSoundType {
  const t = trigger.toLowerCase();
  if (/kick|drum hit/.test(t)) return 'kick';
  if (/snare|clap|hat|rim/.test(t)) return 'snare';
  if (/bass|sub/.test(t)) return 'bass';
  if (/drop|accent|impact|crash/.test(t)) return 'accent';
  if (typeof frequencyHz === 'number') {
    if (frequencyHz < 90) return 'kick';
    if (frequencyHz < 180) return 'bass';
    if (frequencyHz < 4000) return 'snare';
  }
  return 'other';
}

export function buildBeatPeaks(
  record: VideoBreakdownRecord,
  liveBeats?: AnalyzedBeat[] | null
): BeatPeak[] {
  const source =
    liveBeats && liveBeats.length
      ? liveBeats
      : record.analyzedBeats && record.analyzedBeats.length
        ? record.analyzedBeats
        : null;

  if (source?.length) {
    return source
      .filter((b) => Number.isFinite(b.time) && b.time >= 0)
      .sort((a, b) => a.time - b.time)
      .map((beat, i) => ({
        id: `beat-peak-${i}`,
        time: beat.time,
        strength: Math.min(1, Math.max(0.08, beat.strength)),
        beatType: beat.beatType,
        similarityGroup: beat.similarityGroup,
        confidence: Math.min(1, Math.max(0, beat.confidence)),
      }));
  }

  const transients = record.audioTransients ?? [];
  if (transients.length) {
    return transients
      .filter((t) => Number.isFinite(t.time))
      .sort((a, b) => a.time - b.time)
      .map((t, i) => {
        const beatType = typeFromTrigger(t.trigger, t.frequencyHz);
        return {
          id: `beat-peak-${i}`,
          time: t.time,
          strength: 0.55,
          beatType,
          similarityGroup: beatType,
          confidence: 0.45,
        };
      });
  }

  const stamps = (record.beatTimestamps || []).filter(
    (t) => Number.isFinite(t) && t >= 0 && t <= record.trackDuration + 0.25
  );

  return stamps.map((time, i) => ({
    id: `beat-peak-${i}`,
    time,
    strength: 0.5,
    beatType: 'other' as const,
    similarityGroup: 'untyped',
    confidence: 0.3,
  }));
}

export function buildBeatEnvelope(
  record: VideoBreakdownRecord,
  peaks: BeatPeak[],
  liveEnvelope?: BeatEnvelopePoint[] | null
): BeatEnvelopePoint[] {
  if (liveEnvelope && liveEnvelope.length > 4) return liveEnvelope;
  if (record.beatEnvelope && record.beatEnvelope.length > 4) return record.beatEnvelope;

  const duration = Math.max(record.trackDuration, 0.01);
  const steps = Math.max(80, Math.min(360, Math.round(duration * 24)));
  const points: BeatEnvelopePoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const time = (i / steps) * duration;
    let energy = 0.04;
    for (const peak of peaks) {
      const dt = Math.abs(peak.time - time);
      if (dt > 0.09) continue;
      const bump = peak.strength * Math.exp(-(dt * dt) / (2 * 0.018 * 0.018));
      energy = Math.max(energy, bump);
    }
    points.push({ time, energy: Math.min(1, energy) });
  }
  return points;
}

export interface PacingEvent {
  id: string;
  kind: 'cut' | 'speed' | 'beat' | 'transition' | 'scene';
  label: string;
  time: number;
  timeLabel: string;
  symbol: string;
}

export interface EffectCardView {
  id: string;
  name: string;
  /** Primary display title (main detected effect) */
  title: string;
  /** Secondary modifier / plugin line */
  subtitle: string;
  category: EffectCategory;
  icon: string;
  time: number;
  timeLabel: string;
  endTime: number;
  endTimeLabel: string;
  description: string;
  type: string;
  duration: number;
  recipe: EditRecipe;
  libraryId?: string;
  libraryType?: string;
  unmatchedVisuals?: string[];
  confidence?: number;
}

export interface EditRecipe {
  family: string;
  headline: string;
  primary: string;
  combined: string[];
  supporting: string[];
  parameters: Array<{ label: string; value: string }>;
  motion: string[];
  layerOrder: string[];
  timeLabel: string;
  endTimeLabel: string;
  durationLabel: string;
  category: EffectCategory;
  icon: string;
  libraryId?: string;
  kind?: string;
}

export type EffectCategory =
  | 'motion'
  | 'color'
  | 'blur'
  | 'transition'
  | 'camera'
  | 'beat'
  | 'overlay';

export const EFFECT_CATEGORY_META: Record<
  EffectCategory,
  { icon: string; label: string; tint: string; bar: string }
> = {
  motion: {
    icon: '✦',
    label: 'Motion/Text',
    tint: 'bg-sky-500/[0.08]',
    bar: 'bg-sky-400/70',
  },
  color: {
    icon: '◉',
    label: 'Color',
    tint: 'bg-amber-500/[0.08]',
    bar: 'bg-amber-400/60',
  },
  blur: {
    icon: '≋',
    label: 'Blur',
    tint: 'bg-violet-500/[0.08]',
    bar: 'bg-violet-400/60',
  },
  transition: {
    icon: '↗',
    label: 'Transition',
    tint: 'bg-emerald-500/[0.08]',
    bar: 'bg-emerald-400/60',
  },
  camera: {
    icon: '◌',
    label: 'Camera',
    tint: 'bg-zinc-400/[0.08]',
    bar: 'bg-zinc-300/50',
  },
  beat: {
    icon: '⚡',
    label: 'Beat/Timing',
    tint: 'bg-rose-500/[0.08]',
    bar: 'bg-rose-400/55',
  },
  overlay: {
    icon: '▭',
    label: 'Overlay',
    tint: 'bg-cyan-500/[0.08]',
    bar: 'bg-cyan-400/55',
  },
};

export interface TimelineFrameView {
  id: string;
  time: number;
  timeLabel: string;
  label: string;
  effectId?: string;
}

export interface RecreationStepView {
  order: number;
  title: string;
  bullets: string[];
  effectId?: string;
}

export interface AnnotationView {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
}

export interface AnalysisSummary {
  durationLabel: string;
  scenes: number;
  cuts: number;
  effects: number;
  beats: number;
}

function hashHue(seed: string, i: number): string {
  let h = 0;
  for (let c = 0; c < seed.length; c++) h = (h * 31 + seed.charCodeAt(c) + i) % 360;
  return `hsl(${(h + i * 47) % 360} 32% ${22 + (i % 3) * 14}%)`;
}

export function buildColorTone(record: VideoBreakdownRecord): ColorToneView {
  const seed = record.id || record.videoUrl;
  const cc = record.effects.find((e) => e.globalCC)?.globalCC?.toLowerCase() ?? '';
  return {
    shadow: {
      hex: hashHue(seed, 0),
      label: /teal|blue|cool/.test(cc) ? 'Deep Blue' : 'Deep Neutral',
    },
    midtone: {
      hex: hashHue(seed, 2),
      label: 'Neutral',
    },
    highlight: {
      hex: hashHue(seed, 4),
      label: /warm|orange|amber/.test(cc) ? 'Warm Silver' : 'Soft Silver',
    },
    contrast: 62 + (record.bpm % 20),
    saturation: 48 + (record.effects.length % 25),
    temperature: /warm|orange|amber/.test(cc) ? 58 : /cool|teal|blue/.test(cc) ? 42 : 50,
    tint: /teal|orange|split/.test(cc) ? 54 : 50,
    curve: [8, 18, 32, 48, 64, 78, 90, 96],
  };
}

export function buildColorStyleHint(record: VideoBreakdownRecord): string {
  const cc = record.effects.find((e) => e.globalCC)?.globalCC?.toLowerCase() ?? '';
  if (/teal|orange|warm|cool/.test(cc)) {
    return 'Cinematic warm shadows + soft silver highlights';
  }
  if (/grade|lut|cc/.test(cc)) {
    return 'Balanced contrast with lifted midtones';
  }
  return 'Neutral base with subtle contrast lift';
}

export function buildPacingEvents(record: VideoBreakdownRecord): PacingEvent[] {
  return record.effects
    .filter(
      (e) =>
        e.libraryType === 'transition' ||
        e.type === 'Transition' ||
        e.type === 'Flash' ||
        e.type === 'Stutter'
    )
    .map((e, i) => {
      const isTransition = e.libraryType === 'transition' || e.type === 'Transition';
      return {
        id: `cut-${e.id}`,
        kind: (isTransition ? 'transition' : 'cut') as PacingEvent['kind'],
        label: e.name || (isTransition ? 'Transition' : `Cut ${String(i + 1).padStart(2, '0')}`),
        time: e.timestamp,
        timeLabel: formatTimestamp(e.timestamp),
        symbol: isTransition ? '✦' : '◆',
      };
    })
    .sort((a, b) => a.time - b.time);
}

function classifyEffect(e: BreakdownEffect): EffectCategory {
  if (e.libraryType === 'overlay') return 'overlay';
  if (e.libraryType === 'transition') return 'transition';
  if (e.libraryType === 'transform') return 'camera';
  const hay = `${e.type} ${e.name || ''} ${e.description || ''} ${e.globalCC || ''}`.toLowerCase();
  if (/scan.?line|letterbox|black bar|grain|light leak|hud overlay/.test(hay) || e.type === 'Overlay') {
    return 'overlay';
  }
  if (/grade|color|lut|cc|teal|orange|hdr|exposure|curve|toning/.test(hay) || e.type === 'CC') {
    return 'color';
  }
  if (/blur|glow|sharpen|soft/.test(hay) || e.type === 'MotionBlur') return 'blur';
  if (
    /transition|whip|wipe|flash|cut/.test(hay) ||
    e.type === 'Transition' ||
    e.type === 'Flash'
  ) {
    return 'transition';
  }
  if (/zoom|camera|shake|pan|push|orbit|rotation|scale/.test(hay) || e.type === 'Rotation') {
    return 'camera';
  }
  if (/beat|stutter|speed|ramp|sync/.test(hay) || e.type === 'Stutter' || e.type === 'SFX') {
    return 'beat';
  }
  return 'motion';
}

function familyForCategory(category: EffectCategory, hay: string, kind?: string): string {
  if (kind === 'compound') return 'Compound Recipe';
  if (kind === 'overlay' || category === 'overlay') return 'Overlay';
  if (kind === 'transform') return 'Transform / Motion';
  if (category === 'color') return 'Color Grade';
  if (category === 'motion' || /text|kinetic|caption/.test(hay)) return 'Text Animation';
  if (category === 'camera' || /zoom|rotate|scale/.test(hay)) return 'Transform / Motion';
  if (category === 'transition') return 'Transition';
  if (category === 'blur') return 'Blur / Glow';
  if (category === 'beat') return 'Timing / Beat';
  return 'Effect';
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

export function buildEditRecipe(e: BreakdownEffect, durationHint?: number): EditRecipe {
  const category = classifyEffect(e);
  const hay = `${e.type} ${e.name || ''} ${e.description || ''} ${e.sceneContext || ''} ${e.overlayElements || ''} ${e.globalCC || ''}`.toLowerCase();
  const family = familyForCategory(category, hay, e.libraryType);
  const { title, subtitle } = splitEffectTitle(e);

  const duration =
    durationHint ??
    (typeof e.timestampEnd === 'number'
      ? Math.max(0.12, e.timestampEnd - e.timestamp)
      : 0.72);
  const endTime = e.timestamp + duration;

  const detectedLayers = (e.layers ?? []).filter((l) => l.role !== 'base');
  const primary = e.name || title;

  const combined = unique([
    ...detectedLayers.map((l) => {
      const vals = Object.entries(l.parameters || {})
        .slice(0, 3)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ');
      return vals ? `${l.name}: ${vals}` : l.name;
    }),
    ...(e.compoundComponents?.length && e.libraryId ? [`Compound: ${e.libraryId}`] : []),
    ...(subtitle && subtitle !== primary ? [subtitle] : []),
  ]).slice(0, 8);

  const supporting = unique([
    ...(e.overlayElements
      ? e.overlayElements
          .split(/[,;/|]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3)
      : []),
    ...(e.unmatchedVisuals ?? []).slice(0, 2),
    ...(e.globalCC && category !== 'color' ? [e.globalCC] : []),
  ]).slice(0, 5);

  const parameters: Array<{ label: string; value: string }> = [];
  for (const layer of detectedLayers) {
    for (const [k, v] of Object.entries(layer.parameters || {})) {
      if (!parameters.some((p) => p.label === k && p.value === String(v))) {
        parameters.push({ label: k, value: String(v) });
      }
    }
  }
  for (const p of e.parameters || []) {
    for (const [k, v] of Object.entries(p.values).slice(0, 6)) {
      if (!parameters.some((row) => row.label === k)) {
        parameters.push({ label: k, value: String(v) });
      }
    }
  }

  const motion: string[] = [
    `${duration.toFixed(2)}s window`,
    e.audioSync || (/beat|sync/.test(hay) ? 'Beat synchronized' : 'Continuous ease'),
  ];

  const layerOrder = unique([
    'Base Footage',
    ...detectedLayers.map((l) => l.name),
    ...(e.layerStack?.map((l) => l.name) || []),
  ]).slice(0, 8);

  if (layerOrder.length < 2) {
    layerOrder.push(primary);
  }

  return {
    family,
    headline: primary,
    primary,
    combined,
    supporting,
    parameters: parameters.slice(0, 8),
    motion: unique(motion).slice(0, 4),
    layerOrder,
    timeLabel: formatTimestamp(e.timestamp),
    endTimeLabel: formatTimestamp(endTime),
    durationLabel: `${duration.toFixed(2)}s`,
    category,
    icon: EFFECT_CATEGORY_META[category].icon,
    libraryId: e.libraryId,
    kind: e.libraryType || e.type,
  };
}

function splitEffectTitle(e: BreakdownEffect): { title: string; subtitle: string } {
  const raw = (e.name || e.description || e.type).trim();
  const paren = raw.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (paren) {
    return { title: paren[1].trim(), subtitle: paren[2].trim() };
  }
  const dash = raw.split(/\s+[—–-]\s+/);
  if (dash.length >= 2) {
    return { title: dash[0].trim(), subtitle: dash.slice(1).join(' — ').trim() };
  }
  const plugin = e.parameters?.[0]?.plugin;
  if (plugin && plugin.toLowerCase() !== raw.toLowerCase()) {
    return { title: raw, subtitle: plugin };
  }
  if (e.description && e.description !== raw && e.description.length < 48) {
    return { title: raw, subtitle: e.description };
  }
  return { title: raw, subtitle: e.type };
}

function isColorGradeEffect(e: BreakdownEffect): boolean {
  if (e.type === 'CC') return true;
  if (e.libraryType === 'effect' && e.libraryId?.startsWith('FX_000170')) return true;
  const hay = `${e.name || ''} ${e.description || ''} ${e.globalCC || ''}`.toLowerCase();
  return /^(teal|color grade|colour grade|grade shift|lut|cc pass)/.test(hay) && !/transition|zoom|blur|overlay/.test(hay);
}

function isTransitionEffect(e: BreakdownEffect): boolean {
  return (
    e.libraryType === 'transition' ||
    e.type === 'Transition' ||
    e.type === 'Flash' ||
    e.type === 'Stutter'
  );
}

/** Effects shown in Edit Breakdown — excludes standalone color-grade passes. */
export function buildBreakdownEffects(effects: BreakdownEffect[]): BreakdownEffect[] {
  return effects
    .filter((e) => !isColorGradeEffect(e))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function buildEffectCards(effects: BreakdownEffect[]): EffectCardView[] {
  return buildBreakdownEffects(effects)
    .filter((e) => !isTransitionEffect(e))
    .slice(0, 14)
    .map((e) => cardFromEffect(e));
}

export function buildTransitionCards(effects: BreakdownEffect[]): EffectCardView[] {
  return effects
    .filter(isTransitionEffect)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => cardFromEffect(e));
}

function cardFromEffect(e: BreakdownEffect): EffectCardView {
  const duration =
    typeof e.timestampEnd === 'number'
      ? Math.max(0.12, e.timestampEnd - e.timestamp)
      : Math.max(0.55, 0.9);
  const recipe = buildEditRecipe(e, duration);
  const endTime = e.timestamp + duration;
  return {
    id: e.id,
    name: e.name || e.type,
    title: recipe.headline,
    subtitle: recipe.supporting[0] || recipe.combined[0] || e.type,
    category: recipe.category,
    icon: recipe.icon,
    time: e.timestamp,
    timeLabel: recipe.timeLabel,
    endTime,
    endTimeLabel: recipe.endTimeLabel,
    description: e.description,
    type: e.type,
    duration,
    recipe,
    libraryId: e.libraryId,
    libraryType: e.libraryType,
    unmatchedVisuals: e.unmatchedVisuals,
    confidence: e.confidence,
  };
}

function cardFromGuideStep(
  step: RecreationStepView,
  fallbackTime: number,
  duration: number
): EffectCardView {
  const hay = `${step.title} ${step.bullets.join(' ')}`.toLowerCase();
  const category: EffectCategory = /color|grade/.test(hay)
    ? 'color'
    : /motion|camera|zoom|rotat/.test(hay)
      ? 'camera'
      : /time|beat|ramp|speed/.test(hay)
        ? 'beat'
        : /effect|blur|glow/.test(hay)
          ? 'blur'
          : 'motion';
  const meta = EFFECT_CATEGORY_META[category];
  const end = fallbackTime + Math.max(0.6, duration * 0.12);
  return {
    id: `guide-step-${step.order}`,
    name: step.title,
    title: step.title,
    subtitle: step.bullets[0] || '',
    category,
    icon: meta.icon,
    time: fallbackTime,
    timeLabel: formatTimestamp(fallbackTime),
    endTime: end,
    endTimeLabel: formatTimestamp(end),
    description: step.bullets.join(' '),
    type: step.title,
    duration: Math.max(0.55, end - fallbackTime),
    recipe: {
      family: 'Recreation Step',
      headline: step.title,
      primary: step.title,
      combined: step.bullets.slice(0, 2),
      supporting: step.bullets.slice(2, 4),
      parameters: step.bullets.slice(0, 4).map((b, i) => ({
        label: `Step ${i + 1}`,
        value: b,
      })),
      motion: [],
      layerOrder: step.bullets.slice(0, 3),
      timeLabel: formatTimestamp(fallbackTime),
      endTimeLabel: formatTimestamp(end),
      durationLabel: `${Math.max(0.55, end - fallbackTime).toFixed(2)}s`,
      category,
      icon: meta.icon,
    },
  };
}

/** One Edit Breakdown card per Recreation Guide step. */
export function alignBreakdownToGuide(
  cards: EffectCardView[],
  steps: RecreationStepView[],
  duration: number
): EffectCardView[] {
  if (!steps.length) return cards;
  const used = new Set<string>();
  return steps.map((step, i) => {
    const linked = step.effectId
      ? cards.find((c) => c.id === step.effectId)
      : undefined;
    if (linked) {
      used.add(linked.id);
      return linked;
    }
    const leftover = cards.find((c) => !used.has(c.id));
    if (leftover) {
      used.add(leftover.id);
      return leftover;
    }
    const t = (i / Math.max(1, steps.length)) * Math.max(duration, 1);
    return cardFromGuideStep(step, t, duration);
  });
}

function stepFromEffect(
  effect: BreakdownEffect,
  index: number,
  nle: string
): RecreationStepView {
  const tutorials =
    effect.tutorials?.[nle as keyof typeof effect.tutorials] || [];

  const bullets = tutorials
    .sort((a, b) => a.order - b.order)
    .map((t) => t.detail)
    .filter((b): b is string => Boolean(b && b.trim()))
    .slice(0, 6);

  const timeLabel = formatTimestamp(effect.timestamp);
  const prefix =
    bullets.length > 0
      ? bullets
      : [`At ${timeLabel}: apply ${effect.name || effect.type}.`];

  return {
    order: index + 1,
    title: effect.name || `Step ${String(index + 1).padStart(2, '0')}`,
    bullets: prefix,
    effectId: effect.id,
  };
}

export function buildRecreationSteps(
  record: VideoBreakdownRecord,
  nle: string
): RecreationStepView[] {
  const effects = buildBreakdownEffects(record.effects);
  if (!effects.length) {
    return [
      {
        order: 1,
        title: 'Review the reference',
        bullets: ['Match framing, pacing, and overall look to the reference clip.'],
      },
    ];
  }
  return effects.map((e, i) => stepFromEffect(e, i, nle));
}

export function buildTimelineFrames(record: VideoBreakdownRecord): TimelineFrameView[] {
  const cuts = record.effects.filter(
    (e) => e.libraryType === 'transition' || e.type === 'Transition' || e.type === 'Flash'
  );

  if (cuts.length) {
    return cuts.map((e, i) => {
      const next = cuts[i + 1];
      const end = next?.timestamp ?? Math.min(record.trackDuration, e.timestamp + 0.4);
      return {
        id: e.id || `cut-frame-${i}`,
        time: e.timestamp,
        timeLabel: `${formatTimestamp(e.timestamp)} – ${formatTimestamp(end)}`,
        label: e.name || `Cut ${String(i + 1).padStart(2, '0')}`,
        effectId: e.id,
      };
    });
  }

  return [];
}

export function buildAnnotations(record: VideoBreakdownRecord): AnnotationView[] {
  const items = [
    {
      label: 'Scene Detection',
      detail: 'Scene boundary · cut into next clip',
      x: 10,
      y: 16,
      anchorX: 28,
      anchorY: 32,
    },
    {
      label: 'Frame',
      detail: 'Currently analyzed frame region',
      x: 62,
      y: 14,
      anchorX: 52,
      anchorY: 40,
    },
    {
      label: 'Motion Path',
      detail: 'Camera moves right → left · ~0.42s',
      x: 8,
      y: 58,
      anchorX: 36,
      anchorY: 62,
    },
    {
      label: 'Effect Detection',
      detail: record.effects[0]?.name || 'Detected effect region',
      x: 58,
      y: 64,
      anchorX: 48,
      anchorY: 55,
    },
  ];
  return items.map((item, i) => ({ id: `ann-${i}`, ...item }));
}

export function buildAnalysisSummary(record: VideoBreakdownRecord): AnalysisSummary {
  const cuts = record.effects.filter(
    (e) =>
      e.libraryType === 'transition' ||
      e.type === 'Transition' ||
      e.type === 'Flash' ||
      e.type === 'Stutter'
  ).length;
  return {
    durationLabel: `${record.trackDuration.toFixed(2)}s`,
    scenes: record.effects.length,
    cuts,
    effects: record.effects.length,
    beats:
      record.analyzedBeats?.length ||
      record.beatTimestamps?.length ||
      0,
  };
}

/** Map playhead time to the closest recreation step. */
export function stepForTime(
  steps: RecreationStepView[],
  effects: EffectCardView[],
  time: number
): number {
  const nearest = effects.reduce<{ id?: string; dist: number }>(
    (best, fx) => {
      const dist = Math.abs(fx.time - time);
      return dist < best.dist ? { id: fx.id, dist } : best;
    },
    { dist: Infinity }
  );
  if (nearest.id) {
    const linked = steps.find((s) => s.effectId === nearest.id);
    if (linked) return linked.order;
  }
  const ratio = effects.length ? time / Math.max(effects[effects.length - 1]?.time || 1, 1) : 0;
  const idx = Math.min(steps.length - 1, Math.floor(ratio * steps.length));
  return steps[idx]?.order ?? 1;
}

/**
 * Mock database schema for SceneCraft video edit breakdowns.
 */

export type NleSoftware =
  | 'DaVinci Resolve'
  | 'Premiere Pro'
  | 'After Effects'
  | 'CapCut'
  | 'VN Editor';

export type EffectKind =
  | 'Transition'
  | 'Flash'
  | 'SFX'
  | 'CC'
  | 'Rotation'
  | 'MotionBlur'
  | 'Stutter'
  | 'Overlay';

export function effectSpikeY(type: EffectKind): number {
  switch (type) {
    case 'Flash':
      return 10;
    case 'Stutter':
      return 12;
    case 'SFX':
      return 15;
    case 'Rotation':
      return 18;
    case 'Transition':
      return 20;
    case 'MotionBlur':
      return 22;
    case 'Overlay':
      return 25;
    case 'CC':
      return 28;
    default:
      return 30;
  }
}

export interface TutorialStep {
  order: number;
  title: string;
  detail: string;
}

/** Per-NLE recreation steps for a single effect */
export type NleTutorialMap = Record<NleSoftware, TutorialStep[]>;

export interface EffectParameter {
  plugin: string;
  values: Record<string, string | number>;
  easing?: string;
}

export interface CompositorLayer {
  order: number;
  name: string;
  blendMode?: string;
  description: string;
}

export interface AudioTransientEvent {
  time: number;
  frequencyHz?: number;
  trigger: string;
  visualResponse: string;
}

export type BeatSoundType = 'kick' | 'snare' | 'bass' | 'accent' | 'other';

export interface AnalyzedBeat {
  time: number;
  beatType: BeatSoundType;
  similarityGroup: string;
  strength: number;
  confidence: number;
}

export interface BeatEnvelopePoint {
  time: number;
  energy: number;
}

export interface BreakdownEffect {
  id: string;
  timestamp: number;
  /** Optional end time for ranged effects (e.g. glowing text 00:00.00 – 00:00.07) */
  timestampEnd?: number;
  type: EffectKind;
  /** Named effect/transition as an editor would call it, e.g. "Whip Pan Transition" */
  name?: string;
  description: string;
  /** What is visibly happening on screen at this moment */
  sceneContext?: string;
  /** Stickers, text layers, PNG overlays, and FX elements used */
  overlayElements?: string;
  /** Global color grade / LUT notes for this moment */
  globalCC?: string;
  /** How this moment locks to the audio beat */
  audioSync?: string;
  /** Copy-paste plugin parameter values */
  parameters?: EffectParameter[];
  /** Compositing layer stack for this moment */
  layerStack?: CompositorLayer[];
  /** Linked audio transient for this moment */
  audioTransient?: AudioTransientEvent;
  /** Step-by-step tutorials keyed by NLE */
  tutorials: NleTutorialMap;
  /** Canonical master-library ID, e.g. FX_000124 */
  libraryId?: string;
  libraryType?: 'effect' | 'transition' | 'transform' | 'overlay' | 'compound';
  /** Layered detection stack for this moment */
  layers?: DetectedEditLayer[];
  compoundComponents?: string[];
  unmatchedVisuals?: string[];
  confidence?: number;
}

export interface DetectedEditLayer {
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

export interface VideoBreakdownRecord {
  id: string;
  videoUrl: string;
  /** Local MP4 served from /previews after analysis for inline playback */
  previewVideoUrl?: string;
  nleSoftware: NleSoftware;
  bpm: number;
  trackDuration: number;
  beatTimestamps: number[];
  effects: BreakdownEffect[];
  songTitle: string;
  songArtist: string;
  previewLabel: string;
  /** Millisecond-level audio transient map */
  audioTransients?: AudioTransientEvent[];
  /** Per-onset beat analysis from the actual audio (or vision fallback) */
  analyzedBeats?: AnalyzedBeat[];
  /** Downsampled RMS / onset energy curve aligned to video time */
  beatEnvelope?: BeatEnvelopePoint[];
  /** True when served from edge/signature cache */
  fromCache?: boolean;
}

export type AnalyzeStage =
  | 'idle'
  | 'extracting_beats'
  | 'identifying_transitions'
  | 'generating_steps'
  | 'complete'
  | 'error';

export const ANALYZE_STAGE_LABELS: Record<
  Exclude<AnalyzeStage, 'idle' | 'complete' | 'error'>,
  string
> = {
  extracting_beats: 'Extracting Beat Markers...',
  identifying_transitions: 'Identifying Transitions...',
  generating_steps: 'Generating DaVinci Resolve Steps...',
};

export function stageLabelForNle(
  stage: AnalyzeStage,
  nle: NleSoftware
): string {
  if (stage === 'extracting_beats') return 'Extracting Beat Markers...';
  if (stage === 'identifying_transitions') return 'Identifying Transitions...';
  if (stage === 'generating_steps') return `Generating ${nle} Steps...`;
  if (stage === 'complete') return 'Analysis complete';
  if (stage === 'error') return 'Analysis failed';
  return 'Ready';
}

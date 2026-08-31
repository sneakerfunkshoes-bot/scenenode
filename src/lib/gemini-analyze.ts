import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from '@google/genai';
import type {
  AnalyzedBeat,
  AudioTransientEvent,
  BeatSoundType,
  BreakdownEffect,
  CompositorLayer,
  DetectedEditLayer,
  EffectKind,
  EffectParameter,
  NleSoftware,
  NleTutorialMap,
  TutorialStep,
  VideoBreakdownRecord,
} from '@/types/breakdown';
import { NLE_LIST } from '@/lib/breakdown-mock';
import { condenseEffects } from '@/lib/effect-condense';
import { resolveEffectName } from '@/lib/effect-naming';
import { enrichBreakdownWithLibrary } from '@/lib/effect-library/apply';
import { libraryPromptIndex } from '@/lib/effect-library/catalog';
import { stableBreakdownId } from '@/lib/url-hash';
import { resolveSongMeta } from '@/lib/song-meta';

const EMPTY_STEPS: TutorialStep[] = [];

function emptyTutorials(): NleTutorialMap {
  return {
    'DaVinci Resolve': EMPTY_STEPS,
    'Premiere Pro': EMPTY_STEPS,
    'After Effects': EMPTY_STEPS,
    CapCut: EMPTY_STEPS,
    'VN Editor': EMPTY_STEPS,
  };
}

function stepsFrom(items: unknown): TutorialStep[] {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => {
    if (typeof item === 'string') {
      return { order: i + 1, title: `Step ${i + 1}`, detail: item };
    }
    const row = item as { title?: string; detail?: string; order?: number };
    return {
      order: typeof row.order === 'number' ? row.order : i + 1,
      title: row.title?.trim() || `Step ${i + 1}`,
      detail: row.detail?.trim() || '',
    };
  });
}

function parseParameters(raw: unknown): EffectParameter[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((row) => {
      const item = row as Record<string, unknown>;
      const plugin = String(item.plugin ?? item.name ?? 'Effect');
      const values =
        item.values && typeof item.values === 'object'
          ? (item.values as Record<string, string | number>)
          : {};
      const easing = typeof item.easing === 'string' ? item.easing : undefined;
      if (!Object.keys(values).length && item.threshold != null) {
        values.Threshold = Number(item.threshold);
      }
      return { plugin, values, easing };
    })
    .filter((p) => p.plugin);
}

function parseLayerStack(raw: unknown): CompositorLayer[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((row, i) => {
    const item = row as Record<string, unknown>;
    return {
      order: Number(item.order ?? item.layer ?? 4 - i) || i + 1,
      name: String(item.name ?? item.label ?? `Layer ${i + 1}`),
      blendMode: typeof item.blendMode === 'string' ? item.blendMode : undefined,
      description: String(item.description ?? item.detail ?? ''),
    };
  });
}

const LAYER_ROLES = new Set<DetectedEditLayer['role']>([
  'base',
  'transform',
  'camera',
  'effect',
  'overlay',
  'grade',
  'text',
  'audio',
]);

function parseParamRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, String(v)])
  );
}

function parseDetectedLayers(raw: unknown): DetectedEditLayer[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((row) => {
    const item = (row ?? {}) as Record<string, unknown>;
    const roleRaw = String(item.role ?? item.kind ?? 'effect').toLowerCase();
    const role = LAYER_ROLES.has(roleRaw as DetectedEditLayer['role'])
      ? (roleRaw as DetectedEditLayer['role'])
      : 'effect';
    const libraryId =
      typeof item.libraryId === 'string' && item.libraryId.trim()
        ? item.libraryId.trim()
        : undefined;
    return {
      role,
      name: String(item.name ?? item.label ?? 'Layer'),
      libraryId,
      parameters: parseParamRecord(item.parameters ?? item.values),
    };
  });
}

function parseStringList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map((v) => String(v).trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function parseLibraryType(
  raw: unknown
): BreakdownEffect['libraryType'] | undefined {
  const t = String(raw ?? '').toLowerCase();
  if (t === 'overlay' || t === 'transition' || t === 'transform' || t === 'compound' || t === 'effect') {
    return t;
  }
  if (t === 'composition' || t === 'compositional') return 'overlay';
  return undefined;
}

function parseAudioTransient(raw: unknown): AudioTransientEvent | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const item = raw as Record<string, unknown>;
  return {
    time: Number(item.time ?? item.timestamp ?? 0),
    frequencyHz: item.frequencyHz != null ? Number(item.frequencyHz) : undefined,
    trigger: String(item.trigger ?? item.source ?? 'Beat transient'),
    visualResponse: String(item.visualResponse ?? item.response ?? ''),
  };
}

function parseAudioTransients(raw: unknown): AudioTransientEvent[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((row) => parseAudioTransient(row)).filter(Boolean) as AudioTransientEvent[];
}

function parseBeatSoundType(raw: unknown): BeatSoundType {
  const t = String(raw ?? '').toLowerCase();
  if (t.includes('kick')) return 'kick';
  if (/snare|clap|hat/.test(t)) return 'snare';
  if (t.includes('bass') || t.includes('sub')) return 'bass';
  if (/accent|drop|impact/.test(t)) return 'accent';
  return 'other';
}

function parseAnalyzedBeats(data: Record<string, unknown>): AnalyzedBeat[] {
  const rows = data.beats ?? data.analyzedBeats;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      if (typeof row === 'number') {
        return {
          time: row,
          beatType: 'other' as const,
          similarityGroup: 'untyped',
          strength: 0.5,
          confidence: 0.35,
        };
      }
      const item = row as Record<string, unknown>;
      const time = Number(item.time ?? item.timestamp);
      if (!Number.isFinite(time)) return null;
      const beatType = parseBeatSoundType(item.type ?? item.beatType ?? item.trigger);
      return {
        time,
        beatType,
        similarityGroup: String(item.similarityGroup ?? beatType),
        strength: Math.min(1, Math.max(0.08, Number(item.strength ?? 0.55))),
        confidence: Math.min(1, Math.max(0, Number(item.confidence ?? 0.5))),
      };
    })
    .filter(Boolean) as AnalyzedBeat[];
}

function transientToEffect(
  transient: AudioTransientEvent,
  index: number,
  nle: NleSoftware
): BreakdownEffect {
  const freq = transient.frequencyHz
    ? `${Math.round(transient.frequencyHz)}Hz `
    : '';
  const trigger = transient.trigger || 'Beat transient';
  const response =
    transient.visualResponse || `Land the visual hit on the ${trigger.toLowerCase()}.`;

  return {
    id: `fx-transient-${index + 1}`,
    timestamp: transient.time,
    type: 'SFX',
    name: resolveEffectName({
      type: 'SFX',
      description: `${trigger} ${response}`,
    }),
    description: `${freq}${trigger} — audio-synced hit`,
    audioSync: response,
    audioTransient: transient,
    tutorials: {
      ...emptyTutorials(),
      [nle]: [
        {
          order: 1,
          title: 'Mark the transient',
          detail: `Place a marker at ${transient.time.toFixed(2)}s on the ${trigger.toLowerCase()}.`,
        },
        { order: 2, title: 'Match the visual', detail: response },
      ],
    },
  };
}

/**
 * Keeps the timeline down to the moves that define the edit: repeated
 * neighbours are folded together, and a thin answer is topped up with real
 * detected transients rather than padded with invented segments.
 */
function toMainEffects(
  effects: BreakdownEffect[],
  data: Record<string, unknown>,
  nle: NleSoftware
): BreakdownEffect[] {
  const list = [...effects];
  if (list.length === 0) return list;

  const transients =
    parseAudioTransients(data.audioTransients ?? data.transients) ?? [];
  transients.forEach((transient, i) => {
    if (list.length >= 8) return;
    if (!Number.isFinite(transient.time)) return;
    const alreadyCovered = list.some(
      (fx) => Math.abs(fx.timestamp - transient.time) < 0.5
    );
    if (alreadyCovered) return;
    list.push(transientToEffect(transient, i, nle));
  });

  list.sort((a, b) => a.timestamp - b.timestamp);

  // Sustained looks (grades, overlays, spins) hold until the next edit.
  const SUSTAINED: EffectKind[] = ['CC', 'Overlay', 'Rotation', 'Transition'];
  list.forEach((fx, i) => {
    if (fx.timestampEnd != null || !SUSTAINED.includes(fx.type)) return;
    const next = list[i + 1]?.timestamp;
    if (next == null || next - fx.timestamp < 1) return;
    fx.timestampEnd = next;
  });

  return condenseEffects(list);
}

function parseEffectType(
  raw: unknown,
  description = '',
  libraryType?: BreakdownEffect['libraryType']
): EffectKind {
  if (libraryType === 'overlay') return 'Overlay';
  if (libraryType === 'transition') return 'Transition';
  if (libraryType === 'transform') {
    const t = `${raw ?? ''} ${description}`.toLowerCase();
    if (/rotat|spin|roll/.test(t)) return 'Rotation';
    if (/blur/.test(t)) return 'MotionBlur';
    return 'Rotation';
  }
  const t = `${raw ?? ''} ${description}`.toLowerCase();
  if (/\bstutter\b|flavor|flavour|image swap|multi-image|2-frame|2 frame/.test(t)) {
    return 'Stutter';
  }
  if (/\bcc\b|color grade|colour grade|hdr sharpen|high contrast|lut\b/.test(t)) {
    return 'CC';
  }
  if (/rotat|z-axis|z axis|\b360\b|\b180\b|barrel roll/.test(t)) return 'Rotation';
  if (/flash|white flash|exposure burst|exposure flash/.test(t)) return 'Flash';
  if (
    /overlay|text glow|caption|sound barrier|subtitle|scan.?line|letterbox|black bar/.test(
      t
    )
  ) {
    return 'Overlay';
  }
  if (
    /motion blur|directional blur|gaussian blur|radial blur|whip blur/.test(t)
  ) {
    return 'MotionBlur';
  }
  if (/\bsfx\b|whoosh|bass hit|audio hit/.test(t)) return 'SFX';
  return 'Transition';
}

function normalizeTutorials(
  raw: unknown,
  preferredNle: NleSoftware
): NleTutorialMap {
  const base = emptyTutorials();
  if (!raw || typeof raw !== 'object') return base;

  const map = raw as Record<string, unknown>;
  for (const nle of NLE_LIST) {
    if (Array.isArray(map[nle])) {
      base[nle] = stepsFrom(map[nle]);
    }
  }

  // Accept short keys
  const aliases: Array<[string, NleSoftware]> = [
    ['davinci', 'DaVinci Resolve'],
    ['premiere', 'Premiere Pro'],
    ['aftereffects', 'After Effects'],
    ['ae', 'After Effects'],
    ['capcut', 'CapCut'],
    ['vn', 'VN Editor'],
  ];
  for (const [key, nle] of aliases) {
    if (Array.isArray(map[key]) && base[nle].length === 0) {
      base[nle] = stepsFrom(map[key]);
    }
  }

  // If only a flat steps array was returned, attach to preferred NLE
  if (Array.isArray(map.steps) && base[preferredNle].length === 0) {
    base[preferredNle] = stepsFrom(map.steps);
  }

  return base;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error('Gemini returned non-JSON analysis text');
}

export function mapGeminiAnalysisToBreakdown(
  rawText: string,
  videoUrl: string,
  nleSoftware: NleSoftware
): VideoBreakdownRecord {
  const data = extractJsonObject(rawText) as Record<string, unknown>;
  const colorGrade =
    typeof data.colorGrade === 'string'
      ? data.colorGrade
      : typeof (data.colorGrade as { summary?: string } | undefined)?.summary ===
          'string'
        ? (data.colorGrade as { summary: string }).summary
        : '';

  const effectsRaw = Array.isArray(data.effects)
    ? data.effects
    : Array.isArray(data.events)
      ? data.events
      : Array.isArray(data.microEdits)
        ? data.microEdits
        : [];
  const effects: BreakdownEffect[] = effectsRaw.map((item, i) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const description = String(row.description ?? row.name ?? `Effect ${i + 1}`);
    const withCc =
      colorGrade && /cc|color|grade|hdr/i.test(description)
        ? description.includes('CC:')
          ? description
          : `${description} · CC: ${colorGrade}`
        : description;

    const overlayElements =
      typeof row.overlayElements === 'string'
        ? row.overlayElements
        : typeof row.overlays === 'string'
          ? row.overlays
          : undefined;
    const sceneContext =
      typeof row.sceneContext === 'string'
        ? row.sceneContext
        : typeof row.onScreen === 'string'
          ? row.onScreen
          : undefined;
    const label = [row.name, row.effectName, row.transition, row.transitionName]
      .find((value) => typeof value === 'string' && value.trim())
      ?.toString();
    const libraryId =
      typeof row.libraryId === 'string' && row.libraryId.trim()
        ? row.libraryId.trim()
        : undefined;
    const layers = parseDetectedLayers(row.layers);
    const unmatchedVisuals = parseStringList(row.unmatchedVisuals);
    const libraryType = parseLibraryType(row.libraryType ?? row.classification);
    const type = parseEffectType(row.type, description, libraryType);
    const confidence =
      row.confidence != null && Number.isFinite(Number(row.confidence))
        ? Number(row.confidence)
        : undefined;

    return {
      id: String(row.id ?? `fx-${i + 1}`),
      timestamp: Number(row.timestamp ?? row.time ?? i * 1.5) || i * 1.5,
      timestampEnd:
        row.timestampEnd != null || row.endTime != null
          ? Number(row.timestampEnd ?? row.endTime) || undefined
          : undefined,
      type,
      name: resolveEffectName({
        type,
        name: label,
        description,
        overlayElements,
        sceneContext,
      }),
      description: withCc,
      sceneContext,
      overlayElements,
      globalCC: typeof row.globalCC === 'string' ? row.globalCC : undefined,
      audioSync: typeof row.audioSync === 'string' ? row.audioSync : undefined,
      parameters: parseParameters(row.parameters),
      layerStack: parseLayerStack(row.layerStack),
      layers,
      libraryId,
      libraryType,
      unmatchedVisuals,
      confidence,
      audioTransient: parseAudioTransient(row.audioTransient),
      tutorials: normalizeTutorials(row.tutorials ?? row.steps, nleSoftware),
    };
  });

  effects.sort((a, b) => a.timestamp - b.timestamp);

  // Ensure at least one effect so the UI has something to show
  if (effects.length === 0) {
    const tutorialSteps = stepsFrom(data.tutorialSteps ?? data.steps);
    effects.push({
      id: 'fx-1',
      timestamp: 0,
      type: 'Transition',
      description: colorGrade
        ? `Overall edit breakdown · CC: ${colorGrade}`
        : 'Overall edit breakdown',
      tutorials: {
        ...emptyTutorials(),
        [nleSoftware]: tutorialSteps.length
          ? tutorialSteps
          : [
              {
                order: 1,
                title: 'Review analysis',
                detail:
                  typeof data.summary === 'string'
                    ? data.summary
                    : rawText.slice(0, 1200),
              },
            ],
      },
    });
  }

  const detailedEffects = toMainEffects(effects, data, nleSoftware);

  const analyzedBeats = parseAnalyzedBeats(data);
  const beatTimestamps = (
    analyzedBeats.length
      ? analyzedBeats.map((b) => b.time)
      : Array.isArray(data.beatTimestamps)
        ? data.beatTimestamps.map((n) => Number(n)).filter((n) => Number.isFinite(n))
        : []
  ).sort((a, b) => a - b);

  const song = resolveSongMeta(data, videoUrl, beatTimestamps);
  const bpm = song.bpm;
  const trackDuration = song.durationSec;

  return {
    id: stableBreakdownId(videoUrl),
    videoUrl,
    nleSoftware,
    bpm,
    trackDuration,
    beatTimestamps,
    effects: detailedEffects,
    songTitle: song.title,
    songArtist: song.artist,
    previewLabel: String(data.previewLabel ?? 'analyzed reel'),
    audioTransients: parseAudioTransients(data.audioTransients ?? data.transients),
    analyzedBeats: analyzedBeats.length ? analyzedBeats : undefined,
  };
}

function buildPrompt(nle: NleSoftware): string {
  return `You are scenenode AI, an expert short-form video editor and finishing artist.

Analyze EVERY moment in LAYERS, not one generic label. For each moment ask:
"Is this part of the footage, a transform, camera motion, an effect, a transition, an overlay, a color grade, text, or audio sync?"

Never output a bare name like "Zoom Effect", "Zoom", "Cut", "Flash", or "Blur".
If scale AND rotation happen together, the name MUST include both, with numbers:
"Zoom In + 12° Clockwise Rotation" — Scale 100% → 128%, Rotation 0° → 12°, Position X +24 Y -10, Duration 0.42s, Easing, Motion Blur.

Report the recreation sequence as distinct events a creator must copy. Return 6 to 12 events — one for each major move in time order.

What counts as a main move (include ALL that appear):
1. Base composition / framing lock.
2. The look of the clip — colour grade / CC, HDR sharpen, grain.
3. Each distinct transition (whip pan, zoom blur, luma fade, glitch tear, hard cut).
4. Camera / transform — zoom, pan, shake, 3D orbit. Always list Scale, Position, Rotation, Anchor separately when they change.
5. A stutter or multi-image burst — ONE ranged event, never one event per frame.
6. Overlays: scan lines, letterbox, grain, light leak, HUD, rain, flare — these are NOT "effects" on the footage.
7. Text or stickers.
8. Timing / beat-sync hits and speed ramps.
9. The ending — fade to black, iris, outro lock.

Never list the same look twice. A hold is ONE ranged event with timestamp and timestampEnd.

Match each layer to this MASTER LIBRARY (use the exact ID). If 2+ components fire together, prefer a COMPOUND id and still list every layer:

${libraryPromptIndex()}

If a visual does not match any ID, put it in unmatchedVisuals and still describe it.

Return ONLY valid JSON (no markdown) matching this schema:
{
  "bpm": number,
  "trackDuration": number,
  "beatTimestamps": number[],
  "beats": [{ "time": number, "type": "kick" | "snare" | "bass" | "accent" | "other", "strength": number, "confidence": number, "similarityGroup": string }],
  "songTitle": string,
  "songArtist": string,
  "songInfo": { "title": string, "artist": string, "bpm": number, "duration": number },
  "previewLabel": string,
  "colorGrade": string,
  "summary": string,
  "audioTransients": [{ "time": number, "frequencyHz": number, "trigger": string, "visualResponse": string }],
  "effects": [
    {
      "id": string,
      "timestamp": number,
      "timestampEnd": number,
      "type": "Transition" | "Flash" | "SFX" | "CC" | "Rotation" | "MotionBlur" | "Stutter" | "Overlay",
      "libraryId": "MOTION_001",
      "libraryType": "effect" | "transition" | "transform" | "overlay" | "compound",
      "classification": "footage" | "effect" | "transition" | "overlay" | "composition",
      "name": string,
      "description": string,
      "sceneContext": string,
      "overlayElements": string,
      "globalCC": string,
      "audioSync": string,
      "confidence": 0.0,
      "unmatchedVisuals": ["string"],
      "layers": [
        { "role": "base", "name": "Base Footage", "parameters": {} },
        { "role": "transform", "name": "Zoom In + Clockwise Rotation", "libraryId": "MOTION_001", "parameters": { "Scale": "100% → 128%", "Rotation": "0° → 12°", "Position": "X +24, Y -10", "Duration": "0.42s", "Easing": "Ease Out + Overshoot", "Motion Blur": "Enabled" } },
        { "role": "effect", "name": "Directional Blur", "libraryId": "FX_000124", "parameters": { "Direction": "90°", "Blur Length": "42" } },
        { "role": "overlay", "name": "Horizontal Scan Line / Black Bar Overlay", "libraryId": "OV_000301", "parameters": { "Opacity": "65%", "Blend Mode": "Multiply" } }
      ],
      "parameters": [{ "plugin": string, "values": { "Scale": "100% → 128%" }, "easing": "cubic-bezier(0.25, 0.1, 0.25, 1.0)" }],
      "layerStack": [{ "order": number, "name": string, "blendMode": string, "description": string }],
      "audioTransient": { "time": number, "frequencyHz": number, "trigger": string, "visualResponse": string },
      "tutorials": {
        "${nle}": [{ "order": number, "title": string, "detail": string }]
      }
    }
  ]
}

Rules:
- name: specific industry name WITH numbers. Reject "Zoom", "Cut", "Transition", "Flash", "Blur", "Shake" alone.
- layers: always include Base Footage plus every detected transform, camera move, effect, overlay, grade, and text. Overlays (scan lines, letterbox, grain) are their own layer, never merged into "the effect".
- libraryId: the best matching MASTER LIBRARY id. Use a CMP_* id when multiple components combine.
- unmatchedVisuals: any visible component that did not match a library id.
- description: ONE short beginner sentence.
- Timestamps in seconds. Always set timestamp AND timestampEnd for ranged holds.
- sceneContext: what is on screen at this moment.
- overlayElements: overlays/stickers/text — also mirrored in layers[] with role overlay.
- parameters: exact numeric values (scale %, degrees, opacity %, duration).
- colorGrade: contrast, saturation, shadows/highlights, warmth, grain, LUT feel.
- effects: 6–12 distinct moves covering composition, motion, overlays, effects, timing, grade.
- tutorials for ${nle} must use real tools in that NLE.
- beatTimestamps: every audible kick/snare/clap/bass/accent at EXACT time. Never an even grid.
- songTitle & songArtist: exact audible track. Never placeholders. If unknown: "Unknown Track" / "Unknown Artist".
- bpm from the audible grid. trackDuration: actual length of the analyzed edit.`;
}

async function waitForFileActive(
  ai: GoogleGenAI,
  name: string,
  maxWaitMs = 180_000
) {
  const started = Date.now();
  let file = await ai.files.get({ name });
  while (file.state === 'PROCESSING') {
    if (Date.now() - started > maxWaitMs) {
      throw new Error('Timed out waiting for the video file to process.');
    }
    await new Promise((r) => setTimeout(r, 2500));
    file = await ai.files.get({ name });
  }
  if (file.state === 'FAILED') {
    throw new Error('Video processing failed. Please try again.');
  }
  return file;
}

function isRetryableEngineError(error: unknown): boolean {
  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    status === 503 ||
    status === 429 ||
    /503|429|UNAVAILABLE|high demand|overloaded|resource exhausted|quota|unavailable/i.test(
      msg
    )
  );
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  args: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxRetries = 3
) {
  let delay = 1000;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(args);
    } catch (error) {
      lastError = error;
      if (isRetryableEngineError(error) && attempt < maxRetries - 1) {
        console.warn(
          `[analyze] Engine busy (503/429). Retry ${attempt + 1}/${maxRetries} in ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Engine temporary high load. Please try again in a moment.');
}

function publicEngineError(error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error);
  if (isRetryableEngineError(error) || /503|high demand|overloaded/i.test(msg)) {
    return new Error('Engine temporary high load. Please try again in a moment.');
  }
  if (/timed out|timeout/i.test(msg)) {
    return new Error('Analysis timed out. Please try again.');
  }
  return new Error('Analysis failed. Please try again in a moment.');
}

export async function analyzeVideoWithGemini(options: {
  videoPath: string;
  videoUrl: string;
  nle: NleSoftware;
}): Promise<VideoBreakdownRecord> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env.local');
  }

  const preferred = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelCandidates = Array.from(
    new Set([
      preferred,
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
    ])
  );

  const ai = new GoogleGenAI({ apiKey });

  const uploaded = await ai.files.upload({
    file: options.videoPath,
    config: { mimeType: 'video/mp4' },
  });

  if (!uploaded.name) {
    throw new Error('File upload did not return a file name.');
  }

  const active = await waitForFileActive(ai, uploaded.name);
  if (!active.uri || !active.mimeType) {
    throw new Error('Uploaded file is missing uri/mimeType after processing.');
  }

  let text = '';
  let lastError: unknown;

  try {
    for (const model of modelCandidates) {
      try {
        const response = await generateContentWithRetry(ai, {
          model,
          contents: createUserContent([
            createPartFromUri(active.uri, active.mimeType),
            buildPrompt(options.nle),
          ]),
          config: {
            temperature: 0.2,
            maxOutputTokens: 16384,
          },
        });
        text = response.text?.trim() || '';
        if (text) break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (/404|NOT_FOUND|no longer available|not found/i.test(msg)) {
          continue;
        }
        throw publicEngineError(err);
      }
    }

    if (!text) {
      throw publicEngineError(lastError ?? new Error('Empty analysis.'));
    }
  } catch (err) {
    throw publicEngineError(err);
  } finally {
    try {
      await ai.files.delete({ name: uploaded.name });
    } catch {
      /* ignore cleanup errors */
    }
  }

  const mapped = mapGeminiAnalysisToBreakdown(text, options.videoUrl, options.nle);
  return withLibrary(mapped, options.nle);
}

async function withLibrary(
  record: VideoBreakdownRecord,
  nle: NleSoftware
): Promise<VideoBreakdownRecord> {
  try {
    return await enrichBreakdownWithLibrary(record, nle);
  } catch {
    return record;
  }
}

const FIRST_TOKEN_TIMEOUT_MS = 60_000;
const TOTAL_ANALYSIS_TIMEOUT_MS = 240_000;
const HEARTBEAT_INTERVAL_MS = 8_000;

export type GeminiStreamEvent =
  | { type: 'token'; delta: string; totalChars: number }
  | { type: 'progress'; elapsedMs: number; totalChars: number; mode: 'stream' | 'batch' }
  | { type: 'complete'; breakdown: VideoBreakdownRecord };

type GeminiAnalysisEvent = GeminiStreamEvent | { type: 'file_ready' };

type GenerateArgs = Parameters<GoogleGenAI['models']['generateContent']>[0];

function assertAnalysisWithinTimeout(analysisStarted: number) {
  if (Date.now() - analysisStarted > TOTAL_ANALYSIS_TIMEOUT_MS) {
    throw new Error('Analysis timed out. Please try again.');
  }
}

async function tryStreamThenBatch(
  ai: GoogleGenAI,
  args: GenerateArgs,
  onEvent: (event: GeminiAnalysisEvent) => void,
  analysisStarted: number
): Promise<string> {
  const stream = await ai.models.generateContentStream(args);
  let text = '';
  let gotToken = false;
  const streamStarted = Date.now();

  const consumeStream = async (): Promise<string> => {
    for await (const chunk of stream) {
      assertAnalysisWithinTimeout(analysisStarted);
      const delta = chunk.text ?? '';
      if (!delta) continue;
      gotToken = true;
      text += delta;
      onEvent({ type: 'token', delta, totalChars: text.length });
    }
    return text;
  };

  const streamPromise = consumeStream();

  while (!gotToken) {
    assertAnalysisWithinTimeout(analysisStarted);

    if (Date.now() - streamStarted >= FIRST_TOKEN_TIMEOUT_MS) {
      onEvent({
        type: 'progress',
        elapsedMs: Date.now() - analysisStarted,
        totalChars: 0,
        mode: 'batch',
      });
      const response = await generateContentWithRetry(ai, args);
      const batchText = response.text?.trim() || '';
      if (batchText) {
        onEvent({
          type: 'token',
          delta: batchText.slice(0, 120),
          totalChars: batchText.length,
        });
      }
      return batchText;
    }

    const settled = await Promise.race([
      streamPromise.then((result) => ({ status: 'done' as const, text: result })),
      new Promise<{ status: 'tick' }>((resolve) =>
        setTimeout(() => resolve({ status: 'tick' }), 1000)
      ),
    ]);

    if (settled.status === 'done') {
      return settled.text;
    }

    onEvent({
      type: 'progress',
      elapsedMs: Date.now() - analysisStarted,
      totalChars: text.length,
      mode: 'stream',
    });
  }

  return streamPromise;
}

export async function streamAnalyzeVideoWithGemini(
  options: {
    videoPath: string;
    videoUrl: string;
    nle: NleSoftware;
  },
  onEvent: (event: GeminiAnalysisEvent) => void
): Promise<VideoBreakdownRecord> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Add it to .env.local');

  const preferred = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelCandidates = Array.from(
    new Set([
      preferred,
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
    ])
  );

  const ai = new GoogleGenAI({ apiKey });
  const uploaded = await ai.files.upload({
    file: options.videoPath,
    config: { mimeType: 'video/mp4' },
  });

  if (!uploaded.name) throw new Error('File upload did not return a file name.');

  const active = await waitForFileActive(ai, uploaded.name);
  if (!active.uri || !active.mimeType) {
    throw new Error('Uploaded file is missing uri/mimeType after processing.');
  }

  onEvent({ type: 'file_ready' });

  const analysisStarted = Date.now();
  let text = '';
  let streamedChars = 0;
  let lastError: unknown;

  const heartbeat = setInterval(() => {
    onEvent({
      type: 'progress',
      elapsedMs: Date.now() - analysisStarted,
      totalChars: streamedChars,
      mode: streamedChars > 0 ? 'stream' : 'stream',
    });
  }, HEARTBEAT_INTERVAL_MS);

  const relayEvent = (ev: GeminiAnalysisEvent) => {
    if (ev.type === 'token') streamedChars = ev.totalChars;
    onEvent(ev);
  };

  try {
    for (const model of modelCandidates) {
      try {
        const args: GenerateArgs = {
          model,
          contents: createUserContent([
            createPartFromUri(active.uri, active.mimeType),
            buildPrompt(options.nle),
          ]),
          config: { temperature: 0.2, maxOutputTokens: 16384 },
        };

        text = await tryStreamThenBatch(ai, args, relayEvent, analysisStarted);
        if (text) break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (/404|NOT_FOUND|no longer available|not found/i.test(msg)) continue;
        throw publicEngineError(err);
      }
    }

    if (!text) throw publicEngineError(lastError ?? new Error('Empty analysis.'));
  } catch (err) {
    throw publicEngineError(err);
  } finally {
    clearInterval(heartbeat);
    try {
      await ai.files.delete({ name: uploaded.name });
    } catch {
      /* ignore */
    }
  }

  const mapped = mapGeminiAnalysisToBreakdown(text, options.videoUrl, options.nle);
  const breakdown = await withLibrary(mapped, options.nle);
  onEvent({ type: 'complete', breakdown });
  return breakdown;
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && process.env.FORCE_MOCK_ANALYSIS !== '1';
}

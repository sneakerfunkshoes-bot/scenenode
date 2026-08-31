import type { BreakdownEffect, EffectKind } from '@/types/breakdown';
import { hashString } from '@/lib/url-hash';
import { fxParamsForEffect } from '@/lib/fx-params';
import { formatTimestamp } from '@/lib/utils';

export interface TimelineEffectView {
  id: string;
  time: number;
  timestamp: string;
  title: string;
  category: string;
  explanation: string;
  parameters: { label: string; value: string }[];
}

const CATEGORY: Record<EffectKind, string> = {
  Transition: 'Transition',
  Flash: 'Lighting FX',
  SFX: 'Motion FX',
  CC: 'Color Grade',
  Rotation: 'Transform',
  MotionBlur: 'Motion Blur',
  Stutter: 'Stutter Cuts',
  Overlay: 'Text Overlay',
};

const TITLE_TEMPLATES: Record<EffectKind, string[]> = {
  Transition: [
    'Cinematic Black Fade / Iris Shut',
    'Whip Pan Velocity Ramp',
    'Beat-Sync Hard Cut Burst',
  ],
  Flash: [
    'Whip Blur + White Flash Exposure',
    'White Impact Frame Spike',
    'Lens Flare Beat Flash',
  ],
  SFX: [
    'Camera Shake (Impact Micro-Jitter)',
    'Fast Zoom Motion Blur',
    'Velocity Ramp Speed Burst',
  ],
  CC: [
    'Quality CC (HDR Sharpen + Contrast)',
    'High-Contrast Curve Grade',
    'HDR Sharpen Pass',
  ],
  Rotation: [
    '360° Z-Axis Rotation Roll',
    '90° Snap Roll',
    'Barrel Roll + Directional Blur',
  ],
  MotionBlur: [
    'Directional Blur Pass',
    'Radial Zoom Blur',
    'Gaussian Speed Smear',
  ],
  Stutter: [
    '2-Frame Flavor Image Swap',
    'Rapid Multi-Image Stutter',
    'Hold-Frame Stutter Cut',
  ],
  Overlay: [
    'Dynamic Text Glow',
    'Sound Barrier Text Overlay',
    'Slow Zoom Title Hold',
  ],
};

function isColorGrade(effect: BreakdownEffect): boolean {
  return (
    effect.type === 'CC' ||
    /cc:|color grade|teal|orange|lut|gamma|lift|hdr sharpen/i.test(effect.description)
  );
}

export function toTimelineEffectView(effect: BreakdownEffect): TimelineEffectView {
  const seed = parseInt(hashString(effect.id), 36);
  const color = isColorGrade(effect);
  const category = color ? 'Color Grade' : CATEGORY[effect.type];

  const baseDesc = effect.description.replace(/\s*·\s*CC:.*$/i, '').trim();
  const templates = TITLE_TEMPLATES[effect.type] ?? TITLE_TEMPLATES.Transition;
  const title = color
    ? baseDesc.length > 10
      ? baseDesc
      : 'Quality CC (HDR Sharpen + Contrast)'
    : baseDesc.length > 12 && baseDesc.length < 72
      ? baseDesc
      : templates[seed % templates.length]!;

  let explanation = effect.description;
  if (color) {
    explanation =
      'HDR sharpen and high-contrast CC — crushed blacks, lifted highlights, midtone punch on this range only.';
  } else if (effect.type === 'Rotation') {
    explanation =
      'Z-axis roll (often 360°) with a directional blur pass hiding the midpoint of the spin.';
  } else if (effect.type === 'MotionBlur') {
    explanation =
      'Directional, gaussian, or radial blur selling speed — note the blur angle and length.';
  } else if (effect.type === 'Stutter') {
    explanation =
      '2–4 frame still swap in a rapid flavor sequence. Each still is its own cut, not one grouped montage.';
  } else if (effect.type === 'Overlay') {
    explanation =
      'On-screen text or graphic hold — glow, scale, and tracking stay locked for the full timestamp range.';
  } else if (effect.type === 'Flash') {
    explanation =
      'A short brightness flash timed to the beat to emphasize energy without blowing out highlights.';
  } else if (effect.type === 'SFX') {
    explanation =
      'Micro motion applied on the downbeat for punch — position shake with optional motion blur.';
  } else {
    explanation =
      'Transition burst using directional blur and scale to bridge shots on the beat.';
  }

  const parameters = color
    ? [
        { label: 'Shadow Tint', value: 'Cyan (#001A24)' },
        { label: 'Highlight Tint', value: 'Warm Gold (#FFE0B2)' },
        { label: 'Skin Protection', value: 'Enabled (Midtones Isolated)' },
      ]
    : fxParamsForEffect(effect).map((p) => ({
        label: p.label,
        value: `${p.value}${p.unit}`,
      }));

  return {
    id: effect.id,
    time: effect.timestamp,
    timestamp: formatTimestamp(effect.timestamp),
    title,
    category,
    explanation,
    parameters,
  };
}

export function nearestEffectId(
  effects: TimelineEffectView[],
  time: number,
  windowSec = 1
): string | null {
  const match = effects.find((fx) => Math.abs(fx.time - time) < windowSec);
  return match?.id ?? null;
}

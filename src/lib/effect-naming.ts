import type { BreakdownEffect, EffectKind } from '@/types/breakdown';

/** Marker appended when a long hold is split into its beat segments. */
const SEGMENT_SUFFIX = /\s*[—–-]\s*beat segment (\d+)\/(\d+)\s*$/i;
const CC_SUFFIX = /\s*·\s*CC:.*$/i;

/**
 * Bare labels like "Zoom" or "Cut" tell an editor nothing, so they get replaced
 * with the named effect/transition instead of being shown as-is.
 */
const GENERIC_LABEL =
  /^(a |the )?(quick |hard |fast |soft |simple |basic |slight |small |big |smooth |nice |cool )*(zoom(\s?in|\s?out)?|cut|cuts|jump\s?cut|pan|whip|flash|shake|spin|roll|rotation|rotate|glitch|blur|transition|fade|effect|effects|text|overlay|color|colour|grade|cc|speed(\s?ramp)?|slow\s?mo(tion)?|stutter|scale|sfx|sound|beat|edit|clip|scene)(\s(effect|transition|cut|change|shift))?[.!]?$/i;

const NAMED_BY_KEYWORD: Array<[RegExp, string]> = [
  [/whip\s?pan|whip/i, 'Whip Pan Transition (Directional Blur 90°)'],
  [/zoom\s?blur|blur\s?zoom/i, 'Zoom Blur Transition (Radial Push)'],
  [/punch\s?in|zoom\s?in|push\s?in/i, 'Punch-In Zoom (Scale 100% → 115%)'],
  [/zoom\s?out|pull\s?back|pull\s?out/i, 'Pull-Back Zoom (Scale 115% → 100%)'],
  [/rgb|chromatic|split/i, 'RGB Split Glitch Cut'],
  [/glitch|crt|vhs|tv\s?signal|analog/i, 'CRT Glitch Transition (TV Signal Tear)'],
  [/dip\s?to\s?black|fade\s?to\s?black|black\s?screen|iris/i, 'Dip to Black (Luma Fade Out)'],
  [/fade\s?in|dissolve|cross\s?fade/i, 'Cross Dissolve (Luma Fade In)'],
  [/film\s?burn|light\s?leak|burn/i, 'Film Burn Transition (Light Leak Wipe)'],
  [/freeze/i, 'Freeze Frame Hold (Frame Hold + Punch)'],
  [/speed\s?ramp|time\s?remap|ramp/i, 'Speed Ramp Cut (Time Remap Ease)'],
  [/slow\s?mo|slow\s?motion/i, 'Slow-Motion Retime (Optical Flow)'],
  [/match\s?cut|match/i, 'Match Cut on Action'],
  [/shake|jitter|handheld/i, 'Impact Camera Shake (Handheld Jitter)'],
  [/barrel|360|roll|spin|rotat/i, 'Z-Axis Barrel Roll (360° Spin)'],
  [/directional\s?blur|motion\s?blur/i, 'Directional Motion Blur Whip'],
  [/radial\s?blur/i, 'Radial Blur Pulse'],
  [/gaussian/i, 'Gaussian Blur Bloom'],
  [/stutter|frame\s?swap|multi\s?image/i, 'Multi-Image Stutter (2-Frame Swaps)'],
  [/strobe|flicker/i, 'Strobe Flicker Cut (Alternating Frames)'],
  [/flash|exposure/i, 'Flash Frame Cut (1-Frame Exposure Burst)'],
  [/sticker|emoji|png/i, 'Motion Sticker Overlay + Impact Shake'],
  [/caption|subtitle|typograph|kinetic|text/i, 'Kinetic Text Pop (Outer Glow)'],
  [/teal|orange|lut|grade|grading|hdr|contrast|saturat/i, 'Teal & Orange Grade Shift (HDR Sharpen)'],
  [/shockwave|impact|hit/i, 'Impact Shockwave Pop (Scale + Blur)'],
  [/mask|reveal|wipe/i, 'Masked Wipe Reveal'],
  // Direction-less leftovers: still name the technique rather than the category.
  [/zoom|scale|punch/i, 'Zoom Punch (Scale Ramp 100% → 112%)'],
  [/\bpan\b|dolly|track/i, 'Camera Pan Transition (Directional Blur)'],
  [/fade|dip/i, 'Cross Dissolve (Luma Fade)'],
  [/bass|kick|snare|beat|transient/i, 'Beat-Synced Hit (Scale Pop on Kick)'],
];

const NAMED_BY_TYPE: Record<EffectKind, string> = {
  Transition: 'Hard Cut on Beat (Match Frame)',
  Flash: 'Flash Frame Cut (1-Frame Exposure Burst)',
  SFX: 'Impact Camera Shake (Handheld Jitter)',
  CC: 'Teal & Orange Grade Shift (HDR Sharpen)',
  Rotation: 'Z-Axis Barrel Roll (360° Spin)',
  MotionBlur: 'Directional Motion Blur Whip',
  Stutter: 'Multi-Image Stutter (2-Frame Swaps)',
  Overlay: 'Kinetic Text Pop (Outer Glow)',
};

function cleanLabel(raw: string): string {
  return raw.replace(CC_SUFFIX, '').replace(SEGMENT_SUFFIX, '').trim();
}

export function isGenericEffectName(raw: string): boolean {
  const label = cleanLabel(raw);
  if (!label) return true;
  if (GENERIC_LABEL.test(label)) return true;
  return label.replace(/[^a-z]/gi, '').length < 8;
}

type NameableEffect = Pick<BreakdownEffect, 'type' | 'description'> &
  Partial<Pick<BreakdownEffect, 'name' | 'overlayElements' | 'sceneContext'>>;

/**
 * Always returns a concrete effect/transition name — the model's own label when
 * it is specific enough, otherwise the named effect its keywords point to.
 */
export function resolveEffectName(effect: NameableEffect): string {
  const label = cleanLabel(effect.name || effect.description || '');
  const segment = SEGMENT_SUFFIX.exec(effect.description ?? '');
  const suffix = segment ? ` · Beat ${segment[1]}/${segment[2]}` : '';

  if (label && !isGenericEffectName(label) && label.length <= 72) {
    return `${label}${suffix}`;
  }

  const haystack = [
    label,
    effect.description ?? '',
    effect.overlayElements ?? '',
    effect.sceneContext ?? '',
  ].join(' ');

  const matched = NAMED_BY_KEYWORD.find(([pattern]) => pattern.test(haystack));
  const named = matched ? matched[1] : NAMED_BY_TYPE[effect.type];
  return `${named}${suffix}`;
}

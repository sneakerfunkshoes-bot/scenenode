import type { BreakdownEffect, EffectKind } from '@/types/breakdown';
import { hashString } from '@/lib/url-hash';

export interface FxParam {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  value: number;
}

const PRESETS: Record<EffectKind, Omit<FxParam, 'id' | 'value'>[]> = {
  Transition: [
    { label: 'Blur Length', min: 0, max: 40, step: 1, unit: 'px' },
    { label: 'Angle', min: 0, max: 360, step: 1, unit: '°' },
    { label: 'Feather', min: 0, max: 100, step: 1, unit: '%' },
  ],
  Flash: [
    { label: 'Flash Opacity', min: 0, max: 100, step: 1, unit: '%' },
    { label: 'Duration', min: 1, max: 12, step: 1, unit: 'fr' },
    { label: 'Glow Intensity', min: 0, max: 3, step: 0.1, unit: '' },
  ],
  SFX: [
    { label: 'Zoom Scale', min: 1, max: 2, step: 0.05, unit: 'x' },
    { label: 'Motion Blur', min: 0, max: 360, step: 5, unit: '°' },
    { label: 'Shake Amp', min: 0, max: 50, step: 1, unit: 'px' },
  ],
  CC: [
    { label: 'Contrast', min: 0, max: 80, step: 1, unit: '' },
    { label: 'HDR Sharpen', min: 0, max: 40, step: 1, unit: '' },
    { label: 'Black Crush', min: 0, max: 30, step: 1, unit: '' },
  ],
  Rotation: [
    { label: 'Z Rotation', min: 0, max: 360, step: 1, unit: '°' },
    { label: 'Blur at 180°', min: 0, max: 40, step: 1, unit: 'px' },
    { label: 'Duration', min: 4, max: 90, step: 1, unit: 'fr' },
  ],
  MotionBlur: [
    { label: 'Blur Length', min: 0, max: 50, step: 1, unit: 'px' },
    { label: 'Angle', min: 0, max: 360, step: 1, unit: '°' },
    { label: 'Samples', min: 4, max: 32, step: 1, unit: '' },
  ],
  Stutter: [
    { label: 'Hold Frames', min: 1, max: 4, step: 1, unit: 'fr' },
    { label: 'Still Count', min: 2, max: 8, step: 1, unit: '' },
    { label: 'Cut Offset', min: 0, max: 6, step: 1, unit: 'fr' },
  ],
  Overlay: [
    { label: 'Glow', min: 0, max: 100, step: 1, unit: '%' },
    { label: 'Scale', min: 80, max: 140, step: 1, unit: '%' },
    { label: 'Opacity', min: 40, max: 100, step: 1, unit: '%' },
  ],
};

export function fxParamsForEffect(effect: BreakdownEffect): FxParam[] {
  const seed = hashString(effect.id + effect.type);
  const base = PRESETS[effect.type] ?? PRESETS.Transition;
  return base.map((p, i) => {
    const t = ((seed.charCodeAt(i % seed.length) || 65) % 100) / 100;
    const value = p.min + t * (p.max - p.min);
    return {
      ...p,
      id: `${effect.id}-${i}`,
      value: Math.round(value / p.step) * p.step,
    };
  });
}

export function formatFxClipboard(params: FxParam[]): string {
  return params.map((p) => `${p.label}: ${p.value}${p.unit}`).join('\n');
}

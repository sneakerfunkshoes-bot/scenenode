import type {
  AudioTransientEvent,
  BreakdownEffect,
  CompositorLayer,
  EffectKind,
  EffectParameter,
  NleSoftware,
  TutorialStep,
} from '@/types/breakdown';
import { formatTimestamp } from '@/lib/utils';
import { resolveEffectName } from '@/lib/effect-naming';

export interface InspectorEffectView {
  id: string;
  time: number;
  timestamp: string;
  name: string;
  category: string;
  sceneContext: string;
  overlayElements: string;
  globalCC: string;
  audioSync: string;
  parameters: EffectParameter[];
  layerStack: CompositorLayer[];
  audioTransient?: AudioTransientEvent;
  software: NleSoftware;
  location: string;
  steps: string[];
}

const CATEGORY: Record<EffectKind, string> = {
  Transition: 'Cut & Transition',
  Flash: 'Cut & Flash',
  SFX: 'Sound & Motion',
  CC: 'Color Grade',
  Rotation: 'Spin & Rotate',
  MotionBlur: 'Motion Blur',
  Stutter: 'Fast Cuts',
  Overlay: 'Text & Visuals',
};

function effectVariant(
  effect: BreakdownEffect
): 'Glitch' | 'Color' | 'Text' | 'Sticker' | EffectKind {
  if (effect.type === 'CC') return 'Color';
  if (effect.type === 'Overlay') return 'Text';
  if (effect.type === 'Stutter') return 'Stutter';
  if (effect.type === 'Rotation') return 'Rotation';
  if (effect.type === 'MotionBlur') return 'MotionBlur';
  const text = `${effect.description} ${effect.overlayElements ?? ''}`.toLowerCase();
  if (/text|glow|subtitle|neon|typography|caption/.test(text)) return 'Text';
  if (/sticker|alien|emoji|png overlay|motion track/.test(text)) return 'Sticker';
  if (/rgb|glitch|chromatic|split|crt|tv|vhs/.test(text)) return 'Glitch';
  if (/color|grade|teal|orange|lut|gamma|lift|hdr|sharpen/.test(text)) return 'Color';
  return effect.type;
}

const LOCATIONS: Record<NleSoftware, Record<string, string>> = {
  CapCut: {
    Text: 'Text Tool > Text Effects > Luminous / Outer Glow',
    Glitch: 'Effects > Video Effects > Retro > TV Signal / CRT Distortion',
    Sticker: 'Stickers > Trending / Sci-Fi > Motion Sticker',
    Flash: 'Speed Menu > Curve > Custom / Adjustment Layer > Flash',
    SFX: 'Effects > Video Effects > Motion > Camera Shake',
    Transition: 'Speed Menu > Curve > Custom / Speed Ramping Graph',
    Color: 'Adjust > Color > Filters > Cinematic / HSL',
    CC: 'Adjust > Color > Contrast / Sharpen / Filters',
    Rotation: 'Canvas > Rotate keyframes (Z-axis 0–360)',
    MotionBlur: 'Effects > Video Effects > Blur > Motion / Directional Blur',
    Stutter: 'Split > 2-frame stills / Overlay photos on beat',
    Overlay: 'Text Tool > Text Effects > Luminous / Outer Glow',
  },
  'Premiere Pro': {
    Text: 'Graphics > Essential Graphics > Text with Glow / Outer Glow',
    Glitch: 'Effects Panel > Video Effects > Distortion > RGB Split / TV Signal',
    Sticker: 'Graphics > Import PNG / Motion Graphics Template',
    Flash: 'Effects Panel > Adjust > Exposure / Brightness & Contrast',
    SFX: 'Effects Panel > Distort > Transform / Camera Shake',
    Transition: 'Clip > Speed/Duration > Time Remapping / Speed Ramping Graph',
    Color: 'Lumetri Color > Creative / Color Wheels & Match',
    CC: 'Lumetri Color > Basic Correction + Creative Sharpen',
    Rotation: 'Effect Controls > Motion > Rotation (0–360 Z)',
    MotionBlur: 'Effects > Blur & Sharpen > Directional Blur / Gaussian Blur',
    Stutter: 'Razor + Frame Hold / stills at 2-frame duration',
    Overlay: 'Essential Graphics > Text + Outer Glow',
  },
  'After Effects': {
    Text: 'Layer > New > Text > Text Animators > Glow',
    Glitch: 'Effects & Presets > Channel > Shift Channels / TV Distortion',
    Sticker: 'Layer > Import > PNG Sequence / Motion Tracking',
    Flash: 'Layer > New > Adjustment Layer > Exposure / Brightness & Contrast',
    SFX: 'Effects & Presets > Distort > Transform / Wiggle Position',
    Transition: 'Layer > Time > Enable Time Remapping / Graph Editor',
    Color: 'Effects & Presets > Color Correction > Lumetri / Curves',
    CC: 'Lumetri + Unsharp Mask / Curves S-contrast',
    Rotation: 'Transform > Rotation 0x+0 → 1x+0 (360° Z-roll)',
    MotionBlur: 'CC Directional Blur / Gaussian Blur / CC Radial Fast Blur',
    Stutter: 'Time Remap hold keyframes / 2-frame still layers',
    Overlay: 'Text + Glow / Stroke; optional shockwave PNG',
  },
  'DaVinci Resolve': {
    Text: 'Edit Page > Titles > Text+ > Glow / Drop Shadow',
    Glitch: 'Fusion > Tools > Channel > Splitter / CRT Distortion',
    Sticker: 'Edit Page > Fusion > Import PNG / Tracker',
    Flash: 'Edit Page > OpenFX > ResolveFX Light > Glow / Exposure',
    SFX: 'Edit Page > OpenFX > ResolveFX Motion > Camera Shake',
    Transition: 'Edit Page > Inspector > Retime Controls > Speed Ramp',
    Color: 'Color Page > Primaries / Qualifier > Hue vs Sat',
    CC: 'Color Page > Primaries + OpenFX Sharpen / Midtone Detail',
    Rotation: 'Inspector > Rotation 0–360 (anchor centered)',
    MotionBlur: 'Fusion > Directional Blur / Gaussian Blur / Radial Blur',
    Stutter: 'Blade 2-frame stills / Retime freeze on the grid',
    Overlay: 'Titles > Text+ Glow; Fusion tracker if needed',
  },
  'VN Editor': {
    Text: 'Text > Style > Glow / Neon Preset',
    Glitch: 'Effects > Distortion > RGB Split / TV Glitch',
    Sticker: 'Sticker > Import PNG / Motion Track',
    Flash: 'Effects > Light > Flash / Brightness',
    SFX: 'Effects > Motion > Shake / Zoom',
    Transition: 'Speed > Curve > Custom Ramp',
    Color: 'Adjust > Color > Filter / HSL',
    CC: 'Adjust > Contrast / Sharpen / Filter',
    Rotation: 'Transform > Rotate 0–360',
    MotionBlur: 'Effects > Blur > Motion / Directional',
    Stutter: 'Split 2-frame stills / overlay photos',
    Overlay: 'Text > Glow / Neon overlay',
  },
};

function formatSteps(steps: TutorialStep[]): string[] {
  return steps.map((step) => {
    const detail = step.detail.trim();
    const title = step.title.trim();
    if (!title) return detail;
    if (detail.length > title.length + 8) return detail;
    if (detail.toLowerCase().startsWith(title.toLowerCase())) return detail;
    return `${title}: ${detail}`;
  });
}

function effectName(effect: BreakdownEffect): string {
  return resolveEffectName(effect);
}

function effectCategory(effect: BreakdownEffect): string {
  const variant = effectVariant(effect);
  if (variant === 'Text') return 'Text & Visuals';
  if (variant === 'Sticker') return 'Motion & Stickers';
  if (variant === 'Glitch') return 'Transition';
  if (variant === 'Color') return 'Color Grade';
  if (variant === 'Flash') return 'Speed & Lighting';
  if (variant === 'Rotation') return 'Transform';
  if (variant === 'MotionBlur') return 'Motion Blur';
  if (variant === 'Stutter') return 'Multi-Image Stutter';
  if (variant === 'Overlay') return 'Text & Overlays';
  if (variant === 'CC') return 'Color Grade';
  return CATEGORY[effect.type];
}

function formatEffectTimestamp(
  effect: BreakdownEffect,
  index: number,
  allEffects: BreakdownEffect[]
): string {
  const start = formatTimestamp(effect.timestamp);
  const end =
    effect.timestampEnd ??
    (index + 1 < allEffects.length &&
    allEffects[index + 1]!.timestamp - effect.timestamp > 0.05 &&
    allEffects[index + 1]!.timestamp - effect.timestamp < 8
      ? allEffects[index + 1]!.timestamp
      : undefined);

  if (end != null && end > effect.timestamp + 0.02) {
    return `${start} – ${formatTimestamp(end)}`;
  }
  return start;
}

function inferSceneContext(effect: BreakdownEffect): string {
  if (effect.sceneContext?.trim()) return effect.sceneContext.trim();

  const variant = effectVariant(effect);
  const at = formatTimestamp(effect.timestamp);

  if (variant === 'Text') {
    return `On-screen glowing text or subtitles appear and stay visible through ${at}, synced to speech or the beat drop.`;
  }
  if (variant === 'Glitch') {
    return `A TV-style glitch or RGB split breaks the current scene at ${at}, snapping into the next edit segment on the downbeat.`;
  }
  if (variant === 'Sticker') {
    return `An animated sticker or PNG overlay pops onto the subject at ${at}, combined with micro camera shake on the bass hit.`;
  }
  if (variant === 'Flash') {
    return `A bright white flash or exposure burst hits at ${at} to emphasize the beat, often paired with a speed ramp or impact cut.`;
  }
  if (variant === 'Color') {
    return `Color grade shift — HDR sharpen, high-contrast curves, and CC hold through ${at}.`;
  }
  if (variant === 'Rotation') {
    return `Z-axis rotation / barrel roll at ${at}, usually with a directional blur pass hiding the midpoint.`;
  }
  if (variant === 'MotionBlur') {
    return `Motion blur pass at ${at} (directional, gaussian, or radial) selling speed or a whip.`;
  }
  if (variant === 'Stutter') {
    return `2–4 frame still swap at ${at} — a rapid multi-image stutter, not a dissolve.`;
  }
  if (effect.type === 'Transition') {
    return `Hard cut or whip transition at ${at} bridges two shots; motion blur or scale pop sells the scene change.`;
  }
  return `Visual edit moment at ${at}: ${effect.description.replace(/\s*·\s*CC:.*$/i, '').trim()}.`;
}

function inferOverlayElements(effect: BreakdownEffect): string {
  if (effect.overlayElements?.trim()) return effect.overlayElements.trim();

  const variant = effectVariant(effect);
  const desc = effect.description.toLowerCase();

  if (variant === 'Text') return 'Neon Text Glow, Subtitle Preset, Outer Glow FX';
  if (variant === 'Glitch') return 'TV CRT Scanlines, Analog Noise PNG Overlay, RGB Split';
  if (variant === 'Sticker') return 'Animated Motion Sticker, Camera Shake FX, Lens Flare Dot';
  if (variant === 'Flash') return 'White Exposure Layer, Motion Blur Streaks';
  if (variant === 'Color') return 'HDR Sharpen, High-Contrast Curve, LUT';
  if (variant === 'Rotation') return 'Z-Rotation 0–360°, Directional Blur 90°';
  if (variant === 'MotionBlur') return 'Directional / Gaussian / Radial Blur';
  if (variant === 'Stutter') return '2-frame stills, Hard cuts, Flavor plates';
  if (/whoosh|reverse|bass|sfx|audio/.test(desc)) return 'SFX Layer, Reverse Whoosh, Bass Hit Sample';
  if (effect.type === 'Transition') return 'Directional Motion Blur, Speed Ramp Curve';
  if (effect.type === 'SFX') return 'Camera Shake FX, Motion Blur, Impact Micro-Jitter';
  return 'Adjustment Layer, Beat-Synced FX';
}

function inferGlobalCC(effect: BreakdownEffect): string {
  if (effect.globalCC?.trim()) return effect.globalCC.trim();

  const variant = effectVariant(effect);
  const desc = effect.description.toLowerCase();

  if (variant === 'Color' || effect.type === 'CC') {
    return 'Teal & Orange LUT — Shadows: Cyan #002B36, Highlights: Soft Gold #FFB86C. Lift shadows +8%, drop midtones -5% for cinematic contrast.';
  }
  if (variant === 'Flash') {
    return 'CC maintained + Contrast Boost +12% during flash frame. Exposure spike +100 on 1-frame adjustment layer.';
  }
  if (variant === 'Rotation' || variant === 'MotionBlur') {
    return 'Slight vignette around edges (-15% exposure outer ring). Motion blur masks rotation midpoint.';
  }
  if (/teal|orange|lut|grade|contrast|hdr/.test(desc)) {
    return 'Global grade holds through this moment — high-contrast curves, sharpen +10, split-tone teal shadows.';
  }
  return 'Base cinematic grade active — cool shadows, warm highlights, contrast +8% across full timeline.';
}

function inferAudioSync(effect: BreakdownEffect, bpm: number): string {
  if (effect.audioSync?.trim()) return effect.audioSync.trim();

  const at = formatTimestamp(effect.timestamp);
  const variant = effectVariant(effect);
  const beatMs = Math.round((60 / Math.max(bpm, 60)) * 1000);
  const sixteenth = Math.round(beatMs / 4);

  if (variant === 'Text' || effect.type === 'Overlay') {
    return `Text scale pops from 100% to 108% on ${bpm} BPM kick at ${at}. Keyframe window ~${sixteenth}ms (16th-note transient).`;
  }
  if (variant === 'Flash' || effect.type === 'Transition') {
    return `Cut lands exactly on snare/kick at ${at}. Whip or flash peaks on beat — align razor cut to waveform peak (±${Math.max(1, Math.round(sixteenth / 10))} frames).`;
  }
  if (variant === 'Stutter') {
    return `Stutter keyframes matched to 16th-note vocal chops at ${bpm} BPM. Opacity hits: 100% → 0% → 100% every ~${sixteenth}ms.`;
  }
  if (variant === 'Rotation' || variant === 'MotionBlur') {
    return `Speed ramp reaches peak velocity on downbeat at ${at}. Audio pitch dips slightly if time-stretch enabled during slow-mo.`;
  }
  if (effect.type === 'SFX') {
    return `Camera shake intensity peaks on bass transient at ${at}. Layer whoosh/reverse SFX 2–4 frames before the hit.`;
  }
  return `FX keyed to ${bpm} BPM grid at ${at}. Snap keyframes to nearest beat marker (grid: ${beatMs}ms per beat).`;
}

function inferParameters(effect: BreakdownEffect, variant: string): EffectParameter[] {
  if (effect.parameters?.length) return effect.parameters;

  if (variant === 'Text' || effect.type === 'Overlay') {
    return [
      {
        plugin: 'Sapphire S_Glow',
        values: { Threshold: 0.55, Brightness: 1.8, Radius: 45 },
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
      },
      {
        plugin: 'Text Scale',
        values: { Start: '100%', Peak: '108%', Duration: '200ms' },
      },
    ];
  }
  if (variant === 'Flash' || effect.type === 'Transition') {
    return [
      {
        plugin: 'Directional Blur',
        values: { Angle: 90, Length: 60 },
      },
      {
        plugin: 'Exposure Flash',
        values: { Brightness: 100, Frames: 1, Blend: 'Screen' },
      },
    ];
  }
  if (variant === 'Color' || effect.type === 'CC') {
    return [
      {
        plugin: 'Lumetri / Curves',
        values: { Contrast: 15, Saturation: 10, Shadows: '#002B36', Highlights: '#FFB86C' },
      },
    ];
  }
  return [
    {
      plugin: 'SceneCraft FX',
      values: { Intensity: 1, Blend: 'Normal' },
    },
  ];
}

function inferLayerStack(effect: BreakdownEffect, variant: string): CompositorLayer[] {
  if (effect.layerStack?.length) return effect.layerStack;

  const layers: CompositorLayer[] = [
    {
      order: 1,
      name: 'Base Footage',
      blendMode: 'Normal',
      description: 'Original video track',
    },
  ];

  if (variant === 'Color' || effect.type === 'CC') {
    layers.push({
      order: 2,
      name: 'Color Correction Adjustment',
      blendMode: 'Normal',
      description: 'Teal/Orange LUT + Contrast +15',
    });
  }
  if (/blur|whip|motion/.test(variant) || effect.type === 'MotionBlur' || effect.type === 'Transition') {
    layers.push({
      order: 3,
      name: 'Optical Flow / Motion Blur',
      blendMode: 'Normal',
      description: 'Whip pan + directional blur pass',
    });
  }
  if (variant === 'Text' || effect.type === 'Overlay') {
    layers.push({
      order: 4,
      name: 'Glowing Text Overlay',
      blendMode: 'Screen',
      description: effect.overlayElements ?? 'Typography + outer glow',
    });
  }

  return layers.sort((a, b) => b.order - a.order);
}

function inferEffectAudioTransient(
  effect: BreakdownEffect,
  bpm: number
): AudioTransientEvent | undefined {
  if (effect.audioTransient) return effect.audioTransient;
  const at = effect.timestamp;
  const variant = effectVariant(effect);

  if (variant === 'Text' || effect.type === 'Overlay') {
    return {
      time: at,
      frequencyHz: 60,
      trigger: 'Kick drum sub-bass spike (~60Hz)',
      visualResponse: 'Text scale pop 100% → 108%',
    };
  }
  if (variant === 'Flash') {
    return {
      time: at,
      frequencyHz: 8000,
      trigger: 'Snare / hi-hat transient',
      visualResponse: '1-frame brightness flash + cut',
    };
  }
  return {
    time: at,
    frequencyHz: Math.round(bpm),
    trigger: `${bpm} BPM beat grid`,
    visualResponse: effect.description.slice(0, 80),
  };
}

function defaultMicroSteps(
  effect: BreakdownEffect,
  nle: NleSoftware,
  location: string,
  bpm: number
): string[] {
  const at = formatTimestamp(effect.timestamp);
  const variant = effectVariant(effect);
  const name = effectName(effect);

  if (variant === 'Text' || effect.type === 'Overlay') {
    return [
      `Scrub to ${at} and add a bold text layer (Inter / Plus Jakarta Sans).`,
      'Apply Drop Shadow + Outer Glow: Radius 45px, Intensity 80%, Color Neon Cyan (#38BDF8).',
      `Keyframe Scale 100% → 108% → 100% over ~${Math.round(60 / bpm * 250)}ms on the kick (Easy Ease).`,
      'Set Glow Threshold to 55–60% so only letter edges illuminate.',
    ];
  }
  if (variant === 'Flash' || effect.type === 'Transition') {
    return [
      `Cut video track on the beat at ${at}.`,
      'Add Directional Blur to outgoing clip — Angle 90°, Blur Length 60px.',
      'Place 1-frame adjustment layer with Brightness +100 for light flash (Blend: Screen).',
      'Apply exponential fade on incoming audio for seamless blend.',
    ];
  }
  if (variant === 'Color' || effect.type === 'CC') {
    return [
      'Apply primary adjustment layer: Lift shadows +8%, drop midtones -5%.',
      'Load Teal & Orange LUT — Shadows #002B36, Highlights #FFB86C.',
      `Hold grade from ${at} through next beat marker.`,
      'Boost saturation +10 on water/sky tones; sharpen detail +12.',
    ];
  }
  if (variant === 'Stutter') {
    return [
      `Duplicate layer at ${at}. Set top layer Blend Mode to Screen.`,
      'Add Chromatic Aberration — Red/Blue displacement 4px.',
      'Keyframe Opacity on 16th notes: 100% → 0% → 100% → 50%.',
      'Increase glow threshold to 55% for edge-only illumination.',
    ];
  }
  return [
    `Open ${nle} and navigate to ${location}.`,
    `Scrub to ${at} on the timeline.`,
    `Apply ${name} at the beat marker (${bpm} BPM grid).`,
    'Preview and nudge keyframes ±2 frames until the hit aligns with the downbeat.',
  ];
}

export function toInspectorEffectView(
  effect: BreakdownEffect,
  nle: NleSoftware,
  index: number,
  allEffects: BreakdownEffect[],
  bpm = 128
): InspectorEffectView {
  const variant = effectVariant(effect);
  const tutorials = effect.tutorials[nle] ?? [];
  const location =
    LOCATIONS[nle][variant] ??
    LOCATIONS[nle][effect.type] ??
    `Effects library > ${effectCategory(effect)}`;

  return {
    id: effect.id,
    time: effect.timestamp,
    timestamp: formatEffectTimestamp(effect, index, allEffects),
    name: effectName(effect),
    category: effectCategory(effect),
    sceneContext: inferSceneContext(effect),
    overlayElements: inferOverlayElements(effect),
    globalCC: inferGlobalCC(effect),
    audioSync: inferAudioSync(effect, bpm),
    parameters: inferParameters(effect, variant),
    layerStack: inferLayerStack(effect, variant),
    audioTransient: inferEffectAudioTransient(effect, bpm),
    software: nle,
    location,
    steps:
      tutorials.length > 0
        ? formatSteps(tutorials)
        : defaultMicroSteps(effect, nle, location, bpm),
  };
}

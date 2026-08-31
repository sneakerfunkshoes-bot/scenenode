import type { NleSoftware } from '@/types/breakdown';
import type { SoftwareRecipe } from './types';

const NLES: NleSoftware[] = [
  'After Effects',
  'Premiere Pro',
  'CapCut',
  'DaVinci Resolve',
  'VN Editor',
];

export function nleRecipes(spec: {
  ae: { name: string; steps: string[]; map?: Record<string, string> };
  premiere: { name: string; steps: string[]; map?: Record<string, string> };
  capcut: { name: string; steps: string[]; map?: Record<string, string> };
  davinci: { name: string; steps: string[]; map?: Record<string, string> };
  vn: { name: string; steps: string[]; map?: Record<string, string> };
}): SoftwareRecipe[] {
  const byNle: Record<NleSoftware, typeof spec.ae> = {
    'After Effects': spec.ae,
    'Premiere Pro': spec.premiere,
    CapCut: spec.capcut,
    'DaVinci Resolve': spec.davinci,
    'VN Editor': spec.vn,
  };
  return NLES.map((software) => {
    const row = byNle[software];
    return {
      software,
      exactEffectName: row.name,
      steps: row.steps,
      parameterMapping: row.map ?? {},
    };
  });
}

export function transformRecipes(aeName: string, premiere: string, resolve: string): SoftwareRecipe[] {
  return nleRecipes({
    ae: {
      name: aeName,
      steps: [
        `Select the layer and open Transform`,
        `Keyframe ${aeName}`,
        'Enable Motion Blur if the move is fast',
      ],
    },
    premiere: {
      name: premiere,
      steps: [
        `Effect Controls > Motion > ${premiere}`,
        'Add keyframes at in and out',
        'Ease the last keyframe',
      ],
    },
    capcut: {
      name: 'Keyframes + Scale / Rotate',
      steps: [
        'Select the clip and tap Keyframe',
        'Set Scale, Position, and Rotation at start and end',
        'Turn on Motion Blur',
      ],
    },
    davinci: {
      name: resolve,
      steps: [
        `Inspector > Transform > ${resolve}`,
        'Keyframe zoom / position / angle',
        'Enable motion blur on the clip',
      ],
    },
    vn: {
      name: 'Keyframes > Scale + Rotation',
      steps: [
        'Add keyframes on Scale and Rotation',
        'Match the end pose to the reference',
        'Enable blur if available',
      ],
    },
  });
}

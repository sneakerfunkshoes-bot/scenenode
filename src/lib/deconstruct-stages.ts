/** Processing steps shown inside the SceneNode workspace (UI labels only). */
export const DECONSTRUCT_PROCESS_STEPS = [
  'Loading source video',
  'Detecting scenes and key frames',
  'Mapping cuts and timing',
  'Analyzing color and tone',
  'Detecting effects and transitions',
  'Mapping beat markers and speed ramps',
  'Building recreation guide',
] as const;

export type DeconstructProcessStep = (typeof DECONSTRUCT_PROCESS_STEPS)[number];

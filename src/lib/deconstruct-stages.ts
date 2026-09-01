/** Processing steps shown inside the SceneNode workspace (UI labels only). */
export const DECONSTRUCT_PROCESS_STEPS = [
  'Video format verification',
  'Resolution optimization',
  'Shot detection & keyframing',
  'Scene segmentation',
  'Object classification',
  'Motion tracking analysis',
  'Facial recognition pass',
  'Metadata tag generation',
] as const;

export type DeconstructProcessStep = (typeof DECONSTRUCT_PROCESS_STEPS)[number];

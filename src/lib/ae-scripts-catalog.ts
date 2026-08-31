export const AE_SCRIPTS = [
  {
    fileName: 'SceneNodeAutoEdit.jsxbin',
    title: 'SceneNodeAutoEdit.jsxbin',
    description: 'Automatic timeline cutting & pacing',
  },
  {
    fileName: 'SceneNodeBeatMark.jsxbin',
    title: 'SceneNodeBeatMark.jsxbin',
    description: 'Instant audio transient marker sync',
  },
  {
    fileName: 'SceneNodeVault.jsxbin',
    title: 'SceneNodeVault.jsxbin',
    description: '1-click preset library storage',
  },
] as const;

export const AE_BUNDLE_FILE = 'SceneNode_AE_Scripts.zip';

export const ALLOWED_SCRIPT_FILES = new Set<string>([
  AE_BUNDLE_FILE,
  ...AE_SCRIPTS.map((s) => s.fileName),
]);

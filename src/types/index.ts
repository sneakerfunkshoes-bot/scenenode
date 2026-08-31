export type SoftwareTool =
  | 'DaVinci Resolve'
  | 'Premiere Pro'
  | 'After Effects'
  | 'CapCut'
  | 'VN Editor';

export type EffectType = 'SFX' | 'Cut' | 'Flash' | 'Transition';

export type BreakdownTab = 'sfx' | 'transitions' | 'flash' | 'color';

export interface EffectMarker {
  id: string;
  type: EffectType;
  label: string;
  timestamp: number;
  duration?: number;
}

export interface BeatMarker {
  id: string;
  time: number;
  intensity: number;
  kind?: 'beat' | 'drop' | 'cut';
}

export interface ColorGradeNote {
  id: string;
  timestamp: number;
  title: string;
  note: string;
}

export interface ProjectAsset {
  id: string;
  name: string;
  type: 'folder' | 'video' | 'audio' | 'image' | 'project' | 'log';
  children?: ProjectAsset[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SongInfo {
  title: string;
  artist: string;
  bpm: number;
  key?: string;
}

export interface BreakdownData {
  bpm: number;
  duration: number;
  song: SongInfo;
  beats: BeatMarker[];
  effects: EffectMarker[];
  colorNotes: ColorGradeNote[];
  previewLabel: string;
}

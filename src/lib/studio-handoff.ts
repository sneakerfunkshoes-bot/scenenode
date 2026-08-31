import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';

const KEY = 'scenecraft_studio_handoff_v1';

export interface StudioHandoff {
  url: string;
  nle: NleSoftware;
  breakdown: VideoBreakdownRecord;
}

export function setStudioHandoff(payload: StudioHandoff) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function takeStudioHandoff(): StudioHandoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as StudioHandoff;
  } catch {
    return null;
  }
}

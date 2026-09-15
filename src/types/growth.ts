import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';

/** Compact recipe that can reload an edit in SceneNode. */
export interface RemixPayload {
  code: string;
  createdAt: string;
  sourceUrl: string;
  nle: NleSoftware;
  songTitle?: string;
  songArtist?: string;
  bpm?: number;
  trackDuration?: number;
  beatTimestamps?: number[];
  /** Full breakdown so remix opens with zero re-analysis when available */
  breakdown: VideoBreakdownRecord;
  watermark?: {
    enabled: boolean;
    label: string;
  };
}

/** Canonical event posted to the Master Command Center (`POST /api/telemetry`). */
export interface TelemetryEvent {
  id?: string;
  project_name: string;
  event_type: string;
  timestamp: string;
  metrics?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

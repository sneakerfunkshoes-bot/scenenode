import type { VideoBreakdownRecord, NleSoftware } from '@/types/breakdown';

export type AnalyzeStreamEvent =
  | { type: 'stage'; worker: string; label: string; progress?: number }
  | { type: 'worker'; worker: string; label: string; progress: number; ms?: number }
  | { type: 'token'; totalChars: number; preview?: string }
  | { type: 'complete'; breakdown: VideoBreakdownRecord; source?: string; warning?: string }
  | { type: 'error'; error: string };

const TOTAL_STREAM_TIMEOUT_MS = 300_000;
const READ_IDLE_TIMEOUT_MS = 150_000;

function readWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number
) {
  return Promise.race([
    reader.read(),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('__read_idle__')), timeoutMs);
    }),
  ]);
}

export async function analyzeWithStream(
  link: string,
  nle: NleSoftware,
  onEvent: (event: AnalyzeStreamEvent) => void
): Promise<VideoBreakdownRecord> {
  const controller = new AbortController();
  const totalTimer = window.setTimeout(() => controller.abort(), TOTAL_STREAM_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch('/api/analyze-edit/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link, nle }),
      signal: controller.signal,
    });
  } catch (err) {
    window.clearTimeout(totalTimer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Analysis timed out. Please try again.');
    }
    throw err;
  }

  if (!res.ok || !res.body) {
    window.clearTimeout(totalTimer);
    let detail = 'Stream connection failed';
    try {
      const text = await res.text();
      if (text) detail = text.slice(0, 200);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let breakdown: VideoBreakdownRecord | null = null;

  try {
    while (true) {
      let done: boolean;
      let value: Uint8Array | undefined;
      try {
        ({ done, value } = await readWithTimeout(reader, READ_IDLE_TIMEOUT_MS));
      } catch (err) {
        if (err instanceof Error && err.message === '__read_idle__') {
          throw new Error('Analysis stalled. Please try again.');
        }
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Analysis timed out. Please try again.');
        }
        throw err;
      }

      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        if (!part.trim()) continue;
        if (part.trim().startsWith(':')) continue;

        const lines = part.split('\n');
        let eventType = 'message';
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventType = line.slice(6).trim();
          if (line.startsWith('data:')) dataLine = line.slice(5).trim();
        }
        if (!dataLine) continue;
        const payload = JSON.parse(dataLine) as Record<string, unknown>;

        if (eventType === 'error') {
          onEvent({ type: 'error', error: String(payload.error ?? 'Analysis failed') });
          throw new Error(String(payload.error ?? 'Analysis failed'));
        }

        if (eventType === 'complete') {
          breakdown = payload.breakdown as VideoBreakdownRecord;
          onEvent({
            type: 'complete',
            breakdown,
            source: payload.source as string | undefined,
            warning: payload.warning as string | undefined,
          });
        } else if (eventType === 'token') {
          onEvent({
            type: 'token',
            totalChars: Number(payload.totalChars ?? 0),
            preview: payload.preview as string | undefined,
          });
        } else if (eventType === 'worker') {
          onEvent({
            type: 'worker',
            worker: String(payload.worker ?? ''),
            label: String(payload.label ?? ''),
            progress: Number(payload.progress ?? 0),
            ms: payload.ms as number | undefined,
          });
        } else if (eventType === 'stage') {
          onEvent({
            type: 'stage',
            worker: String(payload.worker ?? ''),
            label: String(payload.label ?? ''),
            progress: payload.progress as number | undefined,
          });
        }
      }
    }
  } finally {
    window.clearTimeout(totalTimer);
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }

  if (!breakdown) throw new Error('Analysis stream ended without a breakdown');
  return breakdown;
}

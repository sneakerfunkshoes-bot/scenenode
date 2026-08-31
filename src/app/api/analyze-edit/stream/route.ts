import { NextResponse } from 'next/server';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';
import { NLE_LIST, createMockBreakdown } from '@/lib/breakdown-mock';
import { getEdgeCachedBreakdown, setEdgeCachedBreakdown } from '@/lib/breakdown-edge-cache';
import { runParallelAnalysisStages } from '@/lib/analysis-stages';
import {
  geminiConfigured,
  streamAnalyzeVideoWithGemini,
} from '@/lib/gemini-analyze';
import { enrichBreakdownWithLibrary } from '@/lib/effect-library/apply';
import { savePreviewVideo } from '@/lib/preview-video';
import {
  guardRateLimit,
  MAX_JSON_BODY_BYTES,
  rejectOversizedBody,
} from '@/lib/security/api-guard';
import {
  recordAnalysis,
  recordError,
  visitorIdFromRequest,
} from '@/lib/usage-stats';
import {
  cleanupDir,
  createTempWorkDir,
  downloadVideoFromUrl,
  isSupportedVideoUrl,
} from '@/lib/video-ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isNle(value: string): value is NleSoftware {
  return (NLE_LIST as string[]).includes(value);
}

async function mockBreakdown(link: string, nle: NleSoftware) {
  const record = createMockBreakdown(link, nle);
  try {
    return await enrichBreakdownWithLibrary(record, nle);
  } catch {
    return record;
  }
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function friendlyDownloadError(raw: string): string {
  if (/instagram/i.test(raw)) {
    return 'Could not download that Instagram clip (login/cookies may be required). Showing a demo breakdown instead.';
  }
  if (/tiktok/i.test(raw)) {
    return 'Could not download that TikTok clip. Showing a demo breakdown instead.';
  }
  if (/youtube|yt-dlp|ERROR:/i.test(raw)) {
    return 'Could not download that video. Showing a demo breakdown instead.';
  }
  return 'Live analysis failed. Showing a demo breakdown instead.';
}

export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'analyze-stream', 8, 60_000);
  if (limited) return limited;

  const oversized = rejectOversizedBody(req, MAX_JSON_BODY_BYTES);
  if (oversized) return oversized;

  const visitorId = visitorIdFromRequest(req);
  let workDir: string | null = null;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let link = '';
      let nle: NleSoftware = 'CapCut';

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseEncode(event, data)));
        } catch {
          closed = true;
        }
      };

      const pingInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          closed = true;
        }
      }, 12_000);

      const visionStageLabel = (
        elapsedMs: number,
        totalChars: number,
        mode: 'stream' | 'batch' = 'stream'
      ) => {
        const secs = Math.max(1, Math.round(elapsedMs / 1000));
        if (totalChars > 0) {
          return `Vision LLM ${mode === 'batch' ? 'deep analysis' : 'streaming'}… ${totalChars} chars (${secs}s)`;
        }
        if (mode === 'batch') {
          return `Vision LLM deep analysis… ${secs}s (no stream yet)`;
        }
        return `Vision LLM analyzing video… ${secs}s`;
      };

      const completeWith = (
        breakdown: VideoBreakdownRecord,
        source: string,
        warning?: string
      ) => {
        send('complete', { breakdown, source, warning });
      };

      try {
        const body = (await req.json()) as { link?: string; url?: string; nle?: string };
        link = String(body.link ?? body.url ?? '').trim();
        const nleRaw = String(body.nle ?? '').trim();
        nle = isNle(nleRaw) ? nleRaw : 'CapCut';

        if (!link) {
          send('error', { error: 'Paste a link first.' });
          close();
          return;
        }

        if (!isSupportedVideoUrl(link)) {
          send('error', {
            error: 'Use a TikTok, Instagram Reels, or YouTube Shorts URL.',
          });
          close();
          return;
        }

        send('stage', { worker: 'cache', label: 'Checking edge signature cache…', progress: 5 });

        const cached = await getEdgeCachedBreakdown(link, nle);
        if (cached) {
          send('stage', { worker: 'cache', label: 'Cached breakdown — instant hit', progress: 100 });
          const enriched = await enrichBreakdownWithLibrary(cached, nle).catch(() => cached);
          completeWith(enriched, 'cache');
          close();
          return;
        }

        if (!geminiConfigured()) {
          completeWith(
            await mockBreakdown(link, nle),
            'mock',
            'Demo breakdown — live engine key is not configured.'
          );
          close();
          return;
        }

        await runParallelAnalysisStages((ev) => send('worker', ev), 30);

        workDir = await createTempWorkDir();
        send('stage', { worker: 'ingest', label: 'Downloading source clip…', progress: 15 });

        let videoPath: string;
        try {
          videoPath = await downloadVideoFromUrl(link, workDir);
        } catch (downloadErr) {
          const raw =
            downloadErr instanceof Error ? downloadErr.message : 'Download failed';
          console.error('[analyze-edit/stream] download', raw);
          completeWith(await mockBreakdown(link, nle), 'mock', friendlyDownloadError(raw));
          close();
          return;
        }

        let breakdown: VideoBreakdownRecord;
        try {
          breakdown = await streamAnalyzeVideoWithGemini(
            { videoPath, videoUrl: link, nle },
            (ev) => {
              if (ev.type === 'file_ready') {
                send('stage', {
                  worker: 'vision',
                  label: 'Vision LLM connected — analyzing video…',
                  progress: 40,
                });
              }
              if (ev.type === 'progress') {
                send('stage', {
                  worker: 'vision',
                  label: visionStageLabel(ev.elapsedMs, ev.totalChars, ev.mode),
                  progress: Math.min(92, 40 + Math.floor(ev.elapsedMs / 2500)),
                });
              }
              if (ev.type === 'token') {
                send('token', {
                  totalChars: ev.totalChars,
                  preview: ev.delta.slice(-120),
                });
              }
            }
          );
        } catch (geminiErr) {
          const raw =
            geminiErr instanceof Error ? geminiErr.message : 'Vision analysis failed';
          console.error('[analyze-edit/stream] gemini', raw);
          completeWith(await mockBreakdown(link, nle), 'mock', friendlyDownloadError(raw));
          close();
          return;
        }

        let previewVideoUrl: string | undefined;
        try {
          previewVideoUrl = await savePreviewVideo(breakdown.id, videoPath);
        } catch {
          /* optional */
        }

        const final = previewVideoUrl ? { ...breakdown, previewVideoUrl } : breakdown;
        await setEdgeCachedBreakdown(link, nle, final);
        await recordAnalysis(visitorId, 'gemini-stream');
        completeWith(final, 'gemini');
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'Analysis failed';
        console.error('[analyze-edit/stream]', raw);
        await recordError('analyze-stream', raw);
        if (link && isSupportedVideoUrl(link)) {
          completeWith(await mockBreakdown(link, nle), 'mock', friendlyDownloadError(raw));
        } else {
          send('error', { error: raw });
        }
      } finally {
        clearInterval(pingInterval);
        await cleanupDir(workDir);
        close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

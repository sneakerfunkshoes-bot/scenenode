import { writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import type { NleSoftware } from '@/types/breakdown';
import { NLE_LIST, createMockBreakdown } from '@/lib/breakdown-mock';
import { enrichBreakdownWithLibrary } from '@/lib/effect-library/apply';
import {
  analyzeVideoWithGemini,
  geminiConfigured,
} from '@/lib/gemini-analyze';
import { savePreviewVideo } from '@/lib/preview-video';
import { setEdgeCachedBreakdown } from '@/lib/breakdown-edge-cache';
import {
  guardRateLimit,
  MAX_UPLOAD_BYTES,
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

export async function POST(req: Request) {
  let workDir: string | null = null;

  const limited = guardRateLimit(req, 'analyze', 8, 60_000);
  if (limited) return limited;

  const oversized = rejectOversizedBody(req, MAX_UPLOAD_BYTES);
  if (oversized) return oversized;

  const visitorId = visitorIdFromRequest(req);

  try {
    const contentType = req.headers.get('content-type') || '';
    let link = '';
    let nle: NleSoftware = 'DaVinci Resolve';
    let uploadedBuffer: Buffer | null = null;
    let uploadedName = 'upload.mp4';

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      link = String(form.get('link') ?? form.get('url') ?? '').trim();
      const nleRaw = String(form.get('nle') ?? form.get('targetSoftware') ?? '').trim();
      if (isNle(nleRaw)) nle = nleRaw;

      const file = form.get('file') ?? form.get('video');
      if (file && typeof file !== 'string' && 'arrayBuffer' in file) {
        const blob = file as File;
        if (blob.size > MAX_UPLOAD_BYTES) {
          return NextResponse.json({ error: 'Uploaded file is too large (max 50MB).' }, { status: 413 });
        }
        uploadedBuffer = Buffer.from(await blob.arrayBuffer());
        uploadedName = blob.name || 'upload.mp4';
      }
    } else {
      const body = (await req.json()) as {
        link?: string;
        url?: string;
        nle?: string;
        targetSoftware?: string;
      };
      link = String(body.link ?? body.url ?? '').trim();
      const nleRaw = String(body.nle ?? body.targetSoftware ?? '').trim();
      if (isNle(nleRaw)) nle = nleRaw;
    }

    if (!link && !uploadedBuffer) {
      return NextResponse.json(
        { error: 'Provide a TikTok / Reel / Shorts link or upload an MP4.' },
        { status: 400 }
      );
    }

    if (link && !uploadedBuffer && !isSupportedVideoUrl(link)) {
      return NextResponse.json(
        {
          error:
            'Unsupported link. Use TikTok, Instagram Reels, or YouTube Shorts URLs.',
        },
        { status: 400 }
      );
    }

    // No Gemini key → mock path so the UI still works in local demos
    if (!geminiConfigured()) {
      const record = await enrichBreakdownWithLibrary(
        createMockBreakdown(link || 'uploaded://local-video', nle),
        nle
      ).catch(() => createMockBreakdown(link || 'uploaded://local-video', nle));
      return NextResponse.json({
        source: 'mock',
        warning:
          'Demo breakdown — live engine key is not configured on this server.',
        breakdown: record,
      });
    }

    workDir = await createTempWorkDir();
    let videoPath: string;
    let videoUrlLabel: string;

    if (uploadedBuffer) {
      videoPath = path.join(workDir, uploadedName.replace(/[^\w.\-]+/g, '_'));
      await writeFile(videoPath, uploadedBuffer);
      videoUrlLabel = link || `uploaded://${uploadedName}`;
    } else {
      videoPath = await downloadVideoFromUrl(link, workDir);
      videoUrlLabel = link;
    }

    const breakdown = await analyzeVideoWithGemini({
      videoPath,
      videoUrl: videoUrlLabel,
      nle,
    });

    let previewVideoUrl: string | undefined;
    try {
      previewVideoUrl = await savePreviewVideo(breakdown.id, videoPath);
    } catch (saveErr) {
      console.warn('[analyze-edit] preview save failed', saveErr);
    }

    const final = previewVideoUrl ? { ...breakdown, previewVideoUrl } : breakdown;
    await setEdgeCachedBreakdown(videoUrlLabel, nle, final);
    await recordAnalysis(visitorId, 'gemini');

    return NextResponse.json({
      source: 'gemini',
      breakdown: final,
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Analysis failed';
    console.error('[analyze-edit]', raw);
    await recordError('analyze', raw);
    const isBusy = /503|429|high load|high demand|overloaded|unavailable/i.test(raw);
    return NextResponse.json(
      {
        error: isBusy
          ? 'Engine temporary high load. Please try again in a moment.'
          : raw.includes('Engine temporary') || raw.includes('Analysis failed') || raw.includes('timed out')
            ? raw
            : 'Analysis failed. Please try again in a moment.',
      },
      { status: isBusy ? 503 : 500 }
    );
  } finally {
    await cleanupDir(workDir);
  }
}

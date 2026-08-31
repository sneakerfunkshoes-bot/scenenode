import { mkdir, readdir, rm } from 'fs/promises';
import path from 'path';
import os from 'os';
import youtubeDl from 'youtube-dl-exec';
import { isSupportedVideoUrl } from '@/lib/video-url';

export { isSupportedVideoUrl };

function isYouTube(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com';
  } catch {
    return false;
  }
}

export async function createTempWorkDir(prefix = 'scenecraft-'): Promise<string> {
  const dir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanupDir(dir: string | null | undefined) {
  if (!dir) return;
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

async function findDownloadedVideo(workDir: string): Promise<string | null> {
  const files = await readdir(workDir);
  const video = files.find((f) => /\.(mp4|webm|mkv|mov)$/i.test(f));
  return video ? path.join(workDir, video) : null;
}

function friendlyDownloadError(err: unknown): Error {
  const raw =
    err && typeof err === 'object' && 'stderr' in err
      ? String((err as { stderr?: string }).stderr || '')
      : err instanceof Error
        ? err.message
        : String(err);

  if (/403|Forbidden/i.test(raw)) {
    return new Error(
      'YouTube blocked the download (HTTP 403). Try again, or paste a TikTok/Instagram Reel link instead.'
    );
  }
  if (/private|login|sign in/i.test(raw)) {
    return new Error('This video looks private or age-restricted and cannot be downloaded.');
  }
  if (/Unsupported URL|No video/i.test(raw)) {
    return new Error('Could not find a downloadable video at that link.');
  }
  return new Error(raw.trim().slice(0, 400) || 'Failed to download video.');
}

type DownloadAttempt = {
  format: string;
  extractorArgs?: string;
};

/**
 * Download a TikTok / Reel / Shorts URL to a local mp4 via yt-dlp.
 * YouTube often returns 403 with the default web client — we retry android/ios clients.
 */
export async function downloadVideoFromUrl(
  url: string,
  workDir: string
): Promise<string> {
  const outTemplate = path.join(workDir, 'source.%(ext)s');

  const attempts: DownloadAttempt[] = isYouTube(url)
    ? [
        {
          format: 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
          extractorArgs: 'youtube:player_client=android,web',
        },
        {
          format: 'bv*+ba/best',
          extractorArgs: 'youtube:player_client=ios,android',
        },
        {
          format: 'best[ext=mp4]/best',
          extractorArgs: 'youtube:player_client=tv_embedded,android',
        },
      ]
    : [
        {
          format: 'mp4/best[ext=mp4]/best',
        },
      ];

  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      await youtubeDl(url, {
        output: outTemplate,
        format: attempt.format,
        mergeOutputFormat: 'mp4',
        noPlaylist: true,
        restrictFilenames: true,
        quiet: true,
        noWarnings: true,
        ...(attempt.extractorArgs
          ? { extractorArgs: attempt.extractorArgs }
          : {}),
      });

      const found = await findDownloadedVideo(workDir);
      if (found) return found;
    } catch (err) {
      lastError = err;
    }
  }

  throw friendlyDownloadError(lastError);
}

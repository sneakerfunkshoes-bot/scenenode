import { copyFile, mkdir } from 'fs/promises';
import path from 'path';
import { getCacheDir } from '@/lib/cache-dir';

export async function savePreviewVideo(
  breakdownId: string,
  sourcePath: string
): Promise<string> {
  const dir = path.join(getCacheDir(), 'previews');
  await mkdir(dir, { recursive: true });
  const filename = `${breakdownId}.mp4`;
  const dest = path.join(dir, filename);
  await copyFile(sourcePath, dest);
  return `/api/previews/${breakdownId}`;
}

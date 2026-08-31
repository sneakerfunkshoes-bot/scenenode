import { copyFile, mkdir } from 'fs/promises';
import path from 'path';

export async function savePreviewVideo(
  breakdownId: string,
  sourcePath: string
): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'previews');
  await mkdir(dir, { recursive: true });
  const filename = `${breakdownId}.mp4`;
  const dest = path.join(dir, filename);
  await copyFile(sourcePath, dest);
  return `/previews/${filename}`;
}

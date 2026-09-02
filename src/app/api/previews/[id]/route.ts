import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCacheDir } from '@/lib/cache-dir';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid preview id' }, { status: 400 });
  }

  const filePath = path.join(getCacheDir(), 'previews', `${id}.mp4`);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
  }

  const fileStat = await stat(filePath);
  const range = req.headers.get('range');

  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) {
      return new NextResponse(null, { status: 416 });
    }

    const start = Number.parseInt(match[1], 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : fileStat.size - 1;
    const chunkSize = end - start + 1;

    const stream = createReadStream(filePath, { start, end });
    return new NextResponse(stream as unknown as BodyInit, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'video/mp4',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  const stream = createReadStream(filePath);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(fileStat.size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

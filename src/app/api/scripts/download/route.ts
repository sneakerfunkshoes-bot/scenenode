import { NextResponse } from 'next/server';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { ALLOWED_SCRIPT_FILES } from '@/lib/ae-scripts-catalog';
import { hasDownloadAccess } from '@/lib/scripts-download-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCRIPTS_DIR = path.join(process.cwd(), 'private', 'scripts');

const CONTENT_TYPES: Record<string, string> = {
  '.zip': 'application/zip',
  '.jsxbin': 'application/octet-stream',
};

export async function GET(req: Request) {
  if (!hasDownloadAccess(req)) {
    return NextResponse.json(
      { error: 'Payment required. Complete UPI payment and verification first.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('file') || 'SceneNode_AE_Scripts.zip';

  if (!ALLOWED_SCRIPT_FILES.has(fileName)) {
    return NextResponse.json({ error: 'Invalid script file.' }, { status: 400 });
  }

  const filePath = path.join(SCRIPTS_DIR, fileName);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Script file is unavailable.' }, { status: 404 });
  }

  const ext = path.extname(fileName).toLowerCase();
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}

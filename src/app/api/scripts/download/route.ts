import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { hasBundleAccess } from '@/lib/scripts-download-auth';
import { SCRIPT_BUNDLE_FILES } from '@/lib/script-catalog';
import { zipFiles } from '@/lib/zip-buffer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!hasBundleAccess(req)) {
    return NextResponse.json(
      { error: 'Pay ₹499 to unlock the After Effects script bundle.' },
      { status: 401 }
    );
  }

  try {
    const dir = path.join(process.cwd(), 'private', 'scripts');
    const files = await Promise.all(
      SCRIPT_BUNDLE_FILES.map(async (name) => ({
        name,
        data: await readFile(path.join(dir, name)),
      }))
    );
    const zip = zipFiles(files);

    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="SceneNode-AE-Scripts.zip"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[scripts/download]', err);
    return NextResponse.json({ error: 'Bundle files are unavailable.' }, { status: 500 });
  }
}

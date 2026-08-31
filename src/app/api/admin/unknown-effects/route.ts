import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/security/admin-auth';
import { listUnknownVisuals } from '@/lib/effect-library/unknown-queue';
import { EFFECT_LIBRARY } from '@/lib/effect-library/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const items = await listUnknownVisuals();
  return NextResponse.json({
    librarySize: EFFECT_LIBRARY.length,
    items,
  });
}

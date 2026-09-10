import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** AE script selling removed — product is edit deconstruction only. */
export async function GET() {
  return NextResponse.json(
    { error: 'Script downloads are no longer available.' },
    { status: 410 }
  );
}

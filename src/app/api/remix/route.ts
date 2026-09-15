import { NextResponse } from 'next/server';
import { createRemixPayload, getRemixPayload } from '@/lib/remix-store';
import { emitTelemetry } from '@/lib/telemetry';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get('code')?.trim();
  if (!code) {
    return NextResponse.json({ error: 'Missing code.' }, { status: 400 });
  }
  const payload = await getRemixPayload(code);
  if (!payload) {
    return NextResponse.json({ error: 'Remix not found.' }, { status: 404 });
  }
  return NextResponse.json({ remix: payload });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sourceUrl?: string;
      nle?: NleSoftware;
      breakdown?: VideoBreakdownRecord;
    };

    if (!body.sourceUrl?.trim() || !body.nle || !body.breakdown) {
      return NextResponse.json(
        { error: 'sourceUrl, nle, and breakdown are required.' },
        { status: 400 }
      );
    }

    const remix = await createRemixPayload({
      sourceUrl: body.sourceUrl.trim(),
      nle: body.nle,
      breakdown: body.breakdown,
    });

    await emitTelemetry('remix_created', {
      code: remix.code,
      nle: remix.nle,
      effect_count: remix.breakdown.effects?.length ?? 0,
    });

    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://scenenode.app';
    return NextResponse.json({
      code: remix.code,
      url: `${site.replace(/\/$/, '')}/remix/${remix.code}`,
      remix,
    });
  } catch (err) {
    console.error('[remix]', err);
    return NextResponse.json({ error: 'Could not create remix.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { visitorIdFromRequest } from '@/lib/usage-stats';
import { getOrCreatePartner, getResellerSummary } from '@/lib/reseller-store';
import { RESELLER_COOKIE, resellerShareUrl } from '@/lib/script-catalog';
import { readNamedCookie } from '@/lib/scripts-download-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resellerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 400,
  };
}

export async function GET(req: Request) {
  const visitorId = visitorIdFromRequest(req);
  const existing = readNamedCookie(req, RESELLER_COOKIE);
  const partner = await getOrCreatePartner(visitorId, existing);
  const summary = await getResellerSummary(partner.code);

  const res = NextResponse.json({
    code: partner.code,
    link: resellerShareUrl(partner.code),
    saleCount: summary?.saleCount ?? 0,
    earned: summary?.earned ?? 0,
    available: summary?.available ?? 0,
    withdrawals: summary?.withdrawals ?? [],
  });
  res.cookies.set(RESELLER_COOKIE, partner.code, resellerCookieOptions());
  return res;
}

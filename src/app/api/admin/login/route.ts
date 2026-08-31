import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  adminConfigured,
  adminCookieOptions,
  createAdminToken,
  isAdminRequest,
  verifyAdminPassword,
} from '@/lib/security/admin-auth';
import { guardRateLimit } from '@/lib/security/api-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'admin-login', 5, 60_000);
  if (limited) return limited;

  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'Admin access is not configured on this server.' },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as { password?: string };
    const password = String(body.password ?? '').trim();

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    const token = createAdminToken();
    if (!token) {
      return NextResponse.json({ error: 'Admin session unavailable.' }, { status: 503 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed.' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    authenticated: isAdminRequest(req),
    configured: adminConfigured(),
  });
}

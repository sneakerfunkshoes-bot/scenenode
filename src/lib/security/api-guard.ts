import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { visitorIdFromRequest } from '@/lib/usage-stats';

export const MAX_JSON_BODY_BYTES = 64 * 1024;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_CHAT_MESSAGE_CHARS = 4_000;

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please wait and try again.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  );
}

export function guardRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const key = `${scope}:${visitorIdFromRequest(req)}:${clientIp(req)}`;
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.ok) return rateLimitResponse(result.retryAfterSec);
  return null;
}

export function rejectOversizedBody(req: Request, maxBytes: number): NextResponse | null {
  const raw = req.headers.get('content-length');
  if (!raw) return null;

  const size = Number(raw);
  if (Number.isFinite(size) && size > maxBytes) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
  }
  return null;
}

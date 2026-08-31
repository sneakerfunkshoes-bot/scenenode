import { createHmac, timingSafeEqual } from 'crypto';

export const PAYMENT_SESSION_COOKIE = 'scenenode_payment_session';
export const DOWNLOAD_COOKIE = 'scenenode_scripts_download';
const DOWNLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signingSecret(): string | null {
  const secret =
    process.env.SCRIPTS_DOWNLOAD_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();
  return secret || null;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function readCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

export function getPaymentSessionId(req: Request): string | null {
  return readCookie(req, PAYMENT_SESSION_COOKIE);
}

export function paymentSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24,
  };
}

export function createDownloadToken(paymentId: string): string | null {
  const secret = signingSecret();
  if (!secret) return null;

  const exp = Date.now() + DOWNLOAD_TTL_MS;
  const payload = `download:${paymentId}:${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyDownloadToken(token: string | null | undefined): string | null {
  if (!token) return null;

  const secret = signingSecret();
  if (!secret) return null;

  const [payload, sig] = token.split('.');
  if (!payload || !sig || !payload.startsWith('download:')) return null;

  const parts = payload.split(':');
  const paymentId = parts[1];
  const exp = Number(parts[2]);
  if (!paymentId || !Number.isFinite(exp) || Date.now() > exp) return null;

  const expected = sign(payload, secret);
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return paymentId;
}

export function hasDownloadAccess(req: Request): boolean {
  const token = readCookie(req, DOWNLOAD_COOKIE);
  return Boolean(verifyDownloadToken(token));
}

export function downloadCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: DOWNLOAD_TTL_MS / 1000,
  };
}

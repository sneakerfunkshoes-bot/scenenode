import { createHmac, timingSafeEqual } from 'crypto';
import { secretsEqual } from '@/lib/security/secrets';

export const ADMIN_COOKIE = 'scenenode_admin';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function adminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  return secret?.trim() || null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function adminConfigured(): boolean {
  return Boolean(adminSecret() && process.env.ADMIN_PASSWORD?.trim());
}

export function createAdminToken(): string | null {
  const secret = adminSecret();
  if (!secret) return null;

  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `admin:${exp}`;
  const sig = signPayload(payload, secret);
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const secret = adminSecret();
  if (!secret) return false;

  const [payload, sig] = token.split('.');
  if (!payload || !sig || !payload.startsWith('admin:')) return false;

  const exp = Number(payload.slice('admin:'.length));
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const expected = signPayload(payload, secret);
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  return secretsEqual(password.trim(), process.env.ADMIN_PASSWORD?.trim());
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: TOKEN_TTL_MS / 1000,
  };
}

export function isAdminRequest(req: Request): boolean {
  const token = readAdminCookie(req);
  return verifyAdminToken(token);
}

function readAdminCookie(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;

  const raw = match[1].trim();
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

import { isAdminRequest } from '@/lib/security/admin-auth';
import { secretsEqual } from '@/lib/security/secrets';

export const OPS_SECRET_HEADER = 'x-ops-secret';

export function opsSecret(): string | null {
  return process.env.MASTER_OPS_WEBHOOK_SECRET?.trim() || null;
}

export function opsSecretConfigured(): boolean {
  return Boolean(opsSecret());
}

export function opsSecretMatches(req: Request): boolean {
  const expected = opsSecret();
  if (!expected) return false;
  const provided =
    req.headers.get(OPS_SECRET_HEADER)?.trim() ||
    req.headers.get('x-telemetry-secret')?.trim() ||
    new URL(req.url).searchParams.get('secret')?.trim() ||
    '';
  return secretsEqual(provided, expected);
}

/** Dashboard reads: admin session, ingest secret, or local `next dev`. */
export function canAccessCommandRead(req: Request): boolean {
  if (isAdminRequest(req)) return true;
  if (opsSecretMatches(req)) return true;
  return process.env.NODE_ENV !== 'production';
}

/** Other apps POST here. Production requires MASTER_OPS_WEBHOOK_SECRET. */
export function canIngestTelemetry(req: Request): boolean {
  if (opsSecretConfigured()) return opsSecretMatches(req);
  return process.env.NODE_ENV !== 'production';
}

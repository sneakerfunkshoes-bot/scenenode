/** SceneNode After Effects script bundle (creator-owned). */
export const SCRIPT_BUNDLE_PRICE_INR = 499;
export const SCRIPT_BUNDLE_PRICE_PAISE = SCRIPT_BUNDLE_PRICE_INR * 100;
export const RESELLER_COMMISSION_INR = 300;
export const PLATFORM_SHARE_INR = SCRIPT_BUNDLE_PRICE_INR - RESELLER_COMMISSION_INR;
export const MIN_PAYOUT_INR = RESELLER_COMMISSION_INR;

export const SCRIPT_BUNDLE_FILES = [
  'SceneNodeAutoEdit.jsxbin',
  'SceneNodeBeatMark.jsxbin',
  'SceneNodeVault.jsxbin',
] as const;

export const REF_COOKIE = 'scenenode_ref';
export const RESELLER_COOKIE = 'scenenode_reseller';

export const UPI_ID_PATTERN = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

export function normalizeResellerCode(raw: string | null | undefined): string | null {
  const code = raw?.trim().toUpperCase();
  if (!code || !/^SN_[A-Z0-9]{6,16}$/.test(code)) return null;
  return code;
}

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://snenenode.online').replace(/\/$/, '');
}

export function resellerShareUrl(code: string): string {
  return `${siteOrigin()}/?ref=${encodeURIComponent(code)}`;
}

export function isValidUpiId(value: string): boolean {
  return UPI_ID_PATTERN.test(value.trim());
}

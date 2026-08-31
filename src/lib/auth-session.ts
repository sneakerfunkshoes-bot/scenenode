export const AUTH_KEY = 'theeditdeconstruct_authed';
export const PENDING_INSPECT_URL_KEY = 'theeditdeconstruct_pending_inspect_url';
export const PENDING_PATH_KEY = 'theeditdeconstruct_pending_path';
export const AUTH_CHANGE_EVENT = 'theeditdeconstruct-auth-change';

function notifyAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function markAuthed() {
  try {
    sessionStorage.setItem(AUTH_KEY, '1');
  } catch {
    /* ignore */
  }
  notifyAuthChange();
}

export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearAuthed() {
  try {
    sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
  notifyAuthChange();
}

export function stashPendingInspectUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(PENDING_INSPECT_URL_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function popPendingInspectUrl(): string | null {
  try {
    const value = sessionStorage.getItem(PENDING_INSPECT_URL_KEY);
    sessionStorage.removeItem(PENDING_INSPECT_URL_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function stashPendingPath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(PENDING_PATH_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function popPendingPath(): string | null {
  try {
    const value = sessionStorage.getItem(PENDING_PATH_KEY);
    sessionStorage.removeItem(PENDING_PATH_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function buildInspectUrlPath(url: string): string {
  return `/inspect?url=${encodeURIComponent(url.trim())}`;
}

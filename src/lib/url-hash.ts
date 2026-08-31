/** Normalize short-form URLs so the same edit always maps to the same cache key. */
export function normalizeVideoUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = '';
    u.search = '';
    let path = u.pathname.replace(/\/+$/, '');
    // YouTube Shorts / watch IDs
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id =
        u.searchParams.get('v') ||
        (u.hostname.includes('youtu.be') ? path.slice(1) : path.match(/\/shorts\/([^/]+)/)?.[1]);
      if (id) return `youtube:${id}`;
    }
    if (u.hostname.includes('tiktok.com')) {
      const m = path.match(/\/video\/(\d+)/);
      if (m) return `tiktok:${m[1]}`;
    }
    if (u.hostname.includes('instagram.com')) {
      const m = path.match(/\/(reel|p)\/([^/]+)/);
      if (m) return `instagram:${m[2]}`;
    }
    return `${u.hostname}${path}`.toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function hashString(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function stableBreakdownId(url: string): string {
  return `bd-${hashString(normalizeVideoUrl(url))}`;
}

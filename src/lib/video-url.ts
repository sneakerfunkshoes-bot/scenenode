const SHORTFORM_HOSTS = [
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'instagram.com',
  'www.instagram.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
];

export function youtubeVideoId(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') {
      id = u.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      id =
        u.searchParams.get('v') ||
        u.pathname.match(/\/shorts\/([^/]+)/)?.[1] ||
        u.pathname.match(/\/embed\/([^/]+)/)?.[1] ||
        null;
    }
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
  } catch {
    /* ignore */
  }
  return null;
}

export function instagramReelId(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (!host.includes('instagram.com')) return null;
    const match = u.pathname.match(/\/(reel|p)\/([^/?#]+)/);
    return match?.[2] ?? null;
  } catch {
    return null;
  }
}

export function tiktokVideoId(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (!host.includes('tiktok.com')) return null;
    const match = u.pathname.match(/\/video\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function socialEmbedUrl(raw: string): string | null {
  const ig = instagramReelId(raw);
  if (ig) return `https://www.instagram.com/reel/${ig}/embed`;
  const tt = tiktokVideoId(raw);
  if (tt) return `https://www.tiktok.com/embed/v2/${tt}`;
  return null;
}

export function isSupportedVideoUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    return SHORTFORM_HOSTS.some(
      (host) => u.hostname === host || u.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

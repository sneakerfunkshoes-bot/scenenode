/** Smooth-scroll to a landing section by id (e.g. "features"). */
export function scrollToSectionId(id: string): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    history.replaceState(null, '', `#${id}`);
  } catch {
    /* ignore */
  }
  return true;
}

/** Parse "/#features" or "#features" → "features". */
export function sectionIdFromHref(href: string): string | null {
  if (href.startsWith('/#')) return href.slice(2) || null;
  if (href.startsWith('#')) return href.slice(1) || null;
  return null;
}

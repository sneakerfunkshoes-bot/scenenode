'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_KEY = 'scenenode_tracked';

export function UsageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    try {
      const key = `${SESSION_KEY}:${pathname}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore storage errors */
    }

    void fetch('/api/track/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {
      /* non-critical */
    });
  }, [pathname]);

  return null;
}

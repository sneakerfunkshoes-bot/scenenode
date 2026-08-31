'use client';

export function trackClientError(
  scope: string,
  message: string,
  meta?: Record<string, string | number | boolean>
) {
  try {
    void fetch('/api/track/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope,
        message: message.slice(0, 500),
        meta,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        at: new Date().toISOString(),
      }),
    });
  } catch {
    /* non-critical */
  }
}

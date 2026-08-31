'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const REQUIRED_CLICKS = 7;
const RESET_MS = 2_500;

export function useLogoAdminUnlock() {
  const router = useRouter();
  const countRef = useRef(0);
  const lastClickRef = useRef(0);

  const onLogoClick = useCallback(
    (event: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastClickRef.current > RESET_MS) {
        countRef.current = 0;
      }

      lastClickRef.current = now;
      countRef.current += 1;

      if (countRef.current >= REQUIRED_CLICKS) {
        countRef.current = 0;
        event.preventDefault();
        router.push('/admin');
      }
    },
    [router]
  );

  return onLogoClick;
}

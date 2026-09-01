'use client';

import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

function readMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

/** Viewport < 768px — used for mobile vs desktop layout switching. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(readMobile);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return mobile;
}

/** Alias — phone tab layout when viewport is below 768px. */
export function useDeviceLayout(): 'phone' | 'laptop' {
  const mobile = useIsMobile();
  return mobile ? 'phone' : 'laptop';
}

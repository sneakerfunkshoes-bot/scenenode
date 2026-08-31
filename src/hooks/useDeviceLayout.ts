'use client';

import { useEffect, useState } from 'react';

/** True for phones / mobile browsers — not laptops or tablets treated as desktop. */
export function isPhoneDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;

  if (/iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  // Android phones include "Mobile"; most Android tablets omit it.
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) {
    return true;
  }

  return false;
}

/**
 * Phone → tabbed analysis UI.
 * Laptop / desktop / tablet → full 3-column workspace (regardless of window width).
 */
export function useDeviceLayout(): 'phone' | 'laptop' {
  const [layout, setLayout] = useState<'phone' | 'laptop'>('laptop');

  useEffect(() => {
    const update = () => setLayout(isPhoneDevice() ? 'phone' : 'laptop');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return layout;
}

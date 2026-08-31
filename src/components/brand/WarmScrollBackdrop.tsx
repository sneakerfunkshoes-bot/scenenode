'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SunburstIcon } from './SunburstIcon';

export function WarmScrollBackdrop() {
  const { scrollY } = useScroll();
  const [vh, setVh] = useState(900);

  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const rotate = useTransform(scrollY, [0, 1000], [0, 360]);
  const opacity = useTransform(scrollY, [vh * 2.75, vh * 3.15], [0, 1]);

  return (
    <motion.div style={{ opacity }} className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <motion.div style={{ rotate }} className="absolute -right-16 -top-16 opacity-20">
        <SunburstIcon className="h-96 w-96" />
      </motion.div>
      <motion.div style={{ rotate }} className="absolute -left-20 bottom-10 opacity-[0.15]">
        <SunburstIcon className="h-80 w-80" />
      </motion.div>
    </motion.div>
  );
}

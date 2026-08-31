'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SunburstIconProps {
  className?: string;
  spin?: boolean;
}

export function SunburstIcon({ className = 'h-6 w-6', spin = false }: SunburstIconProps) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={cn('fill-none text-[#D96B43]', className)}
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      animate={spin ? { rotate: 360 } : undefined}
      transition={spin ? { repeat: Infinity, duration: 25, ease: 'linear' } : undefined}
      aria-hidden
    >
      <line x1="50" y1="10" x2="50" y2="30" />
      <line x1="50" y1="70" x2="50" y2="90" />
      <line x1="10" y1="50" x2="30" y2="50" />
      <line x1="70" y1="50" x2="90" y2="50" />
      <line x1="22" y1="22" x2="36" y2="36" />
      <line x1="64" y1="64" x2="78" y2="78" />
      <line x1="78" y1="22" x2="64" y2="36" />
      <line x1="36" y1="64" x2="22" y2="78" />
      <line x1="35" y1="15" x2="42" y2="32" />
      <line x1="65" y1="15" x2="58" y2="32" />
      <line x1="15" y1="35" x2="32" y2="42" />
      <line x1="15" y1="65" x2="32" y2="58" />
    </motion.svg>
  );
}

'use client';

import { cn } from '@/lib/utils';

interface GetStartedButtonProps {
  onClick: () => void;
  pressed?: boolean;
  className?: string;
}

export function GetStartedButton({ onClick, pressed, className }: GetStartedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[44px] rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition duration-200 hover:bg-zinc-200 sm:rounded-xl sm:py-4',
        'active:scale-[0.97]',
        pressed && 'scale-[0.97] bg-zinc-200',
        className
      )}
    >
      Get Started
    </button>
  );
}

'use client';

import { cn } from '@/lib/utils';

interface GetStartedButtonProps {
  onClick: () => void;
  pressed?: boolean;
}

export function GetStartedButton({ onClick, pressed }: GetStartedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[44px] rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition duration-200 hover:bg-zinc-200 sm:py-4',
        'active:scale-[0.97]',
        pressed && 'scale-[0.97] bg-zinc-200'
      )}
    >
      Get Started
    </button>
  );
}

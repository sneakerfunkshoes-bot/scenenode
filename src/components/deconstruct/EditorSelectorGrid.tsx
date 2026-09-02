'use client';

import { cn } from '@/lib/utils';
import {
  DEFAULT_EDITOR_ID,
  EDITOR_PRODUCTS,
  type EditorProductId,
} from '@/lib/editor-products';

interface EditorSelectorGridProps {
  value: EditorProductId;
  onChange: (id: EditorProductId) => void;
  className?: string;
}

export function EditorSelectorGrid({ value, onChange, className }: EditorSelectorGridProps) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        Choose your editing software
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
        Get the recreation guide specifically for the editor you use.
      </p>

      <div
        className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Editing software"
      >
        {EDITOR_PRODUCTS.map((editor) => {
          const active = value === editor.id;
          return (
            <button
              key={editor.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(editor.id)}
              className={cn(
                'flex min-h-[52px] w-full items-center rounded-xl border px-4 py-3.5 text-left transition',
                active
                  ? 'border-white/30 bg-zinc-900 text-white ring-1 ring-inset ring-white/10'
                  : 'border-zinc-800/90 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              )}
            >
              <span className="text-sm font-medium">{editor.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { DEFAULT_EDITOR_ID };

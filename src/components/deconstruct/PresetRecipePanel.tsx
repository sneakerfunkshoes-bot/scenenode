'use client';

import { cn } from '@/lib/utils';
import {
  EFFECT_CATEGORY_META,
  type EffectCardView,
} from '@/lib/deconstruct-view-model';

interface PresetRecipePanelProps {
  effects: EffectCardView[];
  selectedId?: string | null;
  onSelect: (fx: EffectCardView) => void;
}

function typeLabel(fx: EffectCardView): string {
  if (fx.libraryType === 'overlay' || fx.category === 'overlay') return 'Overlay';
  if (fx.libraryType === 'compound') return 'Compound';
  if (fx.libraryType === 'transform' || fx.category === 'camera') return 'Motion';
  if (fx.libraryType === 'transition' || fx.category === 'transition') return 'Transition';
  return 'Effect';
}

export function PresetRecipePanel({
  effects,
  selectedId,
  onSelect,
}: PresetRecipePanelProps) {
  if (!effects.length) {
    return (
      <section className="workspace-fade-in rounded-xl bg-zinc-900/35 p-4 sm:p-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Edit Breakdown
        </h3>
        <p className="text-xs text-zinc-500">No layered moves detected in this clip.</p>
      </section>
    );
  }

  return (
    <section className="workspace-fade-in rounded-xl bg-zinc-900/35 p-4 sm:p-5">
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Edit Breakdown
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {effects.map((fx, i) => {
          const recipe = fx.recipe;
          const meta = EFFECT_CATEGORY_META[fx.category];
          const active = fx.id === selectedId;
          const layers = recipe.layerOrder.filter((l) => l.toLowerCase() !== 'base footage');

          return (
            <button
              key={fx.id}
              type="button"
              onClick={() => onSelect(fx)}
              className={cn(
                'group rounded-xl p-4 text-left transition duration-200',
                'ring-1 ring-inset ring-white/[0.06] hover:-translate-y-px hover:ring-white/12',
                meta.tint,
                active && 'ring-sky-400/35 brightness-110'
              )}
            >
              <span className={cn('mb-3 block h-0.5 w-8 rounded-full', meta.bar)} />
              <div className="flex items-start gap-3">
                <span className="font-mono text-[11px] text-zinc-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                    {typeLabel(fx)}
                    {fx.libraryId ? (
                      <span className="ml-2 font-mono normal-case tracking-normal text-zinc-600">
                        {fx.libraryId}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold leading-snug text-zinc-100">
                    {recipe.headline}
                  </p>
                  {layers.length ? (
                    <ul className="mt-3 space-y-1">
                      {layers.slice(0, 4).map((layer) => (
                        <li key={layer} className="text-[11px] text-zinc-400">
                          <span className="mr-1.5 text-emerald-500/80">✓</span>
                          {layer}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {recipe.parameters.length ? (
                    <ul className="mt-3 space-y-1">
                      {recipe.parameters.slice(0, 4).map((p) => (
                        <li
                          key={`${p.label}-${p.value}`}
                          className="flex justify-between gap-2 text-[11px] text-zinc-400"
                        >
                          <span className="truncate">{p.label}</span>
                          <span className="shrink-0 font-mono text-zinc-300">{p.value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-3 font-mono text-[10px] text-zinc-600">
                    {recipe.timeLabel} – {recipe.endTimeLabel}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

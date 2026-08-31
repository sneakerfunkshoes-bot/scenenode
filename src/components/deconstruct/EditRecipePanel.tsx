'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EFFECT_CATEGORY_META,
  type EffectCardView,
  type EditRecipe,
} from '@/lib/deconstruct-view-model';

interface EditRecipePanelProps {
  recipe: EditRecipe;
  onClose: () => void;
  className?: string;
}

export function EditRecipePanel({ recipe, onClose, className }: EditRecipePanelProps) {
  const meta = EFFECT_CATEGORY_META[recipe.category];

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-zinc-950/90 ring-1 ring-inset ring-white/[0.08]',
        className
      )}
    >
      <div className={cn('h-0.5 w-full', meta.bar)} />
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            {recipe.icon} Composite Edit Recipe · {recipe.family}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-white">{recipe.headline}</h3>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
            {recipe.timeLabel} → {recipe.endTimeLabel}
            <span className="mx-1.5 text-zinc-700">·</span>
            {recipe.durationLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Close recipe"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
        <RecipeBlock label="Primary action">
          <p className="text-sm text-zinc-100">{recipe.primary}</p>
        </RecipeBlock>

        <RecipeBlock label="Combined actions">
          {recipe.combined.length ? (
            <ul className="space-y-1">
              {recipe.combined.map((c) => (
                <li key={c} className="text-[12px] text-zinc-300">
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-zinc-600">No secondary transforms detected</p>
          )}
        </RecipeBlock>

        <RecipeBlock label="Parameters">
          {recipe.parameters.length ? (
            <ul className="space-y-1">
              {recipe.parameters.map((p) => (
                <li key={p.label} className="flex justify-between gap-3 text-[12px]">
                  <span className="text-zinc-500">{p.label}</span>
                  <span className="font-mono text-zinc-200">{p.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-zinc-600">Derived from visual analysis</p>
          )}
        </RecipeBlock>

        <RecipeBlock label="Motion / timing">
          <ul className="space-y-1">
            {recipe.motion.map((m) => (
              <li key={m} className="text-[12px] text-zinc-300">
                {m}
              </li>
            ))}
          </ul>
        </RecipeBlock>

        <RecipeBlock label="Supporting effects" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {recipe.supporting.map((s) => (
              <span
                key={s}
                className="rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 ring-1 ring-inset ring-white/[0.05]"
              >
                ✓ {s}
              </span>
            ))}
          </div>
        </RecipeBlock>

        <RecipeBlock label="Recreate in order" className="sm:col-span-2">
          <ol className="space-y-1.5">
            {recipe.layerOrder.map((step, i) => (
              <li key={step} className="flex items-start gap-2 text-[12px] text-zinc-300">
                <span className="font-mono text-[10px] text-zinc-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </RecipeBlock>
      </div>
    </div>
  );
}

function RecipeBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg bg-zinc-900/50 p-3', className)}>
      <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
        {label}
      </p>
      {children}
    </div>
  );
}

/** Compact timeline face — name only; details live in Edit Breakdown / recipe panel. */
export function RecipeFace({
  effect,
  compact,
}: {
  effect: EffectCardView;
  compact?: boolean;
}) {
  return (
    <span className="flex h-full items-center gap-1.5 px-2 py-1.5">
      <span className="shrink-0 text-[10px] text-zinc-400">{effect.icon}</span>
      <span
        className={cn(
          'truncate font-medium text-zinc-100',
          compact ? 'text-[10px]' : 'text-[11px]'
        )}
      >
        {effect.recipe.headline}
      </span>
    </span>
  );
}

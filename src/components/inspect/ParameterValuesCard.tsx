'use client';

import type { EffectParameter } from '@/types/breakdown';

interface ParameterValuesCardProps {
  parameters: EffectParameter[];
}

export function ParameterValuesCard({ parameters }: ParameterValuesCardProps) {
  return (
    <div className="space-y-2">
      {parameters.map((param) => (
        <div
          key={param.plugin}
          className="rounded-xl border border-zinc-700 bg-zinc-900 p-3"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {param.plugin}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(param.values).map(([key, val]) => (
              <span
                key={key}
                className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] font-semibold text-zinc-300"
              >
                {key}: {val}
              </span>
            ))}
          </div>
          {param.easing ? (
            <p className="mt-2 font-mono text-[10px] text-zinc-500">Easing: {param.easing}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

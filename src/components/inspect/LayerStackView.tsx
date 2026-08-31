'use client';

import type { CompositorLayer } from '@/types/breakdown';

interface LayerStackViewProps {
  layers: CompositorLayer[];
}

export function LayerStackView({ layers }: LayerStackViewProps) {
  const sorted = [...layers].sort((a, b) => b.order - a.order);

  return (
    <div className="space-y-2">
      {sorted.map((layer) => (
        <div
          key={`${layer.order}-${layer.name}`}
          className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-xs font-bold text-zinc-300">
            L{layer.order}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">
              {layer.name}
              {layer.blendMode ? (
                <span className="ml-2 text-xs font-semibold text-zinc-500">
                  Blend: {layer.blendMode}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs font-medium text-zinc-400">{layer.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

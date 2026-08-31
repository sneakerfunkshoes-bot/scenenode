'use client';

import { SOFTWARE_TOOLS } from '@/lib/mock-data';
import type { SoftwareTool } from '@/types';
import { cn } from '@/lib/utils';

interface SoftwareSelectorProps {
  selected: SoftwareTool;
  onSelect: (tool: SoftwareTool) => void;
}

export function SoftwareSelector({ selected, onSelect }: SoftwareSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SOFTWARE_TOOLS.map((tool) => {
        const active = selected === tool;
        return (
          <button
            key={tool}
            type="button"
            onClick={() => onSelect(tool)}
            className={cn(
              'rounded-sm border px-3 py-1.5 font-mono text-[11px] tracking-wide transition',
              active
                ? 'border-silver/50 bg-silver/15 text-silver'
                : 'border-silver/12 bg-obsidian/40 text-silver-dim hover:border-silver/30 hover:text-silver-muted'
            )}
          >
            {tool}
          </button>
        );
      })}
    </div>
  );
}

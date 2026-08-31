'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import { useBreakdown } from '@/context/BreakdownContext';
import { NLE_LIST } from '@/lib/breakdown-mock';
import type { NleSoftware } from '@/types/breakdown';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  onAskAi: (query: string) => void;
}

export function CommandPalette({ onAskAi }: CommandPaletteProps) {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    breakdown,
    nle,
    setNle,
    setSelectedEffectId,
    setCurrentTime,
    analyzeEdit,
  } = useBreakdown();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cmds: { id: string; label: string; group: string; run: () => void }[] = [];

    NLE_LIST.forEach((tool) => {
      cmds.push({
        id: `nle-${tool}`,
        label: `Switch target NLE → ${tool}`,
        group: 'NLE',
        run: () => setNle(tool as NleSoftware),
      });
    });

    breakdown?.effects.forEach((fx) => {
      cmds.push({
        id: `fx-${fx.id}`,
        label: `Jump to ${fx.type} @ ${fx.timestamp.toFixed(2)}s`,
        group: 'Effects',
        run: () => {
          setSelectedEffectId(fx.id);
          setCurrentTime(fx.timestamp);
        },
      });
    });

    cmds.push({
      id: 'analyze',
      label: 'Re-analyze current URL (force refresh)',
      group: 'Actions',
      run: () => void analyzeEdit(true),
    });

    cmds.push({
      id: 'ask',
      label: `Ask AI: "${query || 'Explain the color grade'}"`,
      group: 'AI',
      run: () => onAskAi(query || 'Explain the CC & color grading breakdown.'),
    });

    if (!q) return cmds;
    return cmds.filter((c) => c.label.toLowerCase().includes(q));
  }, [
    query,
    breakdown,
    setNle,
    setSelectedEffectId,
    setCurrentTime,
    analyzeEdit,
    onAskAi,
  ]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search effects, switch NLE, ask AI…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCommandPaletteOpen(false);
              if (e.key === 'Enter' && items[0]) {
                items[0].run();
                setCommandPaletteOpen(false);
              }
            }}
          />
          <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
            ⌘K
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          <AnimatePresence>
            {items.slice(0, 12).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    item.run();
                    setCommandPaletteOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900"
                >
                  {item.group === 'AI' && <Sparkles className="h-3.5 w-3.5 text-zinc-400" />}
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[10px] text-zinc-600">{item.group}</span>
                </button>
              </li>
            ))}
          </AnimatePresence>
        </ul>
        <p className="border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-600">
          Target: {nle} · Enter to run first match
        </p>
      </motion.div>
    </div>
  );
}

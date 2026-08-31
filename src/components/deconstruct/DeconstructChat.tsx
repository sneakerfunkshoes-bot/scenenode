'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

interface DeconstructChatProps {
  nle: NleSoftware;
  breakdown: VideoBreakdownRecord;
  selectedEffectId?: string | null;
  currentTime: number;
  variant?: 'fixed' | 'inline';
}

export function DeconstructChat({
  nle,
  breakdown,
  selectedEffectId,
  currentTime,
  variant = 'fixed',
}: DeconstructChatProps) {
  const inline = variant === 'inline';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'starter',
      role: 'assistant',
      content:
        "I'm scenenode AI. Ask about this edit's cuts, color, effects, or how to recreate a step in your NLE.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, open]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || typing) return;

    const history = messages
      .filter((m) => m.id !== 'starter')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', content: text }]);
    setInput('');
    setTyping(true);

    const selected = breakdown.effects.find((e) => e.id === selectedEffectId);
    const breakdownContext = [
      `Song: ${breakdown.songTitle} — ${breakdown.songArtist} @ ${breakdown.bpm} BPM`,
      `Duration: ${breakdown.trackDuration.toFixed(2)}s`,
      `Playhead: ${currentTime.toFixed(2)}s`,
      `Effects: ${breakdown.effects
        .slice(0, 30)
        .map((e) => `${e.timestamp.toFixed(2)}s ${e.type}: ${e.name || e.description}`)
        .join('; ')}`,
      selected
        ? `Selected: ${selected.name || selected.description} @ ${selected.timestamp.toFixed(2)}s`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          nle,
          breakdownContext,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content:
            data.reply ||
            data.error ||
            'Ask me about a transition, grade, or recreation step.',
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: "Couldn't reach the assistant just now. Try again in a moment.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className={cn(inline && 'relative')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium text-zinc-100 transition',
          inline
            ? 'w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 text-xs hover:border-zinc-500 hover:bg-zinc-800'
            : 'fixed bottom-5 right-5 z-40 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm shadow-xl hover:border-zinc-500',
          open && 'border-sky-500/40'
        )}
      >
        {open ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
        {open ? 'Close' : 'Ask AI'}
      </button>

      {open ? (
        <div
          className={cn(
            'z-40 flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl',
            inline
              ? 'absolute bottom-[calc(100%+8px)] left-0 right-0 h-[min(420px,52vh)]'
              : 'fixed bottom-20 right-5 h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))]'
          )}
        >
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs font-semibold text-white">Edit Assistant AI</p>
              <p className="text-[10px] text-zinc-500">Context-aware for this analysis</p>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'ml-6 bg-zinc-800 text-zinc-100'
                    : 'mr-4 bg-zinc-900 text-zinc-300'
                )}
              >
                {msg.content}
              </div>
            ))}
            {typing ? <p className="text-zinc-500">Thinking…</p> : null}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2 border-t border-zinc-800 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this edit…"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="rounded-xl bg-white p-2 text-black disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

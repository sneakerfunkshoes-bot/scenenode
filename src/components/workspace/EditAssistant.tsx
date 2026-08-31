'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';

const STARTER: ChatMessage[] = [
  {
    id: 'm0',
    role: 'assistant',
    content:
      'I\'m your Edit Assistant. Ask about cut timing, SFX placement, or how to recreate this breakdown in your selected NLE.',
    timestamp: new Date(),
  },
];

const REPLIES = [
  'That flash at 1.88s lands on the downbeat — in Premiere, drop a white solid for 1–2 frames and add a short opacity keyframe.',
  'For CapCut: place a whip-pan transition at 2.81s and ease the speed ramp over 4 frames around the beat.',
  'BPM is 128. Grid your timeline to 1/4 notes and snap hard cuts to every bar for that aggressive reel pacing.',
  'Try layering a reverse whoosh 120ms before the bass hit SFX so the cut feels anticipated rather than late.',
];

interface EditAssistantProps {
  software: string;
}

export function EditAssistant({ software }: EditAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    await new Promise((r) => setTimeout(r, 650 + Math.random() * 400));

    const reply =
      REPLIES[replyIndex.current % REPLIES.length] +
      ` (Target: ${software})`;
    replyIndex.current += 1;

    setMessages((m) => [
      ...m,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      },
    ]);
    setTyping(false);
  };

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-silver/10 bg-obsidian-50/80">
      <div className="flex items-center gap-2 border-b border-silver/10 px-3 py-2.5">
        <Sparkles size={14} className="text-silver-muted" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver-dim">
          Edit Assistant
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'rounded-md px-3 py-2 font-body text-[13px] leading-relaxed',
              msg.role === 'assistant'
                ? 'glass-panel text-silver-muted'
                : 'ml-4 border border-silver/15 bg-silver/10 text-silver'
            )}
          >
            {msg.content}
          </div>
        ))}
        {typing && (
          <div className="glass-panel w-fit rounded-md px-3 py-2 font-mono text-[11px] text-silver-dim">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-silver/10 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Ask about cuts, SFX, timing…"
            className="flex-1 resize-none rounded-sm border border-silver/12 bg-obsidian/70 px-3 py-2 font-body text-sm text-silver outline-none placeholder:text-silver-dim/60 focus:border-silver/35"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || typing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-silver/25 bg-silver/10 text-silver transition hover:bg-silver/20 disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

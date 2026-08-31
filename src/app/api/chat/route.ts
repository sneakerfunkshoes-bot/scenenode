import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { geminiConfigured } from '@/lib/gemini-analyze';
import {
  guardRateLimit,
  MAX_CHAT_MESSAGE_CHARS,
  MAX_JSON_BODY_BYTES,
  rejectOversizedBody,
} from '@/lib/security/api-guard';
import { recordChat, recordError, visitorIdFromRequest } from '@/lib/usage-stats';
import {
  CODE_REFUSAL,
  SCENECRAFT_SYSTEM_INSTRUCTION,
  isCodeRequest,
  isGreeting,
  isVideoLink,
  looksLikeProgrammingCode,
  wantsBreakdown,
} from '@/lib/scenecraft-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatTurn = { role?: string; content?: string };

function isRetryable(error: unknown): boolean {
  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    status === 503 ||
    status === 429 ||
    /503|429|UNAVAILABLE|high demand|overloaded|resource exhausted/i.test(msg)
  );
}

async function generateWithRetry(
  ai: GoogleGenAI,
  args: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxRetries = 3
) {
  let delay = 1000;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(args);
    } catch (error) {
      if (isRetryable(error) && attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Engine temporary high load. Please try again in a moment.');
}

function fallbackReply(message: string): string {
  if (isCodeRequest(message)) return CODE_REFUSAL;
  if (isGreeting(message)) {
    return "Hey! I'm scenenode AI — we can talk transitions, color, speed ramps, or CapCut / Premiere / AE / Resolve. What are you working on?";
  }
  return 'I can help with editing workflows, effects, and recreating looks. Paste a video link if you want a timestamped breakdown.';
}

export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'chat', 20, 60_000);
  if (limited) return limited;

  const oversized = rejectOversizedBody(req, MAX_JSON_BODY_BYTES);
  if (oversized) return oversized;

  const visitorId = visitorIdFromRequest(req);

  try {
    const body = (await req.json()) as {
      message?: string;
      history?: ChatTurn[];
      nle?: string;
      breakdownContext?: string;
    };

    const message = String(body.message ?? '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }
    if (message.length > MAX_CHAT_MESSAGE_CHARS) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 });
    }

    if (isCodeRequest(message)) {
      return NextResponse.json({ reply: CODE_REFUSAL });
    }

    if (!geminiConfigured()) {
      return NextResponse.json({ reply: fallbackReply(message) });
    }

    const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
    const contents = [
      ...history
        .filter((t) => t.content?.trim())
        .map((t) => ({
          role: t.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(t.content) }],
        })),
    ];

    let userText = message;
    if (isVideoLink(message)) {
      userText = `Analyze this video link for editing steps, transitions, overlays, and audio sync. Stay in editor language (no programming code):\n${message}`;
    } else if (wantsBreakdown(message) && body.breakdownContext) {
      userText = `${message}\n\nCurrent edit context (use only if relevant):\n${body.breakdownContext}`;
    } else if (body.nle && !isGreeting(message)) {
      userText = `Target NLE: ${body.nle}\n\n${message}`;
    }

    contents.push({ role: 'user', parts: [{ text: userText }] });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const response = await generateWithRetry(ai, {
      model,
      contents,
      config: { systemInstruction: SCENECRAFT_SYSTEM_INSTRUCTION },
    });

    let reply = response.text?.trim() || fallbackReply(message);
    if (looksLikeProgrammingCode(reply)) {
      reply = CODE_REFUSAL;
    }

    await recordChat(visitorId);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[chat]', error instanceof Error ? error.message : error);
    await recordError('chat', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(
      { error: 'Failed to process editing query.' },
      { status: 500 }
    );
  }
}

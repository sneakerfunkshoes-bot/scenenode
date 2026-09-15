import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { getCacheDir } from '@/lib/cache-dir';
import { geminiConfigured } from '@/lib/gemini-analyze';
import type { ExecutiveBriefing, FleetAppSnapshot } from '@/types/command-center';

const BRIEFING_FILE = path.join(getCacheDir(), 'command-briefings.json');

interface BriefingStore {
  byDate: Record<string, ExecutiveBriefing>;
}

export interface BriefingFacts {
  dailyRevenueInr: number;
  activeUsers: number;
  postsDispatched: number;
  fleet: FleetAppSnapshot[];
  formatInr: (n: number) => string;
}

function dateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

async function loadStore(): Promise<BriefingStore> {
  try {
    const raw = await readFile(BRIEFING_FILE, 'utf8');
    const parsed = JSON.parse(raw) as BriefingStore;
    return { byDate: parsed.byDate ?? {} };
  } catch {
    return { byDate: {} };
  }
}

async function saveStore(store: BriefingStore): Promise<void> {
  const keys = Object.keys(store.byDate).sort();
  if (keys.length > 14) {
    for (const key of keys.slice(0, keys.length - 14)) delete store.byDate[key];
  }
  await mkdir(path.dirname(BRIEFING_FILE), { recursive: true });
  await writeFile(BRIEFING_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function heuristicBriefing(facts: BriefingFacts, now = new Date()): ExecutiveBriefing {
  const scene = facts.fleet.find((a) => a.id === 'scenenode');
  const pune = facts.fleet.find((a) => a.id === 'pune_student_app');
  const clip = facts.fleet.find((a) => a.id === 'clipping_engine');
  const scripts = facts.fleet.find((a) => a.id === 'script_marketplace');

  const clauses: string[] = [];
  if (scene) {
    const n = scene.todayOutput;
    clauses.push(
      n > 0
        ? `SceneNode rendered ${n} ${n === 1 ? 'edit' : 'edits'} today`
        : 'SceneNode is live with no analyses yet today'
    );
  }
  if (scripts && scripts.todayOutput > 0) {
    const n = scripts.todayOutput;
    clauses.push(`Script Marketplace closed ${n} ${n === 1 ? 'unlock' : 'unlocks'}`);
  }
  if (pune) {
    const n = pune.todayOutput;
    clauses.push(
      n > 0
        ? `Pune App added ${n} ${n === 1 ? 'referral' : 'referrals'}`
        : 'Pune App has not pinged yet'
    );
  }
  if (clip && facts.postsDispatched > 0) {
    clauses.push(`${facts.postsDispatched} autonomous posts dispatched`);
  }

  clauses.push(`Total Revenue: ${facts.formatInr(facts.dailyRevenueInr)}`);

  const unhealthy = facts.fleet.filter((a) => a.status === 'error' || a.status === 'degraded');
  const closer =
    unhealthy.length === 0
      ? 'All systems operational.'
      : `${unhealthy.map((a) => a.name).join(', ')} ${unhealthy.length === 1 ? 'needs' : 'need'} attention.`;

  return {
    text: `${clauses.join('. ')}. ${closer}`,
    generatedAt: now.toISOString(),
    source: 'heuristic',
    dateKey: dateKey(now),
  };
}

async function geminiBriefing(facts: BriefingFacts): Promise<ExecutiveBriefing | null> {
  if (!geminiConfigured() || !process.env.GEMINI_API_KEY) return null;

  const payload = {
    revenue_inr: facts.dailyRevenueInr,
    active_users: facts.activeUsers,
    posts_dispatched: facts.postsDispatched,
    fleet: facts.fleet.map((app) => ({
      id: app.id,
      name: app.name,
      status: app.status,
      today_output: app.todayOutput,
      last_event_at: app.lastEventAt,
      errors: app.errorCount,
    })),
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `You are chief of staff to the CEO of a multi-app software holding company (Velop). Write a 2-4 sentence daily executive briefing from this JSON. Mention SceneNode, Script Marketplace, Clipping Engine, and Pune Student App by name when they have signal. Use ₹ for money. End with overall health and one recommended action if anything is degraded or awaiting its first ping. No markdown, no bullets.\n\n${JSON.stringify(payload)}`,
    });
    const text = response.text?.trim();
    if (!text) return null;
    return {
      text: text.slice(0, 900),
      generatedAt: new Date().toISOString(),
      source: 'gemini',
      dateKey: dateKey(),
    };
  } catch (err) {
    console.error('[command-briefing]', err);
    return null;
  }
}

export async function getOrCreateBriefing(facts: BriefingFacts): Promise<ExecutiveBriefing> {
  const key = dateKey();
  const store = await loadStore();
  const cached = store.byDate[key];
  if (cached?.source === 'gemini' && cached.text) return cached;
  return heuristicBriefing(facts);
}

export async function refreshBriefing(facts: BriefingFacts): Promise<ExecutiveBriefing> {
  const generated = (await geminiBriefing(facts)) ?? heuristicBriefing(facts);
  const store = await loadStore();
  store.byDate[generated.dateKey] = generated;
  await saveStore(store);
  return generated;
}

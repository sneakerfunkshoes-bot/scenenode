import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { hashString } from '@/lib/url-hash';

const STATS_FILE = path.join(process.cwd(), '.cache', 'usage-stats.json');
const MAX_UNIQUE = 10_000;
const MAX_RECENT = 50;

export interface UsageStats {
  totalPageViews: number;
  totalAnalyses: number;
  totalChatMessages: number;
  totalErrors: number;
  uniqueVisitors: string[];
  daily: Record<string, { pageViews: number; analyses: number; chats: number }>;
  firstVisit: string;
  lastActivity: string;
  recentEvents: Array<{ type: string; at: string; meta?: string }>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadStats(): Promise<UsageStats> {
  try {
    const raw = await readFile(STATS_FILE, 'utf8');
    return JSON.parse(raw) as UsageStats;
  } catch {
    const now = new Date().toISOString();
    return {
      totalPageViews: 0,
      totalAnalyses: 0,
      totalChatMessages: 0,
      totalErrors: 0,
      uniqueVisitors: [],
      daily: {},
      firstVisit: now,
      lastActivity: now,
      recentEvents: [],
    };
  }
}

async function saveStats(stats: UsageStats): Promise<void> {
  await mkdir(path.dirname(STATS_FILE), { recursive: true });
  await writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
}

function bumpDaily(stats: UsageStats, field: 'pageViews' | 'analyses' | 'chats') {
  const day = todayKey();
  if (!stats.daily[day]) {
    stats.daily[day] = { pageViews: 0, analyses: 0, chats: 0 };
  }
  stats.daily[day][field]++;
}

function addEvent(stats: UsageStats, type: string, meta?: string) {
  stats.recentEvents.unshift({ type, at: new Date().toISOString(), meta });
  if (stats.recentEvents.length > MAX_RECENT) {
    stats.recentEvents.length = MAX_RECENT;
  }
}

function trackVisitor(stats: UsageStats, visitorId: string) {
  if (!stats.uniqueVisitors.includes(visitorId)) {
    stats.uniqueVisitors.push(visitorId);
    if (stats.uniqueVisitors.length > MAX_UNIQUE) {
      stats.uniqueVisitors = stats.uniqueVisitors.slice(-MAX_UNIQUE);
    }
  }
}

export function visitorIdFromRequest(req: Request): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const ua = req.headers.get('user-agent') || '';
  return hashString(`${ip}::${ua.slice(0, 120)}`);
}

export async function recordPageView(visitorId: string, pagePath?: string): Promise<void> {
  const stats = await loadStats();
  stats.totalPageViews++;
  bumpDaily(stats, 'pageViews');
  trackVisitor(stats, visitorId);
  stats.lastActivity = new Date().toISOString();
  addEvent(stats, 'page_view', pagePath);
  await saveStats(stats);
}

export async function recordAnalysis(visitorId: string, source?: string): Promise<void> {
  const stats = await loadStats();
  stats.totalAnalyses++;
  bumpDaily(stats, 'analyses');
  trackVisitor(stats, visitorId);
  stats.lastActivity = new Date().toISOString();
  addEvent(stats, 'analysis', source);
  await saveStats(stats);
}

export async function recordChat(visitorId: string): Promise<void> {
  const stats = await loadStats();
  stats.totalChatMessages++;
  bumpDaily(stats, 'chats');
  trackVisitor(stats, visitorId);
  stats.lastActivity = new Date().toISOString();
  addEvent(stats, 'chat');
  await saveStats(stats);
}

export async function recordError(type: string, message?: string): Promise<void> {
  const stats = await loadStats();
  stats.totalErrors++;
  stats.lastActivity = new Date().toISOString();
  addEvent(stats, 'error', `${type}${message ? `: ${message.slice(0, 120)}` : ''}`);
  await saveStats(stats);
}

export async function getAdminSummary() {
  const stats = await loadStats();
  const days = Object.keys(stats.daily).sort().slice(-14);

  return {
    totalPageViews: stats.totalPageViews,
    uniqueVisitors: stats.uniqueVisitors.length,
    totalAnalyses: stats.totalAnalyses,
    totalChatMessages: stats.totalChatMessages,
    totalErrors: stats.totalErrors,
    firstVisit: stats.firstVisit,
    lastActivity: stats.lastActivity,
    last14Days: days.map((date) => ({ date, ...stats.daily[date] })),
    recentEvents: stats.recentEvents,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    forceMock: process.env.FORCE_MOCK_ANALYSIS === '1',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}

export const FLEET_PROJECT_IDS = [
  'scenenode',
  'script_marketplace',
  'clipping_engine',
  'pune_student_app',
] as const;

export type FleetProjectId = (typeof FLEET_PROJECT_IDS)[number];

export type FleetHealth = 'online' | 'degraded' | 'error' | 'awaiting';

export interface FleetAppDef {
  id: FleetProjectId;
  name: string;
  blurb: string;
  href: string;
  links: Array<{ label: string; href: string }>;
}

export interface FleetAppSnapshot {
  id: FleetProjectId;
  name: string;
  blurb: string;
  href: string;
  links: Array<{ label: string; href: string }>;
  status: FleetHealth;
  todayOutput: number;
  outputLabel: string;
  lastEventAt: string | null;
  errorCount: number;
}

export interface CommandMetricCard {
  id: 'revenue' | 'users' | 'health' | 'posts';
  label: string;
  value: string;
  hint: string;
  tone: 'ok' | 'warn' | 'error' | 'neutral';
}

export interface AgentLogLine {
  id: string;
  timestamp: string;
  level: 'ok' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

export interface ExecutiveBriefing {
  text: string;
  generatedAt: string;
  source: 'gemini' | 'heuristic';
  dateKey: string;
}

export interface CommandCenterSummary {
  generatedAt: string;
  briefing: ExecutiveBriefing;
  metrics: CommandMetricCard[];
  fleet: FleetAppSnapshot[];
  logs: AgentLogLine[];
  totals: {
    dailyRevenueInr: number;
    activeUsers: number;
    postsDispatched: number;
    systemsOnline: number;
    systemsTotal: number;
  };
}

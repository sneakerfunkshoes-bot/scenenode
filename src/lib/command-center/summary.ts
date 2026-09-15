import { FLEET_APPS, resolveFleetProject } from '@/lib/command-center/fleet';
import { getOrCreateBriefing } from '@/lib/command-center/briefing';
import { listRecentPayments } from '@/lib/script-payments';
import { listTelemetryEvents } from '@/lib/telemetry';
import { getAdminSummary } from '@/lib/usage-stats';
import type {
  AgentLogLine,
  CommandCenterSummary,
  CommandMetricCard,
  FleetAppSnapshot,
  FleetHealth,
  FleetProjectId,
} from '@/types/command-center';
import type { TelemetryEvent } from '@/types/growth';

const OUTPUT_EVENTS = new Set([
  'analyze_completed',
  'remix_created',
  'render_completed',
  'video_rendered',
  'clip_exported',
  'assignment_completed',
  'download',
  'sale',
  'revenue',
  'credit_purchase',
]);

const POST_EVENTS = new Set(['post_dispatched', 'post_published', 'autopost']);
const REFERRAL_EVENTS = new Set(['referral', 'referral_secured']);
const ERROR_EVENTS = new Set(['error', 'health_error', 'crash']);

const OUTPUT_LABEL: Record<FleetProjectId, string> = {
  scenenode: 'edits today',
  script_marketplace: 'unlocks today',
  clipping_engine: 'clips today',
  pune_student_app: 'assignments today',
};

function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function isToday(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) === todayKey(now);
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function eventRevenueInr(event: TelemetryEvent): number {
  const m = event.metrics ?? {};
  const keys = ['revenue_inr', 'amount_inr', 'inr', 'revenue'];
  for (const key of keys) {
    const n = asNumber(m[key]);
    if (n && n > 0) return n;
  }
  const amount = asNumber(m.amount);
  if (!amount || amount <= 0) return 0;
  if (m.currency === 'paise' || m.unit === 'paise') return amount / 100;
  return amount;
}

function eventActiveUsers(event: TelemetryEvent): number {
  const m = event.metrics ?? {};
  return asNumber(m.active_users) ?? asNumber(m.users) ?? asNumber(m.unique_users) ?? 0;
}

function isErrorEvent(event: TelemetryEvent): boolean {
  if (ERROR_EVENTS.has(event.event_type)) return true;
  if (/error|fail|crash/i.test(event.event_type)) return true;
  return event.metrics?.ok === false;
}

function formatInr(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
}

function statusForApp(
  lastEventAt: string | null,
  errorCount: number,
  fallbackOnline: boolean
): FleetHealth {
  if (errorCount > 0 && lastEventAt) {
    const age = Date.now() - new Date(lastEventAt).getTime();
    if (age < 30 * 60 * 1000) return 'error';
  }
  if (!lastEventAt && !fallbackOnline) return 'awaiting';
  const ts = lastEventAt ? new Date(lastEventAt).getTime() : Date.now();
  const age = Date.now() - ts;
  if (age > 6 * 60 * 60 * 1000 && !fallbackOnline) return 'degraded';
  if (age > 24 * 60 * 60 * 1000 && !fallbackOnline) return 'degraded';
  return 'online';
}

function logLevel(event: TelemetryEvent): AgentLogLine['level'] {
  if (isErrorEvent(event)) return 'error';
  if (/warn|degraded|timeout/i.test(event.event_type)) return 'warn';
  if (POST_EVENTS.has(event.event_type) || OUTPUT_EVENTS.has(event.event_type)) return 'ok';
  if (event.event_type === 'heartbeat' || event.event_type === 'health') return 'ok';
  return 'info';
}

function logMessage(event: TelemetryEvent): string {
  const metricBits = event.metrics
    ? Object.entries(event.metrics)
        .slice(0, 4)
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join(' ')
    : '';
  const label = event.event_type.replace(/_/g, ' ');
  return metricBits ? `${label} · ${metricBits}` : label;
}

export async function buildCommandCenterSummary(): Promise<CommandCenterSummary> {
  const [events, usage, payments] = await Promise.all([
    listTelemetryEvents(500),
    getAdminSummary(),
    listRecentPayments(400),
  ]);

  const now = new Date();
  const todayEvents = events.filter((ev) => isToday(ev.timestamp, now));
  const paidToday = payments.filter((p) => p.status === 'paid' && isToday(p.paidAt, now));
  const scriptRevenue = paidToday.reduce((sum, p) => sum + (p.amount || 0), 0);

  const telemetryRevenue = todayEvents.reduce((sum, ev) => sum + eventRevenueInr(ev), 0);
  const hasScriptTelemetryRevenue = todayEvents.some(
    (ev) => resolveFleetProject(ev.project_name) === 'script_marketplace' && eventRevenueInr(ev) > 0
  );
  const dailyRevenueInr = telemetryRevenue + (hasScriptTelemetryRevenue ? 0 : scriptRevenue);
  const postsDispatched = todayEvents.filter((ev) => POST_EVENTS.has(ev.event_type)).length;

  const telemetryUsers = todayEvents.reduce((sum, ev) => sum + eventActiveUsers(ev), 0);
  const sceneDailySessions =
    usage.last14Days.find((d) => d.date === todayKey(now))?.pageViews ?? 0;
  const activeUsers = Math.max(telemetryUsers, sceneDailySessions);

  const lastByProject = new Map<string, string>();
  const outputByProject = new Map<FleetProjectId, number>();
  const errorsByProject = new Map<FleetProjectId, number>();

  for (const ev of events) {
    const project = resolveFleetProject(ev.project_name);
    if (!lastByProject.has(ev.project_name)) lastByProject.set(ev.project_name, ev.timestamp);
    if (!project) continue;
    if (isToday(ev.timestamp, now)) {
      if (
        OUTPUT_EVENTS.has(ev.event_type) ||
        POST_EVENTS.has(ev.event_type) ||
        REFERRAL_EVENTS.has(ev.event_type)
      ) {
        outputByProject.set(project, (outputByProject.get(project) ?? 0) + 1);
      }
      if (isErrorEvent(ev)) {
        errorsByProject.set(project, (errorsByProject.get(project) ?? 0) + 1);
      }
    }
  }

  const sceneAnalysesToday =
    usage.last14Days.find((d) => d.date === todayKey(now))?.analyses ?? 0;
  outputByProject.set(
    'scenenode',
    Math.max(outputByProject.get('scenenode') ?? 0, sceneAnalysesToday)
  );
  outputByProject.set(
    'script_marketplace',
    Math.max(outputByProject.get('script_marketplace') ?? 0, paidToday.length)
  );

  const sceneLast =
    lastByProject.get('scenenode') || usage.lastActivity || null;
  const sceneOnline = Boolean(usage.lastActivity);

  const fleet: FleetAppSnapshot[] = FLEET_APPS.map((app) => {
    const lastEventAt =
      app.id === 'scenenode'
        ? sceneLast
        : lastByProject.get(app.id) ?? null;
    const todayOutput = outputByProject.get(app.id) ?? 0;
    const errorCount = errorsByProject.get(app.id) ?? 0;
    return {
      ...app,
      status: statusForApp(lastEventAt, errorCount, app.id === 'scenenode' && sceneOnline),
      todayOutput,
      outputLabel: OUTPUT_LABEL[app.id],
      lastEventAt,
      errorCount,
    };
  });

  const systemsOnline = fleet.filter((app) => app.status === 'online').length;
  const hasError = fleet.some((app) => app.status === 'error');
  const hasDegraded = fleet.some((app) => app.status === 'degraded');

  const healthTone: CommandMetricCard['tone'] = hasError
    ? 'error'
    : hasDegraded
      ? 'warn'
      : systemsOnline > 0
        ? 'ok'
        : 'neutral';

  const healthValue = hasError
    ? 'Incident'
    : hasDegraded
      ? 'Degraded'
      : systemsOnline === fleet.length
        ? 'All green'
        : `${systemsOnline}/${fleet.length} live`;

  const metrics: CommandMetricCard[] = [
    {
      id: 'revenue',
      label: 'Total Daily Revenue',
      value: formatInr(dailyRevenueInr),
      hint: paidToday.length
        ? `${paidToday.length} marketplace unlock${paidToday.length === 1 ? '' : 's'}`
        : 'Ingest `revenue_inr` from each app',
      tone: dailyRevenueInr > 0 ? 'ok' : 'neutral',
    },
    {
      id: 'users',
      label: 'Active Users Across Apps',
      value: String(activeUsers),
      hint: sceneDailySessions
        ? `${sceneDailySessions} SceneNode sessions today`
        : 'Waiting on user_activity pings',
      tone: activeUsers > 0 ? 'ok' : 'neutral',
    },
    {
      id: 'health',
      label: 'Server Health Status',
      value: healthValue,
      hint: `${systemsOnline} of ${fleet.length} fleet nodes reporting`,
      tone: healthTone,
    },
    {
      id: 'posts',
      label: 'Autonomous Posts Dispatched',
      value: String(postsDispatched),
      hint: 'Clipping engine `post_dispatched` events',
      tone: postsDispatched > 0 ? 'ok' : 'neutral',
    },
  ];

  const logs: AgentLogLine[] = events.slice(0, 80).map((ev, i) => ({
    id: ev.id || `${ev.timestamp}-${i}`,
    timestamp: ev.timestamp,
    level: logLevel(ev),
    source: ev.project_name || 'system',
    message: logMessage(ev),
  }));

  if (logs.length === 0) {
    logs.push({
      id: 'boot',
      timestamp: now.toISOString(),
      level: 'info',
      source: 'command',
      message: 'Command center online. Awaiting fleet telemetry on POST /api/telemetry.',
    });
  }

  const briefing = await getOrCreateBriefing({
    dailyRevenueInr,
    activeUsers,
    postsDispatched,
    fleet,
    formatInr,
  });

  return {
    generatedAt: now.toISOString(),
    briefing,
    metrics,
    fleet,
    logs,
    totals: {
      dailyRevenueInr,
      activeUsers,
      postsDispatched,
      systemsOnline,
      systemsTotal: fleet.length,
    },
  };
}

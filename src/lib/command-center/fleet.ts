import type { FleetAppDef, FleetProjectId } from '@/types/command-center';
import { FLEET_PROJECT_IDS } from '@/types/command-center';

export const FLEET_APPS: FleetAppDef[] = [
  {
    id: 'scenenode',
    name: 'SceneNode',
    blurb: 'Celeb Edit SaaS — deconstruct, remix, and recreate short-form edits.',
    href: '/inspect',
    links: [
      { label: 'Inspect', href: '/inspect' },
      { label: 'Admin', href: '/admin' },
    ],
  },
  {
    id: 'script_marketplace',
    name: 'Script Marketplace',
    blurb: 'Paid AE / Premiere / CapCut script unlocks and downloads.',
    href: '/download',
    links: [{ label: 'Download hub', href: '/download' }],
  },
  {
    id: 'clipping_engine',
    name: 'Clipping Engine',
    blurb: 'Autonomous clipping and social auto-posting workforce.',
    href: '/command',
    links: [{ label: 'Awaiting plug-in', href: '/command' }],
  },
  {
    id: 'pune_student_app',
    name: 'Pune Student App',
    blurb: 'Assignment workflow with referral growth loop.',
    href: '/command',
    links: [{ label: 'Awaiting plug-in', href: '/command' }],
  },
];

const ALIASES: Record<string, FleetProjectId> = {
  scenenode: 'scenenode',
  scenecraft: 'scenenode',
  'celeb-edit': 'scenenode',
  script_marketplace: 'script_marketplace',
  scripts: 'script_marketplace',
  marketplace: 'script_marketplace',
  clipping_engine: 'clipping_engine',
  clipping: 'clipping_engine',
  autopost: 'clipping_engine',
  pune_student_app: 'pune_student_app',
  pune: 'pune_student_app',
  student: 'pune_student_app',
};

export function isFleetProjectId(value: string): value is FleetProjectId {
  return (FLEET_PROJECT_IDS as readonly string[]).includes(value);
}

export function normalizeProjectName(raw: string | undefined | null): string {
  const slug = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s.]+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 64);
  if (!slug) return 'scenenode';
  return ALIASES[slug] ?? slug;
}

export function resolveFleetProject(raw: string | undefined | null): FleetProjectId | null {
  const normalized = normalizeProjectName(raw);
  return isFleetProjectId(normalized) ? normalized : null;
}

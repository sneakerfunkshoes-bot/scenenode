import { CommandCenter } from '@/components/command/CommandCenter';

export const dynamic = 'force-dynamic';

/** Holding-company control tower. Product workspace stays at /inspect (via /dashboard). */
export default function CommandPage() {
  return <CommandCenter />;
}

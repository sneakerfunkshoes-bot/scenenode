import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getRemixPayload } from '@/lib/remix-store';

interface PageProps {
  params: { code: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const remix = await getRemixPayload(params.code);
  if (!remix) return { title: 'Remix not found' };
  const title = remix.songTitle
    ? `Remix · ${remix.songTitle}`
    : `Remix ${remix.code}`;
  return {
    title,
    description: `Open this SceneNode remix — ${remix.breakdown.effects?.length ?? 0} mapped effects, ready to recreate.`,
  };
}

export default async function RemixPage({ params }: PageProps) {
  const remix = await getRemixPayload(params.code);
  if (!remix) notFound();
  redirect(`/inspect?workspace=1&remix=${encodeURIComponent(remix.code)}`);
}

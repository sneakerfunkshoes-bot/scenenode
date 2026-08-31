import type { Metadata } from 'next';
import { InspectFlow } from '@/components/inspect/InspectFlow';

export const metadata: Metadata = {
  title: 'Inspect | scenenode',
  description:
    'Paste a TikTok, Reel, or Shorts link to reverse-engineer the edit — scene context, overlays, and step-by-step NLE recreation.',
};

export default function InspectPage() {
  return <InspectFlow />;
}

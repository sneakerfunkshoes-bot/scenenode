import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  SEO_TEMPLATE_SEEDS,
  seoDescription,
  seoTitle,
} from '@/lib/seo-templates';

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return SEO_TEMPLATE_SEEDS.map((seed) => ({ slug: seed.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const seed = SEO_TEMPLATE_SEEDS.find((s) => s.slug === params.slug);
  if (!seed) return { title: 'Edit template' };
  return {
    title: seoTitle(seed),
    description: seoDescription(seed),
    openGraph: {
      title: seoTitle(seed),
      description: seoDescription(seed),
    },
  };
}

export default function SeoTemplatePage({ params }: PageProps) {
  const seed = SEO_TEMPLATE_SEEDS.find((s) => s.slug === params.slug);
  if (!seed) notFound();

  return (
    <main className="min-h-screen bg-black px-5 pb-16 pt-20 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          SceneNode · Edit template
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
          {seed.celebrity} {seed.audioType} edit breakdown
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
          {seed.blurb}
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          Vibe · {seed.vibe}. Paste any similar TikTok, Reel, or Shorts link and SceneNode maps
          beats, transitions, and NLE steps so you can rebuild the edit.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/inspect?workspace=1&from=seo"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Open in SceneNode
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            Learn more
          </Link>
        </div>

        <section className="mt-14 border-t border-zinc-900 pt-10">
          <h2 className="text-lg font-bold">What you get</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li>· Beat-true timeline with BPM and cut points</li>
            <li>· Named effects and transitions (not vague “zoom / cut”)</li>
            <li>· Step maps for CapCut, Premiere, After Effects, DaVinci, VN</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

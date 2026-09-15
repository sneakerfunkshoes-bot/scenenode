import type { MetadataRoute } from 'next';
import { SEO_TEMPLATE_SEEDS } from '@/lib/seo-templates';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://scenenode.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const siteBase = site.replace(/\/$/, '');

  return [
    { url: siteBase, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteBase}/inspect`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteBase}/download`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...SEO_TEMPLATE_SEEDS.map((seed) => ({
      url: `${siteBase}/template/${seed.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}

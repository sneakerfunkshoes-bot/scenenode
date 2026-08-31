import type { MetadataRoute } from 'next';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://scenenode.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site}/inspect`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site}/download`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}

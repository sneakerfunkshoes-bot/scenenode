'use client';

import { socialEmbedUrl } from '@/lib/video-url';

interface SocialVideoEmbedProps {
  sourceUrl: string;
  title?: string;
}

export function SocialVideoEmbed({ sourceUrl, title = 'Reference reel' }: SocialVideoEmbedProps) {
  const embedUrl = socialEmbedUrl(sourceUrl);
  if (!embedUrl) return null;

  return (
    <iframe
      src={embedUrl}
      title={title}
      className="absolute inset-0 h-full w-full border-0 bg-black"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

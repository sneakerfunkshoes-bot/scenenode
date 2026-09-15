export type SeoTemplateSeed = {
  slug: string;
  celebrity: string;
  audioType: string;
  vibe: string;
  blurb: string;
};

/** Seed set for programmatic long-tail SEO pages. Expand over time. */
export const SEO_TEMPLATE_SEEDS: SeoTemplateSeed[] = [
  {
    slug: 'zendaya-phonk-beat-sync',
    celebrity: 'Zendaya',
    audioType: 'phonk',
    vibe: 'cinematic punch-ins',
    blurb: 'Deconstruct Zendaya-style phonk edits — whip cuts, flash frames, and teal-orange grades.',
  },
  {
    slug: 'timothee-chalamet-slowed-reverb',
    celebrity: 'Timothée Chalamet',
    audioType: 'slowed + reverb',
    vibe: 'dreamy match cuts',
    blurb: 'Break down slowed-reverb Timothée edits into beat maps and CapCut / Premiere steps.',
  },
  {
    slug: 'taylor-swift-hype-cut',
    celebrity: 'Taylor Swift',
    audioType: 'stadium pop drop',
    vibe: 'flash + stutter',
    blurb: 'Map every flash and multi-image stutter on a Taylor Swift hype cut.',
  },
  {
    slug: 'drake-trap-hard-cut',
    celebrity: 'Drake',
    audioType: 'trap 808',
    vibe: 'hard cuts on kick',
    blurb: 'Learn how Drake trap edits land hard cuts and zooms on the 808.',
  },
  {
    slug: 'bts-kpop-transition',
    celebrity: 'BTS',
    audioType: 'K-pop chorus',
    vibe: 'spin + whip pan',
    blurb: 'Reverse-engineer K-pop chorus transitions — spins, whip pans, and kinetic text.',
  },
  {
    slug: 'anime-edit-nightcore',
    celebrity: 'anime montage',
    audioType: 'nightcore',
    vibe: 'glitch + RGB split',
    blurb: 'Deconstruct nightcore anime edits into glitch cuts, RGB splits, and speed ramps.',
  },
  {
    slug: 'football-skill-bass-boost',
    celebrity: 'football skills',
    audioType: 'bass boosted',
    vibe: 'impact shakes',
    blurb: 'Break down bass-boosted football skill edits — impact shakes and freeze frames.',
  },
  {
    slug: 'car-edit-phonk-drift',
    celebrity: 'car culture',
    audioType: 'drift phonk',
    vibe: 'speed ramp + light leak',
    blurb: 'Deconstruct drift-phonk car edits into speed ramps, light leaks, and grade shifts.',
  },
];

export function seoTitle(seed: SeoTemplateSeed): string {
  return `${seed.celebrity} ${seed.audioType} edit breakdown`;
}

export function seoDescription(seed: SeoTemplateSeed): string {
  return `${seed.blurb} Open in SceneNode to paste any similar Reel/TikTok and get a full recreation guide.`;
}

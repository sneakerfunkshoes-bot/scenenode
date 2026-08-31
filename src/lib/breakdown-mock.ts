import type {
  BreakdownEffect,
  NleSoftware,
  NleTutorialMap,
  TutorialStep,
  VideoBreakdownRecord,
} from '@/types/breakdown';
import { condenseEffects } from '@/lib/effect-condense';
import { hashString, stableBreakdownId } from '@/lib/url-hash';

function steps(
  items: Array<[string, string]>
): TutorialStep[] {
  return items.map(([title, detail], i) => ({
    order: i + 1,
    title,
    detail,
  }));
}

function tutorials(map: {
  davinci: Array<[string, string]>;
  premiere: Array<[string, string]>;
  ae: Array<[string, string]>;
  capcut: Array<[string, string]>;
  vn: Array<[string, string]>;
}): NleTutorialMap {
  return {
    'DaVinci Resolve': steps(map.davinci),
    'Premiere Pro': steps(map.premiere),
    'After Effects': steps(map.ae),
    CapCut: steps(map.capcut),
    'VN Editor': steps(map.vn),
  };
}

function fx(
  id: string,
  timestamp: number,
  timestampEnd: number | undefined,
  type: BreakdownEffect['type'],
  description: string,
  sceneContext: string,
  overlayElements: string,
  map: Parameters<typeof tutorials>[0]
): BreakdownEffect {
  return {
    id,
    timestamp,
    timestampEnd,
    type,
    description,
    sceneContext,
    overlayElements,
    tutorials: tutorials(map),
  };
}

const FRAME = 1 / 30;

const EFFECTS: BreakdownEffect[] = [
  fx(
    'fx-1',
    0,
    8.5,
    'Overlay',
    'Intro Slow Zoom & Dynamic Text Glow',
    'Opening hold: camera eases in on the subject while glowing title text stays locked on screen through 00:08.50.',
    'Dynamic Text Glow, Slow Scale Zoom 100→112, Outer Glow Preset',
    {
      davinci: [
        ['Text+', 'Edit page → Titles → Text+. Enable Glow and keep the layer for 8.5s.'],
        ['Zoom', 'Inspector → Zoom 1.00 → 1.12 with ease-in across 00:00–00:08.50.'],
        ['Hold', 'Do not cut this beat — it is one continuous intro, not a montage.'],
      ],
      premiere: [
        ['Essential Graphics', 'Add glowing title; Outer Glow on the text layer for the full intro.'],
        ['Scale', 'Keyframe Scale 100 → 112 from 00:00:00:00 to 00:00:08:15.'],
        ['Ease', 'Bezier the scale so the move stays slow until the drop.'],
      ],
      ae: [
        ['Text + Glow', 'New Text layer; Effect → Glow. Hold visibility 0–8.5s.'],
        ['Scale', 'Animate Scale 100 → 112 with Easy Ease over 8.5 seconds.'],
        ['Parent', 'Parent text to a null if you need to keep it screen-center while zooming.'],
      ],
      capcut: [
        ['Text effects', 'Text → Luminous / Outer Glow. Duration 8.5s.'],
        ['Keyframe', 'Scale 100% → 112% across the intro, ease in.'],
        ['Pin', 'Keep the text overlay on for the whole slow zoom — do not split it.'],
      ],
      vn: [
        ['Text glow', 'Text → Glow/Neon. Stretch the clip to 8.5s.'],
        ['Zoom', 'Add slow Zoom keyframes 100 → 112.'],
        ['Timing', 'Leave as one clip until the drop at 8.64s.'],
      ],
    }
  ),
  fx(
    'fx-2',
    8.64,
    9.11,
    'Flash',
    'Drop Impact: Whip Blur + White Flash Exposure',
    'Bass drop hit: directional whip blur streaks the frame, then a 2–4 frame white exposure flash punches the cut.',
    'Directional Motion Blur (horizontal), White Exposure Flash, Impact SFX',
    {
      davinci: [
        ['Directional Blur', 'Fusion → Directional Blur, Length 0 → 28 over 4 frames, Angle 0°.'],
        ['Flash', 'White generator 3 frames at 8.64s, Composite Add, opacity 55%.'],
        ['Align', 'Park the flash peak on the downbeat at 8.64s.'],
      ],
      premiere: [
        ['Directional Blur', 'Effects → Directional Blur. Direction 0°, Length 0 → 25 in 4 frames.'],
        ['Exposure', 'Adjustment layer Exposure +2 for 3 frames, then cut.'],
        ['Nest', 'Nest if stacking blur + flash on the same hit.'],
      ],
      ae: [
        ['CC Vector Blur / Directional', 'CC Directional Blur 0 → 40, Direction 0° on the hit.'],
        ['Flash', 'White solid, Add mode, 3 frames at 8;19.'],
        ['Motion blur', 'Enable layer motion blur for the whip.'],
      ],
      capcut: [
        ['Whip + Flash', 'Effects → Whip / Motion Blur + Flash. Span 8.64–9.11.'],
        ['Length', 'Keep the flash under 4 frames.'],
        ['Beat snap', 'Snap both effects to the drop marker.'],
      ],
      vn: [
        ['Blur', 'Insert Directional/Whip blur at 8.64s.'],
        ['Flash', 'White flash sticker 3 frames.'],
        ['Mix', 'Lower flash to ~50% so highlights do not clip for long.'],
      ],
    }
  ),
  fx(
    'fx-3',
    9.12,
    11.02,
    'CC',
    'Quality CC Color Grade (HDR Sharpen + High Contrast)',
    'Post-drop grade locks in: HDR-style sharpen, crushed blacks, high contrast, slightly lifted highlights.',
    'HDR Sharpen, High-Contrast Curve, Midtone Contrast, Fine Grain',
    {
      davinci: [
        ['Color page', 'Primaries: lift down slightly, gamma contrast up, gain +0.05.'],
        ['Sharpen', 'OpenFX Sharpen / Midtone Detail +15 on this range only.'],
        ['Node', 'Limit the node to 9.12–11.02 so the intro grade stays separate.'],
      ],
      premiere: [
        ['Lumetri', 'Creative contrast +20, Sharpen +25, Blacks -10 on an adjustment layer.'],
        ['Range', 'Trim the adjustment to 00:00:09:04 – 00:00:11:00.'],
        ['Skin', 'Protect skin with HSL Secondary if faces are in frame.'],
      ],
      ae: [
        ['Lumetri / Curves', 'S-curve on RGB; Sharpen 15–25; noise 2%.'],
        ['Precomp', 'Precomp the shot and trim the grade 9.12–11.02.'],
        ['HDR feel', 'Slight unsharp mask + contrast, not a LUT dump.'],
      ],
      capcut: [
        ['Adjust', 'Contrast +20, Sharpen +30, Highlights +5, Shadows -10.'],
        ['Filters', 'Light cinematic filter at 30% if needed.'],
        ['Span', 'Apply only on the 9.12–11.02 clip, not the whole video.'],
      ],
      vn: [
        ['Color', 'Contrast up, sharpen on, shadows down.'],
        ['Filter', 'Cinematic filter ~25%.'],
        ['Trim', 'Keep the grade on this segment only.'],
      ],
    }
  ),
  fx(
    'fx-4',
    11.03,
    13.4,
    'Rotation',
    '360° Z-Axis Rotation Roll + Directional Blur Pass',
    'Full Z-axis barrel roll through 360° while a directional blur pass hides the midpoint of the spin.',
    'Z-Rotation 0→360°, Directional Blur 90°, Motion Blur samples',
    {
      davinci: [
        ['Transform', 'Inspector Rotation 0 → 360 across 11.03–13.40. Linear then ease out.'],
        ['Blur pass', 'Fusion Directional Blur Angle 90°, peak Length 22 at 180°.'],
        ['Anchor', 'Keep anchor at frame center so the roll does not drift.'],
      ],
      premiere: [
        ['Rotation', 'Motion → Rotation 0 to 360. Keyframe 11.03 and 13.40.'],
        ['Directional Blur', 'Angle 90°, Length peaks mid-spin then returns to 0.'],
        ['Anchor', 'Set Anchor Point to clip center before rotating.'],
      ],
      ae: [
        ['Rotation', 'Rotation 0x+0 → 1x+0 (360°) over 2.37s.'],
        ['CC Directional Blur', 'Direction 90°, Blur Length 0 → 30 → 0 keyed to 180°.'],
        ['Motion blur', 'Samples 16+ so the roll reads as a smear, not strobing.'],
      ],
      capcut: [
        ['Rotate', 'Keyframe Rotate 0° → 360° on the clip.'],
        ['Motion blur', 'Effects → Motion Blur / Directional Blur during the spin.'],
        ['Center', 'Pin the subject center so the roll stays on axis.'],
      ],
      vn: [
        ['Rotate', 'Transform rotate 0 to 360.'],
        ['Blur', 'Add directional blur mid-roll.'],
        ['Timing', 'Finish the 360 by 13.40s, then cut clean.'],
      ],
    }
  ),
  fx(
    'fx-5a',
    13.5,
    13.5 + FRAME * 2,
    'Stutter',
    'Rapid Flavor Multi-Image Stutter — frame 1/5',
    'First 2-frame flavor still: image A holds for 2 frames then swaps.',
    'Still frame hold (2 frames), Hard cut, No dissolve',
    {
      davinci: [
        ['Blade', 'Blade a 2-frame still at 13.50s (00:00:13:15 at 30fps).'],
        ['Hold', 'Retime → Freeze or use a still PNG for those 2 frames.'],
        ['No blend', 'Cut, do not dissolve between flavor stills.'],
      ],
      premiere: [
        ['Razor', 'Cut a 2-frame slice at 13.50s.'],
        ['Frame hold', 'Clip → Video Options → Frame Hold or drop still 1.'],
        ['Snap', 'Disable transition defaults so swaps stay 2 frames.'],
      ],
      ae: [
        ['Time freeze', 'Time Remap hold for 2 frames at 13.50s.'],
        ['Still', 'Or swap in flavor still 1, duration 2 frames.'],
        ['Hold keyframes', 'Use hold keyframes, not linear.'],
      ],
      capcut: [
        ['Split', 'Split a 2-frame clip at 13.50s and overlay still 1.'],
        ['Speed', 'Do not speed-ramp this — it is a still swap.'],
        ['Align', 'Cut on the beat grid.'],
      ],
      vn: [
        ['Split', '2-frame clip + still overlay.'],
        ['Cut', 'Hard cut to the next still.'],
        ['Duration', 'Keep exactly 2 frames.'],
      ],
    }
  ),
  fx(
    'fx-5b',
    13.5 + FRAME * 2,
    13.5 + FRAME * 4,
    'Stutter',
    'Rapid Flavor Multi-Image Stutter — frame 2/5',
    'Image B replaces A for 2 frames.',
    'Still frame hold (2 frames), Hard cut',
    {
      davinci: [
        ['Next still', 'Place flavor still 2 for exactly 2 frames after 5a.'],
        ['Match size', 'Inspector Zoom to fill; no extra motion.'],
        ['Audio', 'Keep music continuous under the stills.'],
      ],
      premiere: [
        ['Still 2', 'Drop image B, duration 2 frames.'],
        ['Scale', 'Set to Frame Size; no keyframes.'],
        ['Cut', 'Hard cut from still 1.'],
      ],
      ae: [
        ['Layer', 'Flavor 2, 2-frame in/out.'],
        ['Hold', 'Hold keyframes on Time Remap.'],
        ['Comp', 'Keep all stills in one precomp for the burst.'],
      ],
      capcut: [
        ['Overlay', 'Next overlay image, 2 frames.'],
        ['Replace', 'Hard swap, no fade.'],
        ['Align', 'Keep the same punch-in crop as still 1.'],
      ],
      vn: [
        ['Image', 'Next still, 2 frames.'],
        ['Cut', 'Hard cut.'],
        ['Crop', 'Match previous framing.'],
      ],
    }
  ),
  fx(
    'fx-5c',
    13.5 + FRAME * 4,
    13.5 + FRAME * 6,
    'Stutter',
    'Rapid Flavor Multi-Image Stutter — frame 3/5',
    'Image C, 2 frames.',
    'Still frame hold (2 frames), Hard cut',
    {
      davinci: [
        ['Still 3', '2-frame flavor C.'],
        ['Cut', 'Hard cut from B.'],
        ['Check', 'Play at 100% — it should read as a flicker, not a slide.'],
      ],
      premiere: [
        ['Still 3', '2 frames, hard cut.'],
        ['No transition', 'Delete any automatic dissolve.'],
        ['Preview', 'Loop 13.50–13.80 to confirm 2-frame cadence.'],
      ],
      ae: [
        ['Still 3', '2-frame layer.'],
        ['Hold', 'Hold keyframes.'],
        ['Preview', 'RAM preview the burst.'],
      ],
      capcut: [
        ['Still 3', '2-frame overlay.'],
        ['Cut', 'Hard swap.'],
        ['Preview', 'Play original speed only.'],
      ],
      vn: [
        ['Still 3', '2 frames.'],
        ['Cut', 'Hard cut.'],
        ['Preview', 'Confirm flicker cadence.'],
      ],
    }
  ),
  fx(
    'fx-5d',
    13.5 + FRAME * 6,
    13.5 + FRAME * 8,
    'Stutter',
    'Rapid Flavor Multi-Image Stutter — frame 4/5',
    'Image D, 2 frames.',
    'Still frame hold (2 frames), Hard cut',
    {
      davinci: [
        ['Still 4', '2-frame flavor D.'],
        ['Cut', 'Hard cut from C.'],
        ['Cadence', 'Keep the same 2-frame grid (1/30s × 2).'],
      ],
      premiere: [
        ['Still 4', '2 frames.'],
        ['Grid', 'Snap to frame, not to seconds.'],
        ['Cut', 'Hard cut.'],
      ],
      ae: [
        ['Still 4', '2-frame layer.'],
        ['Snap', 'Hold keyframes on the 2-frame grid.'],
        ['Cut', 'No crossfade.'],
      ],
      capcut: [
        ['Still 4', '2-frame overlay.'],
        ['Snap', 'Use frame-level trim.'],
        ['Cut', 'Hard swap.'],
      ],
      vn: [
        ['Still 4', '2 frames.'],
        ['Trim', 'Frame-accurate.'],
        ['Cut', 'Hard cut.'],
      ],
    }
  ),
  fx(
    'fx-5e',
    13.5 + FRAME * 8,
    16.2,
    'Stutter',
    'Rapid Flavor Multi-Image Stutter — frame 5/5 into hold',
    'Last flavor still (2 frames) then the sequence resolves back into live action through 00:16.20.',
    'Still frame hold (2 frames), Return to live plate',
    {
      davinci: [
        ['Still 5', '2-frame flavor E, then splice live footage until 16.20.'],
        ['Resume', 'Unfreeze / return to the moving plate after the last still.'],
        ['Tail', 'No extra FX on the resume — the next overlay starts at 16.21.'],
      ],
      premiere: [
        ['Still 5', '2 frames, then original clip through 16.20.'],
        ['Unhold', 'End Frame Hold after still 5.'],
        ['Cut', 'Hard cut back to live action.'],
      ],
      ae: [
        ['Still 5', '2 frames, then disable Time Remap hold.'],
        ['Live', 'Continue the plate to 16.20.'],
        ['Precomp', 'Trim the stutter precomp at 16.20.'],
      ],
      capcut: [
        ['Last overlay', '2-frame still 5, then hide overlays.'],
        ['Resume', 'Continue the main clip to 16.20.'],
        ['Clean', 'No fade out of the stutter.'],
      ],
      vn: [
        ['Last still', '2 frames then live clip.'],
        ['Resume', 'Through 16.20.'],
        ['Cut', 'Hard cut, no fade.'],
      ],
    }
  ),
  fx(
    'fx-6',
    16.21,
    18.5,
    'Overlay',
    'Airborne Stunts + Sound Barrier Text Overlay',
    'Action continues airborne; a “sound barrier” style text overlay locks on through 00:18.50.',
    'Sound Barrier Text, Outer Glow, Optional Shockwave PNG',
    {
      davinci: [
        ['Text+', 'New title “sound barrier” style, Glow on, 16.21–18.50.'],
        ['Track', 'If the subject moves, Fusion Tracker on the text.'],
        ['Mix', 'Keep text above the plate; no extra grade here.'],
      ],
      premiere: [
        ['Essential Graphics', 'Bold outline text + Outer Glow, 16.21–18.50.'],
        ['Track', 'Track if needed; otherwise pin lower-third / center.'],
        ['Duration', 'Do not cut the overlay early.'],
      ],
      ae: [
        ['Text', 'Sound-barrier treatment: Stroke + Glow + slight scale pop on in.'],
        ['Track', 'Null + Tracker if the camera is moving.'],
        ['Out', 'Hard off or 4-frame fade at 18.50.'],
      ],
      capcut: [
        ['Text', 'Trending caption / glow text for 16.21–18.50.'],
        ['Effect', 'Optional shockwave sticker under the type.'],
        ['Hold', 'Keep it on for the full airborne beat.'],
      ],
      vn: [
        ['Text', 'Glow title overlay.'],
        ['Sticker', 'Optional shockwave PNG.'],
        ['Span', '16.21–18.50.'],
      ],
    }
  ),
  fx(
    'fx-7',
    18.51,
    21.59,
    'Transition',
    'Cinematic Black Screen Fade / Iris Shut Transition',
    'Picture irises or fades to full black — a closing eyelid / iris-shut, not a hard cut.',
    'Fade to Black, Iris Wipe / Circle Wipe, Optional Film Gate',
    {
      davinci: [
        ['Iris', 'OpenFX Iris / Shape wipe, center-weighted, 18.51 → black by 21.59.'],
        ['Fade', 'If no iris: Dip to Color (black) over the same range.'],
        ['Audio', 'Optional low-pass or volume down with the close.'],
      ],
      premiere: [
        ['Iris Wipe', 'Video Transitions → Wipe → Iris Round. Border 0, softness 8.'],
        ['Or dip', 'Dip to Black if iris is too graphic.'],
        ['Duration', 'Stretch the transition to ~3.08s (18.51–21.59).'],
      ],
      ae: [
        ['Circle wipe', 'Set Matte / Circular wipe 0 → 100% on a black solid.'],
        ['Feather', 'Mask feather 12–20px so it reads cinematic, not a cookie cutter.'],
        ['Hold black', 'Hold full black through 21.59 before the outro cuts.'],
      ],
      capcut: [
        ['Transition', 'Iris / Black fade between clips. Length ~3s.'],
        ['Opacity', 'Or keyframe Opacity 100 → 0 onto a black layer.'],
        ['Hold', 'Stay black until 21.59.'],
      ],
      vn: [
        ['Fade', 'Fade to black or iris transition.'],
        ['Length', 'About 3 seconds.'],
        ['Hold', 'Full black at the end of the span.'],
      ],
    }
  ),
  fx(
    'fx-8',
    21.6,
    27.8,
    'Transition',
    'Rapid Beat Sync Cuts & Final Outro Lock',
    'Out of black: rapid beat-synced cuts, then the last frame locks as the outro hold through 00:27.80.',
    'Beat-sync hard cuts, Final frame hold, Optional end-card',
    {
      davinci: [
        ['Beat cuts', 'Blade on downbeats from 21.60; keep cuts under 8 frames each.'],
        ['Lock', 'Freeze or hold the last hero frame through 27.80.'],
        ['End card', 'Optional logo over the locked frame.'],
      ],
      premiere: [
        ['Razor', 'Cut on beats after the black hold.'],
        ['Frame hold', 'Hold the final frame to 27.80.'],
        ['End', 'Add end card if needed, no extra flash unless on a beat.'],
      ],
      ae: [
        ['Stagger', 'Time Remap or hard cuts on the beat grid.'],
        ['Outro', 'Hold last frame / posterize time 0 from the lock point.'],
        ['Comp', 'End the comp at 27.80s.'],
      ],
      capcut: [
        ['Auto beat', 'Beat cut from 21.60, then freeze the last shot.'],
        ['Lock', 'Hold / freeze through 27.80.'],
        ['Export', 'Export the full 27.8s — do not trim the outro.'],
      ],
      vn: [
        ['Cuts', 'Split on beats after black.'],
        ['Freeze', 'Hold last frame to the end.'],
        ['Length', 'Timeline ends 27.80s.'],
      ],
    }
  ),
];

const SONG_CATALOG: { title: string; artist: string; bpm: number }[] = [
  { title: 'Aliens Among Us (Ronaldo Remix)', artist: 'Fictic', bpm: 125 },
  { title: 'Midnight Voltage', artist: 'Nova Circuit', bpm: 128 },
  { title: 'Teal Horizon', artist: 'Kairo Wave', bpm: 132 },
  { title: 'Neon Drift', artist: 'Vanta', bpm: 120 },
];

function songForUrl(videoUrl: string) {
  try {
    const u = new URL(videoUrl);
    const host = u.hostname.replace(/^www\./, '');
    const slug = u.pathname.split('/').filter(Boolean).pop() || '';
    if (slug && slug.length > 4 && !/^\d+$/.test(slug)) {
      const pretty = decodeURIComponent(slug)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .slice(0, 48);
      const bpm = 110 + (parseInt(hashString(videoUrl), 36) % 31);
      return { title: pretty, artist: host, bpm };
    }
  } catch {
    /* fall through */
  }
  const idx = parseInt(hashString(videoUrl), 36) % SONG_CATALOG.length;
  return SONG_CATALOG[idx]!;
}

/** Build a mock breakdown record for a given URL + NLE. */
export function createMockBreakdown(
  videoUrl: string,
  nleSoftware: NleSoftware = 'DaVinci Resolve'
): VideoBreakdownRecord {
  const song = songForUrl(videoUrl || 'demo');
  const bpm = song.bpm;
  const lastEvent = EFFECTS.reduce(
    (max, e) => Math.max(max, e.timestampEnd ?? e.timestamp),
    0
  );
  const trackDuration = Math.max(lastEvent + 0.2, 27.8);
  const step = 60 / bpm;
  const beatTimestamps: number[] = [];
  for (let t = 0.12; t < trackDuration - 0.2; t += step) {
    const bar = Math.round(t / step);
    if (bar % 8 === 7) continue;
    beatTimestamps.push(Number(t.toFixed(3)));
    if (bar % 4 === 0) beatTimestamps.push(Number((t + 0.09).toFixed(3)));
  }

  const analyzedBeats = beatTimestamps.map((time, i) => {
    const beatType =
      i % 8 === 0 ? 'accent' : i % 4 === 0 ? 'kick' : i % 2 === 0 ? 'snare' : 'bass';
    return {
      time,
      beatType: beatType as 'kick' | 'snare' | 'bass' | 'accent' | 'other',
      similarityGroup: beatType,
      strength: beatType === 'accent' ? 0.95 : beatType === 'kick' ? 0.78 : 0.5,
      confidence: 0.4,
    };
  });

  return {
    id: stableBreakdownId(videoUrl || 'demo'),
    videoUrl: videoUrl || 'https://www.tiktok.com/@scenecraft/demo',
    nleSoftware,
    bpm,
    trackDuration,
    beatTimestamps,
    analyzedBeats,
    effects: condenseEffects(EFFECTS),
    songTitle: song.title,
    songArtist: song.artist,
    previewLabel: 'analyzed · source reel',
  };
}

export const NLE_LIST: NleSoftware[] = [
  'DaVinci Resolve',
  'Premiere Pro',
  'After Effects',
  'CapCut',
  'VN Editor',
];

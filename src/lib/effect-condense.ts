import type { BreakdownEffect } from '@/types/breakdown';
import { resolveEffectName } from '@/lib/effect-naming';

/** A breakdown should read as the main moves of the edit, not a padded list. */
export const MIN_MAIN_EVENTS = 6;
export const MAX_MAIN_EVENTS = 12;

/** Labels added when one look was previously chopped into repeated segments. */
const SEGMENT_LABEL = /\s*[—–·-]\s*(beat|frame|segment)\s*(segment\s*)?\d+\s*\/\s*\d+.*$/i;

function stripSegment(text: string): string {
  return text.replace(SEGMENT_LABEL, '').trim();
}

function mainName(effect: BreakdownEffect): string {
  return stripSegment(resolveEffectName(effect));
}

function endOf(effect: BreakdownEffect): number {
  return effect.timestampEnd ?? effect.timestamp;
}

function spanOf(effect: BreakdownEffect): number {
  return endOf(effect) - effect.timestamp;
}

/** Folds `next` into `current`, keeping the richest detail of the two. */
function merge(current: BreakdownEffect, next: BreakdownEffect): BreakdownEffect {
  return {
    ...current,
    name: mainName(current),
    description: stripSegment(current.description),
    timestampEnd: Math.max(endOf(current), endOf(next)),
    sceneContext: current.sceneContext ?? next.sceneContext,
    overlayElements: current.overlayElements ?? next.overlayElements,
    globalCC: current.globalCC ?? next.globalCC,
    audioSync: current.audioSync ?? next.audioSync,
    parameters: current.parameters?.length ? current.parameters : next.parameters,
    layerStack: current.layerStack?.length ? current.layerStack : next.layerStack,
    audioTransient: current.audioTransient ?? next.audioTransient,
  };
}

function isRepeat(a: BreakdownEffect, b: BreakdownEffect): boolean {
  if (a.type !== b.type) return false;
  if (mainName(a).toLowerCase() === mainName(b).toLowerCase()) return true;
  return b.timestamp - endOf(a) < 0.4;
}

/**
 * Collapses repeated or near-identical neighbours so the timeline shows the
 * handful of moves that actually define the edit.
 */
export function condenseEffects(
  effects: BreakdownEffect[],
  max = MAX_MAIN_EVENTS
): BreakdownEffect[] {
  if (effects.length <= 1) return effects;

  const sorted = [...effects].sort((a, b) => a.timestamp - b.timestamp);

  const grouped: BreakdownEffect[] = [];
  sorted.forEach((effect) => {
    const previous = grouped[grouped.length - 1];
    if (previous && isRepeat(previous, effect)) {
      grouped[grouped.length - 1] = merge(previous, effect);
      return;
    }
    grouped.push({
      ...effect,
      name: mainName(effect),
      description: stripSegment(effect.description),
    });
  });

  // Still long: fold the tightest pair of same-kind neighbours. Moves of
  // different kinds are never merged — that would rename a real move.
  while (grouped.length > Math.max(max, MIN_MAIN_EVENTS)) {
    let bestIndex = -1;
    let bestSpan = Infinity;

    grouped.forEach((effect, i) => {
      const next = grouped[i + 1];
      if (!next || next.type !== effect.type) return;
      const span = spanOf(effect) + spanOf(next);
      if (span < bestSpan) {
        bestSpan = span;
        bestIndex = i;
      }
    });

    if (bestIndex < 0) break;
    grouped.splice(bestIndex, 2, merge(grouped[bestIndex]!, grouped[bestIndex + 1]!));
  }

  return grouped;
}

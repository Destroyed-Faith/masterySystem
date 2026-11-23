/**
 * Detect / repair Dragon Head embeds whose Breath Weapon row cannot reach the
 * combat UI (Breath row without `dragon-breath` identity, missing row, empty progression).
 *
 * Seed stamps alone could mark embeds "current" without pushing catalogue rows —
 * this helper is the content-health check.
 */

import { buildEchoProgressionPicks, getEchoArtifact } from './echo-artifacts.js';
import {
  resolveFullLevelProgression,
  visibleAbilityRows,
} from './artifact-visible-abilities.js';
import type { ArtifactLevelProgressionRow } from '../types/item.js';

export function isDragonHeadArtifactKey(key: string | null | undefined): boolean {
  return String(key || '').trim() === 'dragonHead';
}

/**
 * True when a Dragon Head embed at `level` will not expose usable Breath modes
 * from its stored `levelProgression` (no row carrying the `dragon-breath` identity).
 */
export function dragonHeadBreathProgressionBroken(
  levelProgression: ArtifactLevelProgressionRow[] | null | undefined,
  artifactLevel: number,
): boolean {
  const level = Math.max(1, Math.min(10, Math.floor(Number(artifactLevel) || 1)));
  const rows = visibleAbilityRows(levelProgression, level);
  return !rows.some((r) => r.artifactFunctionId === 'dragon-breath');
}

/** Rebuild visible level-progression rows for Dragon Head at a given level. */
export function rebuildDragonHeadVisibleProgression(
  artifactLevel: number,
): ArtifactLevelProgressionRow[] {
  const def = getEchoArtifact('dragonHead');
  if (!def) return [];
  const picks = buildEchoProgressionPicks(def);
  const full = resolveFullLevelProgression(def.levelProgression, picks as any);
  return visibleAbilityRows(full, artifactLevel);
}

/**
 * Patch an embedded Dragon Head item's levelProgression (and optional powers)
 * when Breath content is broken. Preserves currentLevel / identity.
 * @returns true when a patch was applied.
 */
export function patchDragonHeadBreathProgression(item: any): boolean {
  if (!item || item.type !== 'artifact') return false;
  const sys = (item.system as any) || {};
  const level = Math.max(1, Math.min(10, Math.floor(Number(sys.currentLevel ?? sys.level) || 1)));
  if (!dragonHeadBreathProgressionBroken(sys.levelProgression, level)) return false;
  const next = rebuildDragonHeadVisibleProgression(level);
  if (next.length === 0) return false;
  sys.levelProgression = next;
  return true;
}

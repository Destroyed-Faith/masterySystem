/**
 * Token adjacency for passive `conditionExpr` gates (e.g. Surrounded Bulwark).
 * Uses scene grid distance between token centers (same rule as one grid step).
 */

import { distanceBetweenTokensMeters, tokenIsHostileTo } from '../combat/threatened-ranged.js';

function adjacentDistanceThresholdMeters(): number {
  const g = (typeof canvas !== 'undefined' && canvas?.grid) as any;
  const d = Number(g?.distance ?? 2);
  return Math.max(0.5, d) * 1.08;
}

/** Prefer controlled token on the active scene, else first placeable for this actor. */
export function getPrimaryTokenForActor(actor: any): any {
  if (typeof game === 'undefined' || typeof canvas === 'undefined' || !actor?.id) return null;
  const scene = canvas.scene;
  if (!scene) return null;
  const placeables = canvas.tokens?.placeables ?? [];
  const mine = placeables.filter(
    (t: any) => t?.scene?.id === scene.id && t.actor?.id === actor.id,
  );
  if (!mine.length) return null;
  const controlled = mine.find((t: any) => t.controlled);
  return controlled ?? mine[0];
}

function isGridAdjacentToken(a: any, b: any): boolean {
  if (!a?.center || !b?.center) return false;
  const d = distanceBetweenTokensMeters(a, b);
  const thr = adjacentDistanceThresholdMeters();
  return d <= thr;
}

/** Hostile tokens in the same scene whose base is within one grid step of `selfToken`. */
export function countAdjacentHostileTokenCount(selfToken: any): number {
  if (!selfToken || typeof canvas === 'undefined') return 0;
  let n = 0;
  for (const t of canvas.tokens?.placeables ?? []) {
    if (!t?.actor || t.id === selfToken.id) continue;
    if (!tokenIsHostileTo(selfToken, t)) continue;
    if (isGridAdjacentToken(selfToken, t)) n++;
  }
  return n;
}

/**
 * Non-hostile other tokens adjacent (party-style allies: not mutually hostile).
 */
export function countAdjacentAllyTokenCount(selfToken: any): number {
  if (!selfToken || typeof canvas === 'undefined') return 0;
  let n = 0;
  for (const t of canvas.tokens?.placeables ?? []) {
    if (!t?.actor || t.id === selfToken.id) continue;
    if (tokenIsHostileTo(selfToken, t) || tokenIsHostileTo(t, selfToken)) continue;
    if (isGridAdjacentToken(selfToken, t)) n++;
  }
  return n;
}

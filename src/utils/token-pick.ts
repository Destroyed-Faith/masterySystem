/**
 * Pick the token the user most likely meant under a canvas point.
 *
 * Foundry `placeables` order is not paint/z order. Returning the first
 * `bounds.contains` hit often selects a token behind another when they
 * overlap — classic "I clicked Sjossfur but got Alaris" bug.
 *
 * Preference:
 * 1. Tokens whose bounds contain the point
 * 2. Among those, closest click → token center
 * 3. Higher zIndex / later placeables index as tie-break (topmost)
 * 4. Optional fallback: nearest center within a small pad radius
 */

export type TokenPickOptions = {
  /** Skip these token ids (usually the attacker). */
  excludeIds?: Iterable<string>;
  /** When set, only these token ids are eligible. */
  onlyIds?: Iterable<string> | Set<string>;
  /** Soft center-radius fallback when no bounds hit (default 15 px pad). */
  centerPadPx?: number;
  /** Disable soft radius fallback. */
  noCenterFallback?: boolean;
};

function tokenCenterDist(token: any, x: number, y: number): number {
  const c = token?.center;
  if (!c) return Infinity;
  return Math.hypot(x - c.x, y - c.y);
}

function tokenZ(token: any, placeableIndex: number): number {
  const z = Number(token?.zIndex ?? token?.document?.sort ?? placeableIndex);
  return Number.isFinite(z) ? z : placeableIndex;
}

/**
 * Best token under canvas-stage local coordinates `(x, y)`.
 */
export function pickTokenAtPoint(
  x: number,
  y: number,
  options: TokenPickOptions = {},
): any | null {
  const tokens = (canvas.tokens?.placeables ?? []) as any[];
  if (!tokens.length) return null;

  const exclude = new Set(options.excludeIds ? [...options.excludeIds] : []);
  const only =
    options.onlyIds == null
      ? null
      : options.onlyIds instanceof Set
        ? options.onlyIds
        : new Set(options.onlyIds);

  type Cand = { token: any; dist: number; z: number; index: number };
  const boundsHits: Cand[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token?.id || exclude.has(token.id)) continue;
    if (only && !only.has(token.id)) continue;
    if (!token.bounds?.contains?.(x, y)) continue;
    boundsHits.push({
      token,
      dist: tokenCenterDist(token, x, y),
      z: tokenZ(token, i),
      index: i,
    });
  }

  const rank = (a: Cand, b: Cand): number => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    if (a.z !== b.z) return b.z - a.z;
    return b.index - a.index;
  };

  if (boundsHits.length) {
    boundsHits.sort(rank);
    return boundsHits[0].token;
  }

  if (options.noCenterFallback) return null;

  const pad = Math.max(0, Number(options.centerPadPx ?? 15) || 0);
  let best: Cand | null = null;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token?.id || exclude.has(token.id)) continue;
    if (only && !only.has(token.id)) continue;
    if (!token.center) continue;
    const r = (token.w ?? token.width ?? 50) / 2 + pad;
    const dist = tokenCenterDist(token, x, y);
    if (dist > r) continue;
    const cand: Cand = { token, dist, z: tokenZ(token, i), index: i };
    if (!best || rank(cand, best) < 0) best = cand;
  }
  return best?.token ?? null;
}

/** Convenience: resolve stage-local point from a FederatedPointerEvent, then pick. */
export function pickTokenFromPointerEvent(
  ev: PIXI.FederatedPointerEvent,
  options: TokenPickOptions = {},
): any | null {
  const stage = canvas.stage;
  if (!stage) return null;
  const pos =
    typeof (ev as any)?.getLocalPosition === 'function'
      ? (ev as any).getLocalPosition(stage)
      : ev.data?.getLocalPosition?.(stage);
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;
  return pickTokenAtPoint(pos.x, pos.y, options);
}

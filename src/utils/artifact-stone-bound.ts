/**
 * Stones permanently committed to activated artifacts (`artifactActivationStoneAttr`).
 * These must stay out of Stone Powers distribution and survive pool refills.
 */

/**
 * True when the artifact is currently worn/bound on the actor. A stone is only
 * ever bound by an artifact that is actually equipped — a deactivated or
 * unequipped (e.g. stale duplicate) copy must never block a Stone Powers gem.
 *
 * Kept local (not imported from artifact-actor-rules) to avoid a circular
 * import; the logic mirrors `isArtifactEquippedOnActor`.
 */
function artifactIsWorn(item: any): boolean {
  if (!item) return false;
  const sys = (item.system as any) || {};
  if (item.getFlag?.('mastery-system', 'echoBound')) return true;
  if (sys.binding === 'echo') return true;
  if (sys.equipped === true) return true;
  try {
    const slot = item.getFlag?.('mastery-system', 'equipment')?.slot;
    if (typeof slot === 'string' && slot.length > 0) return true;
  } catch {
    // ignore
  }
  return false;
}

export interface ArtifactActivationBinding {
  /** Canonical key for the artifact tree (root world id / echo key / item id). */
  rootKey: string;
  /** Attribute pool the activation stone is bound to. */
  stoneAttr: string;
  /** Display name of the artifact that binds the stone. */
  artifactName: string;
}

/**
 * Collect the actor's currently-binding artifact activations, deduplicated per
 * artifact tree. Self-healing: only counts artifacts that are still
 * `artifactActivated === true` AND worn — so a GM reset / unequip / stale
 * duplicate immediately releases the stone. Duplicate embedded copies of the
 * same artifact tree only ever bind a single stone.
 */
export function collectArtifactActivationBindings(actor: any): ArtifactActivationBinding[] {
  const A = actor as any;
  if (!A?.items?.filter) return [];
  const byRoot = new Map<string, ArtifactActivationBinding>();
  for (const item of A.items.filter((i: any) => i.type === 'artifact')) {
    if (item.getFlag?.('mastery-system', 'artifactActivated') !== true) continue;
    const stoneAttr = item.getFlag?.('mastery-system', 'artifactActivationStoneAttr') as
      | string
      | undefined;
    if (typeof stoneAttr !== 'string' || !stoneAttr.trim()) continue;
    if (!artifactIsWorn(item)) continue;
    const rootKey =
      (item.getFlag?.('mastery-system', 'evolutionRootItemId') as string | undefined) ||
      (item.getFlag?.('mastery-system', 'echoArtifactKey') as string | undefined) ||
      String(item.id);
    if (!byRoot.has(rootKey)) {
      byRoot.set(rootKey, { rootKey, stoneAttr, artifactName: String(item.name ?? '') });
    }
  }
  return Array.from(byRoot.values());
}

/** Artifact names binding a stone, grouped by attribute pool. */
export function artifactBindingNamesByAttr(actor: any): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const b of collectArtifactActivationBindings(actor)) {
    (out[b.stoneAttr] ??= []).push(b.artifactName);
  }
  return out;
}

/** Count activation stones locked to artifacts, optionally filtered by pool attribute. */
export function countArtifactActivationStones(actor: any, attr?: string): number {
  const bindings = collectArtifactActivationBindings(actor);
  if (!attr) return bindings.length;
  return bindings.filter((b) => b.stoneAttr === attr).length;
}

/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export function effectiveStonePoolAfterBindings(
  maxStones: number,
  sustained: number,
  artifactBound: number,
): number {
  return Math.max(0, maxStones - sustained - artifactBound);
}

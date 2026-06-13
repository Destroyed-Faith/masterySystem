/**
 * Stones permanently committed to activated artifacts (`artifactActivationStoneAttr`).
 * These must stay out of Stone Powers distribution and survive pool refills.
 */

/** Count activation stones locked to artifacts, optionally filtered by pool attribute. */
export function countArtifactActivationStones(actor: any, attr?: string): number {
  const A = actor as any;
  if (!A?.items?.filter) return 0;
  let total = 0;
  for (const item of A.items.filter((i: any) => i.type === 'artifact')) {
    if (item.getFlag?.('mastery-system', 'artifactActivated') !== true) continue;
    const stoneAttr = item.getFlag?.('mastery-system', 'artifactActivationStoneAttr') as
      | string
      | undefined;
    if (typeof stoneAttr !== 'string' || !stoneAttr.trim()) continue;
    if (attr && stoneAttr !== attr) continue;
    total += 1;
  }
  return total;
}

/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export function effectiveStonePoolAfterBindings(
  maxStones: number,
  sustained: number,
  artifactBound: number,
): number {
  return Math.max(0, maxStones - sustained - artifactBound);
}

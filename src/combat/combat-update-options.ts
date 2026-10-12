/**
 * Foundry `Combat#update` option keys used by Mastery combat hooks.
 *
 * When initiative is re-sorted after Stone Powers (or combat launch),
 * `combat.turn` jumps to the highest-init combatant. That must NOT expire
 * "this turn" stone bonuses (Martial Damage, Evade, Armor, …) that were just
 * bought for the round — those last until that actor's own spotlight ends.
 */
export const MASTERY_SKIP_TURN_BONUS_CLEAR = 'masterySkipTurnBonusClear' as const;

/**
 * Whether leaving the previous spotlight should expire per-turn stone bonuses.
 * Administrative turn jumps (initiative sync, round wrap) must return false.
 */
export function shouldClearTurnStoneBonuses(opts: {
  skipFlag?: boolean;
  roundChanged?: boolean;
  prevSpotlightId?: string | null;
  newSpotlightId?: string | null;
}): boolean {
  if (opts.skipFlag || opts.roundChanged) return false;
  const prev = String(opts.prevSpotlightId ?? '');
  const next = String(opts.newSpotlightId ?? '');
  if (!prev || !next) return false;
  return prev !== next;
}

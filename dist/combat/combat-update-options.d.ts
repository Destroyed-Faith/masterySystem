/**
 * Foundry `Combat#update` option keys used by Mastery combat hooks.
 *
 * When initiative is re-sorted after Stone Powers (or combat launch),
 * `combat.turn` jumps to the highest-init combatant. That must NOT expire
 * "this turn" stone bonuses (Martial Damage, Evade, Armor, …) that were just
 * bought for the round — those last until that actor's own spotlight ends.
 */
export declare const MASTERY_SKIP_TURN_BONUS_CLEAR: "masterySkipTurnBonusClear";
/**
 * Whether leaving the previous spotlight should expire per-turn stone bonuses.
 * Administrative turn jumps (initiative sync, round wrap) must return false.
 */
export declare function shouldClearTurnStoneBonuses(opts: {
    skipFlag?: boolean;
    roundChanged?: boolean;
    prevSpotlightId?: string | null;
    newSpotlightId?: string | null;
}): boolean;
//# sourceMappingURL=combat-update-options.d.ts.map
/**
 * Instant AoE target pool helpers.
 *
 * Instant AoE (Melee / Ranged AoE Attack, AoE Special Attacks) has NO Primary
 * Target: every valid creature in the area is an equal participant of one shared
 * Attack roll and one shared Power damage roll. These helpers only decide which
 * tokens are in the pool (ally filter) — never who is "primary".
 */
/**
 * True when `token` counts as allied with the attacker for the AoE ally filter.
 * Deliberately NOT disposition-symmetric ("both hostile ⇒ allies" wrongly nuked
 * every target when all scene tokens carried the HOSTILE default): allies are
 * the attacker itself and — for a player-side attacker — everything else on the
 * player side. NPCs like a combat dummy are never filtered out.
 */
export declare function isAlliedWithAttacker(attackerToken: any, token: any): boolean;
/**
 * Remove allied tokens from an Instant AoE token-id pool. Order is preserved and
 * no token is promoted to "primary".
 */
export declare function excludeAlliesFromAoePool(attackerToken: any, tokenIds: readonly string[], resolveToken?: (id: string) => any): string[];
//# sourceMappingURL=aoe-target-filter.d.ts.map
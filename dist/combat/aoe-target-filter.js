/**
 * Instant AoE target pool helpers.
 *
 * Instant AoE (Melee / Ranged AoE Attack, AoE Special Attacks) has NO Primary
 * Target: every valid creature in the area is an equal participant of one shared
 * Attack roll and one shared Power damage roll. These helpers only decide which
 * tokens are in the pool (ally filter) — never who is "primary".
 */
/**
 * "Player side" for the ally filter: player characters always count (regardless
 * of the token's disposition — scenes often have misconfigured dispositions),
 * plus FRIENDLY-disposition tokens (companions, friendly NPCs, summons).
 */
function isPlayerSide(token) {
    const actor = token?.actor;
    if (!actor)
        return false;
    if (actor.type === 'character')
        return true;
    const d = token?.document?.disposition ?? token?.disposition;
    const friendly = globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY;
    return friendly !== undefined && d === friendly;
}
/**
 * True when `token` counts as allied with the attacker for the AoE ally filter.
 * Deliberately NOT disposition-symmetric ("both hostile ⇒ allies" wrongly nuked
 * every target when all scene tokens carried the HOSTILE default): allies are
 * the attacker itself and — for a player-side attacker — everything else on the
 * player side. NPCs like a combat dummy are never filtered out.
 */
export function isAlliedWithAttacker(attackerToken, token) {
    const attackerActor = attackerToken?.actor;
    const targetActor = token?.actor;
    if (!attackerActor || !targetActor)
        return false;
    if (attackerActor.id === targetActor.id)
        return true;
    return isPlayerSide(attackerToken) && isPlayerSide(token);
}
/**
 * Remove allied tokens from an Instant AoE token-id pool. Order is preserved and
 * no token is promoted to "primary".
 */
export function excludeAlliesFromAoePool(attackerToken, tokenIds, resolveToken = (id) => globalThis.canvas?.tokens?.get?.(id)) {
    return tokenIds.filter((id) => {
        const t = resolveToken(id);
        return t ? !isAlliedWithAttacker(attackerToken, t) : true;
    });
}
//# sourceMappingURL=aoe-target-filter.js.map
/**
 * Threatened Ranged (Mastery System tactical rule)
 *
 * If you declare a Ranged Attack / Ranged Power with a bow, crossbow, thrown weapon,
 * or similar while at least one enemy has you within THEIR melee reach, the attack is
 * Threatened: Disadvantage on the attack roll; after declaring, those enemies may
 * immediately spend a legal Reaction if they have one available.
 *
 * Powers/spells only use this rule if flagged (tag `threatened-ranged` or system.threatenedRanged).
 */
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}
/** Distance between token centers in meters (grid-aware when possible). */
export function distanceBetweenTokensMeters(a, b) {
    const ac = a?.center;
    const bc = b?.center;
    if (!ac || !bc)
        return Infinity;
    const grid = canvas.grid;
    if (grid && typeof grid.measurePath === "function") {
        try {
            const path = grid.measurePath([ac, bc], {});
            return path.distance ?? path.total ?? 0;
        }
        catch {
            // fall through
        }
    }
    const distPx = distance(ac, bc);
    const gridSize = grid?.size ?? 100;
    const gridUnits = distPx / gridSize;
    return gridUnits * (grid?.distance ?? 1);
}
function getEquippedWeapon(actor) {
    if (!actor?.items)
        return null;
    const items = Array.isArray(actor.items)
        ? actor.items
        : actor.items instanceof Map
            ? Array.from(actor.items.values())
            : typeof actor.items.values === "function"
                ? Array.from(actor.items.values())
                : [];
    return (items.find((item) => item.type === "weapon" && item.system?.equipped === true) ||
        null);
}
function getReachBonusMeters(actor) {
    const w = getEquippedWeapon(actor);
    if (!w)
        return 0;
    const innateAbilities = (w.system?.innateAbilities || []);
    const reachAbility = innateAbilities.find((a) => /reach/i.test(a));
    if (!reachAbility)
        return 0;
    const bonusMatch = reachAbility.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
    if (bonusMatch)
        return parseInt(bonusMatch[1], 10);
    const legacyMatch = reachAbility.match(/Reach\s*\((\d+)\s*m\)/i);
    if (legacyMatch) {
        const totalReach = parseInt(legacyMatch[1], 10);
        return Math.max(0, totalReach - 2);
    }
    return 0;
}
/** Melee reach in meters for this actor (2m base + weapon reach bonus). */
export function getActorMeleeReachMeters(actor) {
    return 2 + getReachBonusMeters(actor);
}
/** True when `other` is treated as hostile to `attackerToken` (disposition-based). */
export function tokenIsHostileTo(attackerToken, other) {
    const ad = Number(attackerToken?.document?.disposition ?? attackerToken?.disposition ?? 0);
    const od = Number(other?.document?.disposition ?? other?.disposition ?? 0);
    // Opposite signs (FRIENDLY=1 vs HOSTILE=-1) — covers NPC shooters threatened by PCs.
    if (ad * od < 0)
        return true;
    const HOSTILE = globalThis.CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
    const FRIENDLY = globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
    if (ad === FRIENDLY && od === HOSTILE)
        return true;
    if (ad === HOSTILE && od === FRIENDLY)
        return true;
    return false;
}
/**
 * True if this attack uses the Threatened Ranged rule set (bow/crossbow/thrown declaration).
 * Ranged *powers* only count if explicitly flagged (`threatened-ranged` tag or system.threatenedRanged),
 * so spell-like attacks do not automatically provoke the weapon rule.
 */
export function usesThreatenedRangedWeaponRules(actor, option) {
    // NPC martial ranged attacks (not spells) use Threatened Ranged like bows.
    if (option.source === "npc-attack") {
        if (option.npcIsSpell === true)
            return false;
        if (option.tags?.includes("ranged"))
            return true;
        return false;
    }
    if (option.source === "power" && option.item) {
        if (option.tags?.includes("threatened-ranged"))
            return true;
        const sys = option.item.system || {};
        if (sys.threatenedRanged === true)
            return true;
        return false;
    }
    const w = getEquippedWeapon(actor);
    if (w) {
        const ws = w.system || {};
        if (ws.weaponType === "ranged")
            return true;
        const innate = (ws.innateAbilities || []);
        if (innate.some((a) => /thrown/i.test(a)))
            return true;
    }
    return false;
}
/** Hostile is standing close enough that their melee could reach the shooter. */
export function enemyThreatensRangedShooter(shooterToken, enemyToken) {
    if (!enemyToken?.actor)
        return false;
    const dist = distanceBetweenTokensMeters(shooterToken, enemyToken);
    const enemyReach = getActorMeleeReachMeters(enemyToken.actor);
    return dist <= enemyReach;
}
export function findThreateningEnemyTokenIds(shooterToken) {
    const out = [];
    const tokens = canvas.tokens?.placeables ?? [];
    for (const t of tokens) {
        if (!t?.id || t.id === shooterToken.id || !t.actor)
            continue;
        if (!tokenIsHostileTo(shooterToken, t))
            continue;
        if (enemyThreatensRangedShooter(shooterToken, t))
            out.push(t.id);
    }
    return out;
}
/**
 * Hostiles who have the shooter in THEIR melee reach — after a Threatened
 * Ranged declaration they may spend a Reaction (same set as threatening enemies).
 */
export function findOpportunityEnemyTokenIds(shooterToken) {
    return findThreateningEnemyTokenIds(shooterToken);
}
export function evaluateThreatenedRanged(shooterToken, option) {
    const actor = shooterToken?.actor;
    const appliesRule = !!actor && usesThreatenedRangedWeaponRules(actor, option);
    const threateningEnemyTokenIds = appliesRule ? findThreateningEnemyTokenIds(shooterToken) : [];
    const threatened = appliesRule && threateningEnemyTokenIds.length > 0;
    const opportunityEnemyTokenIds = appliesRule ? findOpportunityEnemyTokenIds(shooterToken) : [];
    return {
        appliesRule,
        threatened,
        threateningEnemyTokenIds,
        opportunityEnemyTokenIds,
        rollDisadvantage: threatened
    };
}
//# sourceMappingURL=threatened-ranged.js.map
/**
 * Threatened Ranged (Mastery System tactical rule)
 *
 * If you declare a Ranged Attack / Ranged Power with a bow, crossbow, thrown weapon,
 * or similar while at least one enemy has you within THEIR melee reach, the attack is
 * Threatened: Disadvantage on the attack roll; after declaring, those enemies may
 * immediately spend a legal Reaction if they have one available.
 *
 * Powers/spells only use this rule if flagged (tag `threatened-ranged` or system.threatenedRanged).
 *
 * Console filter: `[MS Threatened Ranged]`
 */
const LOG = '[MS Threatened Ranged]';
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}
function gridDistanceMeters() {
    return Number(globalThis.canvas?.grid?.distance) || 1;
}
function tokenSizeSquares(token) {
    const w = Number(token?.document?.width ?? token?.width ?? 1);
    return Number.isFinite(w) && w > 0 ? w : 1;
}
/** Distance between token centers in meters (grid-aware when possible). */
export function distanceBetweenTokensMeters(a, b) {
    const ac = a?.center;
    const bc = b?.center;
    if (!ac || !bc)
        return Infinity;
    const grid = globalThis.canvas?.grid;
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
/**
 * Approximate edge-to-edge distance in meters (centers minus half-widths).
 * Melee reach should care about touching/engaging, not only center-to-center —
 * two medium tokens on a 2 m grid are often ~2 m center and fail a strict
 * `dist <= 2` check when slightly diagonal.
 */
export function distanceBetweenTokenEdgesMeters(a, b) {
    const center = distanceBetweenTokensMeters(a, b);
    if (!Number.isFinite(center))
        return Infinity;
    const unit = gridDistanceMeters();
    const halfA = (tokenSizeSquares(a) * unit) / 2;
    const halfB = (tokenSizeSquares(b) * unit) / 2;
    return Math.max(0, center - halfA - halfB);
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
function tokenDisposition(token) {
    return Number(token?.document?.disposition ?? token?.disposition ?? 0);
}
function tokenHasPlayerOwner(token) {
    return !!(token?.actor?.hasPlayerOwner ||
        token?.document?.hasPlayerOwner ||
        token?.document?.isOwner);
}
/**
 * True when `other` is treated as hostile to `attackerToken`.
 * Uses opposite dispositions first; falls back to player-owner XOR when
 * disposition is ambiguous (0 / SECRET), so NPC Dummy vs PC Alaris still counts.
 */
export function tokenIsHostileTo(attackerToken, other) {
    const HOSTILE = globalThis.CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
    const FRIENDLY = globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
    const SECRET = globalThis.CONST?.TOKEN_DISPOSITIONS?.SECRET ?? -2;
    const ad = tokenDisposition(attackerToken);
    const od = tokenDisposition(other);
    // Clear opposite sides (FRIENDLY↔HOSTILE).
    if (ad * od < 0)
        return true;
    if (ad === FRIENDLY && od === HOSTILE)
        return true;
    if (ad === HOSTILE && od === FRIENDLY)
        return true;
    // Same non-zero disposition → allies / same faction.
    if (ad === od && ad !== 0 && ad !== SECRET)
        return false;
    // Ambiguous disposition: PC-owned vs not PC-owned counts as opposing for this rule.
    if (ad === 0 || od === 0 || ad === SECRET || od === SECRET) {
        const aPlayer = tokenHasPlayerOwner(attackerToken);
        const oPlayer = tokenHasPlayerOwner(other);
        if (aPlayer !== oPlayer)
            return true;
    }
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
    const edge = distanceBetweenTokenEdgesMeters(shooterToken, enemyToken);
    const enemyReach = getActorMeleeReachMeters(enemyToken.actor);
    // Small epsilon for floating measurePath noise.
    return edge <= enemyReach + 0.05;
}
export function scanThreateningEnemies(shooterToken) {
    const rows = [];
    const threateningIds = [];
    const tokens = globalThis.canvas?.tokens?.placeables ?? [];
    const shooterName = String(shooterToken?.name ?? shooterToken?.document?.name ?? 'shooter');
    const shooterDisp = tokenDisposition(shooterToken);
    for (const t of tokens) {
        if (!t?.id || t.id === shooterToken.id)
            continue;
        const name = String(t.name ?? t.document?.name ?? t.id);
        const disposition = tokenDisposition(t);
        const hasPlayerOwner = tokenHasPlayerOwner(t);
        if (!t.actor) {
            rows.push({
                tokenId: t.id,
                name,
                disposition,
                hasPlayerOwner,
                hostile: false,
                centerDistM: NaN,
                edgeDistM: NaN,
                enemyReachM: 0,
                threatens: false,
                skipReason: 'no-actor',
            });
            continue;
        }
        const hostile = tokenIsHostileTo(shooterToken, t);
        const centerDistM = distanceBetweenTokensMeters(shooterToken, t);
        const edgeDistM = distanceBetweenTokenEdgesMeters(shooterToken, t);
        const enemyReachM = getActorMeleeReachMeters(t.actor);
        let threatens = false;
        let skipReason;
        if (!hostile) {
            skipReason = `not-hostile (shooterDisp=${shooterDisp}, otherDisp=${disposition}, playerOwner=${hasPlayerOwner})`;
        }
        else if (edgeDistM > enemyReachM + 0.05) {
            skipReason = `out-of-reach (edge ${edgeDistM.toFixed(2)} m > reach ${enemyReachM} m; center ${centerDistM.toFixed(2)} m)`;
        }
        else {
            threatens = true;
            threateningIds.push(t.id);
        }
        rows.push({
            tokenId: t.id,
            name,
            disposition,
            hasPlayerOwner,
            hostile,
            centerDistM: Math.round(centerDistM * 100) / 100,
            edgeDistM: Math.round(edgeDistM * 100) / 100,
            enemyReachM,
            threatens,
            skipReason,
        });
    }
    console.log(`${LOG} scan around "${shooterName}"`, {
        shooterId: shooterToken?.id,
        shooterDisposition: shooterDisp,
        shooterPlayerOwner: tokenHasPlayerOwner(shooterToken),
        threateningIds,
        threateningNames: rows.filter((r) => r.threatens).map((r) => r.name),
        candidates: rows,
    });
    return { threateningIds, rows };
}
export function findThreateningEnemyTokenIds(shooterToken) {
    return scanThreateningEnemies(shooterToken).threateningIds;
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
    const optionMeta = {
        name: option?.name,
        source: option?.source,
        tags: option?.tags,
        npcIsSpell: option?.npcIsSpell,
    };
    if (!actor) {
        console.log(`${LOG} evaluate — no shooter actor`, optionMeta);
        return {
            appliesRule: false,
            threatened: false,
            threateningEnemyTokenIds: [],
            opportunityEnemyTokenIds: [],
            rollDisadvantage: false,
            debugReason: 'no-shooter-actor',
        };
    }
    const appliesRule = usesThreatenedRangedWeaponRules(actor, option);
    if (!appliesRule) {
        console.log(`${LOG} evaluate — rule does NOT apply to this attack`, {
            shooter: actor.name,
            optionMeta,
            hint: 'NPC: needs source=npc-attack + tag ranged + not spell. PC: ranged/thrown weapon or flagged power.',
        });
        return {
            appliesRule: false,
            threatened: false,
            threateningEnemyTokenIds: [],
            opportunityEnemyTokenIds: [],
            rollDisadvantage: false,
            debugReason: 'rule-not-applicable',
        };
    }
    const { threateningIds, rows } = scanThreateningEnemies(shooterToken);
    const threatened = threateningIds.length > 0;
    const result = {
        appliesRule: true,
        threatened,
        threateningEnemyTokenIds: threateningIds,
        opportunityEnemyTokenIds: threateningIds,
        rollDisadvantage: threatened,
        debugReason: threatened
            ? `threatened-by:${rows
                .filter((r) => r.threatens)
                .map((r) => r.name)
                .join(',')}`
            : 'no-enemy-in-melee-reach',
    };
    console.log(`${LOG} evaluate — result`, {
        shooter: actor.name,
        optionMeta,
        ...result,
        nearbyHostilesOutOfReach: rows
            .filter((r) => r.hostile && !r.threatens)
            .map((r) => `${r.name}: ${r.skipReason}`),
        nonHostilesNearby: rows
            .filter((r) => !r.hostile && Number.isFinite(r.edgeDistM) && r.edgeDistM <= 4)
            .map((r) => `${r.name}: ${r.skipReason}`),
    });
    return result;
}
//# sourceMappingURL=threatened-ranged.js.map
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
            const d = path.distance ?? path.total ?? 0;
            if (Number.isFinite(d))
                return d;
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
 * Melee reach should care about touching/engaging, not only center-to-center.
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
/**
 * Grid-neighbor fallback: true when tokens occupy adjacent squares (incl. diagonal),
 * accounting for multi-square tokens. Used when meter math is noisy.
 */
export function tokensAreGridAdjacent(a, b) {
    try {
        const grid = globalThis.canvas?.grid;
        const size = Number(grid?.size) || 100;
        const ax = Number(a?.document?.x ?? a?.x);
        const ay = Number(a?.document?.y ?? a?.y);
        const bx = Number(b?.document?.x ?? b?.x);
        const by = Number(b?.document?.y ?? b?.y);
        if (![ax, ay, bx, by].every(Number.isFinite))
            return false;
        const aw = tokenSizeSquares(a);
        const ah = Number(a?.document?.height ?? a?.height ?? aw) || aw;
        const bw = tokenSizeSquares(b);
        const bh = Number(b?.document?.height ?? b?.height ?? bw) || bw;
        // Bounding boxes in grid squares (top-left based).
        const aCol0 = Math.floor(ax / size);
        const aRow0 = Math.floor(ay / size);
        const bCol0 = Math.floor(bx / size);
        const bRow0 = Math.floor(by / size);
        // Expand to all occupied cells; adjacent if Chebyshev distance between any pair ≤ 1
        // and not the same cell set overlapping as "same space only".
        let minCheb = Infinity;
        let overlap = false;
        for (let ac = 0; ac < aw; ac++) {
            for (let ar = 0; ar < ah; ar++) {
                for (let bc = 0; bc < bw; bc++) {
                    for (let br = 0; br < bh; br++) {
                        const dc = Math.abs(aCol0 + ac - (bCol0 + bc));
                        const dr = Math.abs(aRow0 + ar - (bRow0 + br));
                        const cheb = Math.max(dc, dr);
                        if (cheb === 0)
                            overlap = true;
                        if (cheb < minCheb)
                            minCheb = cheb;
                    }
                }
            }
        }
        // Adjacent (1) or overlapping (0 — same space / grappling-adjacent).
        return Number.isFinite(minCheb) && minCheb <= 1;
    }
    catch {
        return false;
    }
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
/**
 * True for player combatants (characters / player-owned tokens).
 * Important: GM-controlled "Dummy" NPCs are often disposition FRIENDLY — we must
 * still treat them as opposing PCs for Threatened Ranged.
 */
export function isPlayerCombatantToken(token) {
    const actor = token?.actor;
    if (!actor)
        return false;
    if (actor.type === 'character')
        return true;
    if (actor.type === 'npc')
        return false;
    if (actor.hasPlayerOwner === true || token?.document?.hasPlayerOwner === true)
        return true;
    // Ownership map: any non-GM user with OWNER/OBSERVER linked as character.
    try {
        const ownership = actor.ownership ?? actor.permission;
        const users = globalThis.game?.users;
        if (ownership && users) {
            for (const [uid, level] of Object.entries(ownership)) {
                if (uid === 'default')
                    continue;
                if (Number(level) < 1)
                    continue;
                const user = typeof users.get === 'function' ? users.get(uid) : null;
                if (user && !user.isGM)
                    return true;
            }
        }
        // Assigned character actor for a player user.
        if (typeof users?.contents !== 'undefined') {
            for (const u of users) {
                if (u?.isGM)
                    continue;
                if (u?.character?.id && u.character.id === actor.id)
                    return true;
            }
        }
    }
    catch {
        /* ignore */
    }
    return false;
}
/**
 * True when `other` opposes `attackerToken` for Threatened Ranged.
 * PC ↔ NPC always counts, even when both tokens are marked Friendly.
 */
export function tokenIsHostileTo(attackerToken, other) {
    const HOSTILE = globalThis.CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
    const FRIENDLY = globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
    const aPC = isPlayerCombatantToken(attackerToken);
    const oPC = isPlayerCombatantToken(other);
    // Strongest signal: player character vs NPC (Dummy often set Friendly!).
    if (aPC !== oPC)
        return true;
    const ad = tokenDisposition(attackerToken);
    const od = tokenDisposition(other);
    if (ad * od < 0)
        return true;
    if (ad === FRIENDLY && od === HOSTILE)
        return true;
    if (ad === HOSTILE && od === FRIENDLY)
        return true;
    // Same clear disposition among same "side" (two NPCs, two PCs).
    if (ad === od && ad !== 0)
        return false;
    return ad !== od;
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
    if (edge <= enemyReach + 0.05)
        return true;
    // Standard melee (2 m / 1 square): grid adjacency is enough.
    if (enemyReach >= 2 - 0.01 && tokensAreGridAdjacent(shooterToken, enemyToken))
        return true;
    return false;
}
export function scanThreateningEnemies(shooterToken) {
    const rows = [];
    const threateningIds = [];
    const tokens = globalThis.canvas?.tokens?.placeables ?? [];
    const shooterName = String(shooterToken?.name ?? shooterToken?.document?.name ?? 'shooter');
    const shooterDisp = tokenDisposition(shooterToken);
    const shooterPC = isPlayerCombatantToken(shooterToken);
    const placeableCount = Array.isArray(tokens) ? tokens.length : 0;
    console.log(`${LOG} scan start shooter="${shooterName}" id=${shooterToken?.id} disp=${shooterDisp} isPC=${shooterPC} placeables=${placeableCount}`);
    for (const t of tokens) {
        if (!t?.id || t.id === shooterToken.id)
            continue;
        const name = String(t.name ?? t.document?.name ?? t.id);
        const disposition = tokenDisposition(t);
        const isPC = isPlayerCombatantToken(t);
        if (!t.actor) {
            const line = `${LOG}   skip "${name}" (${t.id}): no-actor disp=${disposition}`;
            console.log(line);
            rows.push({
                tokenId: t.id,
                name,
                disposition,
                isPlayerCombatant: isPC,
                hostile: false,
                centerDistM: NaN,
                edgeDistM: NaN,
                enemyReachM: 0,
                gridAdjacent: false,
                threatens: false,
                skipReason: 'no-actor',
            });
            continue;
        }
        const hostile = tokenIsHostileTo(shooterToken, t);
        const centerDistM = distanceBetweenTokensMeters(shooterToken, t);
        const edgeDistM = distanceBetweenTokenEdgesMeters(shooterToken, t);
        const enemyReachM = getActorMeleeReachMeters(t.actor);
        const gridAdjacent = tokensAreGridAdjacent(shooterToken, t);
        let threatens = false;
        let skipReason;
        if (!hostile) {
            skipReason = `not-hostile (shooterPC=${shooterPC}/disp=${shooterDisp}, otherPC=${isPC}/disp=${disposition})`;
        }
        else if (!(edgeDistM <= enemyReachM + 0.05) && !(enemyReachM >= 2 - 0.01 && gridAdjacent)) {
            skipReason = `out-of-reach (edge=${edgeDistM.toFixed(2)}m center=${centerDistM.toFixed(2)}m reach=${enemyReachM}m gridAdj=${gridAdjacent})`;
        }
        else {
            threatens = true;
            threateningIds.push(t.id);
        }
        const row = {
            tokenId: t.id,
            name,
            disposition,
            isPlayerCombatant: isPC,
            hostile,
            centerDistM: Math.round(centerDistM * 100) / 100,
            edgeDistM: Math.round(edgeDistM * 100) / 100,
            enemyReachM,
            gridAdjacent,
            threatens,
            skipReason,
        };
        rows.push(row);
        console.log(`${LOG}   ${threatens ? 'THREAT' : 'skip '} "${name}" (${t.id}): ` +
            `hostile=${hostile} isPC=${isPC} disp=${disposition} ` +
            `edge=${row.edgeDistM} center=${row.centerDistM} reach=${enemyReachM} gridAdj=${gridAdjacent}` +
            (skipReason ? ` | ${skipReason}` : ''));
    }
    console.log(`${LOG} scan done for "${shooterName}": threatening=[${rows
        .filter((r) => r.threatens)
        .map((r) => r.name)
        .join(', ') || 'none'}]`);
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
    const optionMeta = `${option?.name || '?'} source=${option?.source} tags=${JSON.stringify(option?.tags || [])} npcIsSpell=${!!option?.npcIsSpell}`;
    if (!actor) {
        console.log(`${LOG} evaluate — no shooter actor | ${optionMeta}`);
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
        console.log(`${LOG} evaluate — rule NOT applicable for "${actor.name}" | ${optionMeta}`);
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
    const names = rows.filter((r) => r.threatens).map((r) => r.name);
    const result = {
        appliesRule: true,
        threatened,
        threateningEnemyTokenIds: threateningIds,
        opportunityEnemyTokenIds: threateningIds,
        rollDisadvantage: threatened,
        debugReason: threatened
            ? `threatened-by:${names.join(',')}`
            : 'no-enemy-in-melee-reach',
    };
    console.log(`${LOG} evaluate — "${actor.name}" appliesRule=true threatened=${threatened} ` +
        `disadvantage=${result.rollDisadvantage} oa=[${names.join(', ') || 'none'}] ` +
        `reason=${result.debugReason} | ${optionMeta}`);
    return result;
}
//# sourceMappingURL=threatened-ranged.js.map
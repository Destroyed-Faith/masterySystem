/**
 * Tactical Choices (Core v0.9.9.6):
 * - All-Out Attack (Prep declaration)
 * - Regular Attack Action Transfer (Prep grant → recipient spends on their Turn)
 * - Shared Intellect Free Raises helpers (range / perception)
 * Two-actor writes live in `teamwork-transactions.ts`.
 *
 * 20 m coordination range; All-Out Armor floor 0.
 */
import { getActionEconomyActor, getAvailableAttackActions, getRoundState, setRoundState, } from './action-economy.js';
/** Tactical Choices coordination range (meters). */
export const TACTICAL_COORDINATION_RANGE_M = 20;
/** Armor lost per All-Out Armor step; a step needs at least this much Armor left. */
export const ALL_OUT_ARMOR_STEP = 4;
/** Evade lost per All-Out Evade step; a step needs at least this much Evade left. */
export const ALL_OUT_EVADE_STEP = 2;
/** @deprecated Use ALL_OUT_ARMOR_STEP. */
export const ALL_OUT_ARMOR_MIN = ALL_OUT_ARMOR_STEP;
function stepCount(v) {
    return Math.max(0, Math.floor(Number(v) || 0));
}
/** All-Out steps for the Round. A stored single declaration (`penalty`) reads as one step. */
export function readAllOutAttack(rs) {
    const raw = rs?.allOutAttack;
    if (!raw || raw.active !== true)
        return null;
    let armorSteps = stepCount(raw.armorSteps);
    let evadeSteps = stepCount(raw.evadeSteps);
    if (raw.armorSteps === undefined && raw.evadeSteps === undefined) {
        if (raw.penalty === 'evade')
            evadeSteps = 1;
        else
            armorSteps = 1;
    }
    if (armorSteps + evadeSteps <= 0)
        return null;
    return { active: true, armorSteps, evadeSteps };
}
/** One +1d8 per declared step. */
export function allOutDamageBonusDice(rs) {
    const ao = readAllOutAttack(rs);
    return ao ? ao.armorSteps + ao.evadeSteps : 0;
}
/**
 * All-Out dice for one Damage Roll. An explicit count from the damage card or a
 * reroll (including 0 for Special-only or Negation-stripped dice) wins; only a
 * missing count falls back to the live Round declaration.
 */
export function resolveAllOutDamageDice(explicit, specialOnly, liveRs) {
    if (specialOnly)
        return 0;
    if (explicit !== undefined)
        return Math.max(0, Math.floor(Number(explicit) || 0));
    return allOutDamageBonusDice(liveRs);
}
/** Effective Armor after All-Out −4 per Armor step (floor 0). */
export function applyAllOutArmorPenalty(armor, rs) {
    const steps = readAllOutAttack(rs)?.armorSteps ?? 0;
    return Math.max(0, Math.floor(Number(armor) || 0) - ALL_OUT_ARMOR_STEP * steps);
}
/** Effective Evade after All-Out −2 per Evade step (floor 0). */
export function applyAllOutEvadePenalty(evade, rs) {
    const steps = readAllOutAttack(rs)?.evadeSteps ?? 0;
    return Math.max(0, Math.floor(Number(evade) || 0) - ALL_OUT_EVADE_STEP * steps);
}
/**
 * Round state of the actor's economy owner, only when it belongs to the live
 * combat Round. A stale flag from an earlier Round or encounter returns null so
 * an expired All-Out drawback never lowers defenses.
 */
export function currentCombatRoundState(actor) {
    if (!actor)
        return null;
    const combat = globalThis.game?.combat ?? null;
    if (!combat)
        return null;
    const owner = (getActionEconomyActor(actor) ?? actor);
    let rs;
    try {
        rs = owner?.getFlag?.('mastery-system', 'roundState');
    }
    catch {
        return null;
    }
    if (!rs)
        return null;
    const round = Math.max(1, Math.floor(Number(combat.round ?? 1) || 1));
    if (rs.round !== round || String(rs.combatId ?? '') !== String(combat.id ?? ''))
        return null;
    return rs;
}
/**
 * The declaring character's own defenses, read from the same economy owner
 * whose Round state later lowers them when that character is hit.
 */
export async function allOutDefenseView(actor, rs) {
    const { getTargetArmorBeforeAllOut, getTargetEvadeBeforeAllOut } = await import('./target-defenses.js');
    const owner = getActionEconomyActor(actor) ?? actor;
    const ao = readAllOutAttack(rs);
    const armorSteps = ao?.armorSteps ?? 0;
    const evadeSteps = ao?.evadeSteps ?? 0;
    const armorBase = getTargetArmorBeforeAllOut(owner);
    const evadeBase = getTargetEvadeBeforeAllOut(owner);
    const armorNow = applyAllOutArmorPenalty(armorBase, rs);
    const evadeNow = applyAllOutEvadePenalty(evadeBase, rs);
    return {
        armorSteps,
        evadeSteps,
        armorBase,
        evadeBase,
        armorNow,
        evadeNow,
        canAddArmor: armorBase - ALL_OUT_ARMOR_STEP * armorSteps >= ALL_OUT_ARMOR_STEP,
        canAddEvade: evadeBase - ALL_OUT_EVADE_STEP * evadeSteps >= ALL_OUT_EVADE_STEP,
        damageDice: armorSteps + evadeSteps,
    };
}
/** Add one All-Out step (−4 Armor or −2 Evade, +1d8 Damage) for this Round. */
export async function declareAllOutAttack(actor, combat, penalty) {
    const choice = penalty === 'evade' ? 'evade' : 'armor';
    const rs = getRoundState(actor, combat);
    const view = await allOutDefenseView(actor, rs);
    if (choice === 'armor' && !view.canAddArmor) {
        return { ok: false, reason: 'armor-below-minimum', effectiveArmor: view.armorNow };
    }
    if (choice === 'evade' && !view.canAddEvade) {
        return { ok: false, reason: 'evade-below-minimum', effectiveEvade: view.evadeNow };
    }
    rs.allOutAttack = {
        active: true,
        armorSteps: view.armorSteps + (choice === 'armor' ? 1 : 0),
        evadeSteps: view.evadeSteps + (choice === 'evade' ? 1 : 0),
    };
    await setRoundState(actor, rs);
    return { ok: true, state: rs };
}
/** Clear the All-Out steps of one defense, or all of them. */
export async function clearAllOutAttack(actor, combat, which = 'all') {
    const rs = getRoundState(actor, combat);
    const ao = readAllOutAttack(rs);
    if (!rs.allOutAttack)
        return;
    const armorSteps = which === 'armor' || which === 'all' ? 0 : (ao?.armorSteps ?? 0);
    const evadeSteps = which === 'evade' || which === 'all' ? 0 : (ao?.evadeSteps ?? 0);
    if (armorSteps + evadeSteps > 0)
        rs.allOutAttack = { active: true, armorSteps, evadeSteps };
    else
        delete rs.allOutAttack;
    await setRoundState(actor, rs);
}
function tokenCenter(token) {
    const doc = token?.document ?? token;
    if (!doc)
        return null;
    const x = Number(doc.x ?? token.x);
    const y = Number(doc.y ?? token.y);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return null;
    const w = Number(doc.width ?? token.width ?? 1) || 1;
    const h = Number(doc.height ?? token.height ?? 1) || 1;
    const grid = Number(globalThis.canvas?.grid?.size ?? 100) || 100;
    return { x: x + (w * grid) / 2, y: y + (h * grid) / 2 };
}
/** Distance in meters between two placed tokens (grid-aware when possible). */
export function tokenDistanceMeters(a, b) {
    if (!a || !b)
        return null;
    try {
        const dist = globalThis.canvas?.grid?.measureDistance?.(a, b);
        if (typeof dist === 'number' && Number.isFinite(dist))
            return dist;
    }
    catch {
        /* fall through */
    }
    const ca = tokenCenter(a);
    const cb = tokenCenter(b);
    if (!ca || !cb)
        return null;
    const grid = Number(globalThis.canvas?.grid?.size ?? 100) || 100;
    const px = Math.hypot(ca.x - cb.x, ca.y - cb.y);
    // Foundry default: 1 grid ≈ 1.5 m in DF scenes; prefer scene grid distance when set.
    const units = Number(globalThis.canvas?.scene?.grid?.distance ?? 1.5) || 1.5;
    return (px / grid) * units;
}
export function actorsWithinCoordinationRange(donorToken, recipientToken, rangeM = TACTICAL_COORDINATION_RANGE_M) {
    const d = tokenDistanceMeters(donorToken, recipientToken);
    if (d == null)
        return false;
    return d <= rangeM + 1e-6;
}
/** Best-effort perceptibility: recipient not Hidden from donor's perspective. */
export function canPerceiveAlly(donorActor, recipientActor) {
    if (!donorActor || !recipientActor)
        return false;
    try {
        const hidden = recipientActor.getFlag?.('mastery-system', 'hidden') === true;
        if (hidden)
            return false;
    }
    catch {
        /* ignore */
    }
    const cond = recipientActor.statuses ??
        recipientActor.effects ??
        recipientActor.system?.statuses;
    if (cond && typeof cond.has === 'function' && cond.has('hidden'))
        return false;
    return true;
}
function tokenDisposition(token) {
    const doc = token?.document ?? token;
    const d = Number(doc?.disposition);
    return Number.isFinite(d) ? d : null;
}
/**
 * Teamwork options only target allies. With placed tokens the token
 * dispositions must match; without tokens two player characters count as allies.
 */
export function areTeamworkAllies(a, b, tokens) {
    if (!a || !b)
        return false;
    const da = tokenDisposition(tokens?.aToken);
    const db = tokenDisposition(tokens?.bToken);
    if (da != null && db != null)
        return da === db;
    return a.type === 'character' && b.type === 'character';
}
/** Attack Action Transfer recipients are player characters, never NPCs or Summons. */
export function isPlayerCharacter(actor) {
    return actor?.type === 'character' && actor.hasPlayerOwner !== false;
}
/**
 * Prep: donor gives base Attack Action to recipient.
 * Recipient gains +1 donatedAttackActions (additive); donor locks base.
 * Without write access to the recipient the active GM records it.
 */
export async function grantRegularAttackActionTransfer(donor, recipient, combat, opts) {
    const { requestAttackActionTransfer } = await import('./teamwork-transactions.js');
    return requestAttackActionTransfer(donor, recipient, combat, opts ?? {});
}
/** Whether the actor's base Attack Action is locked because it was transferred. */
export function hasTransferredBaseAttack(rs) {
    return rs?.baseAttackTransferred === true;
}
export function donorStillHasUsableAttacks(actor, combat) {
    return getAvailableAttackActions(actor, combat);
}
//# sourceMappingURL=tactical-options.js.map
/**
 * Playtest tactical options (Core 2026-11-19):
 * - All-Out Attack (Prep declaration)
 * - Regular Attack Action Transfer (Prep grant → recipient spends on their Turn)
 * - Shared Intellect Free Raises helpers (range / perception)
 * Two-actor writes live in `teamwork-transactions.ts`.
 *
 * Provisional playtest: 20 m coordination range; All-Out Armor floor 0.
 */
import { getActionEconomyActor, getAvailableAttackActions, getRoundState, setRoundState, } from './action-economy.js';
/** Provisional playtest coordination range (meters). */
export const TACTICAL_COORDINATION_RANGE_M = 20;
/** Core: the Armor drawback may only be chosen with at least this much effective Armor. */
export const ALL_OUT_ARMOR_MIN = 4;
export function readAllOutAttack(rs) {
    const raw = rs?.allOutAttack;
    if (!raw || raw.active !== true)
        return null;
    const penalty = raw.penalty === 'evade' ? 'evade' : 'armor';
    return { active: true, penalty };
}
export function allOutDamageBonusDice(rs) {
    return readAllOutAttack(rs) ? 1 : 0;
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
/** Effective Armor after All-Out −4 (floor 0). */
export function applyAllOutArmorPenalty(armor, rs) {
    const ao = readAllOutAttack(rs);
    if (!ao || ao.penalty !== 'armor')
        return Math.max(0, Math.floor(Number(armor) || 0));
    return Math.max(0, Math.floor(Number(armor) || 0) - 4);
}
/** Effective Evade after All-Out −2 (floor 0). */
export function applyAllOutEvadePenalty(evade, rs) {
    const ao = readAllOutAttack(rs);
    if (!ao || ao.penalty !== 'evade')
        return Math.max(0, Math.floor(Number(evade) || 0));
    return Math.max(0, Math.floor(Number(evade) || 0) - 2);
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
export async function declareAllOutAttack(actor, combat, penalty) {
    const choice = penalty === 'evade' ? 'evade' : 'armor';
    if (choice === 'armor') {
        // The declaring character's own Armor, read from the same economy owner
        // whose Round state later lowers it when that character is hit.
        const { getTargetArmorBeforeAllOut } = await import('./target-defenses.js');
        const effectiveArmor = getTargetArmorBeforeAllOut(getActionEconomyActor(actor) ?? actor);
        if (effectiveArmor < ALL_OUT_ARMOR_MIN) {
            return { ok: false, reason: 'armor-below-minimum', effectiveArmor };
        }
    }
    const rs = getRoundState(actor, combat);
    rs.allOutAttack = { active: true, penalty: choice };
    await setRoundState(actor, rs);
    return { ok: true, state: rs };
}
export async function clearAllOutAttack(actor, combat) {
    const rs = getRoundState(actor, combat);
    if (!rs.allOutAttack)
        return;
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
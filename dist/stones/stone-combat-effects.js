/**
 * Combat resolution for Stone Abilities that outlive the Preparation click:
 * Reaction Denial, Movement Reduction, Not a Target, Maximization.
 */
import { getActiveBuffMaximizationUses } from '../combat/offensive-active-buff-effects.js';
import { isPlayerCombatantToken, tokenIsHostileTo } from '../combat/threatened-ranged.js';
export const REACTION_DENIAL_FLAG = 'reactionDenial';
export const MOVEMENT_REDUCTION_FLAG = 'movementReduction';
export const NOT_A_TARGET_FLAG = 'notATarget';
/** Flag key kept as damageMaximization for saved character compatibility (R-02). */
export const DAMAGE_MAX_FLAG = 'damageMaximization';
export const MAXIMIZATION_FLAG = DAMAGE_MAX_FLAG;
export const ABSORPTION_PENDING_FLAG = 'absorptionPendingStones';
export const ABSORPTION_READY_FLAG = 'absorptionReadyStones';
/** Half a metre rounds up: 5 → 3, 7 → 4, 9 → 5. */
export function halveMovementMeters(meters) {
    const n = Math.max(0, Number(meters) || 0);
    if (n <= 0)
        return 0;
    return Math.round(n / 2);
}
/** Every d8 in a damage/healing formula becomes 8. Flat bonuses stay. Forced 8s do not explode. */
export function maximizeDamageFormula(formula) {
    return String(formula || '').replace(/(\d*)d8(?:x\d+)?/gi, (_match, count) => {
        const n = count ? Math.max(1, parseInt(count, 10) || 1) : 1;
        return String(8 * n);
    });
}
/** Alias — Maximization applies to Damage Rolls and Healing Rolls (R-02). */
export const maximizeDiceFormula = maximizeDamageFormula;
export function getMaximizationRemaining(actor) {
    const raw = actor?.getFlag?.('mastery-system', MAXIMIZATION_FLAG);
    if (!raw)
        return 0;
    const combat = liveCombat();
    if (combat && raw.combatId && String(raw.combatId) !== combat.id)
        return 0;
    return Math.max(0, Math.floor(Number(raw.remaining) || 0));
}
export function sameCombatRound(state, combatId, round) {
    if (!state)
        return false;
    if (String(state.combatId || '') !== String(combatId || ''))
        return false;
    return Math.floor(Number(state.round) || 0) === Math.floor(Number(round) || 0);
}
export function reactionDenialDecision(state, attempt) {
    if (!state || !sameCombatRound(state, attempt.combatId, attempt.round)) {
        return { allow: true, next: state ?? null };
    }
    const reactionId = String(attempt.reactionId || 'reaction');
    const triggerId = String(attempt.triggerId || 'trigger');
    const already = (state.denied || []).some((row) => row.reactionId === reactionId && row.triggerId === triggerId);
    if (already) {
        return {
            allow: false,
            next: state,
            reason: 'That Reaction was already denied against this trigger.',
        };
    }
    if (state.remaining <= 0)
        return { allow: true, next: state };
    return {
        allow: false,
        next: {
            ...state,
            remaining: state.remaining - 1,
            denied: [...(state.denied || []), { reactionId, triggerId }],
        },
        reason: 'Reaction Denial: the declaration does not resolve and does not spend a Reaction.',
    };
}
export function notATargetDecision(state, attackerId, otherValidTargets, combatId, round) {
    if (!state || !sameCombatRound(state, combatId, round))
        return { block: false, next: state ?? null };
    const id = String(attackerId || '');
    if (!id || !(state.enemyIds || []).includes(id))
        return { block: false, next: state };
    if ((state.usedIds || []).includes(id))
        return { block: false, next: state };
    if (otherValidTargets <= 0)
        return { block: false, next: state };
    return {
        block: true,
        next: { ...state, usedIds: [...(state.usedIds || []), id] },
        reason: 'Not a Target: that enemy cannot target you with this attack.',
    };
}
function liveCombat() {
    const combat = globalThis.game?.combat;
    if (!combat?.id)
        return null;
    return { id: String(combat.id), round: Math.max(1, Math.floor(Number(combat.round) || 1)) };
}
export function readReactionDenial(actor) {
    const raw = actor?.getFlag?.('mastery-system', REACTION_DENIAL_FLAG);
    if (!raw || typeof raw !== 'object')
        return null;
    return {
        remaining: Math.max(0, Math.floor(Number(raw.remaining) || 0)),
        combatId: String(raw.combatId || ''),
        round: Math.floor(Number(raw.round) || 0),
        denied: Array.isArray(raw.denied) ? raw.denied : [],
    };
}
export async function denyReactionIfMarked(actor, attempt = {}) {
    const combat = liveCombat();
    if (!combat)
        return { denied: false };
    const decision = reactionDenialDecision(readReactionDenial(actor), {
        reactionId: attempt.reactionId || 'reaction',
        triggerId: attempt.triggerId || 'trigger',
        combatId: combat.id,
        round: combat.round,
    });
    if (decision.allow)
        return { denied: false };
    if (decision.next) {
        await actor?.setFlag?.('mastery-system', REACTION_DENIAL_FLAG, decision.next);
    }
    return { denied: true, reason: decision.reason };
}
export function movementReductionActive(actor) {
    const combat = liveCombat();
    if (!combat)
        return false;
    const raw = actor?.getFlag?.('mastery-system', MOVEMENT_REDUCTION_FLAG);
    return sameCombatRound(raw, combat.id, combat.round);
}
export function movementMetersAfterStoneEffects(actor, meters) {
    if (!movementReductionActive(actor))
        return Math.max(0, Number(meters) || 0);
    return halveMovementMeters(meters);
}
/** Write the round-scoped flag on the first `count` chosen enemies. Rank 1–4 is that count. */
export async function markMovementReductionTargets(targets, count, combat) {
    const cap = Math.max(0, Math.floor(Number(count) || 0));
    const chosen = targets.slice(0, cap);
    const payload = {
        combatId: String(combat?.id || ''),
        round: Math.max(1, Math.floor(Number(combat?.round) || 1)),
    };
    for (const target of chosen) {
        await target?.setFlag?.('mastery-system', MOVEMENT_REDUCTION_FLAG, payload);
    }
    return chosen.length;
}
function readActorFlag(actor, key) {
    try {
        const via = actor?.getFlag?.('mastery-system', key);
        if (via != null)
            return via;
    }
    catch {
        /* plain test actors */
    }
    return actor?.flags?.['mastery-system']?.[key];
}
/**
 * Token actors and the world actor can each hold the Maximization flag.
 * Stone Powers write the economy owner; the damage card may be holding the other document.
 * Return every document that might carry the charge, without duplicates.
 */
export function maximizationActorCandidates(actor) {
    const out = [];
    const seen = new Set();
    const push = (candidate) => {
        if (!candidate)
            return;
        const key = String(candidate.uuid || `${candidate.id || ''}:${candidate.isToken ? 'token' : 'world'}`);
        if (!key || seen.has(key))
            return;
        seen.add(key);
        out.push(candidate);
    };
    push(actor);
    try {
        const gameAny = globalThis.game;
        const tokenDoc = actor?.token?.document ?? (actor?.isToken ? actor?.token : null);
        const baseId = String(tokenDoc?.actorId || actor?.id || '');
        if (baseId)
            push(gameAny?.actors?.get?.(baseId));
        const tokenActor = actor?.isToken ? actor : tokenDoc?.actor;
        push(tokenActor);
        const placeables = gameAny?.canvas?.tokens?.placeables;
        if (placeables && baseId) {
            for (const token of placeables) {
                if (String(token?.document?.actorId || '') === baseId)
                    push(token?.actor);
            }
        }
    }
    catch {
        /* unit tests */
    }
    return out;
}
/** The related actor that currently has the most Maximization charges. */
export function resolveMaximizationActor(actor) {
    let best = actor;
    let bestN = -1;
    for (const candidate of maximizationActorCandidates(actor)) {
        const n = remainingMaximizations(candidate);
        if (n > bestN) {
            bestN = n;
            best = candidate;
            continue;
        }
        if (n === bestN && n > 0) {
            // Prefer the document that actually stores the stone flag, then the world actor.
            const candHasStone = !!readStoneMaximizationFlag(candidate);
            const bestHasStone = !!readStoneMaximizationFlag(best);
            if (candHasStone && !bestHasStone)
                best = candidate;
            else if (candHasStone === bestHasStone && best?.isToken === true && candidate?.isToken !== true) {
                best = candidate;
            }
        }
    }
    return best ?? actor;
}
function liveMaximizationFlag(actor) {
    const raw = readActorFlag(actor, MAXIMIZATION_FLAG);
    const combat = liveCombat();
    if (!raw || Math.floor(Number(raw.remaining) || 0) <= 0)
        return null;
    if (combat && raw.combatId && String(raw.combatId) !== combat.id)
        return null;
    const remaining = Math.floor(Number(raw.remaining) || 0);
    const uses = Math.max(remaining, Math.floor(Number(raw.uses) || 0));
    return { raw, remaining, uses };
}
/** Any Maximization flag for this combat, including remaining 0 (for sync writes). */
function readStoneMaximizationFlag(actor) {
    const raw = readActorFlag(actor, MAXIMIZATION_FLAG);
    if (!raw || typeof raw !== 'object')
        return null;
    const combat = liveCombat();
    if (combat && raw.combatId && String(raw.combatId) !== String(combat.id))
        return null;
    const remaining = Math.max(0, Math.floor(Number(raw.remaining) || 0));
    const uses = Math.max(remaining, Math.floor(Number(raw.uses) || 0));
    return { raw, remaining, uses };
}
/**
 * Shared stone Maximization pool for this combat.
 * Token + world actor can each hold a copy of the flag; treat them as one pool
 * by taking the minimum remaining (a spent copy must not be ignored in favour
 * of a stale sibling that still shows 1).
 */
export function remainingStoneMaximizations(actor) {
    let found = false;
    let min = Infinity;
    for (const candidate of maximizationActorCandidates(actor)) {
        const live = readStoneMaximizationFlag(candidate);
        if (!live)
            continue;
        found = true;
        min = Math.min(min, live.remaining);
    }
    return found ? min : 0;
}
/** Write the shared remaining value onto every candidate that carries the flag. */
async function syncStoneMaximizationRemaining(actor, nextRemaining) {
    const combat = liveCombat();
    const combatId = combat?.id ? String(combat.id) : '';
    const targets = [];
    let template = null;
    for (const candidate of maximizationActorCandidates(actor)) {
        const live = readStoneMaximizationFlag(candidate);
        if (!live)
            continue;
        template = live.raw;
        targets.push({ candidate, raw: live.raw });
    }
    if (!targets.length || !template)
        return false;
    const payload = {
        ...template,
        remaining: Math.max(0, Math.floor(Number(nextRemaining) || 0)),
        combatId: String(template.combatId || combatId || ''),
        used: true,
    };
    for (const { candidate, raw } of targets) {
        await candidate.setFlag?.('mastery-system', MAXIMIZATION_FLAG, {
            ...raw,
            ...payload,
        });
    }
    return true;
}
function readPassiveMaximizationRemainingSync(actor) {
    const combat = liveCombat();
    const raw = readActorFlag(actor, 'passiveMaximizationCharges');
    if (!raw)
        return 0;
    if (combat && raw.combatId && String(raw.combatId) !== String(combat.id))
        return 0;
    return Math.max(0, Math.floor(Number(raw.remaining) || 0));
}
/**
 * Active Buff Maximization combat quota (Z01).
 * `spent` survives Buff end / swap / reactivate so switching cannot farm uses.
 * When no Maximization Buff is maintained (`granted === 0`), returns null for
 * spend/UI but callers that only need persistence should read roundState.
 */
export function syncActiveBuffMaximizationQuotaState(existing, combatId, granted) {
    const roundKey = String(combatId);
    const x = Math.max(0, Math.floor(Number(granted) || 0));
    if (!existing || String(existing.roundKey || '') !== roundKey) {
        return { roundKey, granted: x, remaining: x, spent: 0 };
    }
    const spent = Math.max(0, Math.floor(Number(existing.spent) ||
        Math.max(0, Math.floor(Number(existing.granted) || 0) - Math.floor(Number(existing.remaining) || 0))));
    // Higher X mid-combat (e.g. empower) adds unused capacity only; spent stays.
    return {
        roundKey,
        granted: x,
        remaining: Math.max(0, x - spent),
        spent,
    };
}
function syncActiveBuffMaximizationQuota(actor) {
    const combat = liveCombat();
    if (!combat?.id || !actor)
        return null;
    const granted = getActiveBuffMaximizationUses(actor);
    let rs = null;
    try {
        rs = actor.getFlag?.('mastery-system', 'roundState');
    }
    catch {
        rs = null;
    }
    const existing = rs?.maximizationQuota;
    if (granted <= 0) {
        // Buff off — preserve spent on roundState when present; no spendable uses.
        return null;
    }
    return syncActiveBuffMaximizationQuotaState(existing, String(combat.id), granted);
}
export function remainingActiveBuffMaximizations(actor) {
    return syncActiveBuffMaximizationQuota(actor)?.remaining ?? 0;
}
/** Total Maximizations (stone + Passive + Active Buff) available for UI enablement. */
export function remainingMaximizations(actor) {
    return (remainingStoneMaximizations(actor) +
        readPassiveMaximizationRemainingSync(actor) +
        remainingActiveBuffMaximizations(actor));
}
export function listAvailableMaximizationSources(actor) {
    const out = [];
    const stone = remainingStoneMaximizations(actor);
    const passive = readPassiveMaximizationRemainingSync(actor);
    const buff = remainingActiveBuffMaximizations(actor);
    if (stone > 0)
        out.push({ source: 'stone', remaining: stone, label: `Vitality Stone Maximization (${stone})` });
    if (passive > 0)
        out.push({ source: 'passive', remaining: passive, label: `Passive: Maximization (${passive})` });
    if (buff > 0)
        out.push({ source: 'activeBuff', remaining: buff, label: `Active Buff: Maximization (${buff})` });
    return out;
}
/**
 * Damage-card source picker: hide when empty, plain hint for one source,
 * dropdown only when 2+ Maximization sources remain.
 */
export function maximizationSourcePickerMode(sourceCount) {
    const n = Math.max(0, Math.floor(Number(sourceCount) || 0));
    if (n <= 0)
        return 'hidden';
    if (n === 1)
        return 'hint';
    return 'select';
}
/**
 * Spend one Maximization charge from exactly one source.
 * Prefer `preferred` when that source still has charges; else stone then Passive.
 * Stone charges are a shared combat pool across token/world actor copies.
 */
export async function spendMaximization(actor, preferred) {
    const stoneLeft = remainingStoneMaximizations(actor);
    let passiveLeft = 0;
    try {
        const { getPassiveMaximizationRemaining, grantPassiveCombatCharges } = await import('../combat/passive-combat-charges.js');
        const combat = liveCombat();
        if (combat?.id)
            await grantPassiveCombatCharges(actor, combat);
        passiveLeft = getPassiveMaximizationRemaining(actor, combat);
    }
    catch {
        passiveLeft = 0;
    }
    const buffQuota = syncActiveBuffMaximizationQuota(actor);
    const buffLeft = buffQuota?.remaining ?? 0;
    let pick = null;
    if (preferred === 'stone' && stoneLeft > 0)
        pick = 'stone';
    else if (preferred === 'passive' && passiveLeft > 0)
        pick = 'passive';
    else if (preferred === 'activeBuff' && buffLeft > 0)
        pick = 'activeBuff';
    else if (stoneLeft > 0)
        pick = 'stone';
    else if (passiveLeft > 0)
        pick = 'passive';
    else if (buffLeft > 0)
        pick = 'activeBuff';
    if (!pick)
        return false;
    if (pick === 'stone') {
        return syncStoneMaximizationRemaining(actor, stoneLeft - 1);
    }
    if (pick === 'passive') {
        const { spendPassiveMaximizationCharge } = await import('../combat/passive-combat-charges.js');
        return spendPassiveMaximizationCharge(actor, liveCombat());
    }
    if (pick === 'activeBuff' && buffQuota) {
        try {
            const { getRoundState, setRoundState } = await import('../combat/action-economy.js');
            const combat = liveCombat();
            const rs = getRoundState(actor, combat);
            const nextSpent = Math.max(0, Number(buffQuota.spent) || 0) + 1;
            rs.maximizationQuota = {
                roundKey: buffQuota.roundKey,
                granted: buffQuota.granted,
                spent: nextSpent,
                remaining: Math.max(0, buffQuota.granted - nextSpent),
            };
            await setRoundState(actor, rs);
            return true;
        }
        catch {
            return false;
        }
    }
    return false;
}
/**
 * @deprecated Prefer Roll / Roll Maximum buttons + {@link spendMaximization}.
 * Kept for tests and any legacy callers that still expect a confirm dialog.
 */
export async function offerMaximization(actor, kind = 'damage') {
    const live = liveMaximizationFlag(actor);
    if (!live)
        return false;
    const DialogCtor = globalThis.Dialog;
    let yes = false;
    const rollLabel = kind === 'healing' ? 'Healing Roll' : 'Damage Roll';
    if (typeof DialogCtor?.confirm === 'function') {
        yes = await DialogCtor.confirm({
            title: 'Maximization',
            content: `<p>Maximize this complete ${rollLabel}? Every d8 becomes 8. Forced 8s are not natural 8s and do not explode.</p>` +
                `<p><strong>Maximization: ${live.remaining} / ${live.uses || live.remaining} remaining</strong></p>`,
        });
    }
    if (!yes)
        return false;
    return spendMaximization(actor);
}
/** @deprecated Use spendMaximization — kept for callers / Hunter's Scourge. */
export async function offerDamageMaximization(actor) {
    return spendMaximization(actor);
}
function resolveTokenLike(actor, combatantToken) {
    if (combatantToken && typeof combatantToken === 'object') {
        return combatantToken.actor ? combatantToken : { actor, document: combatantToken, disposition: combatantToken.disposition };
    }
    const active = actor?.getActiveTokens?.()?.[0]?.document ??
        actor?.getActiveTokens?.()?.[0] ??
        actor?.token ??
        null;
    if (active) {
        return active.actor ? active : { actor, document: active, disposition: active.disposition };
    }
    return {
        actor,
        document: actor?.prototypeToken,
        disposition: actor?.prototypeToken?.disposition,
    };
}
/**
 * True when `target` is a valid enemy for Stone powers (Reaction Denial,
 * Movement Reduction). PC casters never see other PCs or PC summons; NPC
 * casters still may target opposing PCs via normal hostility.
 */
export function isHostileNpcStoneTarget(caster, target, combatantToken) {
    if (!target)
        return false;
    if (String(target.id || '') === String(caster?.id || ''))
        return false;
    const casterToken = resolveTokenLike(caster);
    const targetToken = resolveTokenLike(target, combatantToken);
    // Player-side casters only pick opposing NPCs — never ally PCs / summons.
    if (isPlayerCombatantToken(casterToken)) {
        if (isPlayerCombatantToken(targetToken))
            return false;
        if (target.hasPlayerOwner === true || targetToken?.document?.hasPlayerOwner === true) {
            return false;
        }
    }
    return tokenIsHostileTo(casterToken, targetToken);
}
export async function chooseCombatantActors(opts) {
    const combat = globalThis.game?.combat;
    const bag = combat?.combatants;
    const rows = bag
        ? typeof bag.values === 'function'
            ? Array.from(bag.values())
            : Array.isArray(bag)
                ? bag
                : []
        : [];
    const casterId = String(opts.caster?.id || '');
    const maxRange = Math.max(0, Number(opts.maxRangeM) || 0);
    let distanceBetween = null;
    if (maxRange > 0) {
        try {
            const mod = await import('../combat/reaction-eligibility.js');
            distanceBetween = mod.distanceBetweenActorsMeters;
        }
        catch {
            distanceBetween = null;
        }
    }
    const choices = rows
        .map((c) => ({ actor: c?.actor, token: c?.token }))
        .filter(({ actor, token }) => {
        if (!actor || String(actor.id || '') === casterId)
            return false;
        if (opts.enemiesOnly && !isHostileNpcStoneTarget(opts.caster, actor, token))
            return false;
        if (!distanceBetween || maxRange <= 0)
            return true;
        const meters = distanceBetween(opts.caster, actor);
        return meters == null || meters <= maxRange + 0.05;
    })
        .map(({ actor }) => actor)
        .filter(Boolean);
    if (!choices.length)
        return [];
    const DialogCtor = globalThis.Dialog;
    if (typeof DialogCtor !== 'function')
        return [];
    const picked = [];
    const max = Math.max(1, Math.floor(opts.max) || 1);
    let remaining = choices.slice();
    while (picked.length < max && remaining.length) {
        const buttons = remaining
            .map((actor, index) => `<button type="button" class="stone-target-pick" data-index="${index}">${String(actor.name || 'Creature')}</button>`)
            .join('');
        const choice = await new Promise((resolve) => {
            let settled = false;
            const finish = (value) => {
                if (settled)
                    return;
                settled = true;
                resolve(value);
            };
            const dialog = new DialogCtor({
                title: opts.title,
                content: `<form class="mastery-stone-target" onsubmit="return false;"><p>${opts.hint}</p><div>${buttons}</div></form>`,
                buttons: { cancel: { label: 'Done', callback: () => finish(null) } },
                default: 'cancel',
                close: () => finish(null),
            }, { width: 420 });
            dialog.activateListeners = function activate(html) {
                DialogCtor.prototype?.activateListeners?.call(dialog, html);
                const root = html?.jquery ? html[0] : html;
                root?.querySelectorAll?.('.stone-target-pick')?.forEach((btn) => {
                    btn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        finish(Math.floor(Number(btn.dataset.index)));
                        dialog.close();
                    });
                });
            };
            dialog.render(true);
        });
        if (choice == null || !remaining[choice])
            break;
        picked.push(remaining[choice]);
        remaining = remaining.filter((_, index) => index !== choice);
    }
    return picked;
}
//# sourceMappingURL=stone-combat-effects.js.map
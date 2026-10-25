/**
 * Active Buff lifecycle — Preparation-Phase activation, complete-Round duration,
 * Round-End expiry, and Preparation resource refresh (Temp HP / DN Pool).
 *
 * Duration: lastActiveRound = activationRound + effectiveDuration - 1.
 * MR1 activated in Prep for Round 1 lasts all of Round 1 and expires at Round End.
 */
import { getRoundState, setRoundState } from './action-economy.js';
import { refreshBuffDamageNegationPools } from './damage-negation.js';
import { getTempHPSources, makeSourceKey, upsertTempHPSource, } from './passive-triggers.js';
import { readPreparationPhase, PREPARATION_PHASE_FLAG } from '../stones/preparation-phase.js';
async function loadActiveBuffHelpers() {
    const mod = await import('../utils/active-buffs.js');
    return { getActiveBuffs: mod.getActiveBuffs, isTrueActiveBuff: mod.isTrueActiveBuff };
}
function getActiveBuffsSync(actor) {
    // Synchronous read used after effects exist — duplicate minimal filter to avoid
    // circular import with active-buffs.ts at module load.
    const effects = actor?.effects;
    if (!effects)
        return [];
    const list = Array.isArray(effects)
        ? effects
        : Array.isArray(effects.contents)
            ? effects.contents
            : typeof effects[Symbol.iterator] === 'function'
                ? Array.from(effects)
                : [];
    return list.filter((effect) => effect?.flags?.['mastery-system']?.activeBuff === true);
}
/** Pure duration math (authoritative). */
export function computeLastActiveRound(activationRound, effectiveDuration) {
    const act = Math.max(1, Math.floor(Number(activationRound) || 1));
    const dur = Math.max(1, Math.floor(Number(effectiveDuration) || 1));
    return act + dur - 1;
}
export function isBuffActiveInRound(activationRound, lastActiveRound, currentRound) {
    const cur = Math.max(1, Math.floor(Number(currentRound) || 1));
    const act = Math.max(1, Math.floor(Number(activationRound) || 1));
    const last = Math.max(act, Math.floor(Number(lastActiveRound) || act));
    return cur >= act && cur <= last;
}
/** Upcoming combat Round for Preparation (Foundry prep often uses round 0). */
export function preparationTargetRound(combat) {
    const r = Math.floor(Number(combat?.round) || 0);
    return Math.max(1, r <= 0 ? 1 : r);
}
/**
 * True when the actor may legally activate/replace an Active Buff:
 * combat exists and Preparation for the upcoming Round is still open for them.
 */
export function isActiveBuffPreparationWindow(actor, combat) {
    if (!actor || !combat?.id)
        return false;
    // Soft open: combat not started yet → Preparation
    if (!combat.started)
        return true;
    const round = preparationTargetRound(combat);
    try {
        const raw = actor.getFlag?.('mastery-system', PREPARATION_PHASE_FLAG);
        const prep = readPreparationPhase(raw, String(combat.id), round);
        if (prep.assignment === 'open')
            return true;
        const prep0 = readPreparationPhase(raw, String(combat.id), 0);
        if (round === 1 && prep0.assignment === 'open' && prep0.combatId === String(combat.id)) {
            return true;
        }
    }
    catch {
        /* fall through */
    }
    // Stones dialog still open for this Round → Preparation not finalized.
    try {
        const combatants = combat.combatants;
        const list = typeof combatants?.[Symbol.iterator] === 'function'
            ? Array.from(combatants)
            : Array.isArray(combatants)
                ? combatants
                : [];
        const combatant = list.find((c) => c?.actor?.id === actor.id || c?.actorId === actor.id);
        if (combatant) {
            const doneMap = combat.getFlag?.('mastery-system', 'stonePowersDoneByRound') ??
                combat.flags?.['mastery-system']?.stonePowersDoneByRound;
            const key = `${combatant.id}:${round}`;
            if (doneMap && doneMap[key])
                return false;
            // No done flag yet → still in Preparation for this Round
            if (!doneMap || doneMap[key] === undefined)
                return true;
        }
    }
    catch {
        /* optional */
    }
    return false;
}
export function readBuffLifecycleFlags(effect) {
    const flags = effect?.flags?.['mastery-system'];
    if (!flags?.activeBuff)
        return null;
    const activationRound = Math.max(1, Math.floor(Number(flags.activationRound ?? flags.activatedRound) || 1));
    const effectiveDuration = Math.max(1, Math.floor(Number(flags.effectiveDuration ?? flags.durationRounds) || 1));
    const lastActiveRound = Math.max(activationRound, Math.floor(Number(flags.lastActiveRound) || computeLastActiveRound(activationRound, effectiveDuration)));
    return {
        activationRound,
        effectiveDuration,
        lastActiveRound,
        combatId: String(flags.combatId ?? ''),
        durationMode: String(flags.durationMode || ''),
    };
}
/** Remaining complete Rounds including the current Round (0 if expired). */
export function remainingCompleteRounds(lastActiveRound, currentRound) {
    const last = Math.floor(Number(lastActiveRound) || 0);
    const cur = Math.max(1, Math.floor(Number(currentRound) || 1));
    return Math.max(0, last - cur + 1);
}
/**
 * Commit the base Attack Action for the upcoming Round (survives resetTurnState).
 */
export async function commitPrepBaseAttackAction(actor, combat) {
    if (!actor || !combat)
        return false;
    const rs = getRoundState(actor, combat);
    if (rs.prepBaseAttackCommitted)
        return false;
    if (rs.baseAttackLocked)
        return false;
    // Must still have a base slot conceptually: if used already ate the only action and no extras…
    const total = Math.max(0, Math.floor(Number(rs.attackActions?.total) || 1));
    const used = Math.max(0, Math.floor(Number(rs.attackActions?.used) || 0));
    if (total - used <= 0 && !rs.stoneBonuses?.extraAttacks) {
        // Still allow commit when total≥1 and used=0 — checked via available helpers by caller.
    }
    rs.prepBaseAttackCommitted = true;
    rs.activeBuffUsedThisRound = true;
    await setRoundState(actor, rs);
    return true;
}
export async function clearPrepBaseAttackCommitment(actor, combat) {
    if (!actor || !combat)
        return;
    const rs = getRoundState(actor, combat);
    if (!rs.prepBaseAttackCommitted)
        return;
    rs.prepBaseAttackCommitted = false;
    await setRoundState(actor, rs);
}
/**
 * Full rollback of a Preparation Active Buff activation cost:
 * clears prepBaseAttackCommitted and activeBuffUsedThisRound.
 * Call only when the base Attack was committed for that activation.
 */
export async function refundPrepActiveBuffActivation(actor, combat) {
    if (!actor || !combat)
        return false;
    const rs = getRoundState(actor, combat);
    if (!rs.prepBaseAttackCommitted && !rs.activeBuffUsedThisRound)
        return false;
    const hadCommit = !!rs.prepBaseAttackCommitted;
    rs.prepBaseAttackCommitted = false;
    rs.activeBuffUsedThisRound = false;
    await setRoundState(actor, rs);
    return hadCommit;
}
/**
 * Expire Active Buffs whose lastActiveRound is strictly before the new Round
 * (i.e. Round End of lastActiveRound has passed). Call when advancing to `newRound`.
 */
export async function expireActiveBuffsAtRoundEnd(actor, combat, endingRound) {
    if (!actor)
        return [];
    const ended = Math.max(1, Math.floor(Number(endingRound) || 1));
    const expiredNames = [];
    const effects = getActiveBuffsSync(actor);
    for (const effect of effects) {
        const life = readBuffLifecycleFlags(effect);
        if (!life)
            continue;
        if (combat?.id && life.combatId && life.combatId !== String(combat.id))
            continue;
        // Expire when the Round that just ended was the last active Round.
        if (life.lastActiveRound <= ended) {
            expiredNames.push(String(effect.name || 'Active Buff'));
            try {
                await effect.delete?.();
            }
            catch (err) {
                console.warn('Mastery System | Active Buff Round-End expiry failed', err);
            }
        }
    }
    return expiredNames;
}
/**
 * Refresh Active Buff Temporary HP pools at Preparation (once per Round).
 * Raises each buff-owned refresh source to its declared printed value.
 */
export async function refreshActiveBuffTempHPAtPreparation(actor, combat) {
    if (!actor)
        return;
    const combatId = String(combat?.id ?? '');
    const effects = getActiveBuffsSync(actor);
    for (const effect of effects) {
        const flags = effect?.flags?.['mastery-system'];
        if (!flags?.activeBuff)
            continue;
        if (!buffUsesPreparationTempHPRefresh(effect))
            continue;
        const mech = flags.mechanics && typeof flags.mechanics === 'object' ? flags.mechanics : {};
        const raw = mech.tempHP ??
            mech.triggers?.preparation?.tempHP ??
            mech.triggers?.turnStartSelf?.tempHP;
        if (raw == null || raw === '')
            continue;
        const target = Math.max(0, Math.floor(Number(String(raw).replace(/[^\d.-]/g, '')) || 0));
        if (target <= 0)
            continue;
        // Skip if this Round already refreshed (idempotent per combatId:round).
        const round = preparationTargetRound(combat);
        const refreshKey = `prepTempHP:${combatId}:${round}`;
        if (flags[refreshKey])
            continue;
        const effectId = String(effect?.id ?? effect?._id ?? '');
        if (!effectId)
            continue;
        const key = makeSourceKey('buff', effectId, 'turnStartSelf');
        const existing = getTempHPSources(actor)[key];
        const source = {
            value: Math.max(existing?.value ?? 0, target),
            declared: target,
            kind: 'refresh',
            origin: {
                ownerKind: 'buff',
                powerId: effectId,
                name: String(flags.powerName ?? effect?.name ?? 'Active Buff'),
                triggerKind: 'turnStartSelf',
            },
            combatId,
            createdAt: existing?.createdAt ?? Date.now(),
        };
        await upsertTempHPSource(actor, key, source);
        try {
            if (typeof effect.update === 'function') {
                await effect.update({ [`flags.mastery-system.${refreshKey}`]: true });
            }
            else if (flags) {
                flags[refreshKey] = true;
            }
        }
        catch {
            /* best-effort idempotence mark */
        }
    }
}
/**
 * Preparation tick for one actor: refresh Round resources for maintained Buffs.
 * Call after Round End expiry for the previous Round / at Prep open for the new Round.
 */
export async function processActiveBuffPreparation(actor, combat) {
    if (!actor)
        return;
    await refreshBuffDamageNegationPools(actor);
    await refreshActiveBuffTempHPAtPreparation(actor, combat);
}
/**
 * Round advance pipeline helper: expire buffs that ended with `previousRound`,
 * then refresh surviving buffs for `newRound` Preparation.
 */
export async function onCombatRoundAdvanceActiveBuffs(combat, newRound) {
    if (!combat?.combatants)
        return;
    const prev = Math.max(1, Math.floor(Number(newRound) || 1) - 1);
    for (const c of combat.combatants) {
        const actor = c?.actor;
        if (!actor)
            continue;
        if (prev >= 1 && Math.floor(Number(newRound) || 1) >= 2) {
            await expireActiveBuffsAtRoundEnd(actor, combat, prev);
        }
        await processActiveBuffPreparation(actor, combat);
    }
}
/** List true Active Buff power items the actor owns (for Preparation UI). */
export async function listActivatableActiveBuffPowers(actor) {
    if (!actor?.items)
        return [];
    const { isTrueActiveBuff } = await loadActiveBuffHelpers();
    const items = Array.isArray(actor.items)
        ? actor.items
        : Array.isArray(actor.items.contents)
            ? actor.items.contents
            : typeof actor.items[Symbol.iterator] === 'function'
                ? Array.from(actor.items)
                : [];
    const powers = items.filter((it) => {
        if (it?.type !== 'power')
            return false;
        try {
            return isTrueActiveBuff(it);
        }
        catch {
            return false;
        }
    });
    // Artifact Active Buff rows (e.g. Moonlight Shadow) — no backing power item.
    try {
        const { buildArtifactRadialOptions } = await import('../radial-menu/artifact-options.js');
        const artifactOpts = buildArtifactRadialOptions(actor) || [];
        for (const opt of artifactOpts) {
            if (opt?.powerType !== 'active-buff')
                continue;
            powers.push({
                id: String(opt.id || ''),
                _id: String(opt.id || ''),
                name: String(opt.name || 'Artifact Active Buff'),
                type: 'artifact-active-buff',
                system: {
                    rank: Number(opt.artifactRowLevel) || 1,
                    level: Number(opt.artifactRowLevel) || 1,
                    templateId: opt.artifactPowerTemplateId || null,
                },
                __artifactOption: opt,
                __artifactItem: opt.item,
            });
        }
    }
    catch (err) {
        console.warn('Mastery System | Artifact Active Buff list failed', err);
    }
    return powers;
}
export function formatActiveBuffDurationLabel(activationRound, lastActiveRound, currentRound) {
    const rem = remainingCompleteRounds(lastActiveRound, currentRound);
    if (rem <= 0)
        return 'Expired';
    if (rem === 1)
        return `Active through Round ${lastActiveRound} (this Round)`;
    return `Active through Round ${lastActiveRound} (${rem} Rounds left)`;
}
/** Skip turnStartSelf Temp HP for Active Buffs that refresh at Preparation. */
export function buffUsesPreparationTempHPRefresh(effect) {
    const flags = effect?.flags?.['mastery-system'];
    if (!flags?.activeBuff)
        return false;
    const tid = String(flags.powerTemplateId ?? '').toLowerCase();
    if (tid === 'ab-temp-hp' || tid === 'ab-temp-hp-healing')
        return true;
    const mech = flags.mechanics;
    if (mech?.preparationTempHP === true)
        return true;
    // Prefer Prep refresh whenever a buff declares tempHP without an explicit turn pulse.
    if (mech?.tempHP != null && mech?.triggers?.turnStartSelf?.tempHP == null)
        return true;
    if (mech?.triggers?.preparation?.tempHP)
        return true;
    return tid.includes('temp-hp') || tid.includes('temphp');
}
//# sourceMappingURL=active-buff-lifecycle.js.map
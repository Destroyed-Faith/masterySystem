/**
 * Active Buff utilities for the Mastery System
 * Active Buffs are powers that create effects lasting for "Mastery Rank rounds"
 */
import { powerCostPaysAction } from '../radial-menu/options.js';
import { resolvePowerMechanics } from './power-mechanics.js';
import { ALL_POWER_TEMPLATES } from './powers/index.js';
import { getRoundState, setRoundState } from '../combat/action-economy.js';
import { getRulesMasteryRank } from './mastery-rank-sync.js';
/**
 * Consume pending Resolve Active Buff Empowerment (PL + complete Rounds).
 * Applies only when activating/replacing a Buff in Preparation — not when
 * merely maintaining. Clears the pending marker so one activation benefits.
 * Once-per-combat spend is tracked on the stone power flag separately.
 */
async function consumePendingBuffExtension(actor) {
    try {
        const combat = game.combat ?? null;
        const roundState = getRoundState(actor, combat);
        const sb = roundState?.stoneBonuses;
        const pending = Math.max(0, Math.floor(Number(sb?.extendActiveBuffRounds ?? 0) || 0));
        const pl = Math.max(0, Math.floor(Number(sb?.activeBuffPlBonus ?? 0) || 0));
        if (pending <= 0 && pl <= 0)
            return { rounds: 0, powerLevels: 0 };
        sb.extendActiveBuffRounds = 0;
        sb.activeBuffPlBonus = 0;
        await setRoundState(actor, roundState);
        return { rounds: pending, powerLevels: pl };
    }
    catch (err) {
        console.warn('Mastery System | Active Buff Empowerment lookup failed', err);
        return { rounds: 0, powerLevels: 0 };
    }
}
function paysActionCost(power) {
    return powerCostPaysAction(power?.system?.cost);
}
function resolvedActiveBuffMechanics(power) {
    try {
        const mech = resolvePowerMechanics(power);
        return mech?.applyWhen === 'activeBuff-active';
    }
    catch {
        return false;
    }
}
/**
 * Effect Power Level for an Active Buff snapshot.
 * Uses the power's purchased `rank` / `level` — never Mastery Rank (that only
 * sets duration). Missing rank previously fell back to MR and could snapshot
 * Active Buff: Armor at +17 (PL4) while the sheet still showed PL1/+5.
 */
export function resolveActiveBuffEffectLevel(powerSys, empowerPowerLevels = 0) {
    const pick = (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 0;
    };
    const base = pick(powerSys?.rank) || pick(powerSys?.level) || 1;
    const bonus = Math.max(0, Math.floor(Number(empowerPowerLevels) || 0));
    return Math.max(1, Math.min(16, base + bonus));
}
/**
 * Check if a power is a utility (not a true active buff)
 */
export function isUtility(power) {
    if (!power || power.type !== 'power')
        return false;
    const powerType = power.system?.powerType;
    return powerType === 'utility';
}
/**
 * Check if a power is a true active buff (not a utility)
 */
export function isTrueActiveBuff(power) {
    if (!power || power.type !== 'power')
        return false;
    const powerType = power.system?.powerType;
    const pays = paysActionCost(power);
    // Utilities are NOT true active buffs (they can stack)
    if (powerType === 'utility') {
        return false;
    }
    // Check if it's explicitly an active-buff or buff power that requires an action
    if ((powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') && pays) {
        return true;
    }
    if (resolvedActiveBuffMechanics(power) && pays) {
        return true;
    }
    // Check tags for active-buff indicators
    const tags = power.system?.tags || [];
    if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
        if (pays) {
            return true;
        }
    }
    // Check if power type is 'active' but has buff-like characteristics
    if (powerType === 'active' && pays) {
        const nameLower = power.name?.toLowerCase() || '';
        const descLower = (power.system?.description || '').toLowerCase();
        if (nameLower.includes('buff') || descLower.includes('buff') ||
            nameLower.includes('stance') || descLower.includes('stance')) {
            return true;
        }
    }
    return false;
}
/**
 * Check if a power is an active buff (includes utilities)
 */
export function isActiveBuff(power) {
    if (!power || power.type !== 'power')
        return false;
    const powerType = power.system?.powerType;
    const range = power.system?.range;
    const tags = power.system?.tags || [];
    const pays = paysActionCost(power);
    // Check if it's explicitly an active-buff or buff power that requires an action
    if ((powerType === 'active-buff' || powerType === 'activeBuff' || powerType === 'buff') && pays) {
        return true;
    }
    if (resolvedActiveBuffMechanics(power) && pays) {
        return true;
    }
    // Check tags for active-buff indicators
    if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
        if (pays) {
            return true;
        }
    }
    // Check if power type is 'active' but has buff-like characteristics
    if (powerType === 'active' && pays) {
        const nameLower = power.name?.toLowerCase() || '';
        const descLower = (power.system?.description || '').toLowerCase();
        if (nameLower.includes('buff') || descLower.includes('buff') ||
            nameLower.includes('stance') || descLower.includes('stance')) {
            return true;
        }
    }
    // Check if it's a utility that is Self-targeting (these are also active buffs)
    if (powerType === 'utility' && pays) {
        const rangeStr = range?.toString().toLowerCase() || '';
        // If range is "Self" or 0, it's a self-buff utility
        if (rangeStr === 'self' || rangeStr === '0' || range === 0) {
            return true;
        }
        // Also check if it has buff-like tags or characteristics
        if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
            return true;
        }
        // Check name/description for buff indicators
        const nameLower = power.name?.toLowerCase() || '';
        const descLower = (power.system?.description || '').toLowerCase();
        if (nameLower.includes('buff') || descLower.includes('buff') ||
            nameLower.includes('stance') || descLower.includes('stance')) {
            return true;
        }
    }
    return false;
}
/** Active Buff duration in rounds before Extend Active Buff. */
export function activeBuffDurationRounds(actor) {
    return getRulesMasteryRank(actor);
}
/**
 * Get current combat round
 */
function getCurrentRound() {
    return game.combat?.round || 1;
}
/**
 * Get all true active buffs (excluding utilities) on an actor
 */
export function getTrueActiveBuffs(actor) {
    const effects = actor.effects;
    if (!effects)
        return [];
    return effects.filter((effect) => {
        const flags = effect.flags?.['mastery-system'];
        if (flags?.activeBuff !== true)
            return false;
        // Check if the original power was a utility
        const powerId = flags.powerId;
        if (powerId) {
            const power = actor.items?.get(powerId);
            if (power && isUtility(power)) {
                return false; // Exclude utilities
            }
        }
        return true;
    });
}
/**
 * Activate an active buff power during the Preparation Phase.
 * Duration is complete Combat Rounds ending at Round End:
 * lastActiveRound = activationRound + effectiveDuration - 1.
 * Only one true active buff can be active at a time (utilities can stack).
 */
export async function activateActiveBuff(actor, power, opts) {
    if (!isActiveBuff(power)) {
        console.warn('Mastery System | activateActiveBuff called with non-buff power', power.name);
        return false;
    }
    // R-05: ordinary HP healing buffs are retired and flagged by the migration; they cannot activate.
    try {
        const { isR05RetiredHealingPower } = await import('../migrations/r05-healing-migration.js');
        if (isR05RetiredHealingPower(power)) {
            ui.notifications?.warn(`${power.name} was retired in R-05 (use Restoration / Passive: Restoration instead).`);
            return false;
        }
    }
    catch {
        /* guard is best-effort */
    }
    const combat = game.combat ?? null;
    if (!opts?.allowOutsidePreparation) {
        if (!combat) {
            ui.notifications?.warn(`${power.name} can only be activated during the Preparation Phase of combat.`);
            return false;
        }
        try {
            const { isActiveBuffPreparationWindow } = await import('../combat/active-buff-lifecycle.js');
            if (!isActiveBuffPreparationWindow(actor, combat)) {
                ui.notifications?.warn(`${power.name}: Active Buffs activate only during Preparation (not during your Turn).`);
                return false;
            }
        }
        catch (err) {
            console.warn('Mastery System | Active Buff Preparation gate failed', err);
            return false;
        }
    }
    // Active Buff: Damage Negation Pool requires slotted Passive: Damage Negation
    // (even when that Passive's combat Reserve is already 0).
    const tplId = String(power?.system?.templateId || '').toLowerCase();
    if (tplId === 'ab-reinforced-damage-negation') {
        try {
            const { slottedPassiveLevel } = await import('../combat/passive-combat-charges.js');
            if (slottedPassiveLevel(actor, 'passive-damage-negation') <= 0) {
                ui.notifications?.warn(`${power.name} requires Passive: Damage Negation to be slotted (Reserve may be 0).`);
                return false;
            }
        }
        catch (err) {
            console.warn('Mastery System | DN Buff requirement check failed', err);
        }
    }
    // Commit base Attack Action for the upcoming Round (survives turn reset).
    if (!opts?.skipActionCommit && combat && isTrueActiveBuff(power)) {
        try {
            const { commitPrepBaseAttackAction, isActiveBuffPreparationWindow, } = await import('../combat/active-buff-lifecycle.js');
            const { getAvailableAttackActions, getRoundState } = await import('../combat/action-economy.js');
            const rs = getRoundState(actor, combat);
            if (rs.activeBuffUsedThisRound || rs.prepBaseAttackCommitted) {
                ui.notifications?.warn('You already activated or replaced an Active Buff this Preparation.');
                return false;
            }
            if (getAvailableAttackActions(actor, combat) <= 0) {
                ui.notifications?.warn('Cannot activate an Active Buff — no base Attack Action available to commit.');
                return false;
            }
            if (isActiveBuffPreparationWindow(actor, combat)) {
                const ok = await commitPrepBaseAttackAction(actor, combat);
                if (!ok) {
                    ui.notifications?.warn('Failed to commit the base Attack Action for this Active Buff.');
                    return false;
                }
            }
        }
        catch (err) {
            console.warn('Mastery System | Active Buff action commit failed', err);
            return false;
        }
    }
    // Check if this is a true active buff (not a utility)
    const isTrueBuff = isTrueActiveBuff(power);
    // PG "Active Buffs": activating a new Active Buff ENDS the previous one —
    // the new buff replaces it (swap), it is not blocked.
    if (isTrueBuff) {
        const existingTrueBuffs = getTrueActiveBuffs(actor);
        for (const existingBuff of existingTrueBuffs) {
            const existingName = existingBuff.name || 'Unknown';
            try {
                await existingBuff.delete();
                ui.notifications?.info(`${existingName} ends — ${power.name} replaces it (only one Active Buff at a time).`);
            }
            catch (err) {
                console.warn('Mastery System | failed to end previous Active Buff', err);
            }
        }
    }
    const masteryRank = activeBuffDurationRounds(actor);
    const { preparationTargetRound, computeLastActiveRound, } = await import('../combat/active-buff-lifecycle.js');
    const activationRound = combat ? preparationTargetRound(combat) : Math.max(1, getCurrentRound());
    // Resolve Stone Ability: Active Buff Empowerment — may improve PL and duration
    // for a Buff activated in the same Preparation Phase.
    const empower = await consumePendingBuffExtension(actor);
    const durationRounds = masteryRank + empower.rounds;
    const lastActiveRound = computeLastActiveRound(activationRound, durationRounds);
    // Foundry duration is set long enough that native countdown does not cut the
    // Buff mid-Round; authoritative expiry is Round End via lifecycle.
    const duration = {
        startRound: activationRound,
        startTurn: 0,
        rounds: durationRounds + 1,
        turns: 0,
        seconds: null,
        combat: combat?.id || null,
    };
    // Snapshot level-specific mechanics (powers use levels["1"]..["16"]; `rank` is 1–16).
    const powerSys = power.system || {};
    const powerLevelKey = resolveActiveBuffEffectLevel(powerSys, empower.powerLevels);
    let rankMechanicsRaw = null;
    // Prefer live catalog by templateId so PL strength matches the rulebook row
    // (avoids stale baked levels / name collisions with Passive: Armor).
    const tplIdSnap = String(powerSys.templateId || '').trim();
    if (tplIdSnap) {
        const tpl = ALL_POWER_TEMPLATES.find((t) => t?.templateId === tplIdSnap);
        const catMech = tpl?.levels?.[String(powerLevelKey)]?.mechanics;
        if (catMech && typeof catMech === 'object') {
            rankMechanicsRaw = { ...catMech };
        }
    }
    if (!rankMechanicsRaw) {
        const fromLevel = powerSys.levels?.[String(powerLevelKey)]?.mechanics;
        if (fromLevel && typeof fromLevel === 'object') {
            rankMechanicsRaw = { ...fromLevel };
        }
        else if (powerSys.mechanics && typeof powerSys.mechanics === 'object') {
            rankMechanicsRaw = { ...powerSys.mechanics };
        }
        else {
            const resolved = resolvePowerMechanics({
                ...power,
                system: { ...powerSys, rank: powerLevelKey, level: powerLevelKey },
            });
            if (resolved && typeof resolved === 'object') {
                rankMechanicsRaw = { ...resolved };
            }
        }
    }
    // Aggregator requires `applyWhen: 'activeBuff-active'` on the snapshot (item
    // JSON may omit it when only partial mechanics are stored on the level).
    let rankMechanics = rankMechanicsRaw && typeof rankMechanicsRaw === 'object'
        ? { ...rankMechanicsRaw, applyWhen: 'activeBuff-active' }
        : { applyWhen: 'activeBuff-active' };
    // Item JSON sometimes omits `damageReductionPct` on DR rows; merge from catalog so DR always snapshots.
    if (String(powerSys?.templateId || '') === 'ab-damage-reduction') {
        const drNow = rankMechanics.damageReductionPct;
        if (typeof drNow !== 'number' || !Number.isFinite(drNow) || drNow <= 0) {
            const tpl = ALL_POWER_TEMPLATES.find((t) => t?.templateId === 'ab-damage-reduction');
            const lvlKey = String(powerLevelKey);
            const row = tpl?.levels?.[lvlKey] ?? tpl?.levels?.['1'];
            const m = row?.mechanics;
            if (m && typeof m === 'object') {
                rankMechanics = {
                    ...m,
                    ...rankMechanics,
                    applyWhen: 'activeBuff-active',
                };
            }
            else {
            }
        }
    }
    const drSnap = rankMechanics.damageReductionPct;
    if (String(powerSys?.templateId || '') === 'ab-damage-reduction' &&
        (typeof drSnap !== 'number' || !Number.isFinite(drSnap) || drSnap <= 0)) {
        ui.notifications?.warn('Active Buff: Damage Reduction — snapshot has no valid DR%; check power item `levels` / `rank`.');
    }
    const levelRow = powerSys.levels?.[String(powerLevelKey)];
    const effectText = String(levelRow?.effect || levelRow?.effectText || power.system?.description || power.system?.effect || '').trim();
    // Create ActiveEffect data - simplified structure for Foundry VTT
    const effectData = {
        name: power.name,
        // Generic icon — avoids a misleading power-art token on the map for buffs.
        icon: 'icons/svg/book.svg',
        // Store original power data in flags
        flags: {
            'mastery-system': {
                activeBuff: true,
                powerId: power.id,
                powerName: power.name,
                /** Closed-subsystem DR whitelist (see `power-mechanics.ts` / `isSanctionedDR`). */
                powerTemplateId: powerSys?.templateId ? String(powerSys.templateId) : null,
                masteryRank: masteryRank,
                durationRounds: durationRounds,
                effectiveDuration: durationRounds,
                activationRound,
                activatedRound: activationRound,
                lastActiveRound,
                durationMode: 'round-end',
                combatId: combat?.id ? String(combat.id) : null,
                extendedRounds: empower.rounds,
                empoweredPowerLevels: empower.powerLevels,
                effectiveLevel: powerLevelKey,
                level: powerLevelKey,
                effectText,
                isUtility: isUtility(power),
                mechanics: rankMechanics,
                preparationTempHP: tplId === 'ab-temp-hp' || tplId === 'ab-temp-hp-healing',
            }
        },
        // Add description directly (not in system.description.value)
        description: effectText || power.system?.description || power.system?.effect || ''
    };
    // Add duration if in combat
    if (game.combat) {
        effectData.duration = duration;
    }
    else {
        // If not in combat, set a long duration so it doesn't expire immediately
        effectData.duration = {
            startRound: null,
            startTurn: null,
            rounds: durationRounds,
            turns: null,
            seconds: null,
            combat: null
        };
    }
    try {
        // Create the effect on the actor
        const created = await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        if (!created?.length) {
            if (combat && !opts?.skipActionCommit) {
                try {
                    const { refundPrepActiveBuffActivation } = await import('../combat/active-buff-lifecycle.js');
                    await refundPrepActiveBuffActivation(actor, combat);
                }
                catch {
                    /* best-effort */
                }
            }
            ui.notifications?.error(`Failed to activate ${power.name}`);
            return false;
        }
        ui.notifications?.info(`Activated ${power.name} (Rounds ${activationRound}–${lastActiveRound}${empower.rounds > 0 ? `, incl. +${empower.rounds} from Active Buff Empowerment` : ''})`);
        // Grant Prep resources immediately (Temp HP / DN Pool) for the activation Round.
        try {
            const { processActiveBuffPreparation } = await import('../combat/active-buff-lifecycle.js');
            await processActiveBuffPreparation(actor, combat);
        }
        catch (prepErr) {
            console.warn('Mastery System | Active Buff Preparation resource grant failed', prepErr);
        }
        try {
            const ChatCls = globalThis.ChatMessage;
            const esc = globalThis.foundry?.utils?.escapeHTML?.bind(globalThis.foundry.utils) ??
                ((s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            const lines = [
                `<p><strong>${esc(String(power.name))}</strong> — active through <strong>Round ${lastActiveRound}</strong> (expires at Round End; Prep activation).</p>`,
            ];
            if (empower.rounds > 0 || empower.powerLevels > 0) {
                lines.push(`<p>Active Buff Empowerment: <strong>+${empower.powerLevels}</strong> Power Level, <strong>+${empower.rounds}</strong> round${empower.rounds === 1 ? '' : 's'}.</p>`);
            }
            const rm = rankMechanics ?? {};
            if (typeof rm.damageReductionPct === 'number' && rm.damageReductionPct > 0) {
                lines.push(`<p>Buff: <strong>+${rm.damageReductionPct}%</strong> Damage Reduction (stacks with passive DR in combat totals).</p>`);
            }
            if (typeof rm.armor === 'number' && rm.armor !== 0) {
                lines.push(`<p>Buff: <strong>+${rm.armor}</strong> Armor.</p>`);
            }
            if (typeof rm.evade === 'number' && rm.evade !== 0) {
                lines.push(`<p>Buff: <strong>+${rm.evade}</strong> Evade.</p>`);
            }
            await ChatCls.create({
                user: game.user?.id,
                speaker: ChatCls.getSpeaker({ actor: actor }),
                content: lines.join(''),
            });
        }
        catch (chatErr) {
            console.warn('Mastery System | Active buff chat message failed', chatErr);
        }
        return true;
    }
    catch (error) {
        console.error('Mastery System | Failed to activate active buff', error);
        if (combat && !opts?.skipActionCommit) {
            try {
                const { refundPrepActiveBuffActivation } = await import('../combat/active-buff-lifecycle.js');
                await refundPrepActiveBuffActivation(actor, combat);
            }
            catch {
                /* best-effort undo */
            }
        }
        ui.notifications?.error(`Failed to activate ${power.name}`);
        return false;
    }
}
/**
 * Sync permission helper when Preparation window / ownership are already known (UI context).
 * Players: only during Preparation. GMs: anytime a true buff is maintained.
 */
export function canRetractActiveBuffFromFlags(opts) {
    if (!opts.maintaining)
        return false;
    if (opts.isGM)
        return true;
    return opts.isOwner && opts.windowOpen;
}
/**
 * Whether the current user may retract a maintained true Active Buff.
 * Players: only during Preparation. GMs: anytime a true buff is maintained.
 */
export async function canRetractActiveBuffActivation(actor, combat, user) {
    if (!actor)
        return false;
    const maintained = getTrueActiveBuffs(actor);
    if (!maintained.length)
        return false;
    const u = user ?? globalThis.game?.user ?? null;
    if (u?.isGM)
        return true;
    if (!combat)
        return false;
    if (!actor.isOwner)
        return false;
    try {
        const { isActiveBuffPreparationWindow } = await import('../combat/active-buff-lifecycle.js');
        return isActiveBuffPreparationWindow(actor, combat);
    }
    catch {
        return false;
    }
}
/**
 * Retract a maintained Active Buff: delete the effect and, when the base Attack
 * was committed for this activation, refund prepBaseAttackCommitted + activeBuffUsedThisRound.
 * Players may only retract during Preparation; GMs may retract anytime.
 */
export async function retractActiveBuffActivation(actor, opts) {
    const combat = globalThis.game?.combat ?? null;
    const user = opts?.user ?? globalThis.game?.user ?? null;
    const maintained = getTrueActiveBuffs(actor);
    if (!maintained.length) {
        ui.notifications?.warn('No Active Buff to retract.');
        return { ok: false, refunded: false, reason: 'none' };
    }
    let allowed = !!user?.isGM;
    if (!allowed && combat && actor.isOwner) {
        try {
            const { isActiveBuffPreparationWindow } = await import('../combat/active-buff-lifecycle.js');
            allowed = isActiveBuffPreparationWindow(actor, combat);
        }
        catch {
            allowed = false;
        }
    }
    if (!allowed) {
        ui.notifications?.warn('You can only retract an Active Buff during Preparation (GM may retract anytime).');
        return { ok: false, refunded: false, reason: 'denied' };
    }
    const names = maintained
        .map((e) => String(e?.name || 'Active Buff'))
        .filter(Boolean)
        .join(', ');
    try {
        for (const effect of [...maintained]) {
            await effect.delete();
        }
    }
    catch (err) {
        console.error('Mastery System | Failed to retract Active Buff', err);
        ui.notifications?.error('Failed to retract Active Buff.');
        return { ok: false, refunded: false, reason: 'error' };
    }
    let refunded = false;
    if (combat) {
        try {
            const { getRoundState } = await import('../combat/action-economy.js');
            const { refundPrepActiveBuffActivation } = await import('../combat/active-buff-lifecycle.js');
            const rs = getRoundState(actor, combat);
            if (rs.prepBaseAttackCommitted) {
                refunded = await refundPrepActiveBuffActivation(actor, combat);
            }
            else if (rs.activeBuffUsedThisRound) {
                // Stale flag without commit — clear so Preparation can activate again.
                rs.activeBuffUsedThisRound = false;
                const { setRoundState } = await import('../combat/action-economy.js');
                await setRoundState(actor, rs);
            }
        }
        catch (err) {
            console.warn('Mastery System | Active Buff retract refund failed', err);
        }
    }
    if (refunded) {
        ui.notifications?.info(`${names} retracted — base Attack Action restored for this Round.`);
    }
    else {
        ui.notifications?.info(`${names} ended (no Attack Action refund).`);
    }
    try {
        const ChatCls = globalThis.ChatMessage;
        if (ChatCls?.create) {
            const esc = globalThis.foundry?.utils?.escapeHTML?.bind(globalThis.foundry.utils) ??
                ((s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            await ChatCls.create({
                user: globalThis.game?.user?.id,
                speaker: ChatCls.getSpeaker({ actor: actor }),
                content: refunded
                    ? `<p><strong>${esc(names)}</strong> retracted during Preparation — base Attack Action restored.</p>`
                    : `<p><strong>${esc(names)}</strong> ended (maintained buff removed; no Attack refund).</p>`,
            });
        }
    }
    catch {
        /* optional chat */
    }
    return { ok: true, refunded };
}
/**
 * Get all active buffs on an actor
 */
export function getActiveBuffs(actor) {
    const effects = actor.effects;
    if (!effects)
        return [];
    return effects.filter((effect) => {
        const flags = effect.flags?.['mastery-system'];
        return flags?.activeBuff === true;
    });
}
/**
 * Highest Active Buff Critical(X) currently maintained (0 if none).
 * X = Critical-capable attacks per Round (not explode strength).
 * Resolution lives in `src/combat/critical-resolution.ts`.
 */
export function getActiveBuffCriticalTier(actor) {
    let best = 0;
    for (const effect of getActiveBuffs(actor)) {
        const flags = effect.flags?.['mastery-system'] ?? {};
        const mech = flags.mechanics ?? {};
        const crit = Math.max(0, Math.floor(Number(mech.critical) || 0));
        if (crit > best)
            best = crit;
    }
    return best;
}
/**
 * Check if a specific power is currently active as a buff
 */
export function isPowerActiveAsBuff(actor, powerId) {
    const activeBuffs = getActiveBuffs(actor);
    return activeBuffs.some((effect) => {
        const flags = effect.flags?.['mastery-system'];
        return flags?.powerId === powerId;
    });
}
/**
 * Remove all Mastery-flagged active-buff ActiveEffects from an actor (e.g. combat end).
 */
export async function deleteAllMasteryActiveBuffEffects(actor) {
    const effects = getActiveBuffs(actor);
    if (!effects.length)
        return;
    const ids = effects.map((e) => e.id).filter(Boolean);
    if (!ids.length)
        return;
    try {
        await actor.deleteEmbeddedDocuments('ActiveEffect', ids);
    }
    catch (err) {
        console.warn('Mastery System | deleteAllMasteryActiveBuffEffects failed', err);
    }
}
//# sourceMappingURL=active-buffs.js.map
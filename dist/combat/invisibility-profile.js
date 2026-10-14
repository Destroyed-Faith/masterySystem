/**
 * Resolve Passive / Active Buff Invisibility into a combat profile.
 * Powers are the source of truth. Cloak Disruption no longer applies.
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getTemplate } from '../utils/powers/templates/index.js';
import { getPerceptionCombatState, isInvisibilitySuppressedByHealth, setPerceptionCombatState, } from './perception-state.js';
/** Default Special Combat Senses Obscured when the Passive grants slots (until the player picks). */
export const DEFAULT_SPECIAL_SENSE_BLOCK_ORDER = [
    'lifeSense',
    'tremorSense',
    'mageSense',
    'sonarSense',
    'predatorSense',
];
function powerRank(item) {
    const sys = item?.system ?? {};
    const raw = Number(sys.rank ?? sys.level ?? 1);
    return Math.max(1, Math.min(16, Number.isFinite(raw) ? Math.floor(raw) : 1));
}
function catalogInvisibilityBonus(templateId, rank) {
    const tpl = getTemplate(templateId);
    if (!tpl?.levels)
        return 0;
    const row = tpl.levels[String(rank)];
    const fromMech = Number(row?.mechanics?.invisibilityBonus);
    if (Number.isFinite(fromMech) && fromMech > 0)
        return Math.floor(fromMech);
    return 0;
}
function catalogSpecialSenseSlots(templateId, rank) {
    const tpl = getTemplate(templateId);
    if (!tpl?.levels)
        return 0;
    const row = tpl.levels[String(rank)];
    const fromMech = Number(row?.mechanics?.blockedSpecialSenseSlots);
    if (Number.isFinite(fromMech) && fromMech > 0)
        return Math.floor(fromMech);
    return 0;
}
function readChosenSpecialSenses(item, slots) {
    if (slots <= 0)
        return [];
    const sys = item?.system ?? {};
    const raw = sys.blockedCombatSenses ??
        sys.chosenBlockedSenses ??
        item?.getFlag?.('mastery-system', 'blockedCombatSenses');
    const chosen = [];
    if (Array.isArray(raw)) {
        for (const id of raw) {
            const s = String(id || '');
            if (DEFAULT_SPECIAL_SENSE_BLOCK_ORDER.includes(s) && !chosen.includes(s))
                chosen.push(s);
            if (chosen.length >= slots)
                break;
        }
    }
    for (const id of DEFAULT_SPECIAL_SENSE_BLOCK_ORDER) {
        if (chosen.length >= slots)
            break;
        if (!chosen.includes(id))
            chosen.push(id);
    }
    return chosen.slice(0, slots);
}
function iterActorPowerItems(actor) {
    const items = actor?.items;
    if (!items)
        return [];
    if (Array.isArray(items))
        return items;
    try {
        return Array.from(items);
    }
    catch {
        return [];
    }
}
/**
 * Live Invisibility profile from owned Passive: Invisibility + Active Buff: Invisibility.
 */
export function resolveInvisibilityFromActor(actor) {
    let baseBonus = 0;
    let specialSenseSlots = 0;
    const specialBlocked = [];
    for (const item of iterActorPowerItems(actor)) {
        if (item?.type !== 'power')
            continue;
        const tid = String(item.system?.templateId || '');
        const sub = String(item.system?.subfamily || '').toLowerCase();
        const isPassiveInv = tid === 'passive-invisibility' ||
            (sub === 'invisibility' && String(item.system?.category || '').toLowerCase() === 'passive');
        const isBuffInv = tid === 'ab-invisibility';
        if (!isPassiveInv && !isBuffInv)
            continue;
        const rank = powerRank(item);
        let bonus = 0;
        let slots = 0;
        try {
            const mech = resolvePowerMechanics(item);
            bonus = Math.max(0, Math.floor(Number(mech?.invisibilityBonus) || 0));
            slots = Math.max(0, Math.floor(Number(mech?.blockedSpecialSenseSlots) || 0));
        }
        catch {
            /* catalog fallback below */
        }
        if (bonus <= 0) {
            bonus = catalogInvisibilityBonus(tid || (isPassiveInv ? 'passive-invisibility' : 'ab-invisibility'), rank);
        }
        if (isPassiveInv && slots <= 0) {
            slots = catalogSpecialSenseSlots('passive-invisibility', rank);
        }
        baseBonus += bonus;
        if (isPassiveInv) {
            specialSenseSlots = Math.max(specialSenseSlots, slots);
            for (const s of readChosenSpecialSenses(item, slots)) {
                if (!specialBlocked.includes(s))
                    specialBlocked.push(s);
            }
        }
    }
    // Active Buff effects may carry mechanics without a live power item.
    const effects = actor?.effects;
    if (effects) {
        const list = typeof effects[Symbol.iterator] === 'function'
            ? Array.from(effects)
            : Array.isArray(effects)
                ? effects
                : [];
        for (const effect of list) {
            if (effect?.disabled)
                continue;
            const flags = effect?.flags?.['mastery-system'] ?? effect?.getFlag?.('mastery-system');
            if (!flags || flags.activeBuff !== true)
                continue;
            const tid = String(flags.powerTemplateId || '');
            const mech = flags.mechanics && typeof flags.mechanics === 'object' ? flags.mechanics : null;
            let bonus = Math.max(0, Math.floor(Number(mech?.invisibilityBonus) || 0));
            if (bonus <= 0 &&
                (tid === 'ab-invisibility' || /invisibility/i.test(String(flags.powerName || effect.name || '')))) {
                const rank = Math.max(1, Math.min(16, Math.floor(Number(flags.powerRank || flags.rank || 1) || 1)));
                bonus = catalogInvisibilityBonus('ab-invisibility', rank);
            }
            if (bonus > 0)
                baseBonus += bonus;
        }
    }
    if (isInvisibilitySuppressedByHealth(actor)) {
        return {
            baseBonus: 0,
            specialSenseSlots,
            blockedSenses: [],
            active: false,
        };
    }
    const blockedSenses = baseBonus > 0
        ? ['normalCombatAwareness', 'darkvision', ...specialBlocked]
        : [];
    return {
        baseBonus,
        specialSenseSlots,
        blockedSenses: [...new Set(blockedSenses)],
        active: baseBonus > 0,
    };
}
/** Live Invisibility Bonus (0 when Incapacitated / suppressed). */
export function effectiveInvisibilityBonusForActor(actor) {
    if (isInvisibilitySuppressedByHealth(actor))
        return 0;
    const profile = resolveInvisibilityFromActor(actor);
    if (profile.baseBonus > 0)
        return profile.baseBonus;
    // Fallback: synced combat flag (tests / mid-sync).
    const st = getPerceptionCombatState(actor);
    return Math.max(0, Math.floor(Number(st.invisibilityBonus) || 0));
}
/**
 * Covered (Obscured) sense under Invisibility.
 * Uncovered Special Combat Senses are unaffected — callers treat them as auto-perceive.
 */
export function isSenseBlockedForActor(target, senseId) {
    const profile = resolveInvisibilityFromActor(target);
    if (profile.blockedSenses.includes(senseId))
        return true;
    const st = getPerceptionCombatState(target);
    if ((st.blockedSenses ?? []).includes(senseId))
        return true;
    const inv = effectiveInvisibilityBonusForActor(target);
    return inv > 0 && (senseId === 'normalCombatAwareness' || senseId === 'darkvision');
}
/** Sync perceptionCombat base + covered senses from powers (+ visual presentation). */
export async function syncInvisibilityFromPowers(actor) {
    const profile = resolveInvisibilityFromActor(actor);
    if (!actor?.setFlag)
        return profile;
    const patch = {
        invisibilityBonus: profile.baseBonus,
        blockedSenses: profile.blockedSenses,
    };
    await setPerceptionCombatState(actor, patch);
    try {
        const { syncInvisibilityPresentation } = await import('./invisibility-presentation.js');
        await syncInvisibilityPresentation(actor);
    }
    catch (err) {
        console.warn('Mastery System | invisibility presentation sync failed', err);
    }
    return profile;
}
//# sourceMappingURL=invisibility-profile.js.map
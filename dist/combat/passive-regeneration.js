/**
 * R-05 Passive: Restoration — daily Scarred-Bar self-restoration pool.
 * Resets once per Tyhran calendar day (`currentDayIndex`).
 */
import { getCurrentDayIndex } from '../calendar/tyhra-calendar-settings.js';
import { getTemplate } from '../utils/powers/templates/index.js';
import { getActionEconomyActor } from './action-economy.js';
import { isIncapacitated } from './death-check.js';
import { restoreScarredHealthBars } from './r05-restoration.js';
import { regenerationPoolMaxForLevel, regenerationCatalogText } from './r05-pools.js';
export const REGEN_DAILY_FLAG = 'passiveRegenerationDaily';
export const PASSIVE_REGENERATION_TEMPLATE_ID = 'passive-regeneration';
/** Legacy id kept as alias for migration. */
export const PASSIVE_HEALING_LEGACY_ID = 'passive-healing';
function economyOwner(actor) {
    try {
        return getActionEconomyActor(actor) ?? actor;
    }
    catch {
        return actor;
    }
}
function readFlag(actor) {
    const owner = economyOwner(actor);
    const raw = typeof owner?.getFlag === 'function'
        ? owner.getFlag('mastery-system', REGEN_DAILY_FLAG)
        : owner?.flags?.['mastery-system']?.[REGEN_DAILY_FLAG];
    if (!raw || typeof raw !== 'object')
        return null;
    return {
        dayIndex: Math.floor(Number(raw.dayIndex) || 0),
        spent: Math.max(0, Math.floor(Number(raw.spent) || 0)),
        poolMax: Math.max(0, Math.floor(Number(raw.poolMax) || 0)),
    };
}
async function writeFlag(actor, state) {
    const owner = economyOwner(actor);
    await owner?.setFlag?.('mastery-system', REGEN_DAILY_FLAG, state);
}
export function getTyhranDayIndex() {
    try {
        return Math.max(0, Math.floor(Number(getCurrentDayIndex()) || 0));
    }
    catch {
        return Math.max(0, Math.floor(Number(globalThis.game?.settings?.get?.('mastery-system', 'currentDayIndex')) || 0));
    }
}
/** Slotted / owned Passive: Restoration power level (0 if none). */
export function getPassiveRegenerationLevel(actor) {
    const items = actor?.items;
    if (!items)
        return 0;
    let best = 0;
    for (const item of Array.from(items)) {
        const tid = String(item?.system?.templateId || item?.system?.powerTemplateId || '');
        const name = String(item?.name || '');
        const isRegen = tid === PASSIVE_REGENERATION_TEMPLATE_ID ||
            tid === PASSIVE_HEALING_LEGACY_ID ||
            /^passive-regeneration$/i.test(tid) ||
            (/regeneration/i.test(name) && /passive/i.test(String(item?.type || 'passive')));
        if (!isRegen && item?.type !== 'passive') {
            // Also accept slotted passives stored as power items.
            if (tid !== PASSIVE_REGENERATION_TEMPLATE_ID && tid !== 'passive-regeneration')
                continue;
        }
        if (!isRegen && tid !== PASSIVE_REGENERATION_TEMPLATE_ID && tid !== PASSIVE_HEALING_LEGACY_ID) {
            continue;
        }
        const lvl = Math.max(1, Math.min(16, Math.floor(Number(item?.system?.rank ?? item?.system?.level ?? 1) || 1)));
        if (lvl > best)
            best = lvl;
    }
    // Slotted passives may live on system.passives / combat slots.
    try {
        const slots = actor?.system?.passives?.slots ?? actor?.system?.combatPassives ?? [];
        const list = Array.isArray(slots) ? slots : Object.values(slots || {});
        for (const slot of list) {
            const p = slot?.passive ?? slot;
            const tid = String(p?.templateId || p?.id || '');
            if (tid !== PASSIVE_REGENERATION_TEMPLATE_ID && tid !== 'passive-regeneration' && tid !== PASSIVE_HEALING_LEGACY_ID) {
                continue;
            }
            const lvl = Math.max(1, Math.min(16, Math.floor(Number(p?.rank ?? p?.level ?? 1) || 1)));
            if (lvl > best)
                best = lvl;
        }
    }
    catch {
        /* ignore */
    }
    return best;
}
export { regenerationPoolMaxForLevel, regenerationCatalogText };
export function getRegenerationState(actor) {
    const level = getPassiveRegenerationLevel(actor);
    const catalogMax = regenerationPoolMaxForLevel(level);
    const day = getTyhranDayIndex();
    const stored = readFlag(actor);
    if (!stored || stored.dayIndex !== day) {
        return { level, poolMax: catalogMax, spent: 0, remaining: catalogMax, dayIndex: day };
    }
    // PL increase mid-day raises max without refilling spent.
    const poolMax = Math.max(catalogMax, stored.poolMax);
    const spent = Math.min(poolMax, stored.spent);
    return { level, poolMax, spent, remaining: Math.max(0, poolMax - spent), dayIndex: day };
}
/** Ensure day boundary rolled — call on sheet/combat open. Idempotent. */
export async function syncRegenerationDayBoundary(actor) {
    const level = getPassiveRegenerationLevel(actor);
    if (level <= 0)
        return false;
    const day = getTyhranDayIndex();
    const stored = readFlag(actor);
    if (stored && stored.dayIndex === day)
        return false;
    const poolMax = regenerationPoolMaxForLevel(level);
    await writeFlag(actor, { dayIndex: day, spent: 0, poolMax });
    return true;
}
export async function activatePassiveRegeneration(actor, bars) {
    if (!actor)
        return { ok: false, restored: 0, remaining: 0, reason: 'no-actor' };
    if (isIncapacitated(actor)) {
        return { ok: false, restored: 0, remaining: 0, reason: 'incapacitated' };
    }
    await syncRegenerationDayBoundary(actor);
    const state = getRegenerationState(actor);
    if (state.level <= 0 || state.poolMax <= 0) {
        return { ok: false, restored: 0, remaining: 0, reason: 'no-passive' };
    }
    const want = Math.max(0, Math.floor(Number(bars) || 0));
    if (want <= 0)
        return { ok: false, restored: 0, remaining: state.remaining, reason: 'zero' };
    const spend = Math.min(want, state.remaining);
    if (spend <= 0)
        return { ok: false, restored: 0, remaining: 0, reason: 'exhausted' };
    const { restored } = await restoreScarredHealthBars(actor, spend);
    if (restored <= 0) {
        return { ok: false, restored: 0, remaining: state.remaining, reason: 'no-scarred' };
    }
    const nextSpent = state.spent + restored;
    await writeFlag(actor, {
        dayIndex: state.dayIndex,
        spent: nextSpent,
        poolMax: state.poolMax,
    });
    return {
        ok: true,
        restored,
        remaining: Math.max(0, state.poolMax - nextSpent),
    };
}
/** Catalog row helper for pickers — implemented in `r05-pools.ts` (re-exported above). */
export function isPassiveRegenerationTemplate(templateId) {
    const tid = String(templateId || '');
    return (tid === PASSIVE_REGENERATION_TEMPLATE_ID ||
        tid === PASSIVE_HEALING_LEGACY_ID ||
        tid === 'passive-regeneration');
}
/** Ensure template still resolves after rename. */
export function resolveRegenerationTemplate() {
    return (getTemplate(PASSIVE_REGENERATION_TEMPLATE_ID) ||
        getTemplate('passive-regeneration') ||
        getTemplate(PASSIVE_HEALING_LEGACY_ID));
}
//# sourceMappingURL=passive-regeneration.js.map
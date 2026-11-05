/**
 * Training Advantage + Training Crit (Destroyed Faith Profession / Perception system).
 *
 * Profession Rank controls dice quality, never pool size:
 *   - Training Advantage: reroll initial faces ≤ N once (keep new face, then explode).
 *   - Training Crit: declare before roll → natural 7–8 explode; uses per Tyhran Day.
 *
 * Crit charges live only under actor flags keyed by existing Spec / situational
 * Skill ids — never rewrite `system.specializations` or XP for charge tracking.
 *
 * Day cycle: spent uses refresh when `currentDayIndex` advances (Tyhran Day).
 * Safe Haven / Day of Rest within the same Tyhran Day do not grant extra uses.
 */
import { getCurrentDayIndex } from '../calendar/tyhra-calendar-settings.js';
export const SKILL_CRIT_USES_FLAG = 'skillCritUses';
/** Tyhran day index the current `skillCritUses` map belongs to. */
export const SKILL_CRIT_DAY_FLAG = 'skillCritDayIndex';
/** Max initial face that Training Advantage may reroll once (0 = no Advantage). */
export function skillAdvantageRerollMax(rank) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    switch (r) {
        case 0:
            return 0;
        case 1:
            return 1;
        case 2:
            return 2;
        case 3:
            return 3;
        case 4:
            return 4;
        case 5:
            return 5;
        case 6:
        case 7:
        case 8:
            return 6;
        default:
            return 0;
    }
}
/** Daily Training Crit uses unlocked by Rank (0 below Rank 7). */
export function skillCritDailyAllowance(rank) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    if (r >= 8)
        return 2;
    if (r >= 7)
        return 1;
    return 0;
}
export function skillAdvantageLabel(rank) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    if (r <= 0)
        return 'Untrained Disadvantage';
    const max = skillAdvantageRerollMax(r);
    if (max <= 0)
        return 'Normal roll';
    if (max === 1)
        return 'Reroll initial dice showing 1';
    return `Reroll initial dice showing 1–${max}`;
}
/** Current Tyhran calendar day (`mastery-system.currentDayIndex`). */
export function getSkillCritTyhranDayIndex() {
    try {
        return Math.max(0, Math.floor(Number(getCurrentDayIndex()) || 0));
    }
    catch {
        return Math.max(0, Math.floor(Number(globalThis.game?.settings?.get?.('mastery-system', 'currentDayIndex')) || 0));
    }
}
function readUsesMapRaw(actor) {
    try {
        const fromFlag = actor?.getFlag?.('mastery-system', SKILL_CRIT_USES_FLAG);
        if (fromFlag && typeof fromFlag === 'object' && !Array.isArray(fromFlag)) {
            // Wrapped shape { dayIndex, spent } — forward compatible if ever written.
            if (Object.prototype.hasOwnProperty.call(fromFlag, 'spent') &&
                typeof fromFlag.spent === 'object') {
                return { ...fromFlag.spent };
            }
            return { ...fromFlag };
        }
    }
    catch {
        /* ignore */
    }
    const nested = actor?.flags?.['mastery-system']?.[SKILL_CRIT_USES_FLAG];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        if (Object.prototype.hasOwnProperty.call(nested, 'spent') &&
            typeof nested.spent === 'object') {
            return { ...nested.spent };
        }
        return { ...nested };
    }
    return {};
}
function readStampedDayIndex(actor) {
    try {
        const fromFlag = actor?.getFlag?.('mastery-system', SKILL_CRIT_DAY_FLAG);
        if (fromFlag !== undefined && fromFlag !== null && fromFlag !== '') {
            return Math.max(0, Math.floor(Number(fromFlag) || 0));
        }
    }
    catch {
        /* ignore */
    }
    const nested = actor?.flags?.['mastery-system']?.[SKILL_CRIT_DAY_FLAG];
    if (nested !== undefined && nested !== null && nested !== '') {
        return Math.max(0, Math.floor(Number(nested) || 0));
    }
    return null;
}
async function writeUsesMap(actor, map) {
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', SKILL_CRIT_USES_FLAG, map);
        return;
    }
    actor.flags = actor.flags || {};
    actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
    actor.flags['mastery-system'][SKILL_CRIT_USES_FLAG] = map;
}
async function writeDayIndex(actor, dayIndex) {
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', SKILL_CRIT_DAY_FLAG, dayIndex);
        return;
    }
    actor.flags = actor.flags || {};
    actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
    actor.flags['mastery-system'][SKILL_CRIT_DAY_FLAG] = dayIndex;
}
/**
 * Align Crit spends to the current Tyhran Day.
 * - Same day → no-op (idempotent; second call after calendar change or reload does nothing).
 * - Legacy actors with spends but no day stamp → stamp today without clearing (preserves data).
 * - Stamped day ≠ current → clear spends and stamp the new day.
 * Returns true when spends were cleared for a new day.
 */
export async function syncSkillCritDayBoundary(actor) {
    if (!actor)
        return false;
    const day = getSkillCritTyhranDayIndex();
    const stamped = readStampedDayIndex(actor);
    if (stamped === day)
        return false;
    if (stamped === null) {
        // Migrating pre-day-stamp characters: keep current spends for today.
        await writeDayIndex(actor, day);
        return false;
    }
    await writeUsesMap(actor, {});
    await writeDayIndex(actor, day);
    return true;
}
/** Effective spent map for the current Tyhran Day (empty when the stamped day is stale). */
function readUsesMapForToday(actor) {
    const day = getSkillCritTyhranDayIndex();
    const stamped = readStampedDayIndex(actor);
    if (stamped !== null && stamped !== day)
        return {};
    return readUsesMapRaw(actor);
}
/** Uses already spent this Tyhran Day for this Profession / Perception id. */
export function getSkillCritUsesSpent(actor, skillId) {
    const id = String(skillId || '').trim();
    if (!id)
        return 0;
    return Math.max(0, Math.floor(Number(readUsesMapForToday(actor)[id]) || 0));
}
export function getSkillCritUsesRemaining(actor, skillId, rank) {
    const allowance = skillCritDailyAllowance(rank);
    if (allowance <= 0)
        return 0;
    return Math.max(0, allowance - getSkillCritUsesSpent(actor, skillId));
}
/**
 * Spend one Training Crit charge for `skillId`. Returns false if none remain.
 * Does not mutate specializations or XP — only the Crit uses flag.
 * Syncs the Tyhran Day boundary first so a calendar advance cannot be double-spent.
 */
export async function consumeSkillCritUse(actor, skillId, rank) {
    const id = String(skillId || '').trim();
    if (!id || !actor)
        return false;
    await syncSkillCritDayBoundary(actor);
    if (getSkillCritUsesRemaining(actor, id, rank) <= 0)
        return false;
    const map = readUsesMapForToday(actor);
    map[id] = Math.max(0, Math.floor(Number(map[id]) || 0)) + 1;
    await writeUsesMap(actor, map);
    await writeDayIndex(actor, getSkillCritTyhranDayIndex());
    return true;
}
/**
 * Flag updates that force a fresh Crit day (tests / explicit admin tools).
 * Not used by Safe Haven or Day of Rest — those must not grant mid-day extras.
 */
export function skillCritUsesResetFlagUpdate(dayIndex = getSkillCritTyhranDayIndex()) {
    return {
        [`flags.mastery-system.${SKILL_CRIT_USES_FLAG}`]: {},
        [`flags.mastery-system.${SKILL_CRIT_DAY_FLAG}`]: Math.max(0, Math.floor(Number(dayIndex) || 0)),
    };
}
export async function resetSkillCritUses(actor) {
    if (!actor)
        return;
    await writeUsesMap(actor, {});
    await writeDayIndex(actor, getSkillCritTyhranDayIndex());
}
/** Sync Crit day for every world character (calendar day change). Idempotent per actor. */
export async function syncAllCharacterSkillCritDayBoundaries(actors = globalThis.game?.actors) {
    let refreshed = 0;
    if (!actors)
        return 0;
    const list = typeof actors.filter === 'function'
        ? actors.filter((a) => a?.type === 'character')
        : Array.from(actors).filter((a) => a?.type === 'character');
    for (const actor of list) {
        if (await syncSkillCritDayBoundary(actor))
            refreshed += 1;
    }
    return refreshed;
}
/** Pure snapshot helper for tests — never writes actor data. */
export function snapshotSpecializationIdentity(system) {
    const list = Array.isArray(system?.specializations) ? system.specializations : [];
    return list.map((s) => ({
        id: String(s?.id ?? ''),
        rank: Math.max(0, Math.floor(Number(s?.rank) || 0)),
    }));
}
//# sourceMappingURL=skill-advantage.js.map
/**
 * Skill Advantage + Skill Crit (Destroyed Faith Skill System).
 *
 * Skill Rank controls dice quality, never pool size:
 *   - Advantage: reroll initial faces ≤ N once (keep new face, then explode).
 *   - Crit: declare before roll → natural 7–8 explode; daily uses per Skill.
 *
 * Crit charges live only under actor flags keyed by existing Spec / situational
 * Skill ids — never rewrite `system.specializations` or XP for charge tracking.
 */
export const SKILL_CRIT_USES_FLAG = 'skillCritUses';
/** Max initial face that Skill Advantage may reroll once (0 = no Advantage). */
export function skillAdvantageRerollMax(rank) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    switch (r) {
        case 0:
        case 1:
            return 0;
        case 2:
            return 1;
        case 3:
            return 2;
        case 4:
        case 5:
            return 3;
        case 6:
            return 4;
        case 7:
        case 8:
            return 5;
        default:
            return 0;
    }
}
/** Daily Skill Crit uses unlocked by Rank (0 below Rank 5). */
export function skillCritDailyAllowance(rank) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    if (r >= 8)
        return 2;
    if (r >= 5)
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
function readUsesMap(actor) {
    try {
        const fromFlag = actor?.getFlag?.('mastery-system', SKILL_CRIT_USES_FLAG);
        if (fromFlag && typeof fromFlag === 'object' && !Array.isArray(fromFlag)) {
            return { ...fromFlag };
        }
    }
    catch {
        /* ignore */
    }
    const nested = actor?.flags?.['mastery-system']?.[SKILL_CRIT_USES_FLAG];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        return { ...nested };
    }
    return {};
}
/** Uses already spent today for this Skill id (Spec id or NPC situational id). */
export function getSkillCritUsesSpent(actor, skillId) {
    const id = String(skillId || '').trim();
    if (!id)
        return 0;
    return Math.max(0, Math.floor(Number(readUsesMap(actor)[id]) || 0));
}
export function getSkillCritUsesRemaining(actor, skillId, rank) {
    const allowance = skillCritDailyAllowance(rank);
    if (allowance <= 0)
        return 0;
    return Math.max(0, allowance - getSkillCritUsesSpent(actor, skillId));
}
/**
 * Spend one Skill Crit charge for `skillId`. Returns false if none remain.
 * Does not mutate specializations or XP — only the Crit uses flag.
 */
export async function consumeSkillCritUse(actor, skillId, rank) {
    const id = String(skillId || '').trim();
    if (!id || !actor)
        return false;
    if (getSkillCritUsesRemaining(actor, id, rank) <= 0)
        return false;
    const map = readUsesMap(actor);
    map[id] = Math.max(0, Math.floor(Number(map[id]) || 0)) + 1;
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', SKILL_CRIT_USES_FLAG, map);
    }
    else {
        actor.flags = actor.flags || {};
        actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
        actor.flags['mastery-system'][SKILL_CRIT_USES_FLAG] = map;
    }
    return true;
}
/** Clear all Skill Crit daily spends (Safe Haven / Day of Rest). */
export function skillCritUsesResetFlagUpdate() {
    return { [`flags.mastery-system.${SKILL_CRIT_USES_FLAG}`]: {} };
}
export async function resetSkillCritUses(actor) {
    if (!actor)
        return;
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', SKILL_CRIT_USES_FLAG, {});
        return;
    }
    actor.flags = actor.flags || {};
    actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
    actor.flags['mastery-system'][SKILL_CRIT_USES_FLAG] = {};
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
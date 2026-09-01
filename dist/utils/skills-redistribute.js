/**
 * Post-creation skill redistribution (creation budget only).
 *
 * Allowed only when the character has finished creation and has never received
 * or spent progression XP. Same rules as character creation: 40 points total,
 * max 4 per skill.
 */
import { clearSkillBucketsInUpdateBatch } from './reset-character.js';
import { SKILLS } from './skills.js';
export function getCreationSkillBudget() {
    const cfg = CONFIG?.MASTERY?.creation;
    const maxPerSkill = Math.max(1, Math.floor(Number(cfg?.maxSkillAtCreation) || 4));
    return {
        total: Math.max(1, Math.floor(Number(cfg?.skillPoints) || 40)),
        maxPerSkill,
        /** One click buys a full creation rank (4). No 1/2/3 leftover ranks. */
        step: maxPerSkill,
    };
}
export function sumActorSkillPoints(system) {
    let total = 0;
    for (const value of Object.values(system?.skills || {})) {
        total += typeof value === 'number' ? value : Math.floor(Number(value) || 0);
    }
    return total;
}
/** True when no progression XP was ever earned or spent (creation-only premise). */
export function actorHasNoProgressionXp(actor) {
    const xp = actor?.system?.xp ?? {};
    const totalSpent = Math.max(0, Math.floor(Number(xp.totalSpent) || 0));
    const freeSpent = Math.max(0, Math.floor(Number(xp.freeSpent) || 0));
    const totalEarned = Math.max(0, Math.floor(Number(xp.totalEarned) || 0));
    const freeEarned = Math.max(0, Math.floor(Number(xp.freeEarned) || 0));
    return totalSpent === 0 && freeSpent === 0 && totalEarned === 0 && freeEarned === 0;
}
export function isSkillsRedistributing(actor) {
    return actor?.system?.creation?.skillsRedistributing === true;
}
export function canStartSkillsRedistribute(actor) {
    if (!actor || actor.type !== 'character') {
        return { ok: false, reason: 'Only player characters can redistribute skills.' };
    }
    if (actor.system?.creation?.complete === false) {
        return { ok: false, reason: 'Finish character creation first.' };
    }
    if (isSkillsRedistributing(actor)) {
        return { ok: false, reason: 'Skill redistribution is already in progress.' };
    }
    if (!actorHasNoProgressionXp(actor)) {
        return {
            ok: false,
            reason: 'Skills can only be redistributed when the character has no XP yet (none earned, none spent).',
        };
    }
    return { ok: true };
}
/**
 * Creation / redistribute ranks: 40 points in clicks of 4.
 * Legal values are 0 or the creation cap (4) — never 1, 2, or 3.
 */
export function isValidCreationSkillRank(raw, maxPerSkill = getCreationSkillBudget().maxPerSkill) {
    const v = typeof raw === 'number' ? raw : Math.floor(Number(raw) || 0);
    const step = Math.max(1, maxPerSkill);
    return Number.isInteger(v) && v >= 0 && v <= maxPerSkill && v % step === 0;
}
export function nextCreationSkillValue(current, remaining, maxPerSkill = getCreationSkillBudget().maxPerSkill) {
    const cur = Math.max(0, Math.floor(Number(current) || 0));
    const step = Math.max(1, maxPerSkill);
    if (cur >= maxPerSkill) {
        return { ok: false, reason: `This skill is already at the creation cap of ${maxPerSkill}.` };
    }
    const target = Math.min(maxPerSkill, Math.ceil((cur + 1) / step) * step);
    const cost = target - cur;
    if (cost > remaining) {
        return { ok: false, reason: `Need ${cost} skill points remaining to raise this skill by ${cost}.` };
    }
    return { ok: true, value: target };
}
export function prevCreationSkillValue(current, maxPerSkill = getCreationSkillBudget().maxPerSkill) {
    const cur = Math.max(0, Math.floor(Number(current) || 0));
    if (cur <= 0) {
        return { ok: false, reason: 'Skill cannot go below 0.' };
    }
    const step = Math.max(1, maxPerSkill);
    return { ok: true, value: Math.max(0, Math.floor((cur - 1) / step) * step) };
}
export function validateCreationSkillAllocation(system) {
    const { total, maxPerSkill } = getCreationSkillBudget();
    const skills = system?.skills || {};
    for (const [key, raw] of Object.entries(skills)) {
        const v = typeof raw === 'number' ? raw : Math.floor(Number(raw) || 0);
        if (!isValidCreationSkillRank(v, maxPerSkill)) {
            return {
                ok: false,
                reason: `Skill "${key}" must be 0 or ${maxPerSkill} during creation (got ${v}).`,
            };
        }
    }
    const spent = sumActorSkillPoints(system);
    if (spent !== total) {
        return {
            ok: false,
            reason: `Allocate exactly ${total} skill points (max ${maxPerSkill} per skill; currently ${spent}).`,
        };
    }
    return { ok: true };
}
function cloneSkillsRecord(skills) {
    const out = {};
    for (const key of Object.keys(SKILLS)) {
        out[key] = Math.max(0, Math.floor(Number(skills?.[key]) || 0));
    }
    if (skills && typeof skills === 'object') {
        for (const [key, raw] of Object.entries(skills)) {
            if (!(key in out)) {
                out[key] = Math.max(0, Math.floor(Number(raw) || 0));
            }
        }
    }
    return out;
}
/** Zero skills, stash backup, enter redistribute mode. */
export function buildStartSkillsRedistributeUpdates(actor) {
    const updates = {
        'system.creation.skillsRedistributing': true,
        'system.creation.skillsRedistributeBackup': cloneSkillsRecord(actor?.system?.skills),
    };
    clearSkillBucketsInUpdateBatch(updates, actor?.system);
    return updates;
}
/** Restore backup and leave redistribute mode. */
export function buildCancelSkillsRedistributeUpdates(actor) {
    const backup = actor?.system?.creation?.skillsRedistributeBackup;
    const updates = {
        'system.creation.skillsRedistributing': false,
        'system.creation.-=skillsRedistributeBackup': null,
    };
    clearSkillBucketsInUpdateBatch(updates, actor?.system);
    if (backup && typeof backup === 'object') {
        for (const [key, raw] of Object.entries(backup)) {
            updates[`system.skills.${key}`] = Math.max(0, Math.floor(Number(raw) || 0));
        }
    }
    return updates;
}
/**
 * Finish redistribution: require exact creation budget, clear mode flag,
 * refresh post-creation skill snapshot so later progression resets stay correct.
 */
export function buildFinishSkillsRedistributeUpdates(actor) {
    const check = validateCreationSkillAllocation(actor?.system);
    if (!check.ok)
        return { ok: false, reason: check.reason };
    const skills = cloneSkillsRecord(actor?.system?.skills);
    const skillsSpent = {};
    for (const key of Object.keys(skills)) {
        skillsSpent[key] = 0;
    }
    const updates = {
        'system.creation.skillsRedistributing': false,
        'system.creation.-=skillsRedistributeBackup': null,
        'system.xp.postCreationProgress.skills': skills,
        'system.xp.postCreationProgress.skillsSpent': skillsSpent,
    };
    return { ok: true, updates };
}
//# sourceMappingURL=skills-redistribute.js.map
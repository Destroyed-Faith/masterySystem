/**
 * Martial Skills were removed from the rules. Every permanent Skill Point a
 * character had invested in Hand-to-Hand, Melee Weapons, Ranged Weapons,
 * Defensive Combat, or Combat Reflexes is refunded as an unspent Skill Point
 * (`system.skillPoints.unspent`) and the obsolete Skill data is deleted.
 *
 * The refund is the invested Rating (the permanent maximum), never the
 * remaining consumable value. The migration runs once per actor: a flag marks
 * refunded characters, and a later run only strips leftover legacy keys
 * without refunding again.
 */
/** Legacy Skill keys. Migration-only; these are not Skills any more. */
export const LEGACY_MARTIAL_SKILL_KEYS = [
    'handToHand',
    'meleeWeapons',
    'rangedWeapons',
    'defensiveCombat',
    'combatReflexes',
];
export const MARTIAL_SKILLS_REFUND_FLAG = 'martialSkillsRefunded';
function rating(value) {
    const n = Math.floor(Number(value) || 0);
    return n > 0 ? n : 0;
}
function hasFlag(actor) {
    try {
        if (actor?.getFlag?.('mastery-system', MARTIAL_SKILLS_REFUND_FLAG) === true)
            return true;
    }
    catch {
        /* fall through to raw flags */
    }
    return actor?.flags?.['mastery-system']?.[MARTIAL_SKILLS_REFUND_FLAG] === true;
}
function hasAnyLegacyKey(record) {
    if (!record || typeof record !== 'object')
        return false;
    return LEGACY_MARTIAL_SKILL_KEYS.some((key) => key in record);
}
export function planMartialSkillsRefund(actor) {
    const system = actor?.system ?? {};
    const skills = system.skills && typeof system.skills === 'object' ? system.skills : {};
    const alreadyRefunded = hasFlag(actor);
    const byKey = {};
    let refund = 0;
    for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
        if (!(key in skills))
            continue;
        const invested = rating(skills[key]);
        byKey[key] = invested;
        refund += invested;
    }
    const hasLegacyData = hasAnyLegacyKey(skills) ||
        hasAnyLegacyKey(system.skillsSpent) ||
        hasAnyLegacyKey(system.xp?.postCreationProgress?.skills) ||
        hasAnyLegacyKey(system.xp?.postCreationProgress?.skillsSpent) ||
        hasAnyLegacyKey(system.creation?.skillsRedistributeBackup);
    const creationBudget = system.creation?.complete === false;
    const deferred = system.creation?.skillsRedistributing === true;
    return {
        alreadyRefunded,
        byKey,
        refund: alreadyRefunded || creationBudget ? 0 : refund,
        hasLegacyData,
        creationBudget,
        deferred,
    };
}
/**
 * Update batch for one character, or `null` when nothing needs to change.
 * Refunds once (flag), strips legacy keys every time they are found.
 * Characters still in creation only lose the keys (their creation budget
 * frees the points); a running skill redistribution is left alone until done.
 */
export function martialSkillsRefundUpdate(actor) {
    if (!actor || (actor.type && actor.type !== 'character'))
        return null;
    const plan = planMartialSkillsRefund(actor);
    if (plan.deferred)
        return null;
    if (plan.alreadyRefunded && !plan.hasLegacyData)
        return null;
    const system = actor.system ?? {};
    const updates = {};
    for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
        if (hasAnyLegacyKey(system.skills) && key in system.skills) {
            updates[`system.skills.-=${key}`] = null;
        }
        if (hasAnyLegacyKey(system.skillsSpent) && key in system.skillsSpent) {
            updates[`system.skillsSpent.-=${key}`] = null;
        }
        const backup = system.creation?.skillsRedistributeBackup;
        if (hasAnyLegacyKey(backup) && key in backup) {
            updates[`system.creation.skillsRedistributeBackup.-=${key}`] = null;
        }
    }
    // The post-creation snapshot feeds the GM progression reset. Its Martial
    // investment becomes the pool the reset restores, so the points are not lost.
    const snap = system.xp?.postCreationProgress;
    if (snap && typeof snap === 'object') {
        let snapshotRefund = 0;
        for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
            if (hasAnyLegacyKey(snap.skills) && key in snap.skills) {
                snapshotRefund += rating(snap.skills[key]);
                updates[`system.xp.postCreationProgress.skills.-=${key}`] = null;
            }
            if (hasAnyLegacyKey(snap.skillsSpent) && key in snap.skillsSpent) {
                updates[`system.xp.postCreationProgress.skillsSpent.-=${key}`] = null;
            }
        }
        if (snapshotRefund > 0) {
            const prior = rating(snap.skillPointsUnspent);
            updates['system.xp.postCreationProgress.skillPointsUnspent'] = prior + snapshotRefund;
        }
    }
    if (!plan.alreadyRefunded) {
        if (!plan.creationBudget) {
            const currentUnspent = rating(system.skillPoints?.unspent);
            updates['system.skillPoints.unspent'] = currentUnspent + plan.refund;
        }
        updates[`flags.mastery-system.${MARTIAL_SKILLS_REFUND_FLAG}`] = true;
        updates['system.progression.martialSkillsRefund'] = {
            total: plan.refund,
            byKey: plan.byKey,
            creationBudget: plan.creationBudget,
            migratedAt: Date.now(),
        };
    }
    return Object.keys(updates).length ? updates : null;
}
export async function runMartialSkillsRefundMigration(actors) {
    const user = globalThis.game?.user;
    if (user && user.isGM === false)
        return 0;
    let migrated = 0;
    for (const actor of actors || []) {
        if (!actor || actor.type !== 'character')
            continue;
        const update = martialSkillsRefundUpdate(actor);
        if (!update)
            continue;
        try {
            await actor.update(update);
            migrated += 1;
        }
        catch (err) {
            console.warn('Mastery System | Martial Skills refund migration failed', actor?.name, err);
        }
    }
    return migrated;
}
//# sourceMappingURL=martial-skills-refund-migration.js.map
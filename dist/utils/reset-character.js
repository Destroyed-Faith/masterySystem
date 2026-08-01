/**
 * Reset a character back to "creation mode" while preserving:
 *   - the actor document's `name` and `img` (portrait),
 *   - the lifetime `system.xp.totalEarned` XP pool (so the player can
 *     re-spend every XP they ever earned),
 *   - the `system.xp.history` audit log (for GM traceability).
 *
 * Everything else that lives on `system.*` or as an embedded Item (powers,
 * gear, weapons, armor, schticks, artifacts, conditions, echo items, …)
 * is wiped. `system.creation.complete` is set to `false` so the character
 * sheet drops back into creation mode, and `system.points.xp` is refilled
 * with the full `totalEarned` amount. Post-creation snapshot, attribute
 * baselines, and all roll/manual-adjustment data are cleared too.
 *
 * GM-only (callers enforce the permission check).
 */
import { DEFAULT_MANUAL_ADJUSTMENTS } from './manual-adjustments.js';
import { getWorldDefaultMasteryRank } from './mastery-rank-sync.js';
import { SKILLS } from './skills.js';
import { getArtifactBindingKind, isArtifactEquippedOnActor } from './artifact-actor-rules.js';
import { resetGeneralArtifactForRecreation } from './artifact-tree-grant.js';
const ATTRIBUTE_KEYS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
/**
 * Foundry merges nested objects on update — assigning `{}` does not remove
 * existing skill keys. The full character reset uses `diff: false`, which
 * does not apply `-=` deletion operators; zero every catalog skill explicitly
 * and `-=` any legacy/orphan keys.
 */
/** @internal Exported for tests — skill bucket reset batch keys. */
export function clearSkillBucketsInUpdateBatch(updates, system) {
    const catalogKeys = Object.keys(SKILLS);
    for (const key of catalogKeys) {
        updates[`system.skills.${key}`] = 0;
        updates[`system.skillsSpent.${key}`] = 0;
    }
    const skills = system?.skills;
    if (skills && typeof skills === 'object') {
        for (const key of Object.keys(skills)) {
            if (!catalogKeys.includes(key)) {
                updates[`system.skills.-=${key}`] = null;
            }
        }
    }
    const spent = system?.skillsSpent;
    if (spent && typeof spent === 'object') {
        for (const key of Object.keys(spent)) {
            if (!catalogKeys.includes(key)) {
                updates[`system.skillsSpent.-=${key}`] = null;
            }
        }
    }
}
/** General (non-Echo) artifact embedded on the actor. */
export function isGeneralEmbeddedArtifact(item) {
    return item?.type === 'artifact' && getArtifactBindingKind(item) !== 'echo';
}
/** Equipped general artifacts (Echo excluded) — for reset equip prompt. */
export function listEquippedGeneralArtifacts(actor) {
    const out = [];
    try {
        const iter = actor?.items;
        if (!iter)
            return out;
        for (const it of iter) {
            if (!isGeneralEmbeddedArtifact(it))
                continue;
            if (!isArtifactEquippedOnActor(it))
                continue;
            const id = it?.id ?? it?._id;
            if (id)
                out.push({ id: String(id), name: String(it.name ?? 'Artifact') });
        }
    }
    catch {
        // ignore
    }
    return out;
}
function defaultInventoryEquipmentFlags() {
    return { container: 'inventory', band: 'not' };
}
/**
 * Wipe the character back to creation-ready state. Keeps name, portrait,
 * ownership, folder, flags, prototype token, and the lifetime earned-XP
 * figure. Everything else (items, attributes, skills, powers, echo, bio
 * fields, passive slots, manual adjustments, health/stress overrides,
 * saves, faith fractures, minor expressions, disadvantages, schticks, and
 * derived bookkeeping) is reset to the template baseline.
 */
export async function resetCharacterForRecreation(actor, options) {
    if (!actor || actor.type !== 'character') {
        return {
            ok: false,
            error: 'Reset is only supported for character actors.',
            removedItemCount: 0,
            keptGeneralArtifactCount: 0,
            returnedXp: 0,
        };
    }
    const system = actor.system ?? {};
    const xp = system.xp ?? {};
    const totalEarned = Number.isFinite(xp.totalEarned) ? Number(xp.totalEarned) : 0;
    // 1) Remove embedded items except general (non-Echo) artifacts, which are
    //    reset to Level 1 / inactive and optionally keep their equip slot.
    const itemIdsToDelete = [];
    const generalArtifactPlans = [];
    try {
        const iter = actor.items;
        if (iter) {
            for (const it of iter) {
                const id = it?.id ?? it?._id;
                if (!id)
                    continue;
                if (isGeneralEmbeddedArtifact(it)) {
                    const rawFlags = it.getFlag?.('mastery-system', 'equipment') || {};
                    const flags = foundry.utils.duplicate(rawFlags);
                    const slot = flags?.slot;
                    const hasEquipSlot = typeof slot === 'string' && slot.length > 0;
                    let equipment;
                    if (hasEquipSlot) {
                        equipment = options.keepEquippedGeneralArtifacts === true
                            ? flags
                            : defaultInventoryEquipmentFlags();
                    }
                    else {
                        equipment = flags;
                    }
                    generalArtifactPlans.push({ id: String(id), equipment });
                }
                else {
                    itemIdsToDelete.push(String(id));
                }
            }
        }
    }
    catch (err) {
        console.warn('Mastery System | Reset: failed to enumerate items:', err);
    }
    let removedItemCount = 0;
    if (itemIdsToDelete.length > 0) {
        try {
            await actor.deleteEmbeddedDocuments('Item', itemIdsToDelete, { masterySystemForceDelete: true });
            removedItemCount = itemIdsToDelete.length;
        }
        catch (err) {
            console.error('Mastery System | Reset: deleteEmbeddedDocuments failed:', err);
            return {
                ok: false,
                error: 'Failed to delete embedded items during reset.',
                removedItemCount: 0,
                keptGeneralArtifactCount: 0,
                returnedXp: 0,
            };
        }
    }
    let keptGeneralArtifactCount = 0;
    for (const plan of generalArtifactPlans) {
        const emb = actor.items.get(plan.id);
        if (!emb)
            continue;
        try {
            await resetGeneralArtifactForRecreation(actor, emb);
            await emb.update({
                'flags.mastery-system.equipment': plan.equipment,
                'system.equipped': false,
            });
            keptGeneralArtifactCount++;
        }
        catch (err) {
            console.warn('Mastery System | Reset: failed to reset general artifact', plan.id, err);
        }
    }
    // 2) Remove every ActiveEffect so no stale buffs linger.
    const effectIds = [];
    try {
        const effs = actor.effects;
        if (effs) {
            for (const e of effs) {
                const id = e?.id ?? e?._id;
                if (id)
                    effectIds.push(String(id));
            }
        }
    }
    catch (err) {
        console.warn('Mastery System | Reset: failed to enumerate effects:', err);
    }
    if (effectIds.length > 0) {
        try {
            await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
        }
        catch (err) {
            console.warn('Mastery System | Reset: failed to delete ActiveEffects:', err);
        }
    }
    // 3) Build the system.* update batch. We intentionally do NOT touch
    //    the top-level actor fields (`name`, `img`, `ownership`, `folder`,
    //    `flags`, `prototypeToken`, `_id`, `_stats`).
    const updates = {};
    // Attributes back to baseline 2 (and stones 0 per template).
    for (const k of ATTRIBUTE_KEYS) {
        updates[`system.attributes.${k}.value`] = 2;
        updates[`system.attributes.${k}.stones`] = 0;
    }
    // Skills & session spend fully cleared (creation points + roll pool).
    clearSkillBucketsInUpdateBatch(updates, system);
    // Mastery defaults (rank 2, points 0, experience 0) per template.json.
    updates['system.mastery.rank'] = getWorldDefaultMasteryRank();
    updates['system.mastery.points'] = 0;
    updates['system.mastery.experience'] = 0;
    // Creation gate flipped back to incomplete.
    updates['system.creation.complete'] = false;
    updates['system.creation.disadvantagesReviewed'] = false;
    // Echo structured data fully cleared.
    updates['system.echo.key'] = '';
    updates['system.echo.subChoiceKey'] = '';
    updates['system.echo.veiledFormKey'] = '';
    updates['system.echo.selectedCardIds'] = [];
    updates['system.echo.cardUses'] = {};
    updates['system.echo.traitUses'] = {};
    // Echo narrative + bio text cleared. (Name/img live on the actor
    // document, not in system.bio, so they are untouched.)
    updates['system.bio.echo'] = '';
    updates['system.bio.concept'] = '';
    updates['system.bio.appearance'] = '';
    updates['system.bio.notes'] = '';
    updates['system.bio.description'] = '';
    // Notes / background fields cleared.
    updates['system.notes.schticks'] = '';
    updates['system.notes.faithFractures'] = '';
    updates['system.notes.background'] = '';
    // Disadvantages, schticks, minor expressions, conditions cleared.
    updates['system.disadvantages'] = [];
    updates['system.schticks.ranks'] = [];
    updates['system.minorExpressions'] = [];
    updates['system.conditions'] = [];
    // Faith Fractures reset to 0 / 0 — finalize repopulates from disadvantage points.
    updates['system.faithFractures.current'] = 0;
    updates['system.faithFractures.maximum'] = 0;
    // Stone pools zeroed (prepareBaseData re-derives max from attributes).
    for (const k of ATTRIBUTE_KEYS) {
        updates[`system.stonePools.${k}.current`] = 0;
        updates[`system.stonePools.${k}.max`] = 0;
        updates[`system.stonePools.${k}.sustained`] = 0;
    }
    // Legacy stones block (if present).
    updates['system.stones'] = { total: 0, vitality: 0, current: 0, maximum: 0 };
    // Passive slot assignments cleared. We replace the whole map so stale
    // slotN entries for deleted power items don't linger.
    updates['system.passives'] = {};
    // Combat defaults per template.
    updates['system.combat.initiative'] = 0;
    updates['system.combat.evade'] = 10;
    updates['system.combat.armor'] = 0;
    updates['system.combat.armorName'] = '';
    updates['system.combat.shield'] = 0;
    updates['system.combat.shieldName'] = '';
    updates['system.combat.speed'] = 8;
    // Resources reset to 1/1 per template.
    updates['system.resources.reactions'] = { value: 1, max: 1 };
    updates['system.resources.movement'] = { value: 1, max: 1 };
    updates['system.resources.actions'] = { value: 1, max: 1 };
    // Health & stress: let prepareBaseData rebuild bars from vitality on
    // the next data-prep cycle by clearing the bar arrays. We keep the
    // structure so the sheet's first render doesn't blow up.
    updates['system.health.bars'] = [
        { name: 'Healthy', max: 4, current: 4, penalty: 0 },
        { name: 'Bruised', max: 4, current: 4, penalty: -1 },
        { name: 'Injured', max: 4, current: 4, penalty: -2 },
        { name: 'Wounded', max: 4, current: 4, penalty: -4 },
        { name: 'Broken', max: 4, current: 4, penalty: -5 },
        { name: 'Incapacitated', max: 1, current: 1, penalty: -6 },
    ];
    updates['system.health.currentBar'] = 0;
    updates['system.health.tempHP'] = 0;
    updates['system.stress.current'] = 0;
    updates['system.stress.maximum'] = 0;
    // Manual adjustments fully cleared (zero-safe defaults).
    updates['system.manual'] = JSON.parse(JSON.stringify(DEFAULT_MANUAL_ADJUSTMENTS));
    // Carousel-tracked resources cleared.
    updates['system.tracked'] = {};
    // Radial / stone power prefs reset to defaults.
    updates['system.radialManeuverPrefs'] = { hideAllStandard: false, hideIds: {} };
    updates['system.stonePowersPrefs'] = {
        useDefaultsEachRound: false,
        defaultAttributesByPowerId: {},
    };
    // XP: refund ALL earned XP back into the spendable pool. totalEarned
    // stays as-is so the lifetime figure is preserved. totalSpent /
    // attributeBaselines / postCreationProgress / once-per-step bump
    // lists are cleared because the next creation pass will reset these
    // anyway.
    updates['system.points.attribute'] = 0;
    updates['system.points.mastery'] = 0;
    updates['system.points.xp'] = totalEarned;
    updates['system.xp.totalEarned'] = totalEarned;
    updates['system.xp.totalSpent'] = 0;
    // Free XP pool: refund all granted Free XP back into the spendable free
    // pool; freeEarned (lifetime figure) is preserved, freeSpent reset.
    const freeEarned = Number.isFinite(xp.freeEarned) ? Number(xp.freeEarned) : 0;
    updates['system.points.xpFree'] = freeEarned;
    updates['system.xp.freeEarned'] = freeEarned;
    updates['system.xp.freeSpent'] = 0;
    updates['system.xp.attributeBaselines'] = {};
    updates['system.xp.postCreationProgress'] = null;
    updates['system.xp.currentStep'] = { attributes: [], skills: [], powers: [], artifacts: [] };
    // Append an audit-log entry. Capped at 200 entries (same as post-creation helper).
    const beforeState = {
        available: system.points?.xp ?? 0,
        totalEarned,
        totalSpent: xp.totalSpent ?? 0,
    };
    const historyEntry = {
        ts: Date.now(),
        userId: options.gmUserId,
        userName: options.gmUserName,
        kind: 'adjust',
        category: 'xp',
        amount: 0,
        note: 'GM reset: character wiped back to creation (name + portrait preserved); ' +
            'all earned XP returned to pool, spent trackers cleared.',
        details: {
            resetForRecreation: true,
            removedItems: removedItemCount,
            keptGeneralArtifacts: keptGeneralArtifactCount,
            keepEquippedGeneralArtifacts: options.keepEquippedGeneralArtifacts === true,
        },
        before: beforeState,
        after: {
            available: totalEarned,
            totalEarned,
            totalSpent: 0,
        },
    };
    const prior = Array.isArray(xp.history) ? [...xp.history] : [];
    prior.push(historyEntry);
    updates['system.xp.history'] = prior.length > 200 ? prior.slice(-200) : prior;
    // 4) Single actor.update() batch.
    try {
        await actor.update(updates, { diff: false });
    }
    catch (err) {
        console.error('Mastery System | Reset: actor.update failed:', err);
        return {
            ok: false,
            error: 'Failed to persist reset updates on the actor.',
            removedItemCount,
            keptGeneralArtifactCount,
            returnedXp: totalEarned,
        };
    }
    return {
        ok: true,
        removedItemCount,
        keptGeneralArtifactCount,
        returnedXp: totalEarned,
    };
}
//# sourceMappingURL=reset-character.js.map
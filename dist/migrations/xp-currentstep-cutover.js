/**
 * Upgrade Step Cutover — Coerce `system.xp.currentStep` to the new shape.
 *
 * One-time, idempotent migration that runs once per world at Foundry's
 * `ready` hook (GM only). For every character actor it:
 *   1. Normalizes `system.xp.currentStep` to
 *      `{ attributes: [], skills: [], powers: [], artifacts: [] }`.
 *      Any pre-existing string IDs are preserved if the field happens to
 *      already be the new shape.
 *   2. Deletes `system.xp.spentAttributes` (no longer enforced).
 *
 * All other XP fields (`system.points.xp`, `system.xp.totalEarned`,
 * `system.xp.totalSpent`, `system.xp.history`, `system.xp.attributeBaselines`,
 * `system.xp.postCreationProgress`) are left untouched.
 *
 * The new rule is structural, not numeric, so no XP refund is needed.
 *
 * Rerun guard:
 *   `game.settings.get('mastery-system', 'xpCurrentStepCutoverRun') === true`
 */
import { getForcedDeletion } from '../utils/foundry-v14.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'xpCurrentStepCutoverRun';
export function registerXpCurrentStepCutoverSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'XP Upgrade-Step Cutover Ran',
            hint: 'Internal flag: true after the one-time XP Upgrade-Step shape migration ran for this world.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | xp-currentstep-cutover: settings.register failed', err);
    }
}
function hasAlreadyRun() {
    try {
        return game.settings.get(SETTING_NAMESPACE, SETTING_KEY) === true;
    }
    catch {
        return false;
    }
}
async function markRun() {
    try {
        await game.settings.set(SETTING_NAMESPACE, SETTING_KEY, true);
    }
    catch (err) {
        console.warn('Mastery System | xp-currentstep-cutover: settings.set failed', err);
    }
}
function sanitizeStringArray(input) {
    if (!Array.isArray(input))
        return [];
    const out = [];
    for (const v of input) {
        if (typeof v === 'string' && v.length > 0)
            out.push(v);
    }
    return out;
}
/** Execute the one-shot XP Upgrade-Step shape cutover. Idempotent per world. */
export async function runXpCurrentStepCutover() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
    const actors = game.actors?.contents ?? [];
    let touched = 0;
    for (const actor of actors) {
        if (actor?.type !== 'character')
            continue;
        const xp = actor.system?.xp;
        if (!xp)
            continue;
        const stepRaw = xp.currentStep;
        const isLegacyShape = stepRaw == null ||
            typeof stepRaw !== 'object' ||
            Array.isArray(stepRaw) ||
            // Old shape used numeric `attrSpent` / `nonAttrSpent` buckets.
            'attrSpent' in stepRaw ||
            'nonAttrSpent' in stepRaw ||
            !Array.isArray(stepRaw.attributes) ||
            !Array.isArray(stepRaw.skills) ||
            !Array.isArray(stepRaw.powers) ||
            !Array.isArray(stepRaw.artifacts);
        const nextStep = isLegacyShape
            ? { attributes: [], skills: [], powers: [], artifacts: [] }
            : {
                attributes: sanitizeStringArray(stepRaw.attributes),
                skills: sanitizeStringArray(stepRaw.skills),
                powers: sanitizeStringArray(stepRaw.powers),
                artifacts: sanitizeStringArray(stepRaw.artifacts),
            };
        const needsSpentAttrsRemoval = 'spentAttributes' in xp;
        if (!isLegacyShape && !needsSpentAttrsRemoval)
            continue;
        const forcedDeletion = getForcedDeletion();
        const updates = {
            system: {
                xp: {
                    currentStep: nextStep,
                    ...(needsSpentAttrsRemoval && forcedDeletion != null
                        ? { spentAttributes: forcedDeletion }
                        : {}),
                },
            },
        };
        if (needsSpentAttrsRemoval && forcedDeletion == null) {
            updates['system.xp.-=spentAttributes'] = null;
        }
        try {
            await actor.update(updates);
            touched++;
        }
        catch (err) {
            console.warn(`Mastery System | xp-currentstep-cutover: failed to update "${actor.name}"`, err);
        }
    }
    await markRun();
    const msg = touched > 0
        ? `Mastery System | XP Upgrade-Step cutover: normalized ${touched} character actor(s) to the new once-per-step shape.`
        : 'Mastery System | XP Upgrade-Step cutover: no character actors needed migration.';
    try {
        ui.notifications?.info(msg);
    }
    catch {
        // UI may not be ready in every context; console log is enough.
    }
}
//# sourceMappingURL=xp-currentstep-cutover.js.map
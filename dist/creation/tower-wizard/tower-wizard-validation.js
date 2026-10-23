/**
 * Tower Wizard — validation for selections and finalize.
 */
import { CATEGORY_LABELS, CATEGORY_ORDER, activeTemplateCanBeSpell, findCatalogEntry, TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, TOWER_WIZARD_POWER_TOTAL, creationPowerRequirementsForMasteryRank, countPowersByCategory, findDuplicatePowerLabel, resolvePowerCategoryFromItem, } from '../../utils/power-catalog.js';
import { buildPackageGrantSpecs, buildPackageGrantSpecsFromOverrides, buildPackageReview, catalogEntryMatchesGrantKey, getDefensePackage, deriveDefenseIdFromPassive1, getDefaultPassive1TemplateId, getOffensePackage, grantKeyCategory, isManualBuildMode, isValidReplacementActiveBuffId, isValidWizardPassive1, resolveGrant, resolvePassive1TemplateId, selectionUsesCatalogOffense, } from './tower-wizard-packages.js';
import { getPassiveCategoryConflictMessage, isAllowedSecondPassive, } from './tower-wizard-passive-categories.js';
import { validateEchoImprintSelections } from '../../rules/echo-imprints.js';
import { validateSpecializationList } from '../../rules/specializations.js';
import { ATTRIBUTE_KEYS, permanentStonesFromLifetimeXp, startingPackageIsValid } from '../../progression/v099-rules.js';
import { collectEchoAdvisorWarnings, } from './tower-wizard-echo-advisor.js';
/* ------------------------------------------------------------------ */
/* DF 2026 early identity steps — shared by Guided and Quick (manual) */
/* ------------------------------------------------------------------ */
/** Starting Attribute Stones (permanent; independent of Attribute scores). */
export const TOWER_WIZARD_STARTING_STONES = permanentStonesFromLifetimeXp(0);
/** Starting Specializations: five at Rank 2 (20 Creation Points). */
export const TOWER_WIZARD_STARTING_SPECIALIZATIONS = 5;
/** Standard starting Mastery Rank. */
export const TOWER_WIZARD_DEFAULT_MASTERY_RANK = 2;
export function resolveWizardMasteryRank(selection, ctx = {}) {
    const raw = Number(ctx.masteryRank ?? selection.masteryRank ?? TOWER_WIZARD_DEFAULT_MASTERY_RANK);
    return Math.max(1, Math.floor(raw) || TOWER_WIZARD_DEFAULT_MASTERY_RANK);
}
/** Attribute Stone concentration cap: Mastery Rank × 2 on one Attribute. */
export function wizardStoneCap(masteryRank) {
    return Math.max(1, Math.floor(masteryRank) || 1) * 2;
}
/** Starting Attribute package (4,4,3,3,2,2,2) + 2 Stones (≤ MR × 2 each). */
export function validateWizardAttributesAndStones(selection, ctx = {}) {
    const errors = [];
    if (selection.attributeValues) {
        const values = selection.attributeValues;
        if (!startingPackageIsValid(values)) {
            errors.push('Assign your Attributes as 4, 4, 3, 3, 2, 2, 2 (one value per Attribute).');
        }
    }
    if (selection.stoneAssignments) {
        const cap = wizardStoneCap(resolveWizardMasteryRank(selection, ctx));
        let total = 0;
        for (const key of ATTRIBUTE_KEYS) {
            const n = Math.floor(Number(selection.stoneAssignments[key]) || 0);
            if (n < 0)
                errors.push(`${key} cannot have negative Stones.`);
            if (n > cap)
                errors.push(`${key} exceeds the Mastery Rank × 2 Stone limit (${cap}).`);
            total += Math.max(0, n);
        }
        if (total !== TOWER_WIZARD_STARTING_STONES) {
            errors.push(`Place exactly ${TOWER_WIZARD_STARTING_STONES} starting Attribute Stones (placed ${total}).`);
        }
    }
    return errors;
}
/** Echo Imprints: ≤ MR, unique, linked Attribute ≥ 4 (shared rules validator). */
export function validateWizardEchoImprints(selection, ctx = {}) {
    const ids = selection.echoImprintIds;
    if (!ids)
        return [];
    const errors = [];
    if (new Set(ids).size !== ids.length)
        errors.push('Duplicate Echo Imprints selected.');
    const result = validateEchoImprintSelections({
        selectedIds: ids,
        masteryRank: resolveWizardMasteryRank(selection, ctx),
        attributes: (selection.attributeValues ?? ctx.actorAttributes ?? {}),
    });
    errors.push(...result.errors);
    return errors;
}
/** Starting Specializations: exactly five Rank 2 (shared rules validator). */
export function validateWizardSpecializations(selection) {
    if (!selection.specializations)
        return [];
    return validateSpecializationList(selection.specializations, { requireStartingBudget: true }).errors;
}
/**
 * Validate the early identity DTO. Fields are only checked when present, so
 * legacy callers (imports, tests) keep working; set `requireComplete` for the
 * dialog gate where every early step must be finished.
 */
export function validateTowerWizardIdentity(selection, ctx = {}, opts = {}) {
    const errors = [];
    if (opts.requireComplete) {
        if (!ctx.hasEcho && !String(selection.echoKey || '').trim())
            errors.push('Choose your Echo.');
        if (!selection.attributeValues)
            errors.push('Assign your Attributes.');
        if (!selection.stoneAssignments)
            errors.push('Place your starting Stones.');
        if (!selection.specializations)
            errors.push('Choose your five Specializations.');
    }
    errors.push(...validateWizardAttributesAndStones(selection, ctx));
    errors.push(...validateWizardEchoImprints(selection, ctx));
    errors.push(...validateWizardSpecializations(selection));
    return errors.length ? errors.join(' ') : null;
}
/**
 * Per-step gate for the dialog's early steps. Attributes/Stones and Specializations are
 * required to continue; Echo Imprints are optional ("up to MR") but must be legal.
 */
export function validateWizardIdentityStep(step, selection, ctx = {}) {
    let errors = [];
    switch (step) {
        case 'echo':
            if (!ctx.hasEcho && !String(selection.echoKey || '').trim())
                errors.push('Choose your Echo.');
            break;
        case 'attributesStones':
            errors = validateWizardAttributesAndStones({
                ...selection,
                attributeValues: selection.attributeValues ?? {},
                stoneAssignments: selection.stoneAssignments ?? {},
            }, ctx);
            break;
        case 'echoImprints':
            errors = validateWizardEchoImprints(selection, ctx);
            break;
        case 'specializations':
            errors = validateWizardSpecializations({
                ...selection,
                specializations: selection.specializations ?? [],
            });
            break;
        default:
            break;
    }
    return errors.length ? errors.join(' ') : null;
}
export function isValidSecondPassiveForDefense(_defenseId, templateId, passive1TemplateId, actorEchoKey, actorSubChoiceKey) {
    const passive1 = passive1TemplateId;
    if (!passive1)
        return false;
    const entry = findCatalogEntry(templateId);
    if (entry?.category !== 'passive')
        return false;
    return isAllowedSecondPassive(templateId, passive1, actorEchoKey, actorSubChoiceKey);
}
export function validatePowerOverrideForGrantKey(selection, override) {
    const entry = findCatalogEntry(override.templateId, override.special);
    if (!entry)
        return 'One custom power is missing from the catalog.';
    if (!catalogEntryMatchesGrantKey(entry, override.grantKey)) {
        const expected = CATEGORY_LABELS[grantKeyCategory(override.grantKey)];
        return `${expected} slot cannot use that power type. Reset or pick a ${expected} power.`;
    }
    if (override.grantKey === 'passive-2') {
        const passive1Override = selection.powerOverrides?.find((o) => o.grantKey === 'passive-1');
        const passive1Id = passive1Override?.templateId
            ?? resolvePassive1TemplateId(selection)
            ?? getDefaultPassive1TemplateId(selection.defenseId);
        const conflict = getPassiveCategoryConflictMessage(passive1Id, override.templateId);
        if (conflict)
            return conflict;
    }
    if (override.isSpell && !activeTemplateCanBeSpell(override.templateId)) {
        return 'Only Ranged Actives can be cast as Spells.';
    }
    return null;
}
export function validateOffenseActivePicks(selection) {
    const picks = selection.offenseActivePicks;
    if (!picks || picks.length !== 2)
        return 'Choose exactly two Actives.';
    const seen = new Set();
    for (let i = 0; i < picks.length; i++) {
        const pick = picks[i];
        if (seen.has(pick.pickId))
            return 'Choose two different Actives.';
        seen.add(pick.pickId);
        const entry = findCatalogEntry(pick.templateId, pick.special);
        if (!entry)
            return 'One chosen Active is missing from the catalog.';
        const grantKey = i === 0 ? 'offense-0' : 'offense-1';
        if (!catalogEntryMatchesGrantKey(entry, grantKey))
            return 'Invalid Active selection.';
    }
    return null;
}
export function validateManualWizardSelection(selection) {
    if (!isManualBuildMode(selection))
        return null;
    const specs = buildPackageGrantSpecsFromOverrides(selection);
    if (!specs)
        return 'Choose all six Powers on the review page before applying.';
    const synthetic = {
        ...selection,
        defenseId: selection.defenseId ?? 'armor',
        secondPassiveTemplateId: selection.secondPassiveTemplateId ?? '',
        activeBuffMode: selection.activeBuffMode ?? 'defensive',
        delivery: selection.delivery ?? 'melee',
        weakenSave: selection.weakenSave ?? null,
    };
    for (const override of selection.powerOverrides ?? []) {
        const overrideErr = validatePowerOverrideForGrantKey(synthetic, override);
        if (overrideErr)
            return overrideErr;
    }
    const passive1 = selection.powerOverrides?.find((o) => o.grantKey === 'passive-1');
    const passive2 = selection.powerOverrides?.find((o) => o.grantKey === 'passive-2');
    if (passive1 && passive2 && passive1.templateId === passive2.templateId
        && (passive1.special ?? null) === (passive2.special ?? null)) {
        return 'Passive 1 and Passive 2 must be different Powers.';
    }
    if (!specs.every((s) => resolveGrant(s).status === 'ok')) {
        return 'One or more chosen Powers are missing from the catalog.';
    }
    const seen = new Set();
    let speciallessSpells = 0;
    for (const spec of specs) {
        const key = `${spec.templateId}::${spec.special ?? ''}`;
        if (seen.has(key))
            return 'This package contains duplicate Powers.';
        seen.add(key);
        if (spec.isSpell && !spec.special)
            speciallessSpells += 1;
    }
    const masteryRank = Math.max(1, Math.floor(Number(selection.masteryRank) || 2));
    if (speciallessSpells > masteryRank) {
        return `Spell Powers without a Special are limited to Mastery Rank (${masteryRank}).`;
    }
    return null;
}
export function validateTowerWizardSelection(selection, identityCtx) {
    // Guided and Quick share the same identity DTO validation (Imprints / Specs / Stones).
    const identityErr = validateTowerWizardIdentity(selection, identityCtx);
    if (identityErr)
        return identityErr;
    if (isManualBuildMode(selection)) {
        return validateManualWizardSelection(selection);
    }
    const passive1Id = resolvePassive1TemplateId(selection);
    if (!passive1Id || !isValidWizardPassive1(passive1Id)) {
        return 'Choose your first Passive.';
    }
    const defenseId = selection.defenseId ?? deriveDefenseIdFromPassive1(passive1Id);
    if (!selection.secondPassiveTemplateId)
        return 'Choose a second Passive.';
    if (!isValidSecondPassiveForDefense(defenseId, selection.secondPassiveTemplateId, passive1Id)) {
        const conflict = getPassiveCategoryConflictMessage(passive1Id, selection.secondPassiveTemplateId);
        return conflict ?? 'That second Passive is not available for your package.';
    }
    if (selection.activeBuffMode === 'offensive' && !selection.offensiveActiveBuffId) {
        return 'Choose an offensive Active Buff.';
    }
    if (selection.activeBuffMode === 'support' && !selection.offensiveActiveBuffId) {
        return 'Choose a support Active Buff.';
    }
    if (selection.offensiveActiveBuffId
        && !isValidReplacementActiveBuffId(selection.offensiveActiveBuffId, selection.activeBuffMode ?? 'defensive', defenseId)) {
        return 'That Active Buff replacement is not available.';
    }
    if (!selection.offenseId && !selectionUsesCatalogOffense(selection)) {
        return 'Choose exactly two Actives.';
    }
    if (selectionUsesCatalogOffense(selection)) {
        const pickErr = validateOffenseActivePicks({
            ...selection,
            defenseId,
            passive1TemplateId: passive1Id,
        });
        if (pickErr)
            return pickErr;
    }
    else if (!selection.offenseId) {
        return 'Choose exactly two Actives.';
    }
    else {
        const offense = getOffensePackage(selection.offenseId);
        if (!offense?.catalogAvailable)
            return 'That offensive package is not available yet.';
        if (selection.offenseId === 'weaken-save' && !selection.weakenSave) {
            return 'Choose which Save to pressure for Weaken.';
        }
    }
    const full = {
        ...selection,
        defenseId,
        passive1TemplateId: passive1Id,
    };
    for (const override of full.powerOverrides ?? []) {
        const overrideErr = validatePowerOverrideForGrantKey(full, override);
        if (overrideErr)
            return overrideErr;
    }
    const review = buildPackageReview(full);
    if (!review.allOk)
        return 'One or more Powers in this package are missing from the catalog.';
    if (review.defenseRows.length + review.offenseRows.length !== TOWER_WIZARD_POWER_TOTAL) {
        return `Package must grant exactly ${TOWER_WIZARD_POWER_TOTAL} Powers.`;
    }
    const specs = buildPackageGrantSpecs(full);
    const seen = new Set();
    for (const spec of specs) {
        const key = `${spec.templateId}::${spec.special ?? ''}`;
        if (seen.has(key))
            return 'This package contains duplicate Powers. Change or reset one of them.';
        seen.add(key);
    }
    return null;
}
export function validateTowerWizardCreation(actor) {
    const system = actor.system || {};
    if (!system.creation?.towerWizardPackageId) {
        return 'Open the Combat Package Wizard and apply your combat package before finalizing.';
    }
    /* PG "Starting Powers": Passives = available Passive Slots (MR 1 → 1 Passive). */
    const requirements = creationPowerRequirementsForMasteryRank(Number(system?.mastery?.rank) || 2);
    const requiredTotal = Object.values(requirements).reduce((s, n) => s + n, 0);
    const powers = actor.items.filter((i) => i.type === 'power');
    if (powers.length !== requiredTotal) {
        return `Must have exactly ${requiredTotal} Powers from the combat package (currently ${powers.length}).`;
    }
    const counts = countPowersByCategory(powers);
    for (const cat of CATEGORY_ORDER) {
        const need = requirements[cat];
        const have = counts[cat];
        if (have !== need) {
            return `Must have exactly ${need} ${CATEGORY_LABELS[cat]} power(s). Currently: ${have}.`;
        }
    }
    const duplicate = findDuplicatePowerLabel(powers);
    if (duplicate)
        return `Duplicate power "${duplicate}".`;
    let defensive = 0;
    let offensive = 0;
    for (const p of powers) {
        const lvl = Number(p.system?.level ?? 1);
        const cat = resolvePowerCategoryFromItem(p);
        if (cat === 'active') {
            if (lvl !== TOWER_WIZARD_OFFENSIVE_RANK) {
                return `Active Powers must be Rank ${TOWER_WIZARD_OFFENSIVE_RANK}.`;
            }
            offensive++;
        }
        else if (cat === 'passive' || cat === 'activeBuff' || cat === 'reaction') {
            if (lvl !== TOWER_WIZARD_DEFENSIVE_RANK) {
                return `${CATEGORY_LABELS[cat]} must be Rank ${TOWER_WIZARD_DEFENSIVE_RANK}.`;
            }
            defensive++;
        }
    }
    if (defensive !== 4 || offensive !== 2) {
        return 'Invalid rank mix for combat package.';
    }
    return null;
}
export function validatePackageSpecs(selection, identityCtx) {
    if (isManualBuildMode(selection)) {
        const identityErr = validateTowerWizardIdentity(selection, identityCtx);
        if (identityErr)
            return identityErr;
        const specs = buildPackageGrantSpecsFromOverrides(selection);
        if (!specs || specs.length !== TOWER_WIZARD_POWER_TOTAL) {
            return `Internal package error: expected ${TOWER_WIZARD_POWER_TOTAL} grants from manual picks.`;
        }
        return validateManualWizardSelection(selection);
    }
    const specs = buildPackageGrantSpecs(selection);
    if (specs.length !== TOWER_WIZARD_POWER_TOTAL) {
        return `Internal package error: expected ${TOWER_WIZARD_POWER_TOTAL} grants, got ${specs.length}.`;
    }
    return validateTowerWizardSelection(selection, identityCtx);
}
export function collectRelevantWarnings(selection, echoContext) {
    const out = [];
    if (echoContext) {
        out.push(...collectEchoAdvisorWarnings(selection, echoContext));
    }
    if (isManualBuildMode(selection))
        return [...new Set(out)];
    const defense = getDefensePackage(selection.defenseId);
    const offense = selection.offenseId ? getOffensePackage(selection.offenseId) : undefined;
    if (defense?.warning)
        out.push(defense.warning);
    if (offense?.warning)
        out.push(offense.warning);
    if (offense?.helperText)
        out.push(offense.helperText);
    if (selection.defenseId === 'damage-reduction') {
        out.push('Damage Reduction is a committed defensive package. Do not mix it with other defensive subsystems.');
    }
    if (selection.defenseId === 'phasing') {
        out.push('Phasing has limited uses per combat. It is powerful, but not constant protection.');
    }
    if (selection.offenseId === 'corrode-damage') {
        out.push('Corrode needs high damage after it. Do not take it without a damage follow-up.');
    }
    if (selection.offenseId === 'hex-spell') {
        out.push('Hex needs Spell follow-up. Do not take it if you are not using Spell attacks.');
    }
    if (selection.offenseId === 'weaken-save') {
        out.push('Weaken needs follow-up Powers that target the weakened Save.');
    }
    if (selection.offenseId === 'lacerate-push') {
        out.push('This package works best when you understand positioning.');
    }
    if (selection.activeBuffMode === 'offensive') {
        out.push('An offensive Active Buff replaces your defensive buff. You will be easier to hit or less protected while it is active.');
    }
    if (selection.activeBuffMode === 'support') {
        out.push('A support Active Buff replaces your package defensive buff. Your Passive 1 and Reaction stay defensive.');
    }
    return [...new Set(out)];
}
//# sourceMappingURL=tower-wizard-validation.js.map
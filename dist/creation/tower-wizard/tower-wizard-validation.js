/**
 * Tower Wizard — validation for selections and finalize.
 */
import { CATEGORY_LABELS, CATEGORY_ORDER, TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_MASTERY_RANK, TOWER_WIZARD_OFFENSIVE_RANK, TOWER_WIZARD_POWER_REQUIREMENTS, TOWER_WIZARD_POWER_TOTAL, countPowersByCategory, findDuplicatePowerLabel, resolvePowerCategoryFromItem, } from '../../utils/power-catalog.js';
import { buildPackageGrantSpecs, buildPackageReview, getDefensePackage, getOffensePackage, } from './tower-wizard-packages.js';
const BLOCKED_SECOND_PASSIVE_PREFIXES = [
    'passive-armor-',
    'passive-evade-',
    'passive-damage-',
    'passive-awareness-',
    'passive-health-',
    'conditional-passive-',
    'passive-damage-reduction',
    'passive-ghostform',
    'passive-fortified-frame',
    'passive-evade',
];
export function isValidSecondPassiveForDefense(defenseId, templateId) {
    const defense = getDefensePackage(defenseId);
    if (!defense)
        return false;
    if (!defense.secondPassiveTemplateIds.includes(templateId))
        return false;
    if (BLOCKED_SECOND_PASSIVE_PREFIXES.some((p) => templateId.startsWith(p) && !defense.secondPassiveTemplateIds.includes(templateId))) {
        return false;
    }
    return true;
}
export function validateTowerWizardSelection(selection) {
    if (!selection.defenseId)
        return 'Choose a defensive style.';
    if (!selection.secondPassiveTemplateId)
        return 'Choose a second Passive.';
    if (!isValidSecondPassiveForDefense(selection.defenseId, selection.secondPassiveTemplateId)) {
        return 'That second Passive conflicts with your defensive package.';
    }
    if (!selection.offenseId)
        return 'Choose an offensive style.';
    if (selection.activeBuffMode === 'offensive' && !selection.offensiveActiveBuffId) {
        return 'Choose an offensive Active Buff.';
    }
    const offense = getOffensePackage(selection.offenseId);
    if (!offense?.catalogAvailable)
        return 'That offensive package is not available yet.';
    if (selection.offenseId === 'weaken-save' && !selection.weakenSave) {
        return 'Choose which Save to pressure for Weaken.';
    }
    const full = selection;
    const review = buildPackageReview(full);
    if (!review.allOk)
        return 'One or more Powers in this package are missing from the catalog.';
    if (review.defenseRows.length + review.offenseRows.length !== TOWER_WIZARD_POWER_TOTAL) {
        return `Package must grant exactly ${TOWER_WIZARD_POWER_TOTAL} Powers.`;
    }
    return null;
}
export function validateTowerWizardCreation(actor) {
    const system = actor.system || {};
    if (!system.creation?.towerWizardPackageId) {
        return 'Open the Combat Package Wizard and apply your combat package before finalizing.';
    }
    const powers = actor.items.filter((i) => i.type === 'power');
    if (powers.length !== TOWER_WIZARD_POWER_TOTAL) {
        return `Must have exactly ${TOWER_WIZARD_POWER_TOTAL} Powers from the combat package (currently ${powers.length}).`;
    }
    const counts = countPowersByCategory(powers);
    for (const cat of CATEGORY_ORDER) {
        const need = TOWER_WIZARD_POWER_REQUIREMENTS[cat];
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
    const mr = Number(system.mastery?.rank ?? 0);
    if (mr < TOWER_WIZARD_MASTERY_RANK) {
        return `Mastery Rank must be at least ${TOWER_WIZARD_MASTERY_RANK} for this package.`;
    }
    return null;
}
export function validatePackageSpecs(selection) {
    const specs = buildPackageGrantSpecs(selection);
    if (specs.length !== TOWER_WIZARD_POWER_TOTAL) {
        return `Internal package error: expected ${TOWER_WIZARD_POWER_TOTAL} grants, got ${specs.length}.`;
    }
    return validateTowerWizardSelection(selection);
}
export function collectRelevantWarnings(selection) {
    const out = [];
    const defense = getDefensePackage(selection.defenseId);
    const offense = getOffensePackage(selection.offenseId);
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
    if (selection.offenseId === 'bleeding-push') {
        out.push('This package works best when you understand positioning.');
    }
    if (selection.activeBuffMode === 'offensive') {
        out.push('An offensive Active Buff replaces your defensive buff. You will be easier to hit or less protected while it is active.');
    }
    return [...new Set(out)];
}
//# sourceMappingURL=tower-wizard-validation.js.map
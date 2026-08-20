/**
 * Tower Wizard — apply package to actor.
 */
import { applyXpCost, getXpState } from '../../progression/progression-hub-actions.js';
import { CREATION_POWER_TOTAL } from '../../utils/power-catalog.js';
import { grantPowerSpecs } from '../../utils/power-item-builder.js';
import { calculatePowersUpgradeRefund } from '../../utils/power-xp-refund.js';
import { buildPackageGrantSpecs, buildPackageGrantSpecsFromOverrides, buildManualPackageReview, buildPackageReview, isManualBuildMode, } from './tower-wizard-packages.js';
import { validatePackageSpecs } from './tower-wizard-validation.js';
function isCreationMode(actor) {
    return actor.system?.creation?.complete === false;
}
export async function applyTowerWizardPackage(actor, selection, options) {
    const err = validatePackageSpecs(selection);
    if (err) {
        ui.notifications?.error(err);
        return false;
    }
    const review = isManualBuildMode(selection)
        ? buildManualPackageReview(selection)
        : buildPackageReview(selection);
    if (!review.allOk) {
        ui.notifications?.error('Cannot apply package — catalog entries missing.');
        return false;
    }
    const inCreation = isCreationMode(actor);
    const existingPowers = actor.items.filter((i) => i.type === 'power');
    const refundXp = inCreation ? 0 : calculatePowersUpgradeRefund(existingPowers);
    if (!inCreation && !options?.skipConfirm) {
        const confirmed = await Dialog.confirm({
            title: 'Replace all Powers?',
            content: `<p>This replaces <strong>all</strong> Powers on <strong>${actor.name}</strong> with the combat package.</p>${refundXp > 0
                ? `<p><strong>${refundXp} XP</strong> spent on Power upgrades will be refunded.</p>`
                : '<p>No Power upgrade XP to refund.</p>'}`,
            yes: () => true,
            no: () => false,
            defaultYes: false,
        });
        if (!confirmed)
            return false;
    }
    const specs = isManualBuildMode(selection)
        ? buildPackageGrantSpecsFromOverrides(selection)
        : buildPackageGrantSpecs(selection);
    if (!specs) {
        ui.notifications?.error('Cannot apply package — incomplete selection.');
        return false;
    }
    const powerIds = existingPowers.map((i) => i.id);
    if (powerIds.length > 0) {
        await actor.deleteEmbeddedDocuments('Item', powerIds);
    }
    const updateData = {
        'system.creation.towerWizardPackageId': review.packageId,
    };
    if (refundXp > 0) {
        const xpState = getXpState(actor);
        const acct = applyXpCost(xpState, -refundXp);
        updateData['system.points.xp'] = acct.pointsXp;
        updateData['system.points.xpFree'] = acct.pointsXpFree;
        updateData['system.xp.totalSpent'] = acct.totalSpent;
        updateData['system.xp.freeSpent'] = acct.freeSpent;
        const history = [...(xpState.history ?? [])];
        history.push({
            ts: Date.now(),
            userId: game.user?.id ?? '',
            userName: game.user?.name ?? '',
            kind: 'adjust',
            category: 'power',
            amount: refundXp,
            note: 'Combat Package Wizard rebuild — Power upgrade refund',
            before: {
                available: xpState.available,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent,
            },
            after: {
                available: acct.pointsXp + acct.pointsXpFree,
                totalEarned: xpState.totalEarned,
                totalSpent: acct.totalSpent,
            },
        });
        updateData['system.xp.history'] = history.slice(-200);
    }
    await actor.update(updateData);
    const granted = await grantPowerSpecs(actor, specs);
    if (granted !== CREATION_POWER_TOTAL) {
        ui.notifications?.warn(`Applied ${granted} of ${CREATION_POWER_TOTAL} Powers — check the character sheet.`);
    }
    else if (refundXp > 0) {
        ui.notifications?.info(`Combat package applied. ${refundXp} XP refunded.`);
    }
    else {
        ui.notifications?.info('Combat package applied.');
    }
    return true;
}
export function hasTowerWizardPackage(actor) {
    return !!actor.system?.creation?.towerWizardPackageId;
}
//# sourceMappingURL=tower-wizard-apply.js.map
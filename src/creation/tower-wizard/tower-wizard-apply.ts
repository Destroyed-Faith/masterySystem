/**
 * Tower Wizard — apply package to actor.
 */

import { applyXpCost, getXpState } from '../../progression/progression-hub-actions.js';
import { creationPowerRequirementsForMasteryRank, findCatalogEntry } from '../../utils/power-catalog.js';
import { grantPowerSpecs } from '../../utils/power-item-builder.js';
import { calculatePowersUpgradeRefund } from '../../utils/power-xp-refund.js';
import {
    buildPackageGrantSpecs,
    buildPackageGrantSpecsFromOverrides,
    buildManualPackageReview,
    buildPackageReview,
    isManualBuildMode,
} from './tower-wizard-packages.js';
import { validatePackageSpecs } from './tower-wizard-validation.js';
import type { TowerWizardSelection } from './tower-wizard-types.js';

function isCreationMode(actor: Actor): boolean {
    return (actor.system as any)?.creation?.complete === false;
}

export async function applyTowerWizardPackage(
    actor: Actor,
    selection: TowerWizardSelection,
    options?: { skipConfirm?: boolean },
): Promise<boolean> {
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
    const existingPowers = (actor as any).items.filter((i: any) => i.type === 'power');
    const refundXp = inCreation ? 0 : calculatePowersUpgradeRefund(existingPowers);

    if (!inCreation && !options?.skipConfirm) {
        const confirmed = await Dialog.confirm({
            title: 'Replace all Powers?',
            content: `<p>This replaces <strong>all</strong> Powers on <strong>${(actor as any).name}</strong> with the combat package.</p>${
                refundXp > 0
                    ? `<p><strong>${refundXp} XP</strong> spent on Power upgrades will be refunded.</p>`
                    : '<p>No Power upgrade XP to refund.</p>'
            }`,
            yes: () => true,
            no: () => false,
            defaultYes: false,
        });
        if (!confirmed) return false;
    }

    let specs = isManualBuildMode(selection)
        ? buildPackageGrantSpecsFromOverrides(selection)
        : buildPackageGrantSpecs(selection);
    if (!specs) {
        ui.notifications?.error('Cannot apply package — incomplete selection.');
        return false;
    }

    /* PG "Starting Powers": MR 1 campaigns start with 1 Passive instead of 2. */
    const masteryRank = Math.max(1, Math.floor(Number((actor.system as any)?.mastery?.rank) || 2));
    const requirements = creationPowerRequirementsForMasteryRank(masteryRank);
    const maxPassives = requirements.passive;
    let passivesKept = 0;
    specs = specs.filter((spec) => {
        const cat = findCatalogEntry(spec.templateId)?.category;
        if (cat !== 'passive') return true;
        passivesKept++;
        return passivesKept <= maxPassives;
    });
    const expectedTotal = Object.values(requirements).reduce((s, n) => s + n, 0);
    const powerIds = existingPowers.map((i: any) => i.id);

    if (powerIds.length > 0) {
        await (actor as any).deleteEmbeddedDocuments('Item', powerIds);
    }

    const updateData: Record<string, unknown> = {
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
            userId: (game as any).user?.id ?? '',
            userName: (game as any).user?.name ?? '',
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

    await (actor as any).update(updateData);

    const granted = await grantPowerSpecs(actor, specs);
    if (granted !== expectedTotal) {
        ui.notifications?.warn(`Applied ${granted} of ${expectedTotal} Powers — check the character sheet.`);
    } else if (refundXp > 0) {
        ui.notifications?.info(`Combat package applied. ${refundXp} XP refunded.`);
    } else {
        ui.notifications?.info('Combat package applied.');
    }

    return true;
}

export function hasTowerWizardPackage(actor: Actor): boolean {
    return !!(actor.system as any)?.creation?.towerWizardPackageId;
}

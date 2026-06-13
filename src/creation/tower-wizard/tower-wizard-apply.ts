/**
 * Tower Wizard — apply package to actor.
 */

import {
    CREATION_MASTERY_RANK,
    CREATION_POWER_TOTAL,
} from '../../utils/power-catalog.js';
import { grantPowerSpecs } from '../../utils/power-item-builder.js';
import {
    buildPackageGrantSpecs,
    buildPackageReview,
} from './tower-wizard-packages.js';
import { validatePackageSpecs } from './tower-wizard-validation.js';
import type { TowerWizardSelection } from './tower-wizard-types.js';

export async function applyTowerWizardPackage(
    actor: Actor,
    selection: TowerWizardSelection,
): Promise<boolean> {
    const err = validatePackageSpecs(selection);
    if (err) {
        ui.notifications?.error(err);
        return false;
    }

    const review = buildPackageReview(selection);
    if (!review.allOk) {
        ui.notifications?.error('Cannot apply package — catalog entries missing.');
        return false;
    }

    const specs = buildPackageGrantSpecs(selection);
    const powerIds = (actor as any).items.filter((i: any) => i.type === 'power').map((i: any) => i.id);
    if (powerIds.length > 0) {
        await (actor as any).deleteEmbeddedDocuments('Item', powerIds);
    }

    await (actor as any).update({
        'system.mastery.rank': CREATION_MASTERY_RANK,
        'system.creation.towerWizardPackageId': review.packageId,
    });

    const granted = await grantPowerSpecs(actor, specs);
    if (granted !== CREATION_POWER_TOTAL) {
        ui.notifications?.warn(`Applied ${granted} of ${CREATION_POWER_TOTAL} Powers — check the character sheet.`);
    } else {
        ui.notifications?.info('Combat package applied.');
    }

    return true;
}

export function hasTowerWizardPackage(actor: Actor): boolean {
    return !!(actor.system as any)?.creation?.towerWizardPackageId;
}

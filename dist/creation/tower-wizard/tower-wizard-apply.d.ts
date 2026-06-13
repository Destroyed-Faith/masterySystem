/**
 * Tower Wizard — apply package to actor.
 */
import type { TowerWizardSelection } from './tower-wizard-types.js';
export declare function applyTowerWizardPackage(actor: Actor, selection: TowerWizardSelection, options?: {
    skipConfirm?: boolean;
}): Promise<boolean>;
export declare function hasTowerWizardPackage(actor: Actor): boolean;
//# sourceMappingURL=tower-wizard-apply.d.ts.map
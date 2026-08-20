/**
 * Tower Wizard — Echo + Echo Artifact awareness.
 *
 * Characters maintain one Active Buff at a time. Echo Artifacts already grant
 * Active Buff lines via their progression picks; the combat package must not
 * duplicate those axes without a deliberate choice (offensive/support buff, or
 * a different defensive subsystem).
 */
import type { DefensePackageId, TowerWizardSelection } from './tower-wizard-types.js';
export interface EchoArtifactActiveBuff {
    artifactKey: string;
    artifactName: string;
    pickLevel: 1 | 2 | 3;
    templateId: string;
    displayName: string;
    defenseAxis: DefensePackageId | null;
}
export interface TowerWizardEchoContext {
    hasEcho: boolean;
    echoKey: string | null;
    echoLabel: string | null;
    artifactKeys: string[];
    artifactActiveBuffs: EchoArtifactActiveBuff[];
    occupiedDefenseAxes: DefensePackageId[];
}
export interface DefensePackageEchoView {
    id: DefensePackageId;
    mechanicLabel: string;
    label: string;
    explanation: string;
    warning?: string;
    echoConflict: EchoArtifactActiveBuff | null;
    echoRecommended: boolean;
}
/** Collect Active Buff lines granted by Echo Artifacts on this actor. */
export declare function collectEchoArtifactActiveBuffs(actor: Actor): EchoArtifactActiveBuff[];
export declare function buildTowerWizardEchoContext(actor: Actor): TowerWizardEchoContext;
export declare function defensePackageConflictsWithEcho(defenseId: DefensePackageId, ctx: TowerWizardEchoContext): EchoArtifactActiveBuff | null;
/** Defense packages that complement (rather than duplicate) Echo Artifact Active Buffs. */
export declare function recommendDefensePackages(ctx: TowerWizardEchoContext): DefensePackageId[];
export declare function buildDefensePackagesWithEcho(ctx: TowerWizardEchoContext): DefensePackageEchoView[];
export declare function collectArtifactActiveBuffIdentityKeys(ctx: TowerWizardEchoContext): Set<string>;
export declare function validateEchoRequiredForTowerWizard(ctx: TowerWizardEchoContext): string | null;
export declare function collectEchoAdvisorWarnings(selection: Partial<TowerWizardSelection>, ctx: TowerWizardEchoContext): string[];
export declare function buildEchoAdvisorSummary(ctx: TowerWizardEchoContext): string | null;
//# sourceMappingURL=tower-wizard-echo-advisor.d.ts.map
/**
 * Artifact Active Buffs
 *
 * Artifact level-progression rows of type "Active Buff" (e.g. Titan Scars'
 * Growth Form) have no backing `type: 'power'` item, so the normal
 * `activateActiveBuff` pipeline (which requires a power item) cannot drive
 * them. This module activates an artifact's Active-Buff row directly:
 *
 *   • Creates a Mastery-flagged ActiveEffect (`activeBuff: true`) so it counts
 *     as the actor's one maintained Active Buff and is cleaned up by the
 *     existing combat-end / deleteActiveEffect hooks.
 *   • For "Growth Form" rows it visibly enlarges every placed token of the
 *     actor (size scales with the Growth Power Level) and stores the original
 *     token size on the effect so it can be restored when the buff ends.
 */
import type { RadialCombatOption } from '../radial-menu/types.js';
/** Active artifact Active-Buff effects already on the actor (Mastery-flagged). */
export declare function getArtifactActiveBuffs(actor: any): any[];
/** True when this exact artifact row is already running as a buff. */
export declare function isArtifactBuffActive(actor: any, buffKey: string): boolean;
/** Restore token sizes stored on a Growth Form effect (called from deleteActiveEffect). */
export declare function restoreGrowthFromEffect(effect: any): Promise<void>;
/**
 * Activate an artifact Active-Buff row (e.g. Titan Growth → Growth Form).
 * Returns true on success.
 */
export declare function activateArtifactActiveBuff(actor: any, artifactItem: any, option: RadialCombatOption): Promise<boolean>;
//# sourceMappingURL=artifact-active-buffs.d.ts.map
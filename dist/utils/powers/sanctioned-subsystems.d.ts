/**
 * Sanctioned DR% and Phasing Subsystems
 *
 * These six power definitions are the *only* sources the aggregator allows
 * to contribute to `mechanics.damageReductionPct` or `mechanics.phasing`.
 * They are intentionally kept out of the class/mastery tree lists until
 * tree assignment is confirmed by the GM — they exist here so they can
 * be imported, dropped into an actor as items, or referenced by audit
 * scripts and tests.
 *
 * Rule summary (see plan: new-combat-mechanics):
 *   - DR%:      Damage Reduction (passive)  +  Unyielding Shell (buff)  +  Unyielding Intercept (reaction)
 *   - Phasing:  Ghostform (passive)          +  Ghost Mantle (buff)     +  Ghost Slip (reaction)
 *
 * Buff/Reaction contributions only count when the matching Passive is
 * active — this gating lives in `src/utils/power-mechanics.ts` and is
 * enforced independently of the definitions below.
 */
import type { NewArtifactPowerData } from '../../types/item.js';
export declare const DAMAGE_REDUCTION_PASSIVE: NewArtifactPowerData;
export declare const UNYIELDING_SHELL_BUFF: NewArtifactPowerData;
export declare const UNYIELDING_INTERCEPT_REACTION: NewArtifactPowerData;
export declare const GHOSTFORM_PASSIVE: NewArtifactPowerData;
export declare const GHOST_MANTLE_BUFF: NewArtifactPowerData;
export declare const GHOST_SLIP_REACTION: NewArtifactPowerData;
/** Flat list of all six sanctioned subsystem powers. */
export declare const SANCTIONED_SUBSYSTEM_POWERS: NewArtifactPowerData[];
/** Names that may legally declare `damageReductionPct`. */
export declare const SANCTIONED_DR_NAMES: readonly ["Damage Reduction", "Unyielding Shell", "Unyielding Intercept"];
/** Names that may legally declare `phasing` / `triggers.combatStart.phasingCharges`. */
export declare const SANCTIONED_PHASING_NAMES: readonly ["Ghostform", "Ghost Mantle", "Ghost Slip"];
//# sourceMappingURL=sanctioned-subsystems.d.ts.map
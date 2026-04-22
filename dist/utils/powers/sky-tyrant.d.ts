/**
 * Sky Tyrant Mastery Tree Powers
 *
 * Theme:  Dragon / Aerial Bruiser-Tank
 * Role:   Bruiser / Tank / Space Control
 * Pillars: Flight • Split Natural Attacks • DR Commitment
 * Requirement: Dragon form, draconic mutation, or natural weapon build.
 * Gated to actors with the "dragonborn" Echo.
 *
 * Playstyle
 * ---------
 * Sky Tyrant plays as a heavy flying predator that commits to a short, brutal
 * rotation: armor up → DR online → flight engage → claws → reaction spike.
 *
 * Contents (6 powers): 1 Active, 2 Passives, 1 Active Buff, 1 Reaction,
 * 1 Movement. This is a tighter, focused tree rather than the 18-power
 * format of Warden Dragon / Raptor Dragon / Dreadwyrm.
 *
 * Sanctioned DR subsystem: `Damage Reduction` (passive), `Unyielding Shell`
 * (active buff) and `Unyielding Intercept` (reaction) are the three exclusive
 * DR lines and all live in this tree. Aggregator gating in
 * `src/utils/power-mechanics.ts` requires the passive to be active for the
 * buff/reaction to contribute DR%.
 */
import type { NewArtifactPowerData } from '../../types/item.js';
export declare const SKY_TYRANT_POWERS: NewArtifactPowerData[];
//# sourceMappingURL=sky-tyrant.d.ts.map
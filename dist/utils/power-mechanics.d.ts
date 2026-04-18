/**
 * Power Mechanics Engine — Aggregator
 *
 * Reads structured `mechanics` blocks from slot-activated passives and
 * active-buff effects, sums them into per-actor totals, and builds a
 * breakdown list ("Armor +1 from Dragon Scales (slotted)") that the
 * character sheet renders as transparent tooltips.
 *
 * Powers that do not carry a `mechanics` block are ignored here (they are
 * purely descriptive and resolved as GM-ruling, unchanged from prior
 * behavior).
 *
 * This module deliberately does **not** touch Foundry's native
 * `ActiveEffect.changes` pipeline. All addition happens on top of the
 * existing `system.combat.*` values computed earlier in `prepareDerivedData`.
 */
import type { PowerMechanics } from '../types/item';
import type { MechanicsBreakdown } from '../types/actor';
/** Empty breakdown skeleton (all arrays/objects present, all totals zero). */
export declare function emptyBreakdown(): MechanicsBreakdown;
/**
 * Resolve the rank-specific mechanics block from a power item.
 * Falls back to the power-level `system.mechanics` when no rank override
 * exists. Returns null when the power has no mechanics at all.
 */
export declare function resolvePowerMechanics(powerItem: any): PowerMechanics | null;
/** One collected mechanics contribution with its display source. */
interface MechanicsContribution {
    source: string;
    mechanics: PowerMechanics;
}
/**
 * Enumerate every active mechanics contribution for an actor:
 * - slot-activated passives (system.passives.slotN where active=true) with a mechanics block
 * - live ActiveEffects flagged as activeBuff whose source power has a mechanics block
 */
export declare function collectMechanicsContributions(actor: any): MechanicsContribution[];
/**
 * Sum all collected mechanics contributions into a full breakdown with
 * precomputed totals. The result is ready to be stored on
 * `actor.system.derived.mechanicsBreakdown`.
 */
export declare function aggregateMechanics(contributions: MechanicsContribution[]): MechanicsBreakdown;
/** High-level convenience: contributions + aggregation in one call. */
export declare function buildActorMechanicsBreakdown(actor: any): MechanicsBreakdown;
/**
 * Roll-dice delta for a given roll kind. Consumed by `roll-handler.ts`
 * right before the numDice pool is committed to `masteryRoll`.
 */
export declare function getRollDiceDelta(actor: any, kind: 'attack' | 'skill' | 'damage' | 'saveBody' | 'saveMind' | 'saveSpirit'): number;
export {};
//# sourceMappingURL=power-mechanics.d.ts.map
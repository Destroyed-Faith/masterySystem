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
 *
 * Backwards-compatibility: power items created before the `mechanics` blocks
 * were added to the canonical tree/school definitions stored a snapshot of
 * `levels` that lacks those blocks. For those legacy items we look the
 * definition up again in the live catalog by `name` (+ `tree` / `isMagicPower`
 * hints) and pull the mechanics from there. Re-adding the power is no longer
 * required for passives/buffs to apply.
 */
/**
 * Resolve a slotted passive / buff source item id on an actor. Foundry's
 * `actor.items` is a Collection (not an Array) — `Array.isArray(items)` is
 * false, so a bare `items.get` miss used to drop all passive mechanics.
 */
export declare function findPowerItemOnActor(actor: any, pid: string | undefined | null): any;
export declare function resolvePowerMechanics(powerItem: any): PowerMechanics | null;
/** One collected mechanics contribution with its display source. */
interface MechanicsContribution {
    /** Human display, e.g. "Lean Ward (slotted)". */
    source: string;
    /** Canonical power name (no suffix), used for the closed-subsystem whitelist. */
    powerName: string;
    /** Which layer of the stack this contribution belongs to (DR gating axis). */
    sourceKind: 'passive' | 'buff' | 'reaction';
    mechanics: PowerMechanics;
}
/** Same check for Phasing declarations. Exported so the runtime can reuse. */
export declare function isSanctionedPhasingName(powerName: string, sourceKind: 'passive' | 'buff' | 'reaction'): boolean;
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
 *
 * Pass `actor` so self-facing `conditionExpr` gates (e.g. adjacent enemies)
 * can fold into `totals`; omit it only for pure unit tests of unconditional rows.
 */
export declare function aggregateMechanics(contributions: MechanicsContribution[], actor?: any): MechanicsBreakdown;
/** High-level convenience: contributions + aggregation in one call. */
export declare function buildActorMechanicsBreakdown(actor: any): MechanicsBreakdown;
/**
 * Roll-dice delta for a given roll kind. Consumed by `roll-handler.ts`
 * right before the numDice pool is committed to `masteryRoll`.
 *
 * When a `target` is provided, passive/buff contributions whose `condition`
 * gate evaluates **against the target** are also folded in (and those
 * contributions are *not* part of the pre-aggregated breakdown totals, which
 * only contain unconditional bonuses).
 */
export declare function getRollDiceDelta(actor: any, kind: 'attack' | 'skill' | 'damage' | 'saveBody' | 'saveMind' | 'saveSpirit', target?: any): number;
/**
 * Check whether an actor carries a given condition. Checks (in order):
 *   1. actor.statuses (Foundry v13 Set of status ids)
 *   2. actor.effects (ActiveEffect collection) – name/label match
 *   3. actor.flags['mastery-system'].conditions
 *   4. actor.system.conditions
 *   5. actor.system.specials (array of strings like "Bleeding(3)")
 *
 * This is defensive and works whether the GM tags conditions as Foundry
 * status tokens, applies ActiveEffects via our buff system, or stores them
 * as a system flag.
 */
export declare function hasCondition(actor: any, condition: string): boolean;
/**
 * Evaluate a PowerMechanics.condition gate. Returns true when the gate is
 * satisfied (or null/absent). Supports both target-facing (`targetHexed`,
 * `targetMarked`, …) and self-facing (`self-hp-below-50`) flavors.
 */
export declare function evaluateConditionGate(self: any, target: any, condition: string | null | undefined): boolean;
/**
 * Evaluate mechanics `condition` / `conditionExpr` including `self.adjacentEnemies`,
 * movement meters, health state, and `self.hasSpecial.*`. Dot-prefixed `target.*`
 * is reserved for future runtime (returns false). Legacy gates defer to
 * `evaluateConditionGate`.
 */
export declare function evaluateMechanicsConditionExpr(self: any, target: any, expr: string): boolean;
/**
 * A conditional damage rider that fires when attacking a target that carries
 * a given condition. Returned from `collectConditionalDamageRiders`.
 */
export interface ConditionalRider {
    source: string;
    /** Canonical condition keyword (e.g. "hexed"). */
    condition: string;
    /** Dice formula as parsed from the mechanics block (e.g. "+2d8" -> "2d8"). */
    dice: string;
}
/**
 * Collect conditional damage riders that apply to a single attack made by
 * `attacker` against `target`. Walks the attacker's slot-activated passives
 * and active buffs (same pool the aggregator uses) plus the currently
 * selected power's own mechanics. A rider fires when the mechanics block's
 * condition / damageRider.vsCondition matches the target.
 */
export declare function collectConditionalDamageRiders(attacker: any, target: any, selectedPower?: any): ConditionalRider[];
export {};
//# sourceMappingURL=power-mechanics.d.ts.map
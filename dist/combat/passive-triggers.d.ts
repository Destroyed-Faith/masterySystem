/**
 * Passive Combat-Trigger Framework
 *
 * Generic runtime for time-based passive effects: combat-start one-shots,
 * turn-start refresh pools, and (future) end-of-turn / round-start / once-
 * per-round riders. First production consumer is Temp HP from passives:
 * - Lean Ward: `triggers.combatStart.tempHP = '1d8'` (one-shot, rolled once
 *   per combat, survives until combatEnd).
 * - Dragon Scales: `triggers.turnStartSelf.tempHP = '2'` (refresh pool, set
 *   to at least N at the owner's own turn-start, can drop to 0 mid-turn).
 *
 * ### Source Book-keeping
 *
 * Each granted pool is tracked by a **stable source key** so that re-
 * applying the same passive never double-stacks:
 *
 *     sourceKey = `${powerId}:${triggerKind}`
 *
 * Sources live under `actor.flags['mastery-system'].tempHPSources` and each
 * entry carries `{ value, declared, kind, origin, combatId, createdAt }`.
 * The scalar mirror `actor.system.health.tempHP` continues to drive all
 * existing display/damage code unchanged — but its mutations are now routed
 * through this module so that the pool breakdown stays consistent with the
 * mirror.
 *
 * ### Stacking rules (confirmed with design)
 *
 * - Same source: idempotent; re-apply overrides to the newly declared value,
 *   never additive.
 * - Different sources: separate pools; mirror = sum of all.
 * - Damage consumption order: **one-shot pools first**, refresh pools last;
 *   inside each group, oldest first (stable createdAt sort).
 * - Manual / unsourced temp HP remains untouched by damage until all tracked
 *   pools are exhausted; on combatEnd we subtract *only* the sourced portion
 *   from the mirror, leaving manual residuals intact.
 *
 * ### Edge cases (acknowledged, not handled here)
 *
 * - Non-combat tempHP sources (rituals, safe-haven heals) are out of scope.
 * - If a GM manually edits `tempHP` mid-combat while sources exist, the
 *   delta-based updater will propagate the manual change correctly on the
 *   next upsert (the source values are not auto-rebalanced).
 */
import type { PowerMechanicsTriggers } from '../types/item';
export type TriggerKind = keyof PowerMechanicsTriggers;
/** One granted pool tied to a specific passive or active buff. */
export interface TempHPSource {
    /** Current pool value (can be reduced by damage, capped at 0). */
    value: number;
    /** "At-least" target for refresh kinds; rolled amount for one-shot kinds. */
    declared: number;
    /** `one-shot` survives the combat; `refresh` is raised on each turn-start. */
    kind: 'one-shot' | 'refresh';
    origin: {
        /**
         * What granted this pool:
         * - `passive` → a slot-activated passive item (ownerId = item id)
         * - `buff` → a live ActiveEffect flagged activeBuff (ownerId = effect id)
         *
         * Legacy sources written by 0.4.272 may omit this field; code that reads
         * existing sources treats absent `ownerKind` as `'passive'` for
         * backward compatibility.
         */
        ownerKind?: 'passive' | 'buff';
        /**
         * Alias for ownerId. Kept under the historical `powerId` name so the
         * persisted flag shape stays stable across the 0.4.272 → 0.4.273
         * transition.
         */
        powerId: string;
        name: string;
        triggerKind: TriggerKind;
    };
    /** Combat this source belongs to; cleared on matching `combatEnd`. */
    combatId: string;
    /** Monotonic timestamp for stable damage-consumption ordering. */
    createdAt: number;
}
export type TempHPSourcesFlag = Record<string, TempHPSource>;
export interface TempHPConsumptionResult {
    /** How much of the incoming damage was absorbed by tempHP (mirror reduction). */
    reducedBy: number;
    /** Leftover damage that still needs to hit the health bars. */
    remainingDamage: number;
}
type Roller = (formula: string) => Promise<number> | number;
/**
 * Replace the dice-roller for tests. Pass `null` to restore Foundry's
 * default Roll pipeline.
 */
export declare function setTempHPRollerForTests(roller: Roller | null): void;
/** Return a *copy* of the current sources map so callers may mutate freely. */
export declare function getTempHPSources(actor: any): TempHPSourcesFlag;
/**
 * Build the stable key that identifies one trigger-pool source. The optional
 * `ownerKind` prefix (`'passive'` / `'buff'`) is prepended to avoid collisions
 * between a passive item's id and an ActiveEffect's id. When omitted, the
 * legacy 2-arg form `<ownerId>:<triggerKind>` is produced for backward
 * compatibility with sources written by 0.4.272.
 */
export declare function makeSourceKey(ownerId: string, triggerKind: TriggerKind): string;
export declare function makeSourceKey(ownerKind: 'passive' | 'buff', ownerId: string, triggerKind: TriggerKind): string;
/**
 * Upsert a single Temp HP source. The actor mirror `system.health.tempHP`
 * is adjusted by the delta so manual residuals stay intact.
 *
 * Exposed primarily for tests and future callers (e.g. activeBuff-applied
 * Temp HP). The main dispatcher `applyPassiveTrigger` uses an inlined
 * batched version so it only writes once per trigger.
 */
export declare function upsertTempHPSource(actor: any, key: string, source: TempHPSource): Promise<void>;
/**
 * Apply a trigger to every slot-activated passive on the actor whose
 * mechanics block declares `triggers[triggerKind]`. Rolls dice-strings as
 * needed, merges the resulting pools into the actor's `tempHPSources` map,
 * and synchronises the scalar mirror in a single `actor.update`.
 *
 * Idempotence:
 * - `combatStart` skips sources that already exist for the given combatId
 *   (so re-firing the hook does not reroll pools).
 * - `turnStartSelf` always re-evaluates and raises the pool to at least the
 *   declared value; never lowers it.
 */
export declare function applyPassiveTrigger(actor: any, triggerKind: TriggerKind, combat: any): Promise<void>;
/**
 * Fire every trigger kind declared on a freshly-activated ActiveEffect buff.
 * Called from the `createActiveEffect` hook so that a buff activated mid-combat
 * immediately materialises its one-shot Temp HP (combatStart) and its refresh
 * pool floor (turnStartSelf) without waiting for the next turn or the next
 * combat.
 *
 * Semantics when activated outside combat (`combat == null`): we still roll
 * the one-shot pool and record a `combatId: ''` source so the consume/cleanup
 * pipeline behaves consistently; `combatEnd` / `deleteCombat` won't touch it
 * (no combat id to match), but `deleteActiveEffect` will via the buff-specific
 * cleanup path.
 */
export declare function applyBuffTriggersOnActivate(actor: any, effect: any, combat: any): Promise<void>;
/**
 * Remove every Temp HP source granted by a specific ActiveEffect buff. Called
 * from `deleteActiveEffect` so that when the buff expires or is manually
 * removed mid-combat, its pools disappear from the mirror without touching
 * sources owned by other passives or manual Temp HP residuals.
 */
export declare function clearTempHPSourcesForBuffEffect(actor: any, effectId: string): Promise<void>;
export interface TempHPConsumptionPreview extends TempHPConsumptionResult {
    /**
     * Partial actor.update patch that applies the consumption. Callers that
     * also need to update other actor fields (e.g. health bars) should merge
     * this into their own update call to keep the write atomic.
     */
    patch: Record<string, unknown>;
}
/**
 * Compute the result of consuming incoming damage from the actor's tempHP
 * pools **without** writing to the actor. Returns both the numeric result
 * and the update patch to apply. Useful for the damage pipeline, which
 * merges tempHP + bar updates into a single atomic `actor.update`.
 *
 * Consumption order:
 *   1. one-shot sources, oldest first;
 *   2. refresh sources, oldest first;
 *   3. any unsourced manual tempHP residual (mirror minus sources).
 */
export declare function previewTempHPConsumption(actor: any, incoming: number): TempHPConsumptionPreview;
/**
 * Subtract incoming damage from the actor's tempHP pools in priority order.
 * Writes the resulting patch to the actor and returns the numeric result.
 * Use `previewTempHPConsumption` instead when you need to merge the patch
 * with other updates (e.g. health-bar changes) into a single write.
 */
export declare function consumeTempHPFromSources(actor: any, incoming: number): Promise<TempHPConsumptionResult>;
/**
 * Remove every sourced temp-HP pool for the given combat (or all of them, if
 * no combat is passed — use the no-arg form defensively on `deleteCombat`).
 *
 * The mirror `system.health.tempHP` is decremented by the removed portion
 * only; any unsourced residual (GM-set, ritual-derived, …) stays on the
 * actor.
 */
export declare function clearTempHPSourcesOnCombatEnd(actor: any, combat?: any): Promise<void>;
/**
 * Iterate every actor attached to the combat's combatants. Handles both
 * Collection-backed (Foundry) and plain-array (tests) combatant stores.
 */
export declare function getCombatActors(combat: any): any[];
/**
 * Convenience: apply a trigger to every combatant in the combat, one at a
 * time (sequentially — avoids racing `actor.update` calls).
 */
export declare function applyPassiveTriggerToCombat(triggerKind: TriggerKind, combat: any): Promise<void>;
/** Convenience: clear sources on every combatant in the combat. */
export declare function clearTempHPSourcesForCombat(combat: any): Promise<void>;
export {};
//# sourceMappingURL=passive-triggers.d.ts.map
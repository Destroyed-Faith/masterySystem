/**
 * Phasing — Ignore-Hit Charges subsystem.
 *
 * Closed subsystem: only three sanctioned powers may grant or augment phasing
 * charges (enforced at the aggregator layer):
 *
 *   - **Ghostform** (Passive) — `mechanics.phasing.combatStart.charges: N`.
 *     Grants N base charges at combat start. Idempotent per combat (re-firing
 *     the combatStart trigger does not refill).
 *   - **Ghost Mantle** (Active Buff) — `mechanics.phasing.augment.addCharges: M`.
 *     Adds M charges on buff activation *if* a passive base already exists;
 *     Buff-delete removes those augment charges again via per-source tracking.
 *   - **Ghost Slip** (Reaction) — `mechanics.phasing.reactionSingleHit: true`.
 *     Grants exactly one charge for the triggering hit (runtime grants +1 and
 *     consumes it in the same turn).
 *
 * ### Runtime model
 *
 * Charges live under `actor.flags['mastery-system'].phasingCharges`:
 * ```
 * {
 *   max: number,           // aggregated cap (passive + augment sources)
 *   current: number,       // remaining ignore-hit charges
 *   combatId: string,      // combat the pool belongs to; cleared on combatEnd
 *   sources: {             // per-source bookkeeping for augment removal
 *     [key: string]: { ownerKind, ownerId, charges }
 *   }
 * }
 * ```
 *
 * On an incoming hit, `promptPhasingConsume(target, context)` asks the target
 * owner whether to consume one charge. If yes, `consumePhasingCharge(actor)`
 * decrements `current` (and is also invoked automatically inside the damage
 * pipeline once the prompt resolves to `true`).
 *
 * The module is intentionally isolated from the Temp-HP pipeline so that any
 * future defensive subsystem (Mirror Images, Absorption Shield, …) can follow
 * the same shape without coupling.
 */
export interface PhasingChargeSource {
    /** Kind of owner that granted these charges. */
    ownerKind: 'passive' | 'buff' | 'reaction';
    /** Power-item id (passive), ActiveEffect id (buff), or attack-id (reaction). */
    ownerId: string;
    /** Display name for chat logging. */
    name: string;
    /** How many charges this source contributes to `max` (and initially `current`). */
    charges: number;
}
export interface PhasingState {
    max: number;
    current: number;
    combatId: string;
    sources: Record<string, PhasingChargeSource>;
}
/** Return a plain-object snapshot of the actor's phasing state (always defined). */
export declare function getPhasingCharges(actor: any): PhasingState;
/**
 * Grant base phasing charges from a Passive (Ghostform). Idempotent per
 * combat: if the same passive already granted charges for this combat, the
 * call is a no-op. If the combat changed, the state is reset to this power's
 * declared base (aging across combats is handled by `clearPhasingOnCombatEnd`).
 *
 * Augment contributions are preserved across the reset if they were tagged for
 * the same combat.
 */
export declare function grantPhasingCharges(actor: any, combat: any, amount: number, source: {
    ownerKind: 'passive';
    ownerId: string;
    name: string;
}): Promise<void>;
/**
 * Add augment charges from an Active Buff (Ghost Mantle). Refuses if no
 * Passive base currently exists (enforced here as a belt-and-braces guard on
 * top of the aggregator's gating — mid-combat buff activations don't go
 * through the aggregator).
 */
export declare function augmentPhasingCharges(actor: any, combat: any, addAmount: number, source: {
    ownerKind: 'buff' | 'reaction';
    ownerId: string;
    name: string;
}): Promise<void>;
/**
 * Remove augment charges previously granted by a specific ActiveEffect (buff
 * was deleted/expired). Charges already consumed don't come back — we only
 * deduct the unused remainder, capped at what the source still contributes.
 */
export declare function removeAugmentCharges(actor: any, effectId: string): Promise<void>;
/**
 * Consume one charge. Returns true if a charge was available (and decremented).
 * Used by the damage pipeline after `promptPhasingConsume` resolves to `true`.
 */
export declare function consumePhasingCharge(actor: any): Promise<boolean>;
/** Reset phasing state at combat end (parallel to Temp-HP cleanup). */
export declare function clearPhasingOnCombatEnd(actor: any, combat?: any): Promise<void>;
/** Convenience: clear phasing state on every combatant. */
export declare function clearPhasingForCombat(combat: any): Promise<void>;
/**
 * Prompt the owner of `target` whether to consume a phasing charge for the
 * incoming hit. Returns `true` iff the user accepted (or auto-accept is on).
 * In headless environments (no `Dialog` global, tests, GM-driven NPCs without
 * owners) this is a silent no-op (returns `false`) unless the client-side
 * setting `phasingAutoConsume === 'always'` is active for the GM.
 */
export declare function promptPhasingConsume(target: any, context?: {
    attacker?: any;
    rawDamage?: number;
}): Promise<boolean>;
/**
 * Reaction entrypoint for **Ghost Slip** — the reaction-tier phasing power.
 * Grants one charge tied to the triggering attack and immediately decrements
 * it (reaction-style: fire and consume in the same step). The caller
 * (reaction flow / stone-powers-flow hook) is responsible for gating this
 * on the "1 reaction per round" limit.
 *
 * Returns `true` when the hit is successfully phased. Safe to call from a
 * non-combat state (charges are scoped to the current combat id, or an empty
 * string if no combat).
 */
export declare function triggerGhostSlipReaction(actor: any, combat: any, effectId?: string): Promise<boolean>;
/**
 * Register the client-side setting for phasing prompt behaviour. Call from
 * `module.ts` during the `init` hook alongside the existing status-effect
 * registration.
 */
export declare function registerPhasingSettings(): void;
//# sourceMappingURL=phasing.d.ts.map
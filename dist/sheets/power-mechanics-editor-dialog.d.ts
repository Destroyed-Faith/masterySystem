/**
 * Power Mechanics Editor Dialog
 *
 * Lets the user view and edit the structured `PowerMechanics` block of an
 * embedded power item at runtime inside Foundry. Exposes two scopes:
 *   - Power-level default (`system.mechanics`) — used when a rank has no
 *     rank-specific block.
 *   - Per-rank override (`system.levels.<rank>.mechanics`) — per-rank data.
 *
 * Intentionally dual-mode: a guided form for the common fields (armor,
 * evade, saveDice, rollDice, damageRider, healing, modifySpecial,
 * grantNextHitEffect, applyWhen, duration, usageLimit,
 * condition, conditionExpr, trigger, tempHP, regen, initiativeD8, movementBonus, ignoreTerrain) plus
 * a JSON textarea for everything the form does not cover (manual override).
 *
 * Saves via `actor.items.get(powerId).update({ ... })`, so the actor's
 * `prepareDerivedData` re-runs and the aggregator picks up changes live.
 */
interface OpenOptions {
    /** The actor that owns the embedded power item (character or npc). */
    actor: any;
    /** The embedded power Item (actor.items.get(powerId)). */
    power: any;
}
export declare function openPowerMechanicsEditor({ actor, power }: OpenOptions): Promise<void>;
export {};
//# sourceMappingURL=power-mechanics-editor-dialog.d.ts.map
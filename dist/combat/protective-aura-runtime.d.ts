/**
 * Protective Auras (Core v0.9.9.6): Active Buff: Armor Aura, Evade Aura and
 * Spell Resistance Aura. Self-centered, moves with the caster, affects the
 * caster and every ally inside the radius, never enemies.
 *
 * No stacking: a creature gets only the highest Active Buff bonus to the same
 * value — its own Active Buff or any Protective Aura it is inside. Live query:
 * nothing is written onto the affected actor, so leaving the radius removes
 * the bonus immediately.
 */
export declare const PROTECTIVE_AURA_TEMPLATE_IDS: readonly ["ab-armor-aura", "ab-evade-aura", "ab-spell-resistance-aura"];
export type ProtectiveAuraStat = 'armor' | 'evade' | 'spellResistance';
/** Printed bonus for PL 1–16 (identical for all three Auras). */
export declare const PROTECTIVE_AURA_BONUS: readonly [1, 3, 5, 7, 9, 11, 13, 15, 15, 17, 19, 21, 23, 25, 27, 29];
export declare function isProtectiveAuraTemplateId(id: string | null | undefined): boolean;
export declare function protectiveAuraBonus(pl: number): number;
/** Radius 2 m at PL 1–8, 3 m at PL 9–16. */
export declare function protectiveAuraRadiusM(pl: number): number;
export interface ProtectiveAuraState {
    stat: ProtectiveAuraStat;
    value: number;
    radiusM: number;
}
/** Protective Auras currently maintained by `owner`. */
export declare function maintainedProtectiveAuras(owner: any): ProtectiveAuraState[];
/** Same non-neutral disposition side (Summons included). */
export declare function isProtectiveAuraAlly(owner: any, other: any): boolean;
/** Highest Protective Aura bonus to `stat` that `actor` currently stands in (0 if none). */
export declare function bestProtectiveAuraBonus(actor: any, stat: ProtectiveAuraStat): number;
/**
 * Extra bonus on top of the creature's own Active Buff value so the Active
 * Buff part equals max(own Buff, every Protective Aura in range).
 */
export declare function protectiveAuraDelta(actor: any, stat: ProtectiveAuraStat, ownActiveBuffValue: number): number;
//# sourceMappingURL=protective-aura-runtime.d.ts.map
/**
 * Spell Casting TN — DF Players Guide 2026-10-23.
 * Spell Base TN = used Power Level × 4 (not caster MR).
 * Final Spell TN = Base + effective SR + 4 × Paid Combat Raises.
 */
export declare function spellBaseTnFromPowerLevel(powerLevel: number): number;
/** effective SR = max(0, printed SR − piercing). */
export declare function effectiveSpellResistance(printedSr: number, piercing?: number): number;
/** Passive Spell Resistance Piercing = ceil(Passive PL / 2) when eligible. */
export declare function spellResistancePiercingFromPassivePl(passivePl: number): number;
export declare function finalSpellTn(opts: {
    powerLevel: number;
    spellResistance?: number;
    piercing?: number;
    paidCombatRaises?: number;
}): number;
/** Creation TN for placed / persistent zones. */
export declare function zoneCreationTn(powerLevel: number, paidRaises: number): number;
export declare const LEGAL_CASTING_ATTRIBUTES: readonly ["intellect", "resolve", "influence"];
export type CastingAttributeName = (typeof LEGAL_CASTING_ATTRIBUTES)[number];
export declare function isLegalCastingAttribute(value: string | null | undefined): value is CastingAttributeName;
//# sourceMappingURL=spell-tn.d.ts.map
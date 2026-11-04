/**
 * Persistent Zone entry on token movement (Z06 B).
 * Applies printed Specials with no Casting / Spell Resistance rolls.
 */
/**
 * When a creature moves into one or more Persistent Zones, apply each zone's
 * Special at most once per combat Round (zone source × creature × round).
 */
export declare function applyStoredSpellZonesOnEnter(creature: any, tokenDoc: any, combat: any): Promise<void>;
//# sourceMappingURL=spell-zone-entry.d.ts.map
/**
 * Combat Senses — canonical registry (Players Guide Combat Senses chapter).
 *
 * Senses define what information a character may access, not automatic success.
 * Perception rolls still apply when uncertainty matters.
 */
export type CombatSenseId = 'normalCombatAwareness' | 'darkvision' | 'lifeSense' | 'mageSense' | 'tremorSense' | 'sonarSense' | 'predatorSense';
export interface CombatSenseDefinition {
    id: CombatSenseId;
    label: string;
    rangeM: number;
    primaryChannels: string[];
    /** Darkvision augments Normal Combat Awareness; not a full Sense Slot pick. */
    isMinorUpgrade?: boolean;
    /** Human-readable summary for sheet tooltips. */
    summary: string;
}
export declare const COMBAT_SENSES: Record<CombatSenseId, CombatSenseDefinition>;
/** Sense Slot options (special senses only — not Normal or Darkvision). */
export declare const SENSE_SLOT_SPECIAL_IDS: CombatSenseId[];
export declare function parseCombatSenseLabel(raw: string | null | undefined): CombatSenseId | null;
export declare function combatSenseDef(id: CombatSenseId): CombatSenseDefinition;
export declare function isSpecialCombatSense(id: CombatSenseId): boolean;
/** Standard skill-check TN for a creature's Mastery Rank (MR × 8). */
export declare function skillCheckTnByMasteryRank(masteryRank: number): number;
//# sourceMappingURL=combat-senses.d.ts.map
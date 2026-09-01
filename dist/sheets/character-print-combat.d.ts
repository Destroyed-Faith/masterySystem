/**
 * Combat roll previews for the printable character sheet (Battle Cheat page).
 * Compact cheat lines only — no long effect fluff.
 */
import type { ArtifactLevelProgressionRow } from '../types/item.js';
export interface PrintCombatPreview {
    attackKind?: string;
    attackLabel: string;
    attackValue: number;
    rollKind: 'damage' | 'heal' | null;
    damage: string;
    footnote?: string;
    showDamage: boolean;
    showAttack: boolean;
}
export type BattlePrintSlot = 'active' | 'activeBuff' | 'reaction';
export declare function isSpellPowerSys(sys: any): boolean;
/** Short label for printable sheets (Spell badge tooltip). */
export declare function buildSpellPrintMeta(sys: any): {
    isSpell: boolean;
    spellLabel?: string;
};
export declare function buildArtifactRowSpellPrintMeta(row: {
    isSpell?: boolean;
    castingAttribute?: string;
    spellResolution?: string;
}): {
    isSpell: boolean;
    spellLabel?: string;
};
/**
 * Prepared set / equipped weapons available for Basic Attack, split by kind.
 * A ranged set weapon appears here even when the character has no Ranged
 * Single Attack power (that weapon is then Basic Attack only).
 */
export declare function listPreparedWeaponsByAttackType(actor: any, items: any[]): {
    melee: any | null;
    ranged: any | null;
};
/** Compact Basic Attack damage lines: one per prepared weapon kind. */
export declare function buildBasicAttackCompactDamageLines(actor: any, items: any[], mrBonusFormula: string): string[];
/**
 * Build compact battle-sheet lines for a power item.
 */
export declare function buildPrintCombatPreview(actor: any, powerItem: any, items: any[], slot?: BattlePrintSlot): PrintCombatPreview | null;
/** Battle preview for artifact level-progression rows flagged as Spells. */
export declare function buildPrintCombatPreviewForArtifactRow(actor: any, row: ArtifactLevelProgressionRow, items: any[], slot?: BattlePrintSlot): PrintCombatPreview | null;
//# sourceMappingURL=character-print-combat.d.ts.map
/**
 * Combat roll previews for the printable character sheet (Battle Cheat page).
 * Compact cheat lines only — no long effect fluff.
 */
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
/**
 * Build compact battle-sheet lines for a power item.
 */
export declare function buildPrintCombatPreview(actor: any, powerItem: any, items: any[], slot?: BattlePrintSlot): PrintCombatPreview | null;
//# sourceMappingURL=character-print-combat.d.ts.map
/**
 * Combat roll previews for the printable character sheet (Battle Cheat page).
 * Mirrors in-game attack attribute + damage resolution without rolling dice.
 */
export interface PrintCombatPreview {
    attackLabel: string;
    attackValue: number;
    damage: string;
    showDamage: boolean;
}
/**
 * Build attack + damage preview for a power item on the printable Battle Sheet.
 * Returns null when the power does not use an attack roll.
 */
export declare function buildPrintCombatPreview(actor: any, powerItem: any, items: any[]): PrintCombatPreview | null;
//# sourceMappingURL=character-print-combat.d.ts.map
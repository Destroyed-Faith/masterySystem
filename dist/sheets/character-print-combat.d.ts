/**
 * Combat roll previews for the printable character sheet (Battle Cheat page).
 * Mirrors in-game attack attribute + damage resolution without rolling dice.
 */
export interface PrintCombatPreview {
    attackLabel: string;
    attackValue: number;
    damage: string;
    showDamage: boolean;
    showAttack: boolean;
}
export type BattlePrintSlot = 'active' | 'activeBuff' | 'reaction';
/**
 * Build attack + damage preview for a power item on the printable Battle Sheet.
 * `slot` controls whether Attack / weapon damage apply (buffs = effect + power dice only).
 */
export declare function buildPrintCombatPreview(actor: any, powerItem: any, items: any[], slot?: BattlePrintSlot): PrintCombatPreview | null;
//# sourceMappingURL=character-print-combat.d.ts.map
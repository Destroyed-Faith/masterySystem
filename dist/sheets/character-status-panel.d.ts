/**
 * Player-sheet status list: combat specials plus leftover Temp HP.
 */
export type CharacterStatusKind = 'special' | 'tempHP';
export interface CharacterStatusRow {
    kind: CharacterStatusKind;
    index: number;
    id: string;
    name: string;
    value: number | null;
    hasValue: boolean;
    canReduce: boolean;
}
export declare function buildCharacterStatusRows(actor: Actor | null | undefined): CharacterStatusRow[];
export declare function removeCharacterStatusRow(actor: Actor, row: CharacterStatusRow): Promise<void>;
export declare function reduceCharacterStatusRow(actor: Actor, row: CharacterStatusRow, steps: number): Promise<void>;
//# sourceMappingURL=character-status-panel.d.ts.map
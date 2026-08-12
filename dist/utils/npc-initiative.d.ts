/**
 * NPC / Summon initiative flat modifier from the sheet combat block.
 * Applied on top of Mastery Rank d8 at combat start (no Combat Reflexes).
 */
export declare function clampNpcInitiativeModifier(raw: unknown): number;
/** Split a stored net modifier into UI malus (≤0) / bonus (≥0) selects. */
export declare function splitNpcInitiativeModifier(raw: unknown): {
    malus: number;
    bonus: number;
    net: number;
};
export declare function formatNpcInitiativeSigned(net: number): string;
/** Active-phase (or root) initiative modifier for an NPC/summon actor. */
export declare function getNpcInitiativeModifier(actor: any): number;
//# sourceMappingURL=npc-initiative.d.ts.map
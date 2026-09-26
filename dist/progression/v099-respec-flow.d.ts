/**
 * Pure rules for the two-step v0.9.9 migration dialog:
 * starting package gate, Final +/- spending, and per-slot Stone placement.
 */
import { type AttributeKeyName } from './v099-rules.js';
export interface StartingPackageStatus {
    fours: number;
    threes: number;
    twos: number;
    valid: boolean;
    summary: string;
}
/** Live check for the Starting column. Exactly two 4s, two 3s, three 2s. */
export declare function describeStartingPackage(values: Record<string, number>): StartingPackageStatus;
export interface FinalAdjustRow {
    key: AttributeKeyName;
    value: number;
    canIncrease: boolean;
    canDecrease: boolean;
    increaseCost: number;
}
export interface FinalAdjust {
    spent: number;
    remaining: number;
    overBudget: boolean;
    rows: FinalAdjustRow[];
}
/** What + and − may do on Final after Starting has been applied. */
export declare function planFinalAttributes(starting: Record<string, number>, finalValues: Record<string, number>, budget: number): FinalAdjust;
export type StoneSlotChoice = string | null;
/** Unlocked migration slots: two Start boxes, then one box per 20 Lifetime XP. */
export declare function migrationStoneSlotCount(lifetimeXp: number): number;
export declare function migrationStoneSlotLabel(index: number): string;
export declare function emptyStoneSlotOrder(lifetimeXp: number): StoneSlotChoice[];
export interface StoneSlotProgress {
    assignments: Record<AttributeKeyName, number>;
    colorless: number;
    filled: number;
    openIndexes: number[];
}
export declare function isColorlessSlot(choice: string | null | undefined): boolean;
export declare function stoneSlotProgress(order: readonly (string | null)[]): StoneSlotProgress;
export interface StoneSlotTally {
    ok: boolean;
    reason?: string;
    assignments: Record<AttributeKeyName, number>;
    colorless: number;
}
/** A finished slot list: every box filled, Colorless boxes in pairs. */
export declare function tallyStoneSlotOrder(order: readonly (string | null)[]): StoneSlotTally;
export interface StonePlacementOptions {
    attributes: AttributeKeyName[];
    colorless: boolean;
    colorlessReason: string;
}
export declare function stonePlacementOptions(order: readonly (string | null)[], storedRank?: number, lifetimeXp?: number | null): StonePlacementOptions;
/** Slot list for an actor. A stored order wins; otherwise the current sheet order. */
export declare function stoneOrderForActor(system: any, lifetimeXp: number): (string | null)[];
/** Actor update that keeps assignments, pools and the clicked slot order together. */
export declare function stoneOrderActorUpdate(system: any, order: readonly (string | null)[]): Record<string, unknown>;
/** Drop one box. A Permanent Colorless pair drops both boxes. */
export declare function releaseStoneSlot(order: readonly (string | null)[], index: number): (string | null)[];
/** Every earned box becomes empty again. Lifetime XP is untouched. */
export declare function releaseAllStoneSlots(order: readonly (string | null)[]): (string | null)[];
/**
 * GM unblock: Attribute pools and Permanent Colorless return to Ready.
 * Assignment is unchanged. Exhausted, Sustained, Sealed and Burned are cleared.
 */
export declare function unblockStonePoolsUpdate(system: any): Record<string, unknown>;
export declare function slotAbbrev(choice: string | null): string;
//# sourceMappingURL=v099-respec-flow.d.ts.map
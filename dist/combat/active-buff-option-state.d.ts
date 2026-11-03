/**
 * Which Active Buff button is the one currently maintained, and which of
 * those was chosen in this Preparation. Artifact buffs store artifactBuffKey
 * instead of powerId, and empowerment can raise the shown Power Level above
 * the listed row.
 */
export interface ActiveBuffOptionRef {
    id: string;
    name: string;
    level: number;
}
export interface ActiveBuffOptionMarks {
    isActive: boolean;
    chosenThisRound: boolean;
}
export declare function activeBuffOptionMarks(option: ActiveBuffOptionRef, maintained: any | null | undefined, round: number, options: readonly ActiveBuffOptionRef[]): ActiveBuffOptionMarks;
//# sourceMappingURL=active-buff-option-state.d.ts.map
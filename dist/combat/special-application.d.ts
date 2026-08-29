/**
 * Diminishing Special application limit and Natural Special Recovery.
 *
 * Application limit: a creature may receive at most 4 × Mastery Rank *new*
 * points of the same Diminishing Special during one combat Round. Existing
 * stacks from earlier Rounds do not count. Excess is ignored (not a max
 * stack). Tracking is internal — overflow is announced on the applying chat
 * message, not as a sheet counter.
 *
 * Natural Recovery: after Ticks at the start of the creature's Turn, the
 * creature chooses *one* negative Diminishing Special and reduces it by
 * Mastery Rank (minimum 0). Unused reduction is lost and cannot move to
 * another Special. A stored Stone Powers plan still applies at turn start;
 * otherwise the HUD applies the choice. A Special that reaches 0 ends.
 */
export declare const SPECIAL_ROUND_APPS_FLAG = "specialRoundApps";
export declare const NATURAL_RECOVERY_FLAG = "naturalSpecialRecovery";
export declare const SPECIAL_APPLICATION_LIMIT_PER_MR = 4;
export interface SpecialRoundApps {
    combatId: string;
    round: number;
    counts: Record<string, number>;
}
export interface ApplicationClamp {
    applied: number;
    ignored: number;
    limit: number;
    usedThisRound: number;
}
export declare function actorMasteryRank(actor: any): number;
export declare function specialApplicationLimit(masteryRank: number): number;
export declare function isDiminishingSpecialId(id: string | undefined | null): boolean;
/** Regeneration is diminishing but beneficial — Natural Recovery never targets it. */
export declare function isNegativeDiminishingSpecialId(id: string | undefined | null): boolean;
/**
 * HUD tokens: catalog negative diminishing, plus unknown valued stacks
 * that are not a known timed / until-used / positive effect.
 */
export declare function isHudTokenSpecialId(id: string | undefined | null, name?: string | null): boolean;
export interface HudDiminishingSpecial {
    id: string;
    value: number;
    label: string;
}
/** Negative diminishing Specials with a live stack — the HUD token source. */
export declare function listHudDiminishingSpecials(actor: any): HudDiminishingSpecial[];
export declare function specialDisplayName(id: string): string;
export declare function emptySpecialRoundApps(combat?: {
    id?: string;
    round?: number;
} | null): SpecialRoundApps;
export declare function readSpecialRoundApps(actor: any): SpecialRoundApps | null;
/** Reset counts when the combat or Round changes. */
export declare function syncSpecialRoundApps(stored: SpecialRoundApps | null, combat: {
    id?: string;
    round?: number;
} | null | undefined): SpecialRoundApps;
export declare function remainingSpecialApplication(apps: SpecialRoundApps, specialId: string, limit: number): number;
export declare function addSpecialApplication(apps: SpecialRoundApps, specialId: string, amount: number): SpecialRoundApps;
/**
 * How many of `requested` new points may land this Round.
 * Out of combat, or for non-diminishing Specials, the full request lands.
 */
export declare function clampSpecialApplication(actor: any, specialId: string | undefined, requested: number, combat?: {
    id?: string;
    round?: number;
} | null, priorApps?: SpecialRoundApps | null): ApplicationClamp & {
    nextApps: SpecialRoundApps | null;
};
export declare function formatApplicationLimitNote(specialId: string, ignored: number, limit: number, masteryRank: number): string;
export declare function formatNaturalRecoveryNote(specialId: string, before: number, after: number, reducedBy: number): string;
export declare function pickNaturalRecoveryTarget(entries: Array<{
    id: string;
    value: number;
}>): {
    id: string;
    value: number;
} | null;
export declare function applyNaturalRecoveryToValue(value: number, amount: number): {
    after: number;
    reduced: number;
};
export interface NaturalRecoveryStep {
    id: string;
    before: number;
    after: number;
    reduced: number;
}
/** Spend the full MR on one Special (highest stack). Leftover is lost. */
export declare function greedyNaturalRecoveryPlan(entries: Array<{
    id: string;
    value: number;
}>, masteryRank: number): NaturalRecoveryStep[];
export declare function clampNaturalRecoveryAllocations(entries: Array<{
    id: string;
    value: number;
}>, allocations: Record<string, number> | null | undefined, masteryRank: number): Record<string, number>;
export declare function planFromAllocations(entries: Array<{
    id: string;
    value: number;
}>, allocations: Record<string, number>, masteryRank: number): NaturalRecoveryStep[];
export declare function specialRoundAppsUpdate(state: SpecialRoundApps | null): Record<string, unknown>;
export interface NaturalRecoveryChoice {
    combatId: string;
    round: number;
    /** True once the player assigned a split or explicitly skipped. */
    chosen: boolean;
    allocations: Record<string, number>;
}
export interface NaturalRecoveryOption {
    id: string;
    value: number;
    label: string;
    allocated: number;
    canAdd: boolean;
    canRemove: boolean;
}
export declare function emptyNaturalRecoveryChoice(combat?: {
    id?: string;
    round?: number;
} | null): NaturalRecoveryChoice;
export declare function readNaturalRecoveryChoice(actor: any): NaturalRecoveryChoice | null;
export declare function matchingNaturalRecoveryChoice(actor: any, combat?: {
    id?: string;
    round?: number;
} | null): NaturalRecoveryChoice | null;
export declare function naturalRecoveryAllocatedTotal(allocations: Record<string, number> | null | undefined): number;
export declare function listNaturalRecoveryOptions(actor: any, combat?: {
    id?: string;
    round?: number;
} | null): NaturalRecoveryOption[];
export declare function setNaturalRecoveryAllocations(actor: any, combat: {
    id?: string;
    round?: number;
} | null | undefined, allocations: Record<string, number>, chosen?: boolean): Promise<void>;
export declare function setNaturalRecoverySkipped(actor: any, combat: {
    id?: string;
    round?: number;
} | null | undefined): Promise<void>;
export declare function changeNaturalRecoveryAllocation(actor: any, combat: {
    id?: string;
    round?: number;
} | null | undefined, specialId: string, delta: number): Promise<void>;
/**
 * A stored Stone Powers plan (or skip) wins for this Round. With no plan the
 * HUD applies one Special after Ticks — the tick engine does not auto-spend.
 */
export declare function resolveNaturalRecoveryPlan(actor: any, entries: Array<{
    id: string;
    value: number;
}>, combat: {
    id?: string;
    round?: number;
} | null | undefined, masteryRank: number): NaturalRecoveryStep[];
export declare function isCurrentCombatantActor(actor: any, combat?: {
    combatant?: {
        actor?: unknown;
    } | null;
} | null): boolean;
export declare function isNaturalRecoveryUsed(actor: any, combat?: {
    id?: string;
    round?: number;
} | null): boolean;
export declare function isNaturalRecoveryAvailable(actor: any, combat?: {
    id?: string;
    round?: number;
    combatant?: {
        actor?: unknown;
    } | null;
    started?: boolean;
} | null): boolean;
export interface NaturalRecoveryApplyResult {
    ok: boolean;
    reason?: string;
    id?: string;
    name?: string;
    before?: number;
    after?: number;
    reduced?: number;
}
/**
 * Apply Natural Special Recovery to exactly one Special (full Mastery Rank).
 * Writes `system.statusEffects` and marks the turn as used.
 */
export declare function applyNaturalSpecialRecovery(actor: any, specialId: string, combat?: {
    id?: string;
    round?: number;
    combatant?: {
        actor?: unknown;
    } | null;
    started?: boolean;
} | null): Promise<NaturalRecoveryApplyResult>;
export declare function formatNaturalRecoveryChat(result: NaturalRecoveryApplyResult): string;
//# sourceMappingURL=special-application.d.ts.map
/**
 * Diminishing Special application helpers and Natural Special Recovery.
 *
 * The former global Round cap (4 × target Mastery Rank of newly applied
 * Diminishing Special points) is retired. Legitimate applications are no longer
 * clamped by that limit. Zone/Aura once-per-source / target / Round tracking
 * lives elsewhere (`spell-zones`, aura pulse) and is unchanged.
 *
 * Natural Recovery: after Ticks at the start of the creature's Turn, the
 * creature distributes Mastery Rank reduction across negative Diminishing
 * Specials (Stone Powers dialog: draft with +/−, then Apply, or Skip).
 * Unused reduction is lost. A confirmed Stone Powers plan applies at turn
 * start; otherwise the HUD can apply a single-Special choice. A Special that
 * reaches 0 ends.
 */
/** @deprecated Legacy actor flag; no longer written by application. Kept for read/sync compatibility. */
export declare const SPECIAL_ROUND_APPS_FLAG = "specialRoundApps";
export declare const NATURAL_RECOVERY_FLAG = "naturalSpecialRecovery";
/** @deprecated Global 4×MR Round application cap removed (C06 / rules 2026-11-04). */
export declare const SPECIAL_APPLICATION_LIMIT_PER_MR = 0;
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
/**
 * @deprecated Global per-Round Diminishing Special application cap removed.
 * Always returns 0 (no limit). Callers must not clamp applications by this value.
 */
export declare function specialApplicationLimit(_masteryRank: number): number;
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
 * Passthrough for requested Special points. The retired global 4×MR Round cap
 * no longer ignores excess. `priorApps` / round bookkeeping are unused.
 */
export declare function clampSpecialApplication(_actor: any, specialId: string | undefined, requested: number, _combat?: {
    id?: string;
    round?: number;
} | null, priorApps?: SpecialRoundApps | null): ApplicationClamp & {
    nextApps: SpecialRoundApps | null;
};
/** @deprecated Global application-limit notes are no longer produced. */
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
    /**
     * Player character with exactly one eligible Special: plan was filled
     * automatically (no click). Kept visible in UI / chat.
     */
    autoSingle?: boolean;
}
export interface AutoNaturalRecoveryResult {
    applied: boolean;
    autoSingle: boolean;
    specialId?: string;
    label?: string;
    reduced?: number;
    valueBefore?: number;
    actorName?: string;
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
/**
 * Player characters only: if exactly one negative Diminishing Special is up,
 * auto-spend the full Mastery Rank on it (no click). Does not override an
 * explicit skip or a player-made multi-split. NPCs are ignored.
 */
export declare function ensureAutoNaturalRecoveryForSingleEffect(actor: any, combat: {
    id?: string;
    round?: number;
} | null | undefined): Promise<AutoNaturalRecoveryResult>;
/** Auto-fill single-effect Natural Recovery for every PC in the combat. */
export declare function ensureAutoNaturalRecoveryForAllPlayerCharacters(combat: {
    id?: string;
    round?: number;
    combatants?: any;
} | null | undefined): Promise<AutoNaturalRecoveryResult[]>;
/** Chat lines for the stored Natural Recovery plan this Round. */
export declare function formatNaturalRecoveryReceiptLines(actor: any, combat?: {
    id?: string;
    round?: number;
} | null): string[];
export declare function setNaturalRecoverySkipped(actor: any, combat: {
    id?: string;
    round?: number;
} | null | undefined): Promise<void>;
export declare function changeNaturalRecoveryAllocation(actor: any, combat: {
    id?: string;
    round?: number;
} | null | undefined, specialId: string, delta: number): Promise<void>;
/** Lock the current Natural Recovery draft so it applies after Ticks. */
export declare function confirmNaturalRecoveryAllocations(actor: any, combat: {
    id?: string;
    round?: number;
} | null | undefined): Promise<boolean>;
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
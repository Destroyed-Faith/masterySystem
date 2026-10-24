/**
 * Combat resolution for Stone Abilities that outlive the Preparation click:
 * Reaction Denial, Movement Reduction, Not a Target, Maximization.
 */
export declare const REACTION_DENIAL_FLAG = "reactionDenial";
export declare const MOVEMENT_REDUCTION_FLAG = "movementReduction";
export declare const NOT_A_TARGET_FLAG = "notATarget";
/** Flag key kept as damageMaximization for saved character compatibility (R-02). */
export declare const DAMAGE_MAX_FLAG = "damageMaximization";
export declare const MAXIMIZATION_FLAG = "damageMaximization";
export declare const ABSORPTION_PENDING_FLAG = "absorptionPendingStones";
export declare const ABSORPTION_READY_FLAG = "absorptionReadyStones";
export interface ReactionDenialState {
    remaining: number;
    combatId: string;
    round: number;
    denied: Array<{
        reactionId: string;
        triggerId: string;
    }>;
}
export interface MovementReductionState {
    combatId: string;
    round: number;
}
export interface NotATargetState {
    enemyIds: string[];
    usedIds: string[];
    combatId: string;
    round: number;
}
/** Half a metre rounds up: 5 → 3, 7 → 4, 9 → 5. */
export declare function halveMovementMeters(meters: number): number;
/** Every d8 in a damage/healing formula becomes 8. Flat bonuses stay. Forced 8s do not explode. */
export declare function maximizeDamageFormula(formula: string): string;
/** Alias — Maximization applies to Damage Rolls and Healing Rolls (R-02). */
export declare const maximizeDiceFormula: typeof maximizeDamageFormula;
export declare function getMaximizationRemaining(actor: any): number;
export declare function sameCombatRound(state: {
    combatId?: string;
    round?: number;
} | null | undefined, combatId: string, round: number): boolean;
export declare function reactionDenialDecision(state: ReactionDenialState | null | undefined, attempt: {
    reactionId: string;
    triggerId: string;
    combatId: string;
    round: number;
}): {
    allow: boolean;
    next: ReactionDenialState | null;
    reason?: string;
};
export declare function notATargetDecision(state: NotATargetState | null | undefined, attackerId: string, otherValidTargets: number, combatId: string, round: number): {
    block: boolean;
    next: NotATargetState | null;
    reason?: string;
};
export declare function readReactionDenial(actor: any): ReactionDenialState | null;
export declare function denyReactionIfMarked(actor: any, attempt?: {
    reactionId?: string;
    triggerId?: string;
}): Promise<{
    denied: boolean;
    reason?: string;
}>;
export declare function movementReductionActive(actor: any): boolean;
export declare function movementMetersAfterStoneEffects(actor: any, meters: number): number;
/** Write the round-scoped flag on the first `count` chosen enemies. Rank 1–4 is that count. */
export declare function markMovementReductionTargets(targets: Array<{
    setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown>;
}>, count: number, combat: {
    id?: string;
    round?: number;
} | null | undefined): Promise<number>;
export type MaximizationSource = 'stone' | 'passive' | 'activeBuff';
/** Remaining stone Maximizations for the current combat. */
export declare function remainingStoneMaximizations(actor: any): number;
export declare function remainingActiveBuffMaximizations(actor: any): number;
/** Total Maximizations (stone + Passive + Active Buff) available for UI enablement. */
export declare function remainingMaximizations(actor: any): number;
export declare function listAvailableMaximizationSources(actor: any): Array<{
    source: MaximizationSource;
    remaining: number;
    label: string;
}>;
/**
 * Spend one Maximization charge from exactly one source.
 * Prefer `preferred` when that source still has charges; else stone then Passive.
 */
export declare function spendMaximization(actor: any, preferred?: MaximizationSource | null): Promise<boolean>;
/**
 * @deprecated Prefer Roll / Roll Maximum buttons + {@link spendMaximization}.
 * Kept for tests and any legacy callers that still expect a confirm dialog.
 */
export declare function offerMaximization(actor: any, kind?: 'damage' | 'healing'): Promise<boolean>;
/** @deprecated Use spendMaximization — kept for callers / Hunter's Scourge. */
export declare function offerDamageMaximization(actor: any): Promise<boolean>;
export declare function chooseCombatantActors(opts: {
    title: string;
    hint: string;
    caster: any;
    max: number;
    maxRangeM?: number;
}): Promise<any[]>;
//# sourceMappingURL=stone-combat-effects.d.ts.map
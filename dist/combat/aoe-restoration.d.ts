/**
 * R-05 AoE Restoration — distribute a shared Safe Haven pool across allies.
 */
export declare const AOE_RESTORATION_CHAT_FLAG = "aoeRestoration";
export interface AoeRestorationTarget {
    tokenId: string;
    actorId: string;
    name: string;
    scarred: number;
}
export interface AoeRestorationPending {
    casterActorId: string;
    powerKey: string;
    powerName: string;
    poolRemaining: number;
    poolMax: number;
    targets: AoeRestorationTarget[];
}
/** Validate allocations: non-negative, ≤ scarred per target, sum ≤ pool. */
export declare function validateAoeRestorationAllocation(pending: AoeRestorationPending, allocation: Record<string, number>): {
    ok: boolean;
    total: number;
    reason?: string;
    cleaned: Record<string, number>;
};
/** Pool points still free given current allocations (optionally ignoring one actor). */
export declare function aoeRestorationPoolLeft(pending: AoeRestorationPending, allocation: Record<string, number>, excludeActorId?: string): number;
/** Max bars this target may still receive without exceeding scarred or remaining pool. */
export declare function aoeRestorationMaxForTarget(pending: AoeRestorationPending, allocation: Record<string, number>, actorId: string): number;
export declare function formatAoeRestorationPromptChat(pending: AoeRestorationPending): string;
export declare function commitAoeRestorationAllocation(caster: any, pending: AoeRestorationPending, allocation: Record<string, number>): Promise<{
    ok: boolean;
    spent: number;
    results: Array<{
        name: string;
        restored: number;
    }>;
    reason?: string;
}>;
export declare function buildAoeRestorationPending(args: {
    caster: any;
    powerItem: any;
    powerName: string;
    targetTokens: any[];
}): AoeRestorationPending | null;
//# sourceMappingURL=aoe-restoration.d.ts.map
/**
 * Pure rules behind the Stone Powers dialog: which stone a click-fill takes,
 * when a wave may be charged, and why a visible pool is unusable. Kept free of
 * Foundry globals so the behaviour can be unit tested.
 */
/** Remove Scar Seals attribute stones. Initiative Boost must not farm Colorless. */
export declare function stonePowerAllowsColorless(powerId: string): boolean;
export declare function stonePowerColorlessRejectMessage(powerId: string): string;
/**
 * Attribute a click-fill should draw the next stone from. Colorless Stones are
 * the last resort: they only get picked when no attribute pool has a free stone
 * left, so a player never burns them while coloured stones are still available.
 */
export declare function pickStoneFillAttribute(attributes: readonly string[], isUsable: (attr: string) => boolean, spendable: (attr: string) => number): string | null;
/**
 * Guard against paying a wave twice. `currentUses === usesInKey` alone is not
 * enough: `stoneUsage` is wiped on turn change and combat start, so a restored
 * snapshot of an already paid wave would line up again and charge empty pools.
 */
export declare function shouldSettleStoneWave(args: {
    reviewMode: boolean;
    paidAccKeys: Iterable<string>;
    accKey: string;
    currentUses: number;
    usesInKey: number;
}): boolean;
/**
 * Card order inside a power row. Every row holds exactly one T2-start power
 * (Tier 1 does not exist). Its first activation costs 2 stones and the
 * unused Anchor lane is omitted. It leads the row so the shorter cluster
 * sits first. The remaining cards keep their order.
 */
export declare function orderPowersRampFirst<T>(powers: readonly T[], skipsFirstTier: (power: T) => boolean): T[];
/**
 * Whether an attribute (or General) section starts expanded in the Stone
 * Powers dialog. Sections with freely spendable stones of that attribute
 * open; empty ones stay collapsed. The player can still toggle them.
 * A stored override (this dialog session) always wins.
 */
export declare function stoneDialogSectionStartsOpen(args: {
    sectionHasSpendable: boolean;
    sectionHasAssigned?: boolean;
    userOverride?: boolean;
}): boolean;
export interface PendingStoneActivation {
    name: string;
    placed: number;
    needed: number;
    missing: number;
}
/**
 * Stones sitting in a power that has not reached the next full wave.
 * Placing them does not turn the power on — Extra Attack and Crit start at
 * 2 stones, so one stone in each looks assigned and does nothing.
 */
export declare function pendingStoneActivation(args: {
    name: string;
    placed: number;
    needed: number;
}): PendingStoneActivation | null;
export declare function pendingStoneActivationLabel(row: PendingStoneActivation): string;
export declare function formatPendingStoneActivationWarning(rows: readonly PendingStoneActivation[]): string;
/** Why a visible pool has nothing to drag right now (empty string = usable). */
export declare function stonePoolBlockedReason(pool: {
    max: number;
    available: number;
    sustained: number;
    artifactBound: number;
}): string;
/**
 * Green card fill after a Stone Power has been charged. Unused cards stay
 * gray. First activation is a thin green edge; each further wave adds 1px,
 * capped at 5px so the compact card still fits.
 */
export declare function stonePowerActivationRing(activationCount: number): {
    activationCount: number;
    activated: boolean;
    ringPx: number;
};
//# sourceMappingURL=stone-payment-rules.d.ts.map
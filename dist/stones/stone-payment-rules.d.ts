/**
 * Pure rules behind the Stone Powers dialog: which stone a click-fill takes,
 * when a wave may be charged, and why a visible pool is unusable. Kept free of
 * Foundry globals so the behaviour can be unit tested.
 */
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
 * Card order inside a power row. Every row holds exactly one ramp power whose
 * Tier 1 is a no-op, so its first activation costs 2 stones and the unused
 * Anchor lane is omitted (the card starts at the Mid / 2-stone segment). It
 * leads the row so the shorter cluster sits in one corner. The remaining
 * cards keep their order.
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
/** Why a visible pool has nothing to drag right now (empty string = usable). */
export declare function stonePoolBlockedReason(pool: {
    max: number;
    available: number;
    sustained: number;
    artifactBound: number;
}): string;
//# sourceMappingURL=stone-payment-rules.d.ts.map
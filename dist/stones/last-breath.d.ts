/**
 * Last Breath — once per Safe Haven Rest, burn 1 Stone to stay up
 * with 1 box in the Wounded bar when you would drop to Incapacitated.
 */
export declare const LAST_BREATH_FLAG = "lastBreathUsed";
export declare function lastBreathUsedThisRest(actor: {
    getFlag?: (scope: string, key: string) => unknown;
}): boolean;
export declare function actorHasReadyStone(actor: any): boolean;
export declare function canUseLastBreath(actor: any): boolean;
export declare function wouldDropToIncapacitated(bars: Array<{
    name?: string;
    current?: number;
}>): boolean;
/** Mutate bars in place: 1 box in Wounded, later bars restored. Returns wounded index. */
export declare function applyLastBreathBars(bars: Array<{
    name?: string;
    current?: number;
    max?: number;
}>): number;
/**
 * If this hit would drop the actor to Incapacitated, offer Last Breath.
 * Mutates `bars` when accepted. Returns the Wounded bar index, or null.
 */
export declare function maybeApplyLastBreath(actor: any, bars: Array<{
    name?: string;
    current?: number;
    max?: number;
}>): Promise<number | null>;
export declare function clearLastBreathOnRest(actor: {
    getFlag?: (scope: string, key: string) => unknown;
    unsetFlag?: (scope: string, key: string) => Promise<unknown>;
}): Promise<void>;
//# sourceMappingURL=last-breath.d.ts.map
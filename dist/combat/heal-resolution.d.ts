/**
 * Combat Heal Actives — ally targeting, no attack roll, no Reactions.
 * Rolls `mechanics.healing.flat`, applies to the current Health Bar, then
 * optionally offers Scarred / Health Level Recovery in chat.
 */
export declare const HEAL_CHAT_FLAG = "healResolution";
/** Catalog Health Level Recovery band (heal Actives; 0 below L4). */
export declare function healHealthLevelRecoveryForRank(rank: number): number;
export declare function powerItemRank(item: any): number;
/** True for catalog heal Actives / Health Level Heal (not Cleanse/Dispel). */
export declare function isHealPowerItem(item: any): boolean;
export declare function isHealRadialOption(option: {
    item?: any;
    source?: string;
} | null | undefined): boolean;
/** Dice formula from mechanics, e.g. "4d8", or null for Health-Level-only heals. */
export declare function getHealDiceFormula(item: any): string | null;
export declare function getHealAoETargetMode(item: any): 'target' | 'aoe' | 'self';
export interface HealTargetResult {
    tokenId: string;
    actorId: string;
    name: string;
    rolled: number;
    afterBlight: number;
    restored: number;
    blight: number;
    scarredBefore: number;
}
export declare function formatHealResultChat(args: {
    sourceName: string;
    powerName: string;
    results: HealTargetResult[];
    formula: string | null;
}): string;
export declare function formatScarredPromptChat(args: {
    healerName: string;
    targetName: string;
    targetActorId: string;
    maxBars: number;
    scarred: number;
}): string;
/**
 * Resolve heal on one or more token targets (already chosen). No attack roll.
 */
export declare function resolveHealOnTokens(args: {
    casterToken: any;
    powerItem: any;
    powerName: string;
    targetTokens: any[];
}): Promise<HealTargetResult[]>;
/** Register chat button handlers for Scarred recovery prompts. */
export declare function registerHealChatHandlers(): void;
//# sourceMappingURL=heal-resolution.d.ts.map
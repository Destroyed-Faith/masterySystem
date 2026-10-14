/**
 * Combat Heal Actives — ally targeting, no attack roll, no Reactions.
 *
 * Always interactive in chat (never silent auto-roll):
 *   1) If the Power has an HLR pool and the target is Scarred: buttons 0…N
 *      (N > remaining are shown but disabled/gray until Safe Haven Rest)
 *   2) On click: recover Scarred (if chosen), then roll heal dice visibly,
 *      then apply HP into open (non-Scarred) Health Levels
 */
import type { RadialCombatOption } from '../radial-menu/types.js';
export declare const HEAL_CHAT_FLAG = "healResolution";
/** Caster flag: `{ [powerKey]: spentLevels }` since last Safe Haven Rest. */
export declare const HLR_SPENT_FLAG = "healthLevelRecoverySpent";
/** Catalog Health Level Recovery band (heal Actives; 0 below L4, max 4 at L15–16). */
export declare function healHealthLevelRecoveryForRank(rank: number): number;
export declare function powerItemRank(item: any): number;
/** Stable key for this Power's HLR pool on the caster. */
export declare function healPowerHlrKey(powerItem: any): string;
export declare function getHlrSpentOnCaster(caster: any, powerKey: string): number;
export declare function getHlrRemainingOnCaster(caster: any, powerItem: any): number;
export declare function spendHlrOnCaster(caster: any, powerKey: string, amount: number): Promise<number>;
export declare function clearHlrSpentOnCaster(caster: any): Promise<void>;
/** Catalog / artifact template ids that deliver heal (incl. heal+cleanse mixed). */
export declare function isHealTemplateId(templateId: string | null | undefined): boolean;
/** True for catalog heal Actives / Health Level Heal (not Cleanse/Dispel-only). */
export declare function isHealPowerItem(item: any): boolean;
/**
 * True for radial options that should use green ally heal targeting.
 * Covers real power items and artifact rows (Moonlight Mending, …) where
 * `option.item` is the artifact document, not a power.
 */
export declare function isHealRadialOption(option: {
    item?: any;
    source?: string;
    aoePlacementProfile?: string;
    artifactPowerTemplateId?: string;
    name?: string;
    description?: string;
    artifactRowSpecial?: string;
} | null | undefined): boolean;
/**
 * Resolve a power-shaped item for heal dice / HLR — real power, or a synthetic
 * catalog snapshot from an artifact progression row (templateId + stage rank).
 */
export declare function healPowerItemFromRadialOption(option: RadialCombatOption | null | undefined): any | null;
/** Dice formula from mechanics, e.g. "4d8", or null for Health-Level-only heals. */
export declare function getHealDiceFormula(item: any): string | null;
export declare function getHealAoETargetMode(item: any): 'target' | 'aoe' | 'self';
/**
 * Apply rolled HP across open Health Levels (current > 0), most severe first.
 * Scarred bars (0 HP) are never filled by heal dice — only by Health Level Recovery.
 */
export declare function applyHealHpAcrossOpenBars(health: {
    bars?: any[];
    currentBar?: number;
}, rolled: number): {
    bars: any[];
    currentBar: number;
    restored: number;
};
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
    scarredRecovered?: number;
}): string;
export declare function formatScarredPromptChat(args: {
    healerName: string;
    targetName: string;
    targetActorId: string;
    maxBars: number;
    scarred: number;
    poolRemaining: number;
    poolMax: number;
    powerName?: string;
    formula?: string | null;
}): string;
/** No Scarred / no HLR — still require a click so dice are visible. */
export declare function formatHealRollPromptChat(args: {
    healerName: string;
    targetName: string;
    powerName?: string;
    formula: string;
}): string;
/**
 * Resolve heal on one or more token targets (already chosen). No attack roll.
 * Always posts a chat card — Scarred picks and/or a Roll button; never auto-rolls.
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
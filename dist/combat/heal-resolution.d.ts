/**
 * Combat Heal Actives — ally targeting, no attack roll, no Reactions.
 * Rolls `mechanics.healing.flat`, applies to the current Health Bar, then
 * optionally offers Scarred / Health Level Recovery in chat.
 */
import type { RadialCombatOption } from '../radial-menu/types.js';
export declare const HEAL_CHAT_FLAG = "healResolution";
/** Catalog Health Level Recovery band (heal Actives; 0 below L4). */
export declare function healHealthLevelRecoveryForRank(rank: number): number;
export declare function powerItemRank(item: any): number;
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
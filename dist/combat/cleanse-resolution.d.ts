/**
 * Combat Cleanse Actives — ally targeting, no attack roll / Reactions.
 * Posts a heal-style chat card so the caster distributes Cleanse(X) with +/−
 * across eligible Specials on the target (token actor for unlinked tokens).
 */
import type { RadialCombatOption } from '../radial-menu/types.js';
export declare const CLEANSE_CHAT_FLAG = "cleanseResolution";
export declare function isCleanseTemplateId(templateId: string | null | undefined): boolean;
export declare function isCleansePowerItem(item: any): boolean;
export declare function isCleanseRadialOption(option: {
    item?: any;
    source?: string;
    aoePlacementProfile?: string;
    artifactPowerTemplateId?: string;
    name?: string;
    description?: string;
} | null | undefined): boolean;
/** Synthetic power item so Cleanse(X) can be read from an artifact row. */
export declare function cleansePowerItemFromRadialOption(option: RadialCombatOption | null | undefined): any | null;
/** Cleanse(X) value from the power's level specials (or 0). */
export declare function getCleanseRankFromPower(item: any): number;
/**
 * Battle actor for Cleanse reads/writes. Do NOT redirect through
 * getActionEconomyActor — world prototypes often lack the token's Specials.
 */
export declare function cleanseTargetActor(actor: any): any;
export declare function listCleansableForActor(actor: any, tokenHint?: any): Array<{
    id: string;
    label: string;
    value: number;
}>;
export declare function formatCleansePromptChat(args: {
    casterName: string;
    powerName: string;
    targetName: string;
    targetActorId: string;
    cleanseX: number;
    specials: Array<{
        id: string;
        label: string;
        value: number;
    }>;
}): string;
export declare function postCleansePromptForTarget(args: {
    casterToken: any;
    powerItem: any;
    powerName: string;
    targetToken: any;
}): Promise<void>;
/**
 * Resolve Cleanse on chosen tokens (ally targeting already done).
 * One interactive chat card per target.
 */
export declare function resolveCleanseOnTokens(args: {
    casterToken: any;
    powerItem: any;
    powerName: string;
    targetTokens: any[];
}): Promise<void>;
export declare function registerCleanseChatHandlers(): void;
//# sourceMappingURL=cleanse-resolution.d.ts.map
/**
 * Optional NPC / Summon Reactions — opt-in only.
 *
 * Unconfigured NPCs have 0 reaction slots and never appear in the Reaction
 * Window or the combat-strip R counter. Bosses and elites add rows here.
 */
import type { NpcAttackSpecialEntry } from '../types/actor.js';
export type NpcReactionSource = 'basic' | 'catalog' | 'custom';
export interface NpcReactionRow {
    id: string;
    name: string;
    source: NpcReactionSource;
    /** Standard maneuver: guard | evade | counterattack | dive-for-cover | interpose */
    basicId?: string;
    /** Catalog templateId */
    templateId?: string;
    /** Catalog power level 1–16 */
    rank?: number;
    specials?: NpcAttackSpecialEntry[];
}
export declare const NPC_STANDARD_REACTIONS: Array<{
    id: string;
    name: string;
    description: string;
}>;
export declare function newNpcReactionId(): string;
export declare function coerceNpcReactionsArray(raw: unknown): NpcReactionRow[];
export declare function normalizeNpcReactionRow(row: Record<string, unknown> | null | undefined): NpcReactionRow;
export declare function clampNpcReactionSlots(raw: unknown): number;
export declare function defaultNpcReactionRank(masteryRank: number): number;
export declare function listNpcCatalogReactions(): Array<{
    templateId: string;
    name: string;
    description: string;
}>;
export declare function resolveNpcReactionConfig(system: any): {
    slots: number;
    rows: NpcReactionRow[];
    phaseIndex: number | null;
};
export declare function isNpcLikeActor(actor: any): boolean;
/** Characters always participate. NPCs / summons only when slots + rows are set. */
export declare function actorParticipatesInReactions(actor: any): boolean;
export declare function npcReactionSlotsForEconomy(actor: any): number;
/** Synthetic reaction powers for a configured NPC / summon. */
export declare function materializeNpcReactionPowers(actor: any): any[];
export declare function applyNpcReactionSpecialsToTarget(target: any, specials: string[], sourceActor: any): Promise<string[]>;
export declare function newCustomNpcReaction(masteryRank: number): NpcReactionRow;
export declare function newStandardNpcReaction(basicId: string): NpcReactionRow | null;
export declare function newCatalogNpcReaction(templateId: string, masteryRank: number): NpcReactionRow | null;
//# sourceMappingURL=npc-reactions.d.ts.map
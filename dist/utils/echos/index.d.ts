/**
 * Echo Catalog
 *
 * Central registry for all 7 playable Echos. Accessed by the character-creation
 * Echo picker, the sheet's Echo Deck block, and the Echo Roll handler.
 */
import type { EchoCard, EchoCardOption, EchoDefinition, EchoSubChoice, EchoTrait, EchoUsage } from './types.js';
export type { EchoCard, EchoCardOption, EchoDefinition, EchoSize, EchoSkillKey, EchoSubChoice, EchoTrait, EchoUsage } from './types.js';
/** Display order in pickers (mirrors the Player\u2019s Guide). */
export declare const ECHO_KEY_ORDER: string[];
/** All Echos indexed by stable key. */
export declare const ALL_ECHOS: Record<string, EchoDefinition>;
/** All Echos as an array, in canonical display order. */
export declare function getAllEchos(): EchoDefinition[];
/** Lookup a single Echo by its key (legacy `elves` resolves to `elorians`). */
export declare function getEcho(key: string | undefined | null): EchoDefinition | undefined;
/** Lookup a sub-choice on an Echo by key (lineage / order). */
export declare function getEchoSubChoice(echoKey: string | undefined | null, subChoiceKey: string | undefined | null): EchoSubChoice | undefined;
/** Lookup one card from an Echo's deck by card id. */
export declare function getEchoCard(echoKey: string | undefined | null, cardId: string | undefined | null): EchoCard | undefined;
/** Lookup a card option (I-IV) by ids. */
export declare function getCardOption(echoKey: string | undefined | null, cardId: string | undefined | null, optionId: string | undefined | null): EchoCardOption | undefined;
/**
 * Resolve all currently-active Core Traits for a character (core + active sub-choice).
 * Sub-choice trait is included only when the character has picked that sub-choice.
 */
export declare function getActiveEchoTraits(echoKey: string | undefined | null, subChoiceKey?: string | null): EchoTrait[];
/**
 * Build a fresh `traitUses` record for a given Mastery Rank.
 * `mr-per-rest` traits get `masteryRank` uses; all others are not tracked.
 */
export declare function buildFreshTraitUses(echoKey: string | undefined | null, subChoiceKey: string | undefined | null, masteryRank: number): Record<string, number>;
/** Usage kinds that follow the \u201cMastery Rank per Safe Haven Rest\u201d pattern. */
export declare function isMrPerRest(usage: EchoUsage): boolean;
/** Mastery Rank that licenses each Echo Card slot (1-based order). */
export declare const ECHO_CARD_SLOT_UNLOCK_RANKS: readonly [1, 4, 6];
/**
 * Number of Echo-Card slots unlocked at a given Mastery Rank.
 * Start: 1. Second card at MR 4, third at MR 6.
 */
export declare function getUnlockedCardSlots(masteryRank: number): number;
/**
 * Cards that currently have a licensed slot.
 * Extra cards (high-MR start, then a lower rank) stay on the actor until
 * the GM removes them — they are never auto-deleted.
 */
export declare function getLicensedEchoCardIds(selectedCardIds: string[], masteryRank: number): string[];
export declare function isEchoCardLicensed(selectedCardIds: string[], masteryRank: number, cardId: string): boolean;
/**
 * Drop one selected Echo Card and its daily-use flag.
 * Does not change Echo, traits, or other cards.
 */
export declare function removeSelectedEchoCard(selectedCardIds: string[], cardUses: Record<string, boolean>, cardId: string): {
    selectedCardIds: string[];
    cardUses: Record<string, boolean>;
    removed: boolean;
};
/** True if a trait is currently gated off by Mastery Rank. */
export declare function isTraitGatedByMr(usage: EchoUsage, masteryRank: number): boolean;
//# sourceMappingURL=index.d.ts.map
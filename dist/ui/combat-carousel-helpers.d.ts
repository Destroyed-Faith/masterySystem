/**
 * Side color for a combatant card: player characters blue, everyone else red.
 * Not Foundry token disposition — that was always hostile for most NPCs.
 */
export declare function carouselSideClass(actorType: string | undefined): 'disp-pc' | 'disp-npc';
/** Whether the placeable is linked to the world Actor (sheet renames are authoritative). */
export declare function isCombatantActorLinked(combatant: any, token?: any): boolean;
/**
 * Label for a carousel combatant.
 *
 * Live Actor / Token names beat a stale `combatant.name` snapshot. Rename hooks
 * still write the combatant for persistence, but the card must update as soon as
 * the sheet (or token) name changes — especially for unlinked NPC copies.
 */
export declare function resolveCombatantDisplayName(combatant: any, token?: any, actor?: any): string;
/** True when a Foundry update diff touches the document display name. */
export declare function updateDiffHasNameChange(changed: any): boolean;
/** New name from an update diff, or empty string. */
export declare function nameFromUpdateDiff(changed: any, fallback?: unknown): string;
/** Token id for a sheet Actor (synthetic token actor or first active placeable). */
export declare function actorTokenId(actor: any): string;
/**
 * Read NPC/summon stat-block DR % from the prepared combat breakdown rows.
 * `prepareDerivedData` records it as label "Stat block" / detail "NPC DR %".
 */
export declare function readNpcBlockDrPctFromCombat(combat: any): number;
export type CarouselDefensePeek = {
    armorPassive: number;
    evadePassive: number;
    /** Live Active Buff Armor (not in sheet armorTotal). */
    armorBuff?: number;
    /** Live Active Buff Evade (not in sheet evadeTotal). */
    evadeBuff?: number;
    damageReductionPct: number;
};
/**
 * Overlay self-facing mechanics peek onto stored combat totals for the carousel
 * strip (A4). Replaces only the mechanics-derived portion of Armor / Evade / DR;
 * preserves NPC stat-block DR (max), manual DR, and Stone DR Boost.
 * Active Buff Armor/Evade are added on top (sheet totals omit them by design).
 */
export declare function overlayCarouselDefenseStrip(input: {
    actorType?: string;
    armorTotal: number;
    evadeTotal: number;
    damageReductionPct: number;
    armorFromMechanics: number;
    evadeFromMechanics: number;
    /** Mechanics DR total from last `prepareDerivedData` (`derived.mechanicsBreakdown`). */
    damageReductionFromMechanics: number;
    /** NPC/summon stat-block DR % (0 when absent). */
    npcBlockDrPct?: number;
    /** Manual sheet DR adjustment (may be negative). */
    manualDrPct?: number;
    /** Stone DR Boost % (`combat.stoneDrBonusPct`). */
    stoneDrBonusPct?: number;
    peek: CarouselDefensePeek;
}): {
    armor: number;
    evade: number;
    drPct: number;
};
/**
 * Match a sheet Actor to combatants.
 * Token-bound sheets match that Token only (unlinked NPC copies share actorId).
 */
export declare function actorMatchesCombatant(actor: any, combatant: any): boolean;
/** @deprecated Use carouselSideClass — kept for older tests/callers. */
export declare function carouselDispositionClass(disposition: number): 'disp-friendly' | 'disp-neutral' | 'disp-hostile';
export type CarouselTurnRow = {
    id: string;
    defeated?: boolean;
};
/**
 * Current combatant id from Foundry's turn index into `combat.turns`.
 * Prefer the index over `combat.combatant`, which can lag one step after nextTurn.
 */
export declare function resolveCurrentCombatantId(combat: {
    turn?: unknown;
    turns?: Array<{
        id?: unknown;
    } | null | undefined>;
    combatant?: {
        id?: unknown;
    } | null;
    current?: {
        combatantId?: unknown;
    } | null;
} | null | undefined): string | null;
/**
 * Id of the next non-defeated combatant after the current one in tracker order.
 * Null while turns are gated (preparation / stones) or when there is no distinct next.
 */
export declare function findNextCombatantId(combatants: CarouselTurnRow[], currentId: string | null | undefined, turnsActive: boolean): string | null;
//# sourceMappingURL=combat-carousel-helpers.d.ts.map
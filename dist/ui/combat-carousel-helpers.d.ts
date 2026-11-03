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
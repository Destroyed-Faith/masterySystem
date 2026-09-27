/**
 * Side color for a combatant card: player characters blue, everyone else red.
 * Not Foundry token disposition — that was always hostile for most NPCs.
 */
export declare function carouselSideClass(actorType: string | undefined): 'disp-pc' | 'disp-npc';
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
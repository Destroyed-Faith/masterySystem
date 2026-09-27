/** Disposition CSS class for a combatant portrait frame. */
export declare function carouselDispositionClass(disposition: number): 'disp-friendly' | 'disp-neutral' | 'disp-hostile';
export type CarouselTurnRow = {
    id: string;
    defeated?: boolean;
};
/**
 * Id of the next non-defeated combatant after the current one in tracker order.
 * Null while turns are gated (preparation / stones) or when there is no distinct next.
 */
export declare function findNextCombatantId(combatants: CarouselTurnRow[], currentId: string | null | undefined, turnsActive: boolean): string | null;
//# sourceMappingURL=combat-carousel-helpers.d.ts.map
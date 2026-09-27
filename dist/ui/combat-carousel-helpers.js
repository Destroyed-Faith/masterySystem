/** Disposition CSS class for a combatant portrait frame. */
export function carouselDispositionClass(disposition) {
    const d = Number(disposition);
    if (d > 0)
        return 'disp-friendly';
    if (d < 0)
        return 'disp-hostile';
    return 'disp-neutral';
}
/**
 * Id of the next non-defeated combatant after the current one in tracker order.
 * Null while turns are gated (preparation / stones) or when there is no distinct next.
 */
export function findNextCombatantId(combatants, currentId, turnsActive) {
    if (!turnsActive || !currentId || !combatants.length)
        return null;
    const idx = combatants.findIndex((c) => c.id === currentId);
    if (idx < 0)
        return null;
    for (let step = 1; step < combatants.length; step++) {
        const c = combatants[(idx + step) % combatants.length];
        if (!c?.id || c.defeated)
            continue;
        if (c.id === currentId)
            return null;
        return c.id;
    }
    return null;
}
//# sourceMappingURL=combat-carousel-helpers.js.map
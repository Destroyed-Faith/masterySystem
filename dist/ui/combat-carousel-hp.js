/** Hide exact HP numbers on hostile/secret NPC cards. The bar itself stays. */
export function hideCarouselHpNumbers(actorType, disposition) {
    if (actorType !== 'npc')
        return false;
    return Number(disposition) < 0;
}
//# sourceMappingURL=combat-carousel-hp.js.map
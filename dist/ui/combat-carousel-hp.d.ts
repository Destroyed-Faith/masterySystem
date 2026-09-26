/** Hide exact HP numbers on hostile/secret NPC cards. The bar itself stays. */
export declare function hideCarouselHpNumbers(actorType: string | undefined, disposition: number): boolean;
export interface CarouselHpSegment {
    name: string;
    shortName: string;
    /** Deducted pool percent for this bar, e.g. "−10%". Healthy is "0%". */
    penaltyLabel: string;
    /** Bar name plus the deducted percent, for the segment hover. */
    hoverTitle: string;
    current: number;
    max: number;
    severity: number;
    widthPct: number;
    scarred: boolean;
}
export declare function carouselHpBarShortName(name: string, index?: number): string;
/** Pool percent this wound bar deducts. Index follows HEALTH_PENALTY_FRACTIONS. */
export declare function carouselHpPenaltyLabel(index: number): string;
export declare function carouselHpHoverTitle(name: string, index: number, scarred: boolean): string;
/** One carousel HP segment per Health Bar, including Scarred so players can see the lock. */
export declare function buildCarouselHpSegments(bars: unknown): CarouselHpSegment[];
//# sourceMappingURL=combat-carousel-hp.d.ts.map
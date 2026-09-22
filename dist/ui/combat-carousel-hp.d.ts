/** Hide exact HP numbers on hostile/secret NPC cards. The bar itself stays. */
export declare function hideCarouselHpNumbers(actorType: string | undefined, disposition: number): boolean;
export interface CarouselHpSegment {
    name: string;
    shortName: string;
    current: number;
    max: number;
    severity: number;
    widthPct: number;
    scarred: boolean;
}
export declare function carouselHpBarShortName(name: string, index?: number): string;
/** One carousel HP segment per Health Bar, including Scarred so players can see the lock. */
export declare function buildCarouselHpSegments(bars: unknown): CarouselHpSegment[];
//# sourceMappingURL=combat-carousel-hp.d.ts.map
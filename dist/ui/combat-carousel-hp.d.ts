/**
 * Hide NPC Health Bars from non-GM clients in the combat carousel.
 * Disposition no longer matters — only the GM sees NPC damage bars.
 * (`disposition` kept for call-site compatibility.)
 */
export declare function hideCarouselHpNumbers(actorType: string | undefined, _disposition?: number): boolean;
/** True when this client must not see NPC Health Bars at all (not just numbers). */
export declare function hideCarouselNpcHpBars(actorType: string | undefined, isGM: boolean): boolean;
/**
 * Vertical Health rail beside a carousel portrait.
 * GM only, and only on player characters — NPCs stay without a bar.
 */
export declare function showCarouselSideHp(actorType: string | undefined, isGM: boolean): boolean;
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
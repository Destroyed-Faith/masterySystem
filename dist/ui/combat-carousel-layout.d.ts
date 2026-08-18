/** Foundry's own usable-area floor. Below this, UI (including our carousel) clips. */
export declare const CAROUSEL_COMPACT_MIN_WIDTH = 1024;
/** Slightly above Foundry's 768 so we collapse before the canvas/UI starts clipping. */
export declare const CAROUSEL_COMPACT_MIN_HEIGHT = 800;
export declare function readViewportSize(win?: {
    innerWidth: number;
    innerHeight: number;
    visualViewport?: {
        width: number;
        height: number;
    } | null;
}): {
    width: number;
    height: number;
};
/**
 * True when the usable window is too small or zoomed for the full portrait carousel.
 * Uses CSS pixels (browser/OS zoom already applied), same space Foundry validates.
 */
export declare function isCompactCarouselViewport(width?: number, height?: number): boolean;
export declare function applyCarouselCompactClass(root: HTMLElement | null | undefined, compact: boolean): void;
//# sourceMappingURL=combat-carousel-layout.d.ts.map
/** Foundry's own usable-area floor. Below this, UI (including our carousel) clips. */
export declare const CAROUSEL_COMPACT_MIN_WIDTH = 1024;
/** Slightly above Foundry's 768 so we collapse before the canvas/UI starts clipping. */
export declare const CAROUSEL_COMPACT_MIN_HEIGHT = 800;
/** Stay under Application windows (`--z-index-app`, usually 100). */
export declare const CAROUSEL_Z_INDEX = 80;
export declare const CAROUSEL_MIN_HEIGHT = 44;
export declare const CAROUSEL_MIN_WIDTH = 220;
/** Names + right-hand buttons; portraits drop out. */
export declare const CAROUSEL_RAIL_HEIGHT = 72;
/** Smaller portraits, extra chrome hidden. */
export declare const CAROUSEL_MEDIUM_HEIGHT = 140;
export declare const CAROUSEL_SIZE_STORAGE_KEY = "mastery-system.carouselSize";
export type CarouselDensity = 'full' | 'medium' | 'rail';
export type CarouselUserSize = {
    width: number | null;
    height: number | null;
};
export declare function carouselDensityForHeight(height: number | null | undefined): CarouselDensity;
export declare function clampCarouselHeight(height: number, maxHeight?: number): number;
export declare function clampCarouselWidth(width: number, maxWidth?: number): number;
export declare function readCarouselUserSize(store?: Storage | null): CarouselUserSize;
export declare function writeCarouselUserSize(size: CarouselUserSize, store?: Storage | null): void;
export declare function applyCarouselUserSize(root: HTMLElement | null | undefined, size: CarouselUserSize): void;
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
export declare function syncCarouselTopOffset(root: HTMLElement | null | undefined): void;
export declare function clearCarouselTopOffset(): void;
export declare function applyCarouselCompactClass(root: HTMLElement | null | undefined, compact: boolean): void;
//# sourceMappingURL=combat-carousel-layout.d.ts.map
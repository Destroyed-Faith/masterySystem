/** Foundry's own usable-area floor. Below this, UI (including our carousel) clips. */
export const CAROUSEL_COMPACT_MIN_WIDTH = 1024;
/** Slightly above Foundry's 768 so we collapse before the canvas/UI starts clipping. */
export const CAROUSEL_COMPACT_MIN_HEIGHT = 800;
/** Stay under Application windows (`--z-index-app`, usually 100). */
export const CAROUSEL_Z_INDEX = 80;
export const CAROUSEL_MIN_HEIGHT = 44;
export const CAROUSEL_MIN_WIDTH = 220;
/** Names + right-hand buttons; portraits drop out. */
export const CAROUSEL_RAIL_HEIGHT = 72;
/** Smaller portraits, extra chrome hidden. */
export const CAROUSEL_MEDIUM_HEIGHT = 140;
export const CAROUSEL_SIZE_STORAGE_KEY = 'mastery-system.carouselSize';
export function carouselDensityForHeight(height) {
    if (height == null || !Number.isFinite(height) || height <= 0)
        return 'full';
    if (height <= CAROUSEL_RAIL_HEIGHT)
        return 'rail';
    if (height <= CAROUSEL_MEDIUM_HEIGHT)
        return 'medium';
    return 'full';
}
export function clampCarouselHeight(height, maxHeight) {
    const hi = Number.isFinite(Number(maxHeight)) && Number(maxHeight) > CAROUSEL_MIN_HEIGHT
        ? Number(maxHeight)
        : 2400;
    return Math.max(CAROUSEL_MIN_HEIGHT, Math.min(hi, Math.round(Number(height) || 0)));
}
export function clampCarouselWidth(width, maxWidth) {
    const hi = Number.isFinite(Number(maxWidth)) && Number(maxWidth) > CAROUSEL_MIN_WIDTH
        ? Number(maxWidth)
        : 2400;
    return Math.max(CAROUSEL_MIN_WIDTH, Math.min(hi, Math.round(Number(width) || 0)));
}
function storage() {
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    }
    catch {
        return null;
    }
}
export function readCarouselUserSize(store = storage()) {
    const empty = { width: null, height: null };
    if (!store)
        return empty;
    try {
        const raw = store.getItem(CAROUSEL_SIZE_STORAGE_KEY);
        if (!raw)
            return empty;
        const parsed = JSON.parse(raw);
        const width = Number(parsed.width);
        const height = Number(parsed.height);
        return {
            width: Number.isFinite(width) && width > 0 ? width : null,
            height: Number.isFinite(height) && height > 0 ? height : null,
        };
    }
    catch {
        return empty;
    }
}
export function writeCarouselUserSize(size, store = storage()) {
    if (!store)
        return;
    if (size.width == null && size.height == null) {
        store.removeItem(CAROUSEL_SIZE_STORAGE_KEY);
        return;
    }
    store.setItem(CAROUSEL_SIZE_STORAGE_KEY, JSON.stringify(size));
}
export function applyCarouselUserSize(root, size) {
    if (!root)
        return;
    const inner = root.querySelector?.('.mastery-carousel');
    const hasSize = size.width != null || size.height != null;
    const density = carouselDensityForHeight(size.height);
    root.classList.toggle('is-user-sized', hasSize);
    root.classList.toggle('is-user-medium', density === 'medium');
    root.classList.toggle('is-user-rail', density === 'rail');
    inner?.classList.toggle('is-user-sized', hasSize);
    inner?.classList.toggle('is-user-medium', density === 'medium');
    inner?.classList.toggle('is-user-rail', density === 'rail');
    if (size.width != null) {
        root.style.setProperty('--ms-carousel-user-width', `${Math.round(size.width)}px`);
    }
    else {
        root.style.removeProperty('--ms-carousel-user-width');
    }
    if (size.height != null) {
        root.style.setProperty('--ms-carousel-user-height', `${Math.round(size.height)}px`);
    }
    else {
        root.style.removeProperty('--ms-carousel-user-height');
    }
    syncCarouselTopOffset(root);
}
export function readViewportSize(win = window) {
    const vv = win.visualViewport;
    return {
        width: Number(vv?.width || win.innerWidth) || 0,
        height: Number(vv?.height || win.innerHeight) || 0,
    };
}
/**
 * True when the usable window is too small or zoomed for the full portrait carousel.
 * Uses CSS pixels (browser/OS zoom already applied), same space Foundry validates.
 */
export function isCompactCarouselViewport(width, height) {
    const size = width == null || height == null
        ? typeof window === 'undefined'
            ? { width: 1920, height: 1080 }
            : readViewportSize()
        : { width, height };
    return size.width < CAROUSEL_COMPACT_MIN_WIDTH || size.height < CAROUSEL_COMPACT_MIN_HEIGHT;
}
const CAROUSEL_OFFSET_VAR = '--mastery-carousel-offset';
export function syncCarouselTopOffset(root) {
    const body = globalThis.document?.body;
    if (!body?.style)
        return;
    const inner = root?.querySelector?.('.mastery-carousel');
    const height = inner?.offsetHeight ?? 0;
    body.style.setProperty(CAROUSEL_OFFSET_VAR, `${height}px`);
}
export function clearCarouselTopOffset() {
    const body = globalThis.document?.body;
    if (!body?.style)
        return;
    body.style.removeProperty(CAROUSEL_OFFSET_VAR);
}
export function applyCarouselCompactClass(root, compact) {
    if (!root)
        return;
    root.classList.toggle('mastery-carousel-compact', compact);
    const inner = root.querySelector?.('.mastery-carousel');
    inner?.classList.toggle('is-compact', compact);
    if (compact) {
        inner?.setAttribute('title', compactHint());
    }
    else {
        inner?.removeAttribute('title');
    }
    document.body.classList.toggle('mastery-carousel-compact', compact);
    applyCarouselUserSize(root, readCarouselUserSize());
}
function compactHint() {
    const key = 'MASTERY.carousel.compactHint';
    const i18n = globalThis.game?.i18n;
    const t = i18n?.localize?.(key);
    return t && t !== key
        ? t
        : 'Kompaktes Carousel — Fenster oder Zoom ist unter 1024×768.';
}
//# sourceMappingURL=combat-carousel-layout.js.map
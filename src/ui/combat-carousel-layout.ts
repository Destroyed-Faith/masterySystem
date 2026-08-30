/** Foundry's own usable-area floor. Below this, UI (including our carousel) clips. */
export const CAROUSEL_COMPACT_MIN_WIDTH = 1024;
/** Slightly above Foundry's 768 so we collapse before the canvas/UI starts clipping. */
export const CAROUSEL_COMPACT_MIN_HEIGHT = 800;

export function readViewportSize(
  win: { innerWidth: number; innerHeight: number; visualViewport?: { width: number; height: number } | null } = window,
): { width: number; height: number } {
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
export function isCompactCarouselViewport(
  width?: number,
  height?: number,
): boolean {
  const size =
    width == null || height == null
      ? typeof window === 'undefined'
        ? { width: 1920, height: 1080 }
        : readViewportSize()
      : { width, height };
  return size.width < CAROUSEL_COMPACT_MIN_WIDTH || size.height < CAROUSEL_COMPACT_MIN_HEIGHT;
}

const CAROUSEL_OFFSET_VAR = '--mastery-carousel-offset';

export function syncCarouselTopOffset(root: HTMLElement | null | undefined): void {
  const inner = root?.querySelector?.('.mastery-carousel') as HTMLElement | null;
  const height = inner?.offsetHeight ?? 0;
  document.body.style.setProperty(CAROUSEL_OFFSET_VAR, `${height}px`);
}

export function clearCarouselTopOffset(): void {
  document.body.style.removeProperty(CAROUSEL_OFFSET_VAR);
}

export function applyCarouselCompactClass(root: HTMLElement | null | undefined, compact: boolean): void {
  if (!root) return;
  root.classList.toggle('mastery-carousel-compact', compact);
  const inner = root.querySelector?.('.mastery-carousel') as HTMLElement | null;
  inner?.classList.toggle('is-compact', compact);
  if (compact) {
    inner?.setAttribute('title', compactHint());
  } else {
    inner?.removeAttribute('title');
  }
  document.body.classList.toggle('mastery-carousel-compact', compact);
  syncCarouselTopOffset(root);
}

function compactHint(): string {
  const key = 'MASTERY.carousel.compactHint';
  const i18n = (globalThis as any).game?.i18n;
  const t = i18n?.localize?.(key);
  return t && t !== key
    ? t
    : 'Kompaktes Carousel — Fenster oder Zoom ist unter 1024×768.';
}

/**
 * Resolve actor portrait URLs for Epic Mastery Roll UI.
 */

const PORTRAIT_FALLBACK = 'icons/svg/mystery-man.svg';

function routeImage(path: string): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  try {
    return (foundry as any).utils?.getRoute?.(path) ?? path;
  } catch {
    return path;
  }
}

export function resolveActorPortraitSrc(actor?: Actor, storedImg?: string): string {
  const anyActor = actor as any;
  const raw =
    anyActor?.img ||
    anyActor?.texture?.src ||
    anyActor?.prototypeToken?.texture?.src ||
    storedImg ||
    PORTRAIT_FALLBACK;

  return routeImage(String(raw || PORTRAIT_FALLBACK)) || routeImage(PORTRAIT_FALLBACK);
}

export function portraitFallbackSrc(): string {
  return routeImage(PORTRAIT_FALLBACK);
}

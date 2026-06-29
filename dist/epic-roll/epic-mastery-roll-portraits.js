/**
 * Resolve actor portrait URLs for Epic Mastery Roll UI.
 */
const PORTRAIT_FALLBACK = 'icons/svg/mystery-man.svg';
function routeImage(path) {
    if (!path)
        return '';
    if (/^(https?:|data:|blob:)/i.test(path))
        return path;
    try {
        return foundry.utils?.getRoute?.(path) ?? path;
    }
    catch {
        return path;
    }
}
export function resolveActorPortraitSrc(actor, storedImg) {
    const anyActor = actor;
    const raw = anyActor?.img ||
        anyActor?.texture?.src ||
        anyActor?.prototypeToken?.texture?.src ||
        storedImg ||
        PORTRAIT_FALLBACK;
    return routeImage(String(raw || PORTRAIT_FALLBACK)) || routeImage(PORTRAIT_FALLBACK);
}
export function portraitFallbackSrc() {
    return routeImage(PORTRAIT_FALLBACK);
}
//# sourceMappingURL=epic-mastery-roll-portraits.js.map
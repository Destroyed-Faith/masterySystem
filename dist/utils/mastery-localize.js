/** Foundry i18n with English fallback when keys are missing (e.g. in unit tests). */
export function masteryLocalize(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(key);
    if (typeof raw === 'string' && raw.length > 0 && raw !== key)
        return raw;
    return fallback;
}
export function masteryFormat(key, data, fallback) {
    const raw = globalThis.game?.i18n?.format?.(key, data);
    if (typeof raw === 'string' && raw.length > 0 && raw !== key)
        return raw;
    return fallback;
}
//# sourceMappingURL=mastery-localize.js.map
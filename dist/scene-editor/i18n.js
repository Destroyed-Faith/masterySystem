export function t(key, fallback, data) {
    const raw = globalThis.game?.i18n?.localize?.(`MASTERY.sceneEditor.${key}`) || fallback;
    if (!data)
        return raw;
    return Object.entries(data).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), raw);
}
//# sourceMappingURL=i18n.js.map
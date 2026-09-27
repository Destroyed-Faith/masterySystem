export const CAROUSEL_CLIENT_PREFS_KEY = 'carouselClientPrefs';
export const DEFAULT_CAROUSEL_CLIENT_PREFS = {
    compactMode: 'auto',
    showCombatStrip: true,
    showStatusIcons: true,
    showNextMark: true,
    showDisposition: true,
    tooltipMode: 'full',
    showStressBar: true,
};
function asBool(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
export function normalizeCarouselClientPrefs(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const compact = src.compactMode === 'force' || src.compactMode === 'off' || src.compactMode === 'auto'
        ? src.compactMode
        : DEFAULT_CAROUSEL_CLIENT_PREFS.compactMode;
    const tip = src.tooltipMode === 'short' || src.tooltipMode === 'off' || src.tooltipMode === 'full'
        ? src.tooltipMode
        : DEFAULT_CAROUSEL_CLIENT_PREFS.tooltipMode;
    return {
        compactMode: compact,
        showCombatStrip: asBool(src.showCombatStrip, true),
        showStatusIcons: asBool(src.showStatusIcons, true),
        showNextMark: asBool(src.showNextMark, true),
        showDisposition: asBool(src.showDisposition, true),
        tooltipMode: tip,
        showStressBar: asBool(src.showStressBar, true),
    };
}
export function registerCarouselClientSettings() {
    const g = globalThis;
    if (!g.game?.settings?.register)
        return;
    try {
        g.game.settings.register('mastery-system', CAROUSEL_CLIENT_PREFS_KEY, {
            name: 'Combat Carousel Preferences',
            scope: 'client',
            config: false,
            type: Object,
            default: { ...DEFAULT_CAROUSEL_CLIENT_PREFS },
        });
    }
    catch {
        /* already registered */
    }
}
export function readCarouselClientPrefs() {
    const g = globalThis;
    try {
        const raw = g.game?.settings?.get?.('mastery-system', CAROUSEL_CLIENT_PREFS_KEY);
        return normalizeCarouselClientPrefs(raw);
    }
    catch {
        return { ...DEFAULT_CAROUSEL_CLIENT_PREFS };
    }
}
export async function writeCarouselClientPrefs(prefs) {
    const next = normalizeCarouselClientPrefs({ ...readCarouselClientPrefs(), ...prefs });
    const g = globalThis;
    await g.game?.settings?.set?.('mastery-system', CAROUSEL_CLIENT_PREFS_KEY, next);
    return next;
}
export function resolveCarouselCompact(prefs, viewportCompact) {
    if (prefs.compactMode === 'force')
        return true;
    if (prefs.compactMode === 'off')
        return false;
    return viewportCompact;
}
/** Build rich tooltip lines for a combatant card. */
export function buildCarouselTooltip(input) {
    if (input.mode === 'off')
        return null;
    const lines = [`Initiative ${input.initiative}`];
    if (input.statusTooltips.length) {
        lines.push(input.statusTooltips.join(', '));
    }
    if (input.mode === 'short' || input.hideVitals) {
        return { title: input.name, lines };
    }
    if (input.armor != null || input.evade != null || input.drPct != null) {
        lines.push(`Armor ${input.armor ?? 0} · Evade ${input.evade ?? 0} · DR ${input.drPct ?? 0}%`);
    }
    if (input.attackTotal != null || input.movementTotal != null || input.reactionTotal != null) {
        lines.push(`A ${input.attackRemaining ?? 0}/${input.attackTotal ?? 0} · M ${input.movementRemaining ?? 0}/${input.movementTotal ?? 0} · R ${input.reactionRemaining ?? 0}/${input.reactionTotal ?? 0}`);
    }
    if ((input.tempHP ?? 0) > 0)
        lines.push(`Temp HP +${input.tempHP}`);
    if ((input.hpScarredCount ?? 0) > 0)
        lines.push(`Scarred ${input.hpScarredCount}`);
    if (input.stressMax != null) {
        lines.push(`Stress ${input.stressCurrent ?? 0}/${input.stressMax}`);
    }
    return { title: input.name, lines };
}
//# sourceMappingURL=combat-carousel-settings.js.map
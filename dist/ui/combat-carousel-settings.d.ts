export type CarouselCompactMode = 'auto' | 'force' | 'off';
export type CarouselTooltipMode = 'full' | 'short' | 'off';
export interface CarouselClientPrefs {
    compactMode: CarouselCompactMode;
    showCombatStrip: boolean;
    showStatusIcons: boolean;
    showNextMark: boolean;
    showDisposition: boolean;
    tooltipMode: CarouselTooltipMode;
    showStressBar: boolean;
}
export declare const CAROUSEL_CLIENT_PREFS_KEY = "carouselClientPrefs";
export declare const DEFAULT_CAROUSEL_CLIENT_PREFS: CarouselClientPrefs;
export declare function normalizeCarouselClientPrefs(raw: unknown): CarouselClientPrefs;
export declare function registerCarouselClientSettings(): void;
export declare function readCarouselClientPrefs(): CarouselClientPrefs;
export declare function writeCarouselClientPrefs(prefs: Partial<CarouselClientPrefs>): Promise<CarouselClientPrefs>;
export declare function resolveCarouselCompact(prefs: CarouselClientPrefs, viewportCompact: boolean): boolean;
export interface CarouselTooltipLines {
    title: string;
    lines: string[];
}
/** Build rich tooltip lines for a combatant card. */
export declare function buildCarouselTooltip(input: {
    mode: CarouselTooltipMode;
    name: string;
    initiative: number;
    statusTooltips: string[];
    hideVitals: boolean;
    armor?: number;
    evade?: number;
    drPct?: number;
    attackRemaining?: number;
    attackTotal?: number;
    movementRemaining?: number;
    movementTotal?: number;
    reactionRemaining?: number;
    reactionTotal?: number;
    tempHP?: number;
    hpScarredCount?: number;
    stressCurrent?: number;
    stressMax?: number;
}): CarouselTooltipLines | null;
//# sourceMappingURL=combat-carousel-settings.d.ts.map
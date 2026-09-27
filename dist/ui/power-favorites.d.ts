/** Per-actor pinned powers for the combat-carousel favorites strip. */
export declare const POWER_FAVORITES_FLAG = "powerFavorites";
export declare const POWER_FAVORITES_MAX = 6;
export declare function normalizePowerFavorites(raw: unknown): string[];
export declare function readPowerFavorites(actor: any): string[];
export declare function writePowerFavorites(actor: any, ids: string[]): Promise<string[]>;
export declare function togglePowerFavorite(actor: any, itemId: string): Promise<string[]>;
export declare function isPowerFavorited(actor: any, itemId: string): boolean;
//# sourceMappingURL=power-favorites.d.ts.map
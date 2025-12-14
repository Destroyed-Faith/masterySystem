/**
 * Blood Pool / Blutlache System
 * Creates visual blood pools on the canvas when damage is dealt
 */
/**
 * Create a blood pool at a token's position
 * @param token - The token that took damage
 * @param damage - Amount of damage dealt (affects pool size)
 * @param persistent - If true, creates a Tile that persists. If false, creates temporary graphics
 * @param bloodColor - Optional hex color (e.g., "#8b0000"). If not provided, uses actor's bloodColor or default dark red
 */
export declare function createBloodPool(token: any, damage: number, persistent?: boolean, bloodColor?: string): Promise<void>;
/**
 * Remove all blood pools for a specific token (if temporary)
 */
export declare function removeBloodPoolsForToken(tokenId: string): void;
//# sourceMappingURL=blood-pool.d.ts.map
/**
 * Blood Pool / Blutlache System
 * Visual blood effects under a hit token, tinted with the actor's bloodColor.
 *
 * - splatter: a few small droplets when HP is chipped within the same health level
 * - puddle: a large blood pool when a health level is lost (bar depleted / currentBar advances)
 */
export type BloodEffectIntensity = 'splatter' | 'puddle';
export interface BloodEffectOptions {
    /** Raw or bar damage amount (used as a mild size hint). */
    damage?: number;
    /** Prefer sheet color; falls back to actor then default dark red. */
    bloodColor?: string;
    /** If omitted, inferred from healthLevelLost + damage. */
    intensity?: BloodEffectIntensity;
    /** True when the hit depleted a health bar / advanced currentBar. */
    healthLevelLost?: boolean;
    /**
     * Persistent TileDocument (legacy). Default false — temporary PIXI graphics
     * support animation and avoid Foundry tile quirks.
     */
    persistent?: boolean;
}
/** Decide visual intensity from combat outcome. */
export declare function resolveBloodIntensity(opts: {
    barDamage: number;
    healthLevelLost: boolean;
    intensity?: BloodEffectIntensity;
}): BloodEffectIntensity | null;
/** True when at least one health bar went from >0 HP to 0, or currentBar advanced. */
export declare function didLoseHealthLevel(opts: {
    oldBarIndex: number;
    newBarIndex: number;
    barsBefore: Array<{
        current?: number;
    }>;
    barsAfter: Array<{
        current?: number;
    }>;
}): boolean;
/**
 * Create a blood effect at a token's position.
 * Back-compat: createBloodPool(token, damage, persistent?, bloodColor?)
 */
export declare function createBloodPool(token: any, damageOrOptions?: number | BloodEffectOptions, persistent?: boolean, bloodColor?: string): Promise<void>;
/** Convenience wrapper used by the damage pipeline. */
export declare function showDamageBloodEffect(token: any, opts: {
    barDamage: number;
    healthLevelLost: boolean;
    bloodColor?: string;
}): Promise<void>;
/**
 * Remove all temporary blood pools for a specific token
 */
export declare function removeBloodPoolsForToken(tokenId: string): void;
//# sourceMappingURL=blood-pool.d.ts.map
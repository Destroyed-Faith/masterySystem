/**
 * Blood stains under a hit token, tinted with the actor's bloodColor.
 *
 * Textures live in assets/fx/blood:
 *   light  → drops/   (small HP chips)
 *   medium → impacts/ (heavy chips)
 *   heavy  → pools/   (health level lost)
 *   trail  → trails/  (badly wounded tokens dragging across the map)
 *
 * Drawn on canvas.primary between tiles and tokens so stains sit on the
 * map, not on top of the character.
 */
export type BloodEffectIntensity = 'light' | 'medium' | 'heavy';
export type BloodStainKind = BloodEffectIntensity | 'trail';
export type BloodIntensityInput = BloodEffectIntensity | 'splatter' | 'puddle';
export interface BloodEffectOptions {
    /** Raw or bar damage amount (used as a mild size hint). */
    damage?: number;
    /** Prefer sheet color; falls back to actor then default dark red. */
    bloodColor?: string;
    /** If omitted, inferred from healthLevelLost + damage. */
    intensity?: BloodIntensityInput;
    /** True when the hit depleted a health bar / advanced currentBar. */
    healthLevelLost?: boolean;
    /** Current wound-bar max, used to split light vs medium chips. */
    barMax?: number;
    /**
     * Persistent TileDocument (legacy). Default false — temporary PIXI sprites
     * support animation and avoid Foundry tile quirks.
     */
    persistent?: boolean;
}
/** Trail art points bottom-left → top-right in canvas space. */
export declare const BLOOD_TRAIL_TEXTURE_ANGLE: number;
export declare const BLOOD_TEXTURES: Record<BloodEffectIntensity, readonly string[]>;
export declare const BLOOD_TRAIL_TEXTURES: readonly ["systems/mastery-system/assets/fx/blood/trails/trail-01.png", "systems/mastery-system/assets/fx/blood/trails/trail-02.png"];
/** Map legacy names and pass through the three current intensities. */
export declare function normalizeBloodIntensity(intensity?: BloodIntensityInput): BloodEffectIntensity | undefined;
/** Decide visual intensity from combat outcome. */
export declare function resolveBloodIntensity(opts: {
    barDamage: number;
    healthLevelLost: boolean;
    barMax?: number;
    intensity?: BloodIntensityInput;
}): BloodEffectIntensity | null;
export declare function pickBloodTexturePath(intensity: BloodEffectIntensity, seed: number): string;
export declare function pickBloodTrailPath(seed: number): string;
/**
 * Wounded / Broken / Incapacitated — second half of the wound track.
 * Healthy, Bruised, and Injured do not drip while walking.
 */
export declare function shouldLeaveBloodTrail(actor: any): boolean;
export declare function bloodTrailRotation(dx: number, dy: number): number;
/** Mid-segment stamps along a move. Empty when the drag is too short. */
export declare function bloodTrailWaypoints(opts: {
    from: {
        x: number;
        y: number;
    };
    to: {
        x: number;
        y: number;
    };
    gridSize: number;
}): Array<{
    x: number;
    y: number;
}>;
/** Display width/height in canvas pixels for one stain. */
export declare function bloodSpriteSize(opts: {
    intensity: BloodEffectIntensity;
    damage: number;
    gridSize: number;
}): number;
/** HP actually lost across the wound track (heals do not count). */
export declare function hpLostFromHealthUpdate(opts: {
    barsBefore: Array<{
        current?: number;
    }>;
    barsAfter: Array<{
        current?: number;
    }>;
}): number;
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
    barMax?: number;
}): Promise<void>;
/** Drag smear under a badly wounded token. `fromTopLeft` is the pre-move document xy. */
export declare function showBloodTrailForToken(tokenDoc: any, fromTopLeft: {
    x: number;
    y: number;
}): Promise<void>;
/**
 * Remove all temporary blood pools for a specific token
 */
export declare function removeBloodPoolsForToken(tokenId: string): void;
/**
 * Sheet HP minus, token-bar edits, and any other health.bars write.
 * Combat applyDamageToTarget draws its own FX and passes masteryBloodHandled.
 */
export declare function initializeBloodPoolHooks(): void;
//# sourceMappingURL=blood-pool.d.ts.map
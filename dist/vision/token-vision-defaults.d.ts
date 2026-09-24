/**
 * Player token vision defaults — Foundry rendering baseline only.
 *
 * Player characters render with Vision enabled, 60 m, 360°, Basic Vision.
 * Foundry Token Vision is not the Combat Sense system: an NPC with vision
 * disabled or range 0 is not blind and never counts as unaware because of it.
 * NPC tokens are therefore left alone here.
 */
export declare const PLAYER_VISION_DEFAULTS: {
    readonly enabled: true;
    readonly range: number;
    readonly angle: 360;
    readonly visionMode: "basic";
};
export declare const VISION_INITIALIZED_FLAG = "visionInitialized";
export interface SightLike {
    enabled?: boolean;
    range?: number | null;
    angle?: number | null;
    visionMode?: string | null;
}
/** Range 0 / missing is Foundry's untouched default — nothing deliberate. */
export declare function isSightUninitialized(sight: SightLike | null | undefined): boolean;
/**
 * Update for a prototype token / token document `sight` block. Returns null
 * when nothing should change: an initialized range is a deliberate choice
 * and is preserved (angle and vision mode too). Uninitialized sight gets the
 * defaults, keeping any angle / mode the GM already set.
 */
export declare function planPlayerSightUpdate(sight: SightLike | null | undefined, opts?: {
    alreadyInitialized?: boolean;
}): Record<string, unknown> | null;
/** Sight block for a brand-new player character (creation data may pre-set parts). */
export declare function defaultPlayerSight(existing: SightLike | null | undefined): Required<SightLike>;
/**
 * Actor update normalizing an existing player prototype token. Prefixed with
 * `prototypeToken.` and marks the actor so later GM edits to 0 are kept.
 */
export declare function planPrototypeVisionUpdate(actor: any): Record<string, unknown> | null;
/** Ready-hook migration: normalize every player character once. GM only. */
export declare function runPlayerVisionDefaultsMigration(actors: Iterable<any>): Promise<number>;
/** preCreateActor: new player characters start with the rendering baseline. */
export declare function applyPlayerVisionToCreateData(actorType: string, data: any): void;
/**
 * preCreateToken: a placed player token whose sight is still 0 (older
 * prototype, drag from a compendium) gets the baseline. NPC tokens untouched.
 */
export declare function planTokenCreateSightUpdate(actorType: string, tokenData: any): Record<string, unknown> | null;
//# sourceMappingURL=token-vision-defaults.d.ts.map
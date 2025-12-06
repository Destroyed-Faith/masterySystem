/**
 * Special Effects System for Mastery System
 *
 * Special effects can be applied from Raises on attacks or from special abilities
 * Common effects: Prone, Bleed, Disarm, Stun, Frightened, Mark, Dazed, etc.
 */
/**
 * Special effect types
 */
export declare enum SpecialEffect {
    PRONE = "prone",
    BLEED = "bleed",
    DISARM = "disarm",
    STUN = "stun",
    FRIGHTENED = "frightened",
    MARK = "mark",
    DAZED = "dazed",
    SLOWED = "slowed",
    BLIND = "blind",
    DEAFENED = "deafened",
    GRAPPLED = "grappled",
    RESTRAINED = "restrained",
    POISONED = "poisoned",
    BURNING = "burning",
    FROZEN = "frozen"
}
/**
 * Special effect data
 */
export interface SpecialEffectData {
    type: SpecialEffect;
    intensity: number;
    duration?: number;
    source?: any;
}
/**
 * Apply Prone effect
 * Target is knocked down, -2 dice to attacks, enemies get advantage
 */
export declare function applyProne(target: any, source?: any): Promise<void>;
/**
 * Apply Bleed effect
 * Takes damage at start of each round
 */
export declare function applyBleed(target: any, intensity: number, source?: any): Promise<void>;
/**
 * Apply Disarm effect
 * Weapon dropped, must use Action to pick up
 */
export declare function applyDisarm(target: any, source?: any): Promise<void>;
/**
 * Apply Stun effect
 * Lose next Action
 */
export declare function applyStun(target: any, duration: number, source?: any): Promise<void>;
/**
 * Apply Frightened effect
 * Cannot move closer to source, disadvantage on attacks
 */
export declare function applyFrightened(target: any, intensity: number, duration: number, source?: any): Promise<void>;
/**
 * Apply Mark effect
 * Advantage to hit, extra damage
 */
export declare function applyMark(target: any, intensity: number, duration: number, source?: any): Promise<void>;
/**
 * Apply Dazed effect
 * -1 Action next round
 */
export declare function applyDazed(target: any, source?: any): Promise<void>;
/**
 * Apply Slowed effect
 * Movement reduced by half
 */
export declare function applySlowed(target: any, duration: number, source?: any): Promise<void>;
/**
 * Apply Grappled effect
 * Cannot move, disadvantage on attacks
 */
export declare function applyGrappled(target: any, source?: any): Promise<void>;
/**
 * Apply special effect from raise spending
 *
 * @param target - Target actor
 * @param effect - Special effect type
 * @param intensity - Effect intensity (if applicable)
 * @param source - Source actor
 */
export declare function applySpecialEffect(target: any, effect: SpecialEffect, intensity?: number, source?: any): Promise<void>;
/**
 * Parse special effects from item
 * Item can have "specials" array like ["prone", "bleed:2", "mark:1"]
 */
export declare function parseSpecialEffects(item: any): Array<{
    effect: SpecialEffect;
    intensity: number;
}>;
//# sourceMappingURL=specials.d.ts.map
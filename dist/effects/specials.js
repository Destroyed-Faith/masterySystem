/**
 * Special Effects System for Mastery System
 *
 * Special effects can be applied from Raises on attacks or from special abilities
 * Common effects: Prone, Bleed, Disarm, Stun, Frightened, Mark, Dazed, etc.
 */
import { applyCondition } from '../effects/conditions.js';
/**
 * Special effect types
 */
export var SpecialEffect;
(function (SpecialEffect) {
    SpecialEffect["PRONE"] = "prone";
    SpecialEffect["BLEED"] = "bleed";
    SpecialEffect["DISARM"] = "disarm";
    SpecialEffect["STUN"] = "stun";
    SpecialEffect["FRIGHTENED"] = "frightened";
    SpecialEffect["MARK"] = "mark";
    SpecialEffect["DAZED"] = "dazed";
    SpecialEffect["SLOWED"] = "slowed";
    SpecialEffect["BLIND"] = "blind";
    SpecialEffect["DEAFENED"] = "deafened";
    SpecialEffect["GRAPPLED"] = "grappled";
    SpecialEffect["RESTRAINED"] = "restrained";
    SpecialEffect["POISONED"] = "poisoned";
    SpecialEffect["BURNING"] = "burning";
    SpecialEffect["FROZEN"] = "frozen";
})(SpecialEffect || (SpecialEffect = {}));
/**
 * Apply Prone effect
 * Target is knocked down, -2 dice to attacks, enemies get advantage
 */
export async function applyProne(target, source) {
    const conditionData = {
        name: 'Prone',
        value: 1,
        diminishing: false,
        duration: {
            type: 'permanent' // Until they use Movement to stand
        },
        save: {
            type: 'body',
            tn: 0,
            frequency: 'none'
        },
        effect: 'Knocked down. -2 dice to attacks. Enemies have advantage against you. Use Movement action to stand up.',
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is knocked Prone!`);
}
/**
 * Apply Bleed effect
 * Takes damage at start of each round
 */
export async function applyBleed(target, intensity, source) {
    const conditionData = {
        name: 'Bleeding',
        value: intensity,
        diminishing: true, // Reduces by 1 each round
        duration: {
            type: 'scene'
        },
        save: {
            type: 'body',
            tn: 12,
            frequency: 'eachRound'
        },
        effect: `Taking ${intensity} damage at start of each round. Diminishes by 1 each round. Body Save (TN 12) to stop bleeding.`,
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Bleeding(${intensity})!`);
}
/**
 * Apply Disarm effect
 * Weapon dropped, must use Action to pick up
 */
export async function applyDisarm(target, source) {
    const conditionData = {
        name: 'Disarmed',
        value: 1,
        diminishing: false,
        duration: {
            type: 'permanent' // Until they pick up weapon
        },
        save: {
            type: 'body',
            tn: 0,
            frequency: 'none'
        },
        effect: 'Weapon dropped. Use Action to pick up weapon.',
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Disarmed!`);
}
/**
 * Apply Stun effect
 * Lose next Action
 */
export async function applyStun(target, duration, source) {
    const conditionData = {
        name: 'Stunned',
        value: duration,
        diminishing: false,
        duration: {
            type: 'rounds',
            remaining: duration
        },
        save: {
            type: 'body',
            tn: 0,
            frequency: 'none'
        },
        effect: `Cannot take Actions for ${duration} round(s).`,
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Stunned for ${duration} round(s)!`);
}
/**
 * Apply Frightened effect
 * Cannot move closer to source, disadvantage on attacks
 */
export async function applyFrightened(target, intensity, duration, source) {
    const conditionData = {
        name: 'Frightened',
        value: intensity,
        diminishing: true,
        duration: {
            type: 'rounds',
            remaining: duration
        },
        save: {
            type: 'mind',
            tn: 12,
            frequency: 'eachRound'
        },
        effect: `Cannot willingly move closer to ${source?.name || 'the source'}. Disadvantage on attacks. -${intensity} dice to checks. Mind Save (TN 12) to overcome.`,
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Frightened(${intensity})!`);
}
/**
 * Apply Mark effect
 * Advantage to hit, extra damage
 */
export async function applyMark(target, intensity, duration, source) {
    const conditionData = {
        name: 'Marked',
        value: intensity,
        diminishing: false,
        duration: {
            type: 'rounds',
            remaining: duration
        },
        save: {
            type: 'body',
            tn: 0,
            frequency: 'none'
        },
        effect: `Marked by ${source?.name || 'attacker'}. Attackers have advantage. +${intensity} damage from attacks.`,
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Marked(${intensity})!`);
}
/**
 * Apply Dazed effect
 * -1 Action next round
 */
export async function applyDazed(target, source) {
    const conditionData = {
        name: 'Dazed',
        value: 1,
        diminishing: false,
        duration: {
            type: 'rounds',
            remaining: 1
        },
        save: {
            type: 'body',
            tn: 0,
            frequency: 'none'
        },
        effect: 'Lose 1 Attack Action next round.',
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Dazed!`);
}
/**
 * Apply Slowed effect
 * Movement reduced by half
 */
export async function applySlowed(target, duration, source) {
    const conditionData = {
        name: 'Slowed',
        value: 1,
        diminishing: false,
        duration: {
            type: 'rounds',
            remaining: duration
        },
        save: {
            type: 'body',
            tn: 12,
            frequency: 'eachRound'
        },
        effect: 'Movement speed reduced by half. Body Save (TN 12) to overcome.',
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Slowed!`);
}
/**
 * Apply Grappled effect
 * Cannot move, disadvantage on attacks
 */
export async function applyGrappled(target, source) {
    const conditionData = {
        name: 'Grappled',
        value: 1,
        diminishing: false,
        duration: {
            type: 'permanent' // Until escape contest
        },
        save: {
            type: 'body',
            tn: 16, // Contest vs grappler's Might
            frequency: 'eachRound'
        },
        effect: `Grappled by ${source?.name || 'enemy'}. Cannot move. Disadvantage on attacks. Body contest to escape.`,
        source: source?.name
    };
    await applyCondition(target, conditionData);
    ui.notifications?.warn(`${target.name} is Grappled!`);
}
/**
 * Apply special effect from raise spending
 *
 * @param target - Target actor
 * @param effect - Special effect type
 * @param intensity - Effect intensity (if applicable)
 * @param source - Source actor
 */
export async function applySpecialEffect(target, effect, intensity = 1, source) {
    switch (effect) {
        case SpecialEffect.PRONE:
            await applyProne(target, source);
            break;
        case SpecialEffect.BLEED:
            await applyBleed(target, intensity, source);
            break;
        case SpecialEffect.DISARM:
            await applyDisarm(target, source);
            break;
        case SpecialEffect.STUN:
            await applyStun(target, intensity, source);
            break;
        case SpecialEffect.FRIGHTENED:
            await applyFrightened(target, intensity, 3, source); // 3 rounds default
            break;
        case SpecialEffect.MARK:
            await applyMark(target, intensity, 3, source); // 3 rounds default
            break;
        case SpecialEffect.DAZED:
            await applyDazed(target, source);
            break;
        case SpecialEffect.SLOWED:
            await applySlowed(target, 3, source); // 3 rounds default
            break;
        case SpecialEffect.GRAPPLED:
            await applyGrappled(target, source);
            break;
        default:
            ui.notifications?.warn(`Special effect ${effect} not yet implemented`);
    }
}
/**
 * Parse special effects from item
 * Item can have "specials" array like ["prone", "bleed:2", "mark:1"]
 */
export function parseSpecialEffects(item) {
    const specials = item.system.specials || [];
    const parsed = [];
    for (const special of specials) {
        const parts = special.split(':');
        const effectName = parts[0].trim().toLowerCase();
        const intensity = parts[1] ? parseInt(parts[1]) : 1;
        // Map string to enum
        const effectType = Object.values(SpecialEffect).find(e => e === effectName);
        if (effectType) {
            parsed.push({
                effect: effectType,
                intensity
            });
        }
    }
    return parsed;
}
//# sourceMappingURL=specials.js.map
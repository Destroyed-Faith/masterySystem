/**
 * Combat Maneuvers System for Mastery System
 *
 * Defines all generic Combat Maneuvers available to all characters.
 * These are separate from Powers (which come from Mastery Trees).
 *
 * Categories:
 * - Movement Maneuvers: Use Movement slot
 * - Defensive Reactions: Use Reaction slot, defensive in nature
 * - Support Reactions: Use Reaction slot, help allies
 * - Tactical Reactions: Use Reaction slot, tactical/opportunity attacks
 * - Combat Actions/Stances: Use Action slot, provide ongoing benefits
 * - Advanced Specials: Modify Attack actions (Multiattack, Autofire, etc.)
 */
/**
 * All available Combat Maneuvers
 *
 * NOTE: These are based on common RPG patterns and the categories described.
 * Update with exact names/descriptions from the Players Guide when available.
 */
export const COMBAT_MANEUVERS = [
    // ========================================
    // MOVEMENT MANEUVERS
    // ========================================
    {
        id: "dash",
        name: "Dash",
        description: "Move at double speed",
        slot: "movement",
        category: "movement",
        tags: ["movement", "speed"],
        effect: "Move up to 2× your Speed this turn. Cannot be split with regular movement."
    },
    {
        id: "disengage",
        name: "Disengage",
        description: "Move without provoking opportunity attacks",
        slot: "movement",
        category: "movement",
        tags: ["movement", "defensive"],
        effect: "Move normally, but enemies cannot make opportunity attacks against you this turn."
    },
    {
        id: "tactical-retreat",
        name: "Tactical Retreat",
        description: "Move away while maintaining defensive posture",
        slot: "movement",
        category: "movement",
        tags: ["movement", "defensive", "tactical"],
        effect: "Move up to your Speed away from enemies. Gain +1 to Defense until the start of your next turn."
    },
    {
        id: "flee-you-fools",
        name: "Flee You Fools!",
        description: "Desperate escape maneuver",
        slot: "movement",
        category: "movement",
        tags: ["movement", "escape", "desperate"],
        effect: "Move up to 3× your Speed, but you cannot take any other actions this turn and provoke opportunity attacks."
    },
    {
        id: "stand-up",
        name: "Stand Up",
        description: "Rise from prone position",
        slot: "movement",
        category: "movement",
        tags: ["movement", "prone"],
        requirements: {
            requiresProne: true
        },
        effect: "Stand up from prone position. Uses half your Movement."
    },
    {
        id: "charge",
        name: "Charge",
        description: "Move and attack with bonus",
        slot: "movement",
        category: "movement",
        tags: ["movement", "attack", "offensive"],
        effect: "Move up to your Speed toward an enemy, then make one attack with +1d8 damage. Must move in a straight line."
    },
    {
        id: "leap",
        name: "Leap",
        description: "Jump over obstacles or gaps",
        slot: "movement",
        category: "movement",
        tags: ["movement", "athletics"],
        effect: "Make an Athletics check (TN 12+) to jump over obstacles or gaps. Distance depends on check result."
    },
    {
        id: "climb",
        name: "Climb",
        description: "Climb vertical surfaces",
        slot: "movement",
        category: "movement",
        tags: ["movement", "athletics"],
        effect: "Move at half speed while climbing. Athletics check required for difficult surfaces (TN varies)."
    },
    {
        id: "swim",
        name: "Swim",
        description: "Move through water",
        slot: "movement",
        category: "movement",
        tags: ["movement", "athletics"],
        effect: "Move at half speed while swimming. Athletics check required in rough water (TN varies)."
    },
    // ========================================
    // DEFENSIVE REACTIONS
    // ========================================
    {
        id: "parry",
        name: "Parry",
        description: "Deflect an incoming melee attack",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "melee"],
        requirements: {
            requiresMeleeWeapon: true,
            requiresFreeHand: true
        },
        effect: "When targeted by a melee attack, make an opposed roll. If you succeed, reduce damage by your weapon's damage dice."
    },
    {
        id: "dodge",
        name: "Dodge",
        description: "Evade an incoming attack",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "evasion"],
        effect: "When targeted by an attack, make an Agility check. If you succeed, the attack misses."
    },
    {
        id: "block",
        name: "Block",
        description: "Intercept an attack with shield or weapon",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "shield"],
        requirements: {
            requiresShield: true
        },
        effect: "When targeted by an attack, use your shield to block. Reduce damage by your shield's Block value."
    },
    {
        id: "defensive-roll",
        name: "Defensive Roll",
        description: "Roll to reduce damage from an attack",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "damage-reduction"],
        effect: "When hit by an attack, make an Agility check. Reduce damage by 1d8 per success."
    },
    {
        id: "brace",
        name: "Brace",
        description: "Prepare to receive a charge or impact",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "stance"],
        requirements: {
            requiresStanding: true
        },
        effect: "When an enemy moves into melee range, you may make an attack against them. If they charge, they take additional damage."
    },
    // ========================================
    // SUPPORT REACTIONS
    // ========================================
    {
        id: "aid",
        name: "Aid",
        description: "Help an ally with their action",
        slot: "reaction",
        category: "support-reaction",
        tags: ["reaction", "support", "aid"],
        effect: "When an ally within range makes an attack or check, you may grant them +1d8 to their roll. Must be adjacent or within 2m."
    },
    {
        id: "interpose",
        name: "Interpose",
        description: "Place yourself between an ally and danger",
        slot: "reaction",
        category: "support-reaction",
        tags: ["reaction", "support", "protection"],
        effect: "When an ally within 2m is targeted by an attack, you may move into the attack's path. The attack targets you instead."
    },
    {
        id: "cover-fire",
        name: "Cover Fire",
        description: "Provide covering fire for an ally",
        slot: "reaction",
        category: "support-reaction",
        tags: ["reaction", "support", "ranged"],
        requirements: {
            requiresRangedWeapon: true
        },
        effect: "When an ally moves, make a ranged attack against an enemy. If you hit, that enemy has disadvantage on attacks against your ally this turn."
    },
    // ========================================
    // TACTICAL REACTIONS
    // ========================================
    {
        id: "opportunity-attack",
        name: "Opportunity Attack",
        description: "Strike an enemy leaving melee range",
        slot: "reaction",
        category: "tactical-reaction",
        tags: ["reaction", "tactical", "opportunity-attack", "melee"],
        requirements: {
            requiresMeleeWeapon: true
        },
        effect: "When an enemy leaves your melee range, you may make one melee attack against them."
    },
    {
        id: "readied-action",
        name: "Readied Action",
        description: "Prepare to act when a trigger occurs",
        slot: "reaction",
        category: "tactical-reaction",
        tags: ["reaction", "tactical", "prepared"],
        effect: "Declare a trigger condition and an action. When the trigger occurs, you may use your Reaction to perform that action."
    },
    {
        id: "counter-attack",
        name: "Counter Attack",
        description: "Strike back after defending",
        slot: "reaction",
        category: "tactical-reaction",
        tags: ["reaction", "tactical", "counter"],
        requirements: {
            requiresMeleeWeapon: true
        },
        effect: "After successfully Parrying or Dodging an attack, you may make a melee attack against that enemy."
    },
    // ========================================
    // COMBAT ACTIONS / STANCES
    // ========================================
    {
        id: "parry-stance",
        name: "Parry Stance",
        description: "Adopt a defensive fighting stance",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "defensive", "ongoing"],
        requirements: {
            requiresMeleeWeapon: true,
            requiresFreeHand: true
        },
        effect: "Enter a defensive stance. Gain +2 to Parry attempts and +1 to Defense. Lasts until you take another Action or are knocked prone."
    },
    {
        id: "dodge-stance",
        name: "Dodge Stance",
        description: "Adopt an evasive fighting stance",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "defensive", "evasion", "ongoing"],
        effect: "Enter an evasive stance. Gain +2 to Dodge attempts and +1 to Defense against ranged attacks. Lasts until you take another Action or are knocked prone."
    },
    {
        id: "shield-wall",
        name: "Shield Wall",
        description: "Form a defensive formation with allies",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "defensive", "formation", "ongoing"],
        requirements: {
            requiresShield: true
        },
        effect: "Form a shield wall with adjacent allies who also have shields. All participants gain +2 to Defense and +1 to Block attempts. Lasts until you or an ally breaks formation."
    },
    {
        id: "aggressive-stance",
        name: "Aggressive Stance",
        description: "Adopt an offensive fighting stance",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "offensive", "ongoing"],
        requirements: {
            requiresMeleeWeapon: true
        },
        effect: "Enter an aggressive stance. Gain +1d8 to damage on melee attacks, but take -1 to Defense. Lasts until you take another Action."
    },
    {
        id: "aim",
        name: "Aim",
        description: "Take careful aim with a ranged weapon",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "ranged", "ongoing"],
        requirements: {
            requiresRangedWeapon: true
        },
        effect: "Take careful aim. Your next ranged attack gains +2d8 to the attack roll. Lasts until you make an attack or take another Action."
    },
    {
        id: "total-defense",
        name: "Total Defense",
        description: "Focus entirely on defense",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "defensive", "ongoing"],
        effect: "Focus entirely on defense. Gain +3 to Defense until the start of your next turn. You cannot make attacks while in Total Defense."
    },
    // ========================================
    // ADVANCED SPECIALS
    // ========================================
    {
        id: "multiattack-2",
        name: "Multiattack (2)",
        description: "Make two attacks with a single Action",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "multiattack", "attack-modifier"],
        effect: "When you take the Attack action, you may make two attacks instead of one. Both attacks use the same weapon and modifiers."
    },
    {
        id: "multiattack-3",
        name: "Multiattack (3)",
        description: "Make three attacks with a single Action",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "multiattack", "attack-modifier"],
        effect: "When you take the Attack action, you may make three attacks instead of one. All attacks use the same weapon and modifiers."
    },
    {
        id: "autofire-2",
        name: "Autofire (2)",
        description: "Fire two shots with a ranged weapon",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "autofire", "ranged", "attack-modifier"],
        requirements: {
            requiresRangedWeapon: true
        },
        effect: "When you take the Attack action with a ranged weapon, you may fire two shots. Both shots target the same or different enemies within range."
    },
    {
        id: "autofire-3",
        name: "Autofire (3)",
        description: "Fire three shots with a ranged weapon",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "autofire", "ranged", "attack-modifier"],
        requirements: {
            requiresRangedWeapon: true
        },
        effect: "When you take the Attack action with a ranged weapon, you may fire three shots. All shots may target the same or different enemies within range."
    },
    {
        id: "power-attack",
        name: "Power Attack",
        description: "Sacrifice accuracy for damage",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "attack-modifier", "melee"],
        requirements: {
            requiresMeleeWeapon: true
        },
        effect: "When making a melee attack, you may take a penalty of up to -2d8 to your attack roll to gain +2d8 damage per die penalty."
    },
    {
        id: "precise-shot",
        name: "Precise Shot",
        description: "Aim for a specific body part",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "attack-modifier", "ranged"],
        requirements: {
            requiresRangedWeapon: true
        },
        effect: "When making a ranged attack, you may take a -1d8 penalty to target a specific body part. Success grants additional effects (GM discretion)."
    },
    {
        id: "cleave",
        name: "Cleave",
        description: "Strike multiple adjacent enemies",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "attack-modifier", "melee", "aoe"],
        requirements: {
            requiresMeleeWeapon: true,
            requiresTwoHanded: true
        },
        effect: "When you reduce an enemy to 0 Health with a melee attack, you may make another attack against an adjacent enemy as part of the same Action."
    },
    {
        id: "whirlwind-attack",
        name: "Whirlwind Attack",
        description: "Strike all enemies around you",
        slot: "attack",
        category: "advanced-special",
        tags: ["advanced", "attack-modifier", "melee", "aoe"],
        requirements: {
            requiresMeleeWeapon: true
        },
        effect: "Make a melee attack against all enemies within your melee reach. Each attack uses the same attack roll, but damage is rolled separately."
    }
];
/**
 * Get all maneuvers available to an actor
 * Filters based on requirements and actor capabilities
 */
export function getAvailableManeuvers(actor) {
    const available = [];
    for (const maneuver of COMBAT_MANEUVERS) {
        if (meetsRequirements(actor, maneuver)) {
            available.push(maneuver);
        }
    }
    return available;
}
/**
 * Get maneuvers by slot type
 */
export function getManeuversBySlot(slot, actor) {
    const maneuvers = actor ? getAvailableManeuvers(actor) : COMBAT_MANEUVERS;
    return maneuvers.filter(m => m.slot === slot);
}
/**
 * Get maneuvers by category
 */
export function getManeuversByCategory(category, actor) {
    const maneuvers = actor ? getAvailableManeuvers(actor) : COMBAT_MANEUVERS;
    return maneuvers.filter(m => m.category === category);
}
/**
 * Get a specific maneuver by ID
 */
export function getManeuverById(id) {
    return COMBAT_MANEUVERS.find(m => m.id === id);
}
/**
 * Check if an actor meets the requirements for a maneuver
 */
function meetsRequirements(actor, maneuver) {
    if (!maneuver.requirements) {
        return true;
    }
    const req = maneuver.requirements;
    const system = actor.system || {};
    const items = (actor.items || []);
    // Check shield requirement
    if (req.requiresShield) {
        const hasShield = items.some(item => item.type === 'armor' &&
            item.system?.armorType === 'shield');
        if (!hasShield)
            return false;
    }
    // Check melee weapon requirement
    if (req.requiresMeleeWeapon) {
        const hasMelee = items.some(item => item.type === 'weapon' &&
            item.system?.weaponType !== 'ranged');
        if (!hasMelee)
            return false;
    }
    // Check ranged weapon requirement
    if (req.requiresRangedWeapon) {
        const hasRanged = items.some(item => item.type === 'weapon' &&
            item.system?.weaponType === 'ranged');
        if (!hasRanged)
            return false;
    }
    // Check two-handed requirement
    if (req.requiresTwoHanded) {
        const hasTwoHanded = items.some(item => item.type === 'weapon' &&
            item.system?.twoHanded === true);
        if (!hasTwoHanded)
            return false;
    }
    // Check free hand requirement
    if (req.requiresFreeHand) {
        // This is a simplified check - in reality, you'd need to check equipment slots
        // For now, assume it's available if not wielding a two-handed weapon
        const hasTwoHanded = items.some(item => item.type === 'weapon' &&
            item.system?.twoHanded === true);
        if (hasTwoHanded)
            return false;
    }
    // Check prone requirement
    if (req.requiresProne) {
        const isProne = system.effects?.prone === true ||
            actor.getFlag('mastery-system', 'prone') === true;
        if (!isProne)
            return false;
    }
    // Check standing requirement
    if (req.requiresStanding) {
        const isProne = system.effects?.prone === true ||
            actor.getFlag('mastery-system', 'prone') === true;
        if (isProne)
            return false;
    }
    // Check minimum attribute requirement
    if (req.minAttribute) {
        const attrValue = system.attributes?.[req.minAttribute.attribute]?.value || 0;
        if (attrValue < req.minAttribute.value)
            return false;
    }
    return true;
}
/**
 * Get all maneuvers grouped by slot for display
 */
export function getManeuversBySlotGrouped(actor) {
    const maneuvers = actor ? getAvailableManeuvers(actor) : COMBAT_MANEUVERS;
    return {
        attack: maneuvers.filter(m => m.slot === 'attack'),
        movement: maneuvers.filter(m => m.slot === 'movement'),
        utility: maneuvers.filter(m => m.slot === 'utility'),
        reaction: maneuvers.filter(m => m.slot === 'reaction')
    };
}
//# sourceMappingURL=combat-maneuvers.js.map
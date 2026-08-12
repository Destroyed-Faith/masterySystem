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
 * All available Combat Maneuvers — canonical list from Players Guide
 * 6815–6985.
 *
 * Categories
 *   • Movement Options       (consume Movement, exclusive per turn)
 *   • Escape Rule (Flee)     (consumes Movement, suppresses everything else)
 *   • Defensive Reactions    (consume Reaction, react to incoming hit)
 *   • Support Reactions      (consume Reaction, help allies)
 *   • Tactical Reactions     (consume Reaction, opportunity attacks)
 *   • Combat Actions         (Stances / declarations that consume Attack
 *                              Actions)
 *   • Initiative: Delay      (no slot — initiative-time decision)
 */
export const COMBAT_MANEUVERS = [
    // ========================================
    // MOVEMENT OPTIONS
    // (Players Guide 6822–6848 — choose one Movement use per turn unless a
    //  Power says otherwise.)
    // ========================================
    {
        id: "move",
        name: "Move",
        description: "Move up to your Speed.",
        slot: "movement",
        category: "movement",
        tags: ["movement", "basic"],
        effect: "Move up to your Speed. You may draw or sheathe a weapon as part of Movement. Provokes movement-triggered Reactions normally.",
    },
    {
        id: "dash",
        name: "Dash",
        description: "Focus entirely on movement (2× Speed).",
        slot: "movement",
        category: "movement",
        tags: ["movement", "speed", "basic"],
        effect: "Move up to **double your normal Speed**. You cannot perform your base Attack Action this Turn, but additional Attack Actions from Stones or another source may still be used. Provokes movement-triggered Reactions normally.",
    },
    {
        id: "disengage",
        name: "Disengage",
        description: "Withdraw without provoking movement-triggered Reactions.",
        slot: "movement",
        category: "movement",
        tags: ["movement", "defensive", "basic"],
        effect: "Move up to your normal Speed **without provoking movement-triggered Reactions**. You cannot perform your base Attack Action this Turn unless another effect grants an additional Attack Action.",
    },
    {
        id: "quick-load",
        name: "Quick Load",
        description: "Spend Movement to perform Reload (1).",
        slot: "movement",
        category: "movement",
        tags: ["movement", "reload", "basic"],
        requirements: {
            requiresFreeHand: true,
        },
        effect: "Instead of moving, spend your Movement to perform **Reload (1)**. Additional Movements may Quick Load again, up to a total Reload equal to your **Mastery Rank**. Requires a free hand. Cannot Quick Load while Immobilized or Restrained.",
    },
    {
        id: "stand-up",
        name: "Stand Up",
        description: "Recover from Prone (costs 1 Attack Action).",
        // Lives in the Movement radial segment for UX, but spends an Attack Action
        // (not Movement) — see costsAction / costsMovement in radial options.
        slot: "movement",
        category: "movement",
        tags: ["movement", "prone", "basic"],
        requirements: {
            requiresProne: true,
        },
        effect: "Standing up costs **1 Attack Action** but does not consume Movement. After standing, you may use Movement normally. Standing itself does not provoke Reactions.",
    },
    // ========================================
    // ESCAPE RULE
    // ========================================
    {
        id: "flee",
        name: "Flee",
        description: "Escape danger at 4× Speed.",
        slot: "movement",
        category: "movement",
        tags: ["movement", "escape", "basic"],
        effect: "Move up to **4× your normal Speed** directly away from danger. Until the start of your next Turn you cannot make Attacks, use Reactions, or spend Stones. Provokes movement-triggered Reactions normally. The GM may transition into a chase if appropriate.",
    },
    // ========================================
    // BASIC REACTIONS (also injected into the Reaction Window)
    // ========================================
    {
        id: "guard",
        name: "Guard",
        description: "Gain +MR × 2 Armor vs the triggering hit/damage.",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "basic", "basic-reaction"],
        effect: "Trigger: you are hit by an Attack or would take damage. Gain **+MR × 2 Armor** against that triggering event only.",
    },
    {
        id: "evade",
        name: "Evade",
        description: "Gain +MR × 2 Evade vs the triggering attack.",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "basic", "basic-reaction"],
        effect: "Trigger: you are targeted by an Attack, before the result is finalized. Gain **+MR × 2 Evade** against that Attack only.",
    },
    {
        id: "counterattack",
        name: "Counterattack",
        description: "Basic Attack against the creature that hit you.",
        slot: "reaction",
        category: "tactical-reaction",
        tags: ["reaction", "tactical", "basic", "basic-reaction", "melee"],
        effect: "Trigger: a creature hits you with an Attack and is a valid target. Immediately make a **Basic Attack** (Weapon Damage + MR × 2d8). No Active Power effects.",
    },
    {
        id: "dive-for-cover",
        name: "Dive for Cover",
        description: "Move 2 × MR m to escape an AoE.",
        slot: "reaction",
        category: "defensive-reaction",
        tags: ["reaction", "defensive", "movement", "basic", "basic-reaction"],
        effect: "Trigger: you would be hit by an AoE Attack after its shared roll is compared to your defense, before damage. Move up to **2 × Mastery Rank meters**. If you leave the area completely, you are not affected. This movement does not provoke movement-triggered Reactions.",
    },
    // ========================================
    // SUPPORT REACTIONS
    // (Players Guide 6888–6892)
    // ========================================
    {
        id: "aid",
        name: "Aid",
        description: "Grant an ally +2 flat to a roll within 8 m.",
        slot: "reaction",
        category: "support-reaction",
        tags: ["reaction", "support"],
        effect: "When an ally within **8 m** makes an Attack, Save, or Skill check, give them **+2 flat bonus**. Must be justified in roleplay.",
    },
    {
        id: "interpose",
        name: "Interpose",
        description: "Take half of an adjacent ally's damage.",
        slot: "reaction",
        category: "support-reaction",
        tags: ["reaction", "support", "protection"],
        effect: "When an ally within **2 m** takes damage, you may step in and take **half of it**.",
    },
    // ========================================
    // TACTICAL REACTIONS
    // (Players Guide 6897–6900)
    // ========================================
    {
        id: "opportunity-attack",
        name: "Opportunity Attack",
        description: "Strike an enemy leaving your melee reach.",
        slot: "reaction",
        category: "tactical-reaction",
        tags: ["reaction", "tactical", "opportunity-attack", "melee"],
        requirements: {
            requiresMeleeWeapon: true,
        },
        effect: "When an enemy **leaves your melee reach** by movement, spend your Reaction to make **one Basic Attack** (Weapon Damage + MR × 2d8). No Active Power effects.",
    },
    // ========================================
    // COMBAT ACTIONS / STANCES
    // (Players Guide 6902–6963)
    // ========================================
    {
        id: "parry-stance",
        name: "Parry Stance",
        description: "Give up Attack Actions; one Parry contest sets your TN.",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "defensive", "melee"],
        requirements: {
            requiresMeleeWeapon: true,
        },
        effect: "Stance. Give up **all Attack Actions** this round (including extra Attacks). Roll one Parry Contest; the result becomes your TN vs all melee attacks until your next turn.",
    },
    {
        id: "dodge-stance",
        name: "Dodge Stance",
        description: "Convert Attack Actions into +4 Evade each.",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "defensive", "evasion"],
        effect: "Stance. Convert your Attack Actions into defense. For **each** Attack Action you give up this round, gain **+4 Evade** until your next turn. (You may convert your last remaining Attack Action when using a Stance.)",
    },
    {
        id: "shield-stance",
        name: "Shield Stance",
        description: "Stand fast: Movement 0; convert attacks into Evade + Armor.",
        slot: "attack",
        category: "combat-action",
        tags: ["stance", "defensive", "shield"],
        requirements: {
            requiresShield: true,
        },
        effect: "Stance. Requires a shield. Your Movement becomes **0 m** until your next turn. For each Attack Action you give up this round, gain **+(Shield Evade modifier, min 0)** to Evade and **+(Armor Value from worn armor)** as temporary Armor until your next turn.",
    },
    {
        id: "grapple",
        name: "Grapple",
        description: "Restrain a creature within reach.",
        slot: "attack",
        category: "combat-action",
        tags: ["combat-action", "control", "melee"],
        effect: "Attempt to restrain a creature within reach. Contest (Might/Agility Roll + optional HtH Skill vs. Might/Agility Roll + optional HtH Skill). On success, the target is **Grappled**. The target may attempt to end the grapple on their turn; if the grapple remains, you may deal **MR weapon damage dice** to the target.",
    },
    {
        id: "reckless-attack",
        name: "Reckless Attack",
        description: "All-out: Advantage on attacks, enemies have Advantage on you.",
        slot: "attack",
        category: "combat-action",
        tags: ["combat-action", "offensive"],
        effect: "When you declare your Attack this round, fight without defense or restraint. Gain **Advantage on all Attack Rolls** against enemies until the start of your next turn. **All enemies gain Advantage** on Attack Rolls against you until the start of your next turn. You cannot combine this maneuver with any defensive stance (Parry, Dodge, Shield Stance, etc.).",
    },
    {
        id: "guard-melee",
        name: "Guard (Melee)",
        description: "Free Basic Melee Attack each time an enemy enters reach.",
        slot: "attack",
        category: "combat-action",
        tags: ["combat-action", "control", "melee"],
        requirements: {
            requiresMeleeWeapon: true,
        },
        effect: "Focus on controlling your reach until your next turn. While Guarding, **each time** an enemy **enters** your melee reach, you may spend your **Reaction** to immediately make **one Basic Melee Attack** against them (no Power; weapon damage + passives + active buffs only). You may do this multiple times per round if you have additional Reactions, but each attack costs 1 Reaction.",
    },
    {
        id: "oversight",
        name: "Oversight (Ranged Overwatch)",
        description: "Free Basic Ranged Attack on a triggered creature/zone.",
        slot: "attack",
        category: "combat-action",
        tags: ["combat-action", "ranged"],
        requirements: {
            requiresRangedWeapon: true,
        },
        effect: "Choose **one creature** you can see **or** **one zone/lane**. Until your next turn, when your chosen trigger occurs, you may spend your **Reaction** to immediately make **one Basic Ranged Attack** (no Power; weapon damage + passives + active buffs only). Multiple shots per round if you have additional Reactions, but each shot costs 1 Reaction. **Trigger choices:** the target moves (leaves cover / enters line of sight / enters your zone), or a creature enters your chosen zone.",
    },
    // ========================================
    // INITIATIVE: DELAY
    // (Players Guide 6968–6984 — declared at the start of your turn.)
    // ========================================
    {
        id: "initiative-delay",
        name: "Initiative: Delay",
        description: "Skip your turn; act after another creature finishes.",
        slot: "utility",
        category: "advanced-special",
        tags: ["initiative", "delay"],
        effect: "Trigger at the start of your turn: skip and act immediately after any other creature finishes its turn. Your Initiative permanently changes to that position. Delaying past the round boundary carries the turn into the next round; you may take it after any creature's turn but never interrupt one. If you were last to act, your new Initiative becomes (highest Initiative + 1). You cannot delay if Incapacitated or Surprised; if you delay past your next natural turn, you lose that turn.",
    },
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
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
 * Combat slot types - which turn resource the maneuver consumes
 */
export type CombatSlot = "attack" | "movement" | "utility" | "reaction";

/**
 * Maneuver category - fine-grained subtype for organization
 */
export type ManeuverCategory =
  | "movement"
  | "defensive-reaction"
  | "support-reaction"
  | "tactical-reaction"
  | "combat-action"
  | "advanced-special";

/**
 * Requirements for using a maneuver
 */
export interface ManeuverRequirements {
  requiresShield?: boolean;
  requiresMeleeWeapon?: boolean;
  requiresReach?: boolean;
  requiresTwoHanded?: boolean;
  requiresRangedWeapon?: boolean;
  requiresFreeHand?: boolean;
  requiresProne?: boolean;
  requiresStanding?: boolean;
  minAttribute?: {
    attribute: string;
    value: number;
  };
}

/**
 * Combat Maneuver definition
 */
export interface CombatManeuver {
  id: string;                 // Stable internal id, e.g. "dash", "parry-stance"
  name: string;               // Rules name exactly as in the book
  description: string;        // Short description based on the rules text
  slot: CombatSlot;           // Which turn resource it consumes
  category: ManeuverCategory; // Fine-grained subtype
  tags: string[];             // e.g. ["stance", "defensive"], ["movement"], ["opportunity-attack"]
  requirements?: ManeuverRequirements;
  effect?: string;            // Detailed effect description
  cost?: {
    stones?: number;         // Attribute Stones cost (if any)
    charges?: number;         // Mastery Charges cost (if any)
  };
}

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
export const COMBAT_MANEUVERS: CombatManeuver[] = [
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
    effect:
      "Move up to your Speed this turn. Movement provokes Opportunity Attacks as normal. You may draw or sheathe a weapon as part of your Movement.",
  },
  {
    id: "dash",
    name: "Dash",
    description: "Focus entirely on movement (2× Speed).",
    slot: "movement",
    category: "movement",
    tags: ["movement", "speed"],
    effect:
      "Move up to **2× your normal Speed** this turn. You cannot perform your base Attack Action, but you may still buy additional attacks using Stones. Movement provokes Opportunity Attacks as normal.",
  },
  {
    id: "disengage",
    name: "Disengage",
    description: "Withdraw without provoking Opportunity Attacks.",
    slot: "movement",
    category: "movement",
    tags: ["movement", "defensive"],
    effect:
      "Move up to your normal Speed this turn **without provoking Opportunity Attacks**. You cannot perform your base Attack Action this turn (unless granted by a Stone).",
  },
  {
    id: "quick-load",
    name: "Quick Load",
    description: "Spend Movement to perform Reload (1).",
    slot: "movement",
    category: "movement",
    tags: ["movement", "reload"],
    requirements: {
      requiresFreeHand: true,
    },
    effect:
      "Instead of moving, spend your Movement to perform **Reload (1)**. You may convert Movement into Reload multiple times per turn (max **MR** total Reload per turn). Requires a free hand and the ability to manipulate the weapon/ammunition. You cannot Quick Load while Immobilized/Restrained.",
  },
  {
    id: "stand-up",
    name: "Stand Up",
    description: "Recover from Prone (costs 1 Attack Action).",
    slot: "attack",
    category: "movement",
    tags: ["movement", "prone"],
    requirements: {
      requiresProne: true,
    },
    effect:
      "Standing up costs **one Attack Action** but does not limit your movement. You may move normally after standing. Standing up itself does not provoke Opportunity Attacks; only the movement you take afterward might.",
  },

  // ========================================
  // ESCAPE RULE
  // (Players Guide 6859–6870)
  // ========================================
  {
    id: "flee",
    name: "Flee",
    description: "Escape danger at 4× Speed.",
    slot: "movement",
    category: "movement",
    tags: ["movement", "escape"],
    effect:
      "Move up to **4× your normal Speed** directly away from danger. You cannot make Attacks, take Reactions, or spend Stones until the start of your next turn. This movement provokes Opportunity Attacks as normal (unless you used Disengage this turn). The GM may immediately transition into a chase / escape resolution if appropriate.",
  },

  // ========================================
  // DEFENSIVE REACTIONS
  // (Players Guide 6874–6884)
  // ========================================
  {
    id: "parry",
    name: "Parry",
    description: "Contest a melee hit with your weapon.",
    slot: "reaction",
    category: "defensive-reaction",
    tags: ["reaction", "defensive", "melee"],
    requirements: {
      requiresMeleeWeapon: true,
    },
    effect:
      "When hit by a melee attack, roll a Contest (Weapon Skill + Might/Agility vs. Attack Roll). On success, the attack is deflected. Requires a melee weapon.",
  },
  {
    id: "dodge",
    name: "Dodge",
    description: "Raise your TN to be hit by MR × 4.",
    slot: "reaction",
    category: "defensive-reaction",
    tags: ["reaction", "defensive", "evasion"],
    effect:
      "When targeted by **any attack**, raise your TN to be hit by **Mastery Rank × 4** until the attack resolves.",
  },
  {
    id: "block",
    name: "Block (Shield)",
    description: "Raise your TN to be hit by MR × 4 (shield).",
    slot: "reaction",
    category: "defensive-reaction",
    tags: ["reaction", "defensive", "shield"],
    requirements: {
      requiresShield: true,
    },
    effect:
      "When targeted by **any attack**, raise your TN to be hit by **Mastery Rank × 4**. Requires a shield.",
  },
  {
    id: "dive-for-cover",
    name: "Dive for Cover",
    description: "Move 2 × MR m to escape an AoE.",
    slot: "reaction",
    category: "defensive-reaction",
    tags: ["reaction", "defensive", "movement"],
    effect:
      "When an AoE is placed and you are inside its area, you may spend your Reaction to immediately move up to **2 × your Mastery Rank meters**. If this movement takes you completely outside the AoE, you are not affected by that AoE's damage or payload. If you remain inside, the AoE affects you normally. This does **not** provoke Opportunity Attacks.",
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
    effect:
      "When an ally within **8 m** makes an Attack, Save, or Skill check, give them **+2 flat bonus**. Must be justified in roleplay.",
  },
  {
    id: "interpose",
    name: "Interpose",
    description: "Take half of an adjacent ally's damage.",
    slot: "reaction",
    category: "support-reaction",
    tags: ["reaction", "support", "protection"],
    effect:
      "When an ally within **2 m** takes damage, you may step in and take **half of it**.",
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
    effect:
      "When an enemy **leaves your melee reach** by movement, you may spend your Reaction to immediately make **one Basic Melee Attack** against them. This attack **cannot use a Power** — it deals weapon damage + passives + active buffs only.",
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
    effect:
      "Stance. Give up **all Attack Actions** this round (including extra Attacks). Roll one Parry Contest; the result becomes your TN vs all melee attacks until your next turn.",
  },
  {
    id: "dodge-stance",
    name: "Dodge Stance",
    description: "Convert Attack Actions into +4 Evade each.",
    slot: "attack",
    category: "combat-action",
    tags: ["stance", "defensive", "evasion"],
    effect:
      "Stance. Convert your Attack Actions into defense. For **each** Attack Action you give up this round, gain **+4 Evade** until your next turn. (You may convert your last remaining Attack Action when using a Stance.)",
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
    effect:
      "Stance. Requires a shield. Your Movement becomes **0 m** until your next turn. For each Attack Action you give up this round, gain **+(Shield Evade modifier, min 0)** to Evade and **+(Armor Value from worn armor)** as temporary Armor until your next turn.",
  },
  {
    id: "grapple",
    name: "Grapple",
    description: "Restrain a creature within reach.",
    slot: "attack",
    category: "combat-action",
    tags: ["combat-action", "control", "melee"],
    effect:
      "Attempt to restrain a creature within reach. Contest (Might/Agility Roll + optional HtH Skill vs. Might/Agility Roll + optional HtH Skill). On success, the target is **Grappled**. The target may attempt to end the grapple on their turn; if the grapple remains, you may deal **MR weapon damage dice** to the target.",
  },
  {
    id: "reckless-attack",
    name: "Reckless Attack",
    description: "All-out: Advantage on attacks, enemies have Advantage on you.",
    slot: "attack",
    category: "combat-action",
    tags: ["combat-action", "offensive"],
    effect:
      "When you declare your Attack this round, fight without defense or restraint. Gain **Advantage on all Attack Rolls** against enemies until the start of your next turn. **All enemies gain Advantage** on Attack Rolls against you until the start of your next turn. You cannot combine this maneuver with any defensive stance (Parry, Dodge, Shield Stance, etc.).",
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
    effect:
      "Focus on controlling your reach until your next turn. While Guarding, **each time** an enemy **enters** your melee reach, you may spend your **Reaction** to immediately make **one Basic Melee Attack** against them (no Power; weapon damage + passives + active buffs only). You may do this multiple times per round if you have additional Reactions, but each attack costs 1 Reaction.",
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
    effect:
      "Choose **one creature** you can see **or** **one zone/lane**. Until your next turn, when your chosen trigger occurs, you may spend your **Reaction** to immediately make **one Basic Ranged Attack** (no Power; weapon damage + passives + active buffs only). Multiple shots per round if you have additional Reactions, but each shot costs 1 Reaction. **Trigger choices:** the target moves (leaves cover / enters line of sight / enters your zone), or a creature enters your chosen zone.",
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
    effect:
      "Trigger at the start of your turn: skip and act immediately after any other creature finishes its turn. Your Initiative permanently changes to that position. Delaying past the round boundary carries the turn into the next round; you may take it after any creature's turn but never interrupt one. If you were last to act, your new Initiative becomes (highest Initiative + 1). You cannot delay if Incapacitated or Surprised; if you delay past your next natural turn, you lose that turn.",
  },
];

/**
 * Get all maneuvers available to an actor
 * Filters based on requirements and actor capabilities
 */
export function getAvailableManeuvers(actor: any): CombatManeuver[] {
  const available: CombatManeuver[] = [];

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
export function getManeuversBySlot(slot: CombatSlot, actor?: any): CombatManeuver[] {
  const maneuvers = actor ? getAvailableManeuvers(actor) : COMBAT_MANEUVERS;
  return maneuvers.filter(m => m.slot === slot);
}

/**
 * Get maneuvers by category
 */
export function getManeuversByCategory(category: ManeuverCategory, actor?: any): CombatManeuver[] {
  const maneuvers = actor ? getAvailableManeuvers(actor) : COMBAT_MANEUVERS;
  return maneuvers.filter(m => m.category === category);
}

/**
 * Get a specific maneuver by ID
 */
export function getManeuverById(id: string): CombatManeuver | undefined {
  return COMBAT_MANEUVERS.find(m => m.id === id);
}

/**
 * Check if an actor meets the requirements for a maneuver
 */
function meetsRequirements(actor: any, maneuver: CombatManeuver): boolean {
  if (!maneuver.requirements) {
    return true;
  }

  const req = maneuver.requirements;
  const system = actor.system || {};
  const items = (actor.items || []) as any[];

  // Check shield requirement
  if (req.requiresShield) {
    const hasShield = items.some(item => 
      item.type === 'armor' && 
      (item.system as any)?.armorType === 'shield'
    );
    if (!hasShield) return false;
  }

  // Check melee weapon requirement
  if (req.requiresMeleeWeapon) {
    const hasMelee = items.some(item => 
      item.type === 'weapon' && 
      (item.system as any)?.weaponType !== 'ranged'
    );
    if (!hasMelee) return false;
  }

  // Check ranged weapon requirement
  if (req.requiresRangedWeapon) {
    const hasRanged = items.some(item => 
      item.type === 'weapon' && 
      (item.system as any)?.weaponType === 'ranged'
    );
    if (!hasRanged) return false;
  }

  // Check two-handed requirement
  if (req.requiresTwoHanded) {
    const hasTwoHanded = items.some(item => 
      item.type === 'weapon' && 
      (item.system as any)?.twoHanded === true
    );
    if (!hasTwoHanded) return false;
  }

  // Check free hand requirement
  if (req.requiresFreeHand) {
    // This is a simplified check - in reality, you'd need to check equipment slots
    // For now, assume it's available if not wielding a two-handed weapon
    const hasTwoHanded = items.some(item => 
      item.type === 'weapon' && 
      (item.system as any)?.twoHanded === true
    );
    if (hasTwoHanded) return false;
  }

  // Check prone requirement
  if (req.requiresProne) {
    const isProne = (system.effects as any)?.prone === true ||
                    actor.getFlag('mastery-system', 'prone') === true;
    if (!isProne) return false;
  }

  // Check standing requirement
  if (req.requiresStanding) {
    const isProne = (system.effects as any)?.prone === true ||
                    actor.getFlag('mastery-system', 'prone') === true;
    if (isProne) return false;
  }

  // Check minimum attribute requirement
  if (req.minAttribute) {
    const attrValue = (system.attributes as any)?.[req.minAttribute.attribute]?.value || 0;
    if (attrValue < req.minAttribute.value) return false;
  }

  return true;
}

/**
 * Get all maneuvers grouped by slot for display
 */
export function getManeuversBySlotGrouped(actor?: any): Record<CombatSlot, CombatManeuver[]> {
  const maneuvers = actor ? getAvailableManeuvers(actor) : COMBAT_MANEUVERS;
  
  return {
    attack: maneuvers.filter(m => m.slot === 'attack'),
    movement: maneuvers.filter(m => m.slot === 'movement'),
    utility: maneuvers.filter(m => m.slot === 'utility'),
    reaction: maneuvers.filter(m => m.slot === 'reaction')
  };
}


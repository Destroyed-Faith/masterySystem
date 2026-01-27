/**
 * Type definitions for Mastery System Items
 */

export interface MasteryItemData {
  type: 'power' | 'masteryNode' | 'echo' | 'schtick' | 'artifact' | 'condition' | 'weapon' | 'armor' | 'shield' | 'gear';
  system: PowerData | MasteryNodeData | EchoData | SchtickData | ArtifactData | ConditionData | WeaponData | ArmorData | ShieldData | GearData;
}

// === Base Item Data (common to all items) ===
export interface BaseItemData {
  description: string;
  inventorySize: string; // e.g., "1x1", "2x1", "L", "2x2", etc.
  baseDamage: string; // e.g., "1d8", "2d8", "3d8", "4d8", "5d8" or empty
  specials: string[]; // Maximum 3 specials
}

// === Artifact Power Data (powers embedded in artifacts) ===
export interface ArtifactPowerData {
  name: string;
  powerType: 'active' | 'buff' | 'utility' | 'passive' | 'reaction' | 'movement';
  level: number;
  tree: string;
  tags: string[]; // Can include "spell", "charged", etc.
  range: string;
  aoe: string;
  duration: string;
  effect: string;
  specials: string[];
  ap: number;
  cost: {
    action: boolean;
    movement: boolean;
    reaction: boolean;
    stones: number;
    charges: number;
  };
  roll: {
    attribute: string;
    tn: number;
    damage: string;
    healing: string;
    raises: string;
  };
  requirements: {
    masteryRank: number;
    other: string;
  };
}

// === Power Data ===
export interface PowerData extends BaseItemData {
  powerType: 'active' | 'buff' | 'utility' | 'passive' | 'reaction' | 'movement';
  level: number;
  tree: string;
  tags: string[];
  range: string;
  aoe: string;
  duration: string;
  effect: string;
  ap: number;
  cost: {
    action: boolean;
    movement: boolean;
    reaction: boolean;
    stones: number;
    charges: number;
  };
  roll: {
    attribute: string;
    tn: number;
    damage: string;
    healing: string;
    raises: string;
  };
  requirements: {
    masteryRank: number;
    other: string;
  };
}

// === Mastery Node Data ===
export interface MasteryNodeData extends BaseItemData {
  tree: string;
  level: number;
  bonus: string;
  requirements: {
    masteryRank: number;
    prerequisites: string[];
  };
}

// === Echo Data ===
export interface EchoData extends BaseItemData {
  echoType: string;
  traits: string[];
  bonuses: {
    attributes: Record<string, number>;
    skills: Record<string, number>;
    other: string;
  };
  options: any[];
}

// === Schtick Data ===
export interface SchtickData extends BaseItemData {
  manifestation: string;
  masteryRank: number;
  notes: string;
}

// === Artifact Data ===
export interface ArtifactData extends BaseItemData {
  level: number;
  equipped: boolean;
  effects: string[];
  bonuses: {
    attack: number;
    damage: string;
    defense: number;
    specials: string[];
  };
  lore: string;
  requirements: {
    stones: number;
    masteryRank: number;
  };
  powers: ArtifactPowerData[]; // Powers embedded in the artifact
}

// === Condition Data ===
export interface ConditionData extends BaseItemData {
  conditionType: string;
  value: number;
  diminishing: boolean;
  duration: string;
  effect: string;
  save: string;
  removal: string;
}

// === Weapon Data ===
export interface WeaponData extends BaseItemData {
  weaponType: 'melee' | 'ranged';
  damage: string;
  range: string;
  equipped: boolean;
  hands: number;
  innateAbilities: string[];
}

// === Armor Data ===
export interface ArmorData extends BaseItemData {
  type: string;
  armorValue: number;
  skillPenalty?: number;
  equipped: boolean;
}

// === Shield Data ===
export interface ShieldData extends BaseItemData {
  type: string;
  shieldValue: number;
  evadeBonus?: number;
  skillPenalty?: number;
  equipped: boolean;
}

// === Gear Data ===
export interface GearData extends BaseItemData {
  weight: number;
  quantity: number;
  equipped: boolean;
}





































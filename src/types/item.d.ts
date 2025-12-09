/**
 * Type definitions for Mastery System Items
 */

export interface MasteryItemData {
  type: 'special' | 'masteryNode' | 'echo' | 'schtick' | 'artifact' | 'condition' | 'weapon' | 'armor';
  system: SpecialData | MasteryNodeData | EchoData | SchtickData | ArtifactData | ConditionData | WeaponData | ArmorData;
}

// === Special (Power) Data ===
export interface SpecialData {
  description: string;
  powerType: 'active' | 'buff' | 'utility' | 'passive' | 'reaction' | 'movement';
  level: number;
  tree: string;
  tags: string[];
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

// === Mastery Node Data ===
export interface MasteryNodeData {
  description: string;
  tree: string;
  level: number;
  bonus: string;
  requirements: {
    masteryRank: number;
    prerequisites: string[];
  };
}

// === Echo Data ===
export interface EchoData {
  description: string;
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
export interface SchtickData {
  description: string;
  manifestation: string;
  masteryRank: number;
  notes: string;
}

// === Artifact Data ===
export interface ArtifactData {
  description: string;
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
}

// === Condition Data ===
export interface ConditionData {
  description: string;
  conditionType: string;
  value: number;
  diminishing: boolean;
  duration: string;
  effect: string;
  save: string;
  removal: string;
}

// === Weapon Data ===
export interface WeaponData {
  description: string;
  weaponType: 'melee' | 'ranged';
  damage: string;
  range: string;
  specials: string[];
  equipped: boolean;
}

// === Armor Data ===
export interface ArmorData {
  description: string;
  armorValue: number;
  type: string;
  equipped: boolean;
}


















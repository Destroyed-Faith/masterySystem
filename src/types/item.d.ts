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

// === Power Structure Types (New Structure) ===

export type PowerCategory = 'active' | 'activeBuff' | 'utility' | 'reaction' | 'passive' | 'movement';
export type PowerActionCost = 'attack' | 'movement' | 'full' | 'reaction' | 'none' | 'utility';
export type PowerLevelKey = '1' | '2' | '3' | '4';
export type PowerRollKind = string;

export interface RangeSpec {
  kind: 'self' | 'touch' | 'melee' | 'distance';
  m?: number;
  note?: string;
}

export interface AoeSpec {
  shape: 'radius' | 'cone' | 'line' | 'burst' | 'none' | 'single' | 'weapon' | 'aura';
  m?: number;
  radiusM?: number;
  lengthM?: number;
  widthM?: number;
  angleDeg?: number;
  targets?: number;
  note?: string;
}

export interface DurationSpec {
  kind: 'instant' | 'rounds' | 'masteryRounds' | 'masteryRankRounds' | 'untilNextTurn' | 'scene';
  rounds?: number;
  note?: string;
}

export interface EffectSpec {
  text: string;
  dice?: string; // OPTIONAL and has NO TYPE - just untyped dice like "4d8"
}

export interface PowerSpecial {
  key: string;
  rank?: number; // Optional rank/value
  value?: number;
  raiseCost?: number;
  note?: string;
}

export type RaiseUpgrade =
  | { kind: 'rangePlus'; m: number; raiseCost: number }
  | { kind: 'aoeRadiusPlus'; m: number; raiseCost: number }
  | { kind: 'specialPlus'; key: string; delta: number; raiseCost: number }
  | { kind: 'custom'; text: string; raiseCost: number };

export interface PowerLevelRow {
  type: string; // Table "Type" column like "Melee", "Ranged", "Buff", or "Passive, Defensive" etc
  range: RangeSpec | null;
  aoe: AoeSpec | null;
  duration: DurationSpec;
  effect: EffectSpec;
  specials: Array<{ key: string; rank?: number; value?: number; raiseCost?: number; note?: string }>;
  trigger?: string;
  lvl?: number;
}

export interface PowerCostLimit {
  per: 'round' | 'combat' | 'day' | 'week';
  uses: number;
}

export interface PowerCost {
  action?: PowerActionCost;
  stones?: number;
  charges?: number;
  limit?: PowerCostLimit;
}

// Embedded Power Data (for artifacts and trees)
export interface EmbeddedPowerData {
  id?: string;
  name: string;
  /** Narrative flavor copied to power items when added to a character */
  fluff?: string;
  category: PowerCategory;
  tags: string[]; // e.g. "spell", "charged", etc
  cost: PowerCost;
  trigger?: string; // mainly for reaction/passive
  roll?: {
    kind: PowerRollKind;
    attribute?: string;
    vs?: string;
  };
  levels: Record<PowerLevelKey, PowerLevelRow>;
}

// Legacy alias for backwards compatibility
export interface NewArtifactPowerData extends EmbeddedPowerData {
  rank?: number; // Legacy field - kept for backwards compatibility
}

// === Legacy Artifact Power Data (for backwards compatibility) ===
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

// === Power Data (Item-level Power, supports both old and new format) ===
export interface PowerData extends BaseItemData {
  // Legacy fields (for backwards compatibility)
  powerType?: 'active' | 'buff' | 'utility' | 'passive' | 'reaction' | 'movement';
  level?: number;
  tree?: string;
  tags?: string[];
  /** Ranged attack powers: opt in to Threatened Ranged (disadvantage + OA window) like weapons */
  threatenedRanged?: boolean;
  range?: string;
  aoe?: string;
  duration?: string;
  effect?: string;
  ap?: number;
  cost?: {
    action: boolean;
    movement: boolean;
    reaction: boolean;
    stones: number;
    charges: number;
  };
  roll?: {
    attribute: string;
    tn: number;
    damage: string;
    healing: string;
    raises: string;
  };
  requirements?: {
    masteryRank: number;
    other: string;
  };
  
  // New structure fields
  category?: PowerCategory;
  rank?: number; // 1–4, aktuelles Level der Power
  minLevel?: number; // Minimum level allowed (baseline from character creation)
  trigger?: string; // für Reactions
  newCost?: {
    action?: PowerActionCost;
    stones?: number;
    charges?: number;
    note?: string;
  };
  newRoll?: {
    kind: PowerRollKind;
    attribute?: string;
    vs?: string;
  };
  levels?: Record<PowerLevelKey, PowerLevelRow>;
  /** Optional narrative flavor (shown above the rank table on the sheet) */
  fluff?: string;
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

export type ArtifactKind = 'weapon' | 'armor' | 'shield' | 'gear';

/** Weapon-shaped stats for an artifact tree node (edited in Node Editor). */
export interface ArtifactWeaponProfile {
  weaponType: 'melee' | 'ranged';
  damage: string;
  range: string;
  hands: number;
  innateAbilities: string[];
  specials: string[];
}

export interface ArtifactArmorProfile {
  type: string;
  armorValue: number;
  evadeModifier: number;
  skillPenalty: string;
}

export interface ArtifactShieldProfile {
  type: string;
  shieldValue: number;
  evadeBonus: number;
  skillPenalty: string;
}

// === Artifact Data ===
export interface ArtifactData extends BaseItemData {
  level: number;
  equipped: boolean;
  effects: string[];
  /** Legacy flat bonuses; kept for migration / folder sync until fully unused. */
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
  powers: (EmbeddedPowerData | NewArtifactPowerData | ArtifactPowerData)[]; // Powers embedded in the artifact (supports both old and new format)
  /** What kind of item this node represents (drives which profile fields apply). */
  artifactKind?: ArtifactKind;
  /** When artifactKind is gear: paperdoll slot key (helmet, ring1, belt, …). */
  gearSlot?: string;
  artifactWeapon?: ArtifactWeaponProfile;
  artifactArmor?: ArtifactArmorProfile;
  artifactShield?: ArtifactShieldProfile;
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
  /** Non-empty = may be equipped only to these paperdoll slots. Empty/missing = not equippable. */
  equipSlots?: string[];
}

// === Armor Data ===
export interface ArmorData extends BaseItemData {
  type: string;
  armorValue: number;
  evadeModifier: number;
  /** Free text (e.g. −1d8…). Empty uses skill penalty from armor type table. */
  skillPenalty?: string;
  equipped: boolean;
  equipSlots?: string[];
}

// === Shield Data ===
export interface ShieldData extends BaseItemData {
  type: string;
  shieldValue: number;
  evadeBonus?: number;
  skillPenalty?: string;
  equipped: boolean;
  equipSlots?: string[];
}

// === Gear Data ===
export interface GearData extends BaseItemData {
  weight: number;
  quantity: number;
  equipped: boolean;
  equipSlots?: string[];
}





































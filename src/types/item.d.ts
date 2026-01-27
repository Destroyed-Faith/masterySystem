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
export type PowerActionCost = 'attack' | 'utility' | 'reaction' | 'movement' | 'full';
export type PowerRollKind = 'attack' | 'contest' | 'check' | 'none';
export type PowerLevelKey = '1' | '2' | '3' | '4';

export interface RangeSpec {
  kind: 'self' | 'touch' | 'distance';
  m?: number;
  note?: string;
}

export interface AoeSpec {
  shape: 'none' | 'single' | 'line' | 'radius' | 'cone' | 'weapon' | 'aura';
  radiusM?: number;
  lengthM?: number;
  widthM?: number;
  angleDeg?: number;
  targets?: number;
  note?: string;
}

export interface DurationSpec {
  kind: 'instant' | 'rounds' | 'masteryRankRounds' | 'untilNextTurn';
  rounds?: number;
  note?: string;
}

export interface EffectSpec {
  text: string; // UI-Spalte "Effect" (z.B. "Weapon DMG +2d8", "+2d8 Heal", "-1 Attack Die", "Gain 20 Temp HP")
  dice?: string; // optional untyped Xd8 (z.B. "2d8") wenn du es maschinenlesbar brauchst
  tempHpDice?: string; // optional "1d8" etc (ebenfalls untyped)
  flat?: number; // optional für +Armor/+Evade etc
  notes?: string;
}

export interface PowerSpecial {
  key: string; // z.B. "Push", "Shock", "Ignite", "Prone", "Bleeding", "Crit", "Mark"
  value?: number; // Zahl in Klammern, z.B. Push(3) -> 3
  raiseCost: number; // Kosten in Raises, i.d.R. = value, ABER NICHT erzwingen; wir speichern raiseCost explizit
  note?: string;
}

export type RaiseUpgrade =
  | { kind: 'rangePlus'; m: number; raiseCost: number }
  | { kind: 'aoeRadiusPlus'; m: number; raiseCost: number }
  | { kind: 'specialPlus'; key: string; delta: number; raiseCost: number }
  | { kind: 'custom'; text: string; raiseCost: number };

export interface PowerLevelRow {
  lvl: 1 | 2 | 3 | 4; // redundant optional, aber praktisch
  type: string; // exakt Tabellenspalte "Type": bei Actives typischerweise "melee"|"ranged"; bei utility "utility"; bei buff "buff"; reaction "reaction"
  range: RangeSpec;
  aoe: AoeSpec;
  duration: DurationSpec;
  effect: EffectSpec;
  specials: PowerSpecial[]; // das sind die Specials, die über Raises wählbar sind
  raiseUpgrades?: RaiseUpgrade[];
  trigger?: string; // für Reactions: Trigger-Bedingung
}

export interface NewArtifactPowerData {
  name: string;
  category: PowerCategory;
  tags: string[]; // z.B. ["spell","charged"]
  rank: number; // 1–4, aktuelles Level der Power am Item/Char
  trigger?: string; // für Reactions: Trigger-Bedingung
  cost: {
    action: PowerActionCost;
    stones?: number;
    charges?: number; // i.d.R. 1 wenn tag "charged"
    note?: string;
  };
  roll: {
    kind: PowerRollKind;
    attribute?: string; // z.B. "intellect"
    vs?: string; // z.B. "evade" oder "save:body" (nur als text, keine Logik erzwingen)
  };
  levels: Record<PowerLevelKey, PowerLevelRow>;
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
  trigger?: string; // für Reactions
  newCost?: {
    action: PowerActionCost;
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
  powers: (NewArtifactPowerData | ArtifactPowerData)[]; // Powers embedded in the artifact (supports both old and new format)
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





































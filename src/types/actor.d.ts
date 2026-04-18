/**
 * Type definitions for Mastery System Actors
 */

export interface MasteryActorData {
  type: 'character' | 'npc' | 'summon' | 'divine';
  system: CharacterData | NpcData | SummonData | DivineData;
}

// Attribute structure
export interface AttributeData {
  value: number;
  stones?: number;
}

// Mastery progression
export interface MasteryData {
  rank: number;
  points: number;
  experience: number;
}

// Health bar structure
export interface HealthBar {
  name: string;
  max: number;
  current: number;
  penalty: number;
}

// Combat stats
export interface CombatData {
  initiative: number;
  evade: number;
  armor: number;
  speed: number;
  // Derived fields (calculated from equipped items)
  armorTotal?: number;
  evadeTotal?: number;
  /** Short breakdown for UI (equipped armor/shield only). */
  evadeBreakdownHint?: string;
  /** Line items for combat stats UI */
  evadeBreakdownRows?: Array<{ label: string; detail: string; value: number; display: string }>;
  armorBreakdownRows?: Array<{ label: string; detail: string; value: number | null; display: string }>;
  initiativeEquipmentRows?: Array<{ label: string; detail: string; value: number; display: string }>;
  initiativeEquipmentTotal?: number;
  initiativeEquipmentTotalDisplay?: string;
  initiativeMasteryRank?: number;
  armorName?: string;
  shieldName?: string;
  activeWeaponName?: string;
  activeWeaponId?: string;
  armorId?: string;
  shieldId?: string;
}

// Resource tracking
export interface ResourceData {
  value: number;
  max: number;
}

export interface ResourcesData {
  reactions: ResourceData;
  movement: ResourceData;
  actions: ResourceData;
}

// === Character Data ===
/**
 * Echo data attached to a character.
 * `key` identifies the chosen Echo (e.g. 'humans'); sub-choices (Elves lineage,
 * Sentinels order) go into `subChoiceKey`. `veiledFormKey` is Dragonborn-only.
 * Cards and trait uses are tracked as plain dictionaries so daily reset is
 * just `actor.update({ 'system.echo.cardUses': {}, 'system.echo.traitUses': ... })`.
 */
export interface CharacterEchoData {
  key: string;
  subChoiceKey?: string;
  veiledFormKey?: string;
  selectedCardIds: string[];
  cardUses: Record<string, boolean>;
  traitUses: Record<string, number>;
}

export interface CharacterData {
  bio: {
    name: string;
    echo: string;
    concept: string;
    appearance: string;
    notes: string;
  };
  echo?: CharacterEchoData;
  bloodColor?: string; // Hex color for blood pools (e.g., "#8b0000" for dark red)
  attributes: {
    might: AttributeData;
    agility: AttributeData;
    vitality: AttributeData;
    intellect: AttributeData;
    resolve: AttributeData;
    influence: AttributeData;
    wits: AttributeData;
  };
  mastery: MasteryData;
  stones: {
    total: number;
    vitality: number;
    current: number;
    maximum: number;
  };
  health: {
    bars: HealthBar[];
    currentBar: number;
    tempHP: number;
  };
  stress: {
    bars: HealthBar[]; // 4 bars: Healthy, Stressed, Not Well, Breaking
    currentBar: number;
  };
  combat: CombatData;
  resources: ResourcesData;
  skills: Record<string, number>;
  skillsSpent: Record<string, number>;
  /** Chosen minor expression (cantrip) IDs; max length = mastery.rank; each requires attribute ≥ 8; new picks cost Faith Fractures when pool max > 0 */
  minorExpressions?: string[];
  /** Optional: default attribute pool per generic stone power; auto-filled each round when useDefaultsEachRound is true */
  stonePowersPrefs?: {
    useDefaultsEachRound?: boolean;
    defaultAttributesByPowerId?: Record<string, string>;
  };
  saves: {
    vitalitySpent: number;
    vitalityUsesRemaining: number;
  };
  conditions: any[];
  notes: {
    schticks: string;
    faithFractures: string;
    background: string;
  };
  // XP system (unified currency)
  points?: {
    xp?: number;
  };
  xp?: {
    totalEarned: number;
    totalSpent: number;
    spentAttributes: number;
    /** Post-creation floor per attribute (set at finalize; used for XP refunds). */
    attributeBaselines?: Record<string, number>;
    /** Immutable snapshot after creation (attributes, skills, powers); used for GM progression reset. */
    postCreationProgress?: {
      attributes: Record<string, number>;
      skills: Record<string, number>;
      skillsSpent: Record<string, number>;
      powerLevels: Record<string, number>;
    };
    history: Array<{
      ts: number;
      userId: string;
      userName: string;
      kind: "grant" | "spend" | "adjust";
      category: "xp" | "attribute" | "skill" | "power";
      amount: number;
      note?: string;
      details?: any;
      before: { available: number; totalEarned: number; totalSpent: number; spentAttributes: number; };
      after: { available: number; totalEarned: number; totalSpent: number; spentAttributes: number; };
    }>;
  };
  // Derived tracked resources for Combat Carousel module
  tracked?: {
    hp?: ResourceData;
    stress?: ResourceData;
    stones?: ResourceData;
  };
}

// Status effect structure
export interface StatusEffect {
  name: string;
  value?: number | null;
  source?: string;
  timestamp?: number;
}

/** One special on an NPC attack (multiple per power). */
export interface NpcAttackSpecialEntry {
  special?: string;
  specialValue?: number;
}

// Attack Value structure for NPCs
export interface AttackValue {
  name?: string;
  /** @deprecated Legacy — prefer attackDiceCount */
  attackDice?: string;
  /** @deprecated Legacy — prefer damageDiceCount */
  damage?: string;
  /** Attack pool: d8 count (sheet dropdown 2–16) */
  attackDiceCount?: number;
  /** Damage pool: d8 count (sheet dropdown 4–16) */
  damageDiceCount?: number;
  /** Multiple specials on this attack */
  specials?: NpcAttackSpecialEntry[];
  /** @deprecated Single special — migrated to specials[] in UI; still read for old data */
  special?: string;
  specialValue?: number;
  /** @deprecated */
  armor?: string;
  /** @deprecated */
  autoApplySpecial?: boolean;
  /** @deprecated */
  autoRaises?: number;
}

/** NSC default weapon attack (always first in radial); extras live in attackValues. */
export interface NpcBaseAttack extends Partial<AttackValue> {
  name?: string;
  attackDiceCount?: number;
  damageDiceCount?: number;
  specials?: NpcAttackSpecialEntry[];
}

/** NSC-wide specials for damage / raise UI (with optional auto-apply). */
export interface NpcListedSpecial {
  name: string;
  value?: string | number;
  auto?: boolean;
}

// Phase structure for Boss NPCs
export interface BossPhase {
  name: string; // e.g., "Phase 1", "Phase 2"
  health: {
    bars: HealthBar[];
    currentBar: number;
    tempHP: number;
  };
  combat: CombatData;
  savingThrows?: {
    body: number;
    mind: number;
    spirit: number;
  };
  attackValues?: AttackValue[];
  /** Basis-Waffenangriff (immer verfügbar); attackValues = weitere Powers. */
  npcBaseAttack?: NpcBaseAttack;
  statusEffects?: StatusEffect[];
  divineCombat?: {
    startingPool: number;
    regeneration: number;
    basisAttack: number;
    basisDefense: number;
    vitality?: number;
  };
}

// === NPC Data ===
export interface NpcData {
  bloodColor?: string; // Hex color for blood pools (e.g., "#8b0000" for dark red)
  bio: {
    name: string;
    type: string;
    faction: string;
    description: string;
  };
  attributes: {
    might: AttributeData;
    agility: AttributeData;
    vitality: AttributeData;
    intellect: AttributeData;
    resolve: AttributeData;
    influence: AttributeData;
    wits: AttributeData;
  };
  mastery: {
    rank: number;
  };
  health: {
    bars: HealthBar[];
    currentBar: number;
    tempHP: number;
  };
  combat: CombatData;
  resources: ResourcesData;
  skills: Record<string, number>;
  savingThrows?: {
    body: number;
    mind: number;
    spirit: number;
  };
  attackValues?: AttackValue[];
  /** Basis-Waffenangriff; attackValues = weitere Powers. */
  npcBaseAttack?: NpcBaseAttack;
  phases?: BossPhase[]; // For boss NPCs with multiple phases
  /** Which phase is active for radial attacks / shared lists (0-based). */
  npcActivePhaseIndex?: number;
  /** How many attack actions this NPC has per round (minimum 1). */
  attackSlots?: number;
  /** Movement actions per round in combat (default 1). */
  npcMovementSlots?: number;
  /** Reference list: specials tied to the creature (optional auto-apply). */
  npcCombatSpecials?: NpcListedSpecial[];
  /** Reference list: specials typically spent with raises (optional auto-apply). */
  npcRaiseSpecials?: NpcListedSpecial[];
  conditions: any[];
  statusEffects?: StatusEffect[];
  notes: string;
  divineCombat?: {
    startingPool: number;
    regeneration: number;
    basisAttack: number;
    basisDefense: number;
    vitality?: number;
  };
  // Derived tracked resources for Combat Carousel module
  tracked?: {
    hp?: ResourceData;
    stress?: ResourceData;
    stones?: ResourceData;
  };
}

// === Summon Data ===
export interface SummonData {
  bio: {
    name: string;
    summonType: string;
    duration: string;
    description: string;
  };
  attributes: {
    might: { value: number };
    agility: { value: number };
    vitality: { value: number };
    wits: { value: number };
  };
  health: {
    current: number;
    maximum: number;
  };
  combat: {
    evade: number;
    armor: number;
    speed: number;
  };
  abilities: any[];
  notes: string;
}

// === Divine Entity Data ===
export interface DivineData {
  bio: {
    name: string;
    title: string;
    description: string;
  };
  stones: {
    vitality: number;
    pool: number;
  };
  divineClash: {
    attack: number;
    defense: number;
    overhang: number;
  };
  artifacts: any[];
  notes: string;
}


































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
  /** Reserved; passive armor/evade no longer feeds sheet totals. */
  armorFromMechanics?: number;
  evadeFromMechanics?: number;
  /** Active-buff armor bonus (not in sheet base total; applied at hit resolution). */
  armorFromActiveBuffs?: number;
  /** Active-buff evade bonus (not in sheet base total; applied at hit resolution). */
  evadeFromActiveBuffs?: number;
  /** Passive + slotted Ward spell resistance (applied vs Spell-tagged attacks). */
  spellResistanceTotal?: number;
  /** Active-buff spell resistance (stacks with spellResistanceTotal at resolution). */
  spellResistanceFromActiveBuffs?: number;
  /** Flat Initiative from slotted passives (added to initial Initiative Score). */
  initiativeFromMechanics?: number;
  initiativeD8FromMechanics?: number;
  /**
   * Aggregated percentage-based Damage Reduction, applied AFTER flat Armor
   * on incoming damage. Gated by the closed DR subsystem: Buff/Reaction
   * contributions only count if a Passive DR source is active. Clamped 0–100.
   */
  damageReductionPct?: number;
  /** Per-source rows for the DR breakdown UI. */
  damageReductionRows?: Array<{ label: string; detail: string; value: number; display: string }>;
  /** Equipped artifact body armor weight class (light / medium / heavy). */
  artifactBodyArmorClass?: 'light' | 'medium' | 'heavy';
  artifactBodyArmorTypeLabel?: string;
  /** Total d8 removed from physical skill pool (mundane + artifact). */
  physicalSkillPenaltyDice?: number;
  physicalSkillPenaltyDisplay?: string;
}

/** Sense Slot + granted special Combat Senses (Players Guide). */
export interface CombatSensesData {
  activeSenseId: string;
  grantedSenseIds: string[];
  passiveSenseIds: string[];
  hasDarkvision?: boolean;
}

/** One line in a mechanics breakdown (source name + numeric value). */
export interface MechanicsBreakdownEntry {
  source: string;
  value: number;
}

/**
 * Full aggregator output stored at `actor.system.derived.mechanicsBreakdown`.
 * Drives the transparent UI ("why is my Armor 6?") and the roll-bonus
 * registry consumed by `src/dice/roll-handler.ts`.
 */
/** Dice or flat healing formula from mechanics (display-only in breakdown). */
export interface MechanicsBreakdownDiceStringEntry {
  source: string;
  value: string;
}

/** Declarative mechanics not yet folded into numeric totals (modify / next-hit). */
export interface MechanicsBreakdownNoteEntry {
  source: string;
  text: string;
}

export interface MechanicsBreakdown {
  armor: MechanicsBreakdownEntry[];
  evade: MechanicsBreakdownEntry[];
  initiative: MechanicsBreakdownEntry[];
  initiativeD8: MechanicsBreakdownEntry[];
  movementBonus: MechanicsBreakdownEntry[];
  regen: MechanicsBreakdownEntry[];
  spellResistance: MechanicsBreakdownEntry[];
  cleanseMaintenance: MechanicsBreakdownEntry[];
  tempHP: Array<{ source: string; value: string }>;
  /** Heal dice or flat strings from `PowerMechanics.healing` (not summed numerically). */
  healing: MechanicsBreakdownDiceStringEntry[];
  /** Declared `modifySpecial` lines for transparency / future automation. */
  modifySpecialDeclared: MechanicsBreakdownNoteEntry[];
  /** Declared `grantNextHitEffect` summaries. */
  grantNextHitDeclared: MechanicsBreakdownNoteEntry[];
  rollDice: {
    attack: MechanicsBreakdownEntry[];
    skill: MechanicsBreakdownEntry[];
    damage: MechanicsBreakdownEntry[];
  };
  /**
   * Percentage-based Damage Reduction rows, split by gate tier so the UI
   * can explain "Buff DR ignored (no Passive base)".
   */
  damageReductionPct: {
    passive: MechanicsBreakdownEntry[];
    buff: MechanicsBreakdownEntry[];
    reaction: MechanicsBreakdownEntry[];
  };
  totals: {
    armor: number;
    evade: number;
    initiative: number;
    initiativeD8: number;
    movementBonus: number;
    regen: number;
    spellResistance: number;
    cleanseMaintenance: number;
    /** Final DR % after gating and clamping (0–100). */
    damageReductionPct: number;
    rollDice: { attack: number; skill: number; damage: number };
  };
}

export interface DerivedData {
  mechanicsBreakdown?: MechanicsBreakdown;
  buffMechanicsBreakdown?: MechanicsBreakdown;
}

/**
 * Player-authored manual adjustments applied on top of the computed stats.
 *
 * All fields are **additive** — zero (the default) means "no override". They
 * are surfaced as explicit "Manual Bonus" rows in the combat breakdowns and as
 * bonus dice / flat adds in the roll pipeline, so the source of the change is
 * always visible in the UI.
 *
 * Roll bonuses:
 *  - `rolls.any`    applies to every `masteryRoll` that has a non-generic
 *                   `rollKind` (attack / skill).
 *  - `rolls.attack` / `rolls.skill` stack on top of `rolls.any`.
 *  - `rolls.damage` only affects damage dice (resolved via `damage-dialog`).
 *
 * Health / stress:
 *  - `health.barMaxBonus` is added to **every** health-bar max (Healthy /
 *    Bruised / Injured / Wounded). Current HP is rescaled to preserve the
 *    bar-fill ratio.
 *  - `stress.barMaxBonus` is added to every stress-bar max (Healthy /
 *    Stressed / Not Well / Breaking).
 */
export interface ManualRollBonus {
  /** Flat additive bonus to the roll's final total. */
  flat: number;
  /** Extra d8 (mastery-dice) added to the roll pool. */
  dice: number;
}

export interface ManualAdjustments {
  combat: {
    armor: number;
    evade: number;
    damageReductionPct: number;
    initiative: number;
  };
  rolls: {
    any: ManualRollBonus;
    attack: ManualRollBonus;
    skill: ManualRollBonus;
    damage: ManualRollBonus;
  };
  health: {
    barMaxBonus: number;
  };
  stress: {
    barMaxBonus: number;
  };
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
  combatSenses?: CombatSensesData;
  resources: ResourcesData;
  skills: Record<string, number>;
  skillsSpent: Record<string, number>;
  /** Chosen minor expression (cantrip) IDs; max length = mastery.rank; each requires attribute ≥ 8 */
  minorExpressions?: string[];
  /** Optional: default attribute pool per generic stone power; auto-filled each round when useDefaultsEachRound is true */
  stonePowersPrefs?: {
    useDefaultsEachRound?: boolean;
    defaultAttributesByPowerId?: Record<string, string>;
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
    /**
     * Free XP balance. Spent BEFORE regular XP and without the once-per-step
     * bump limit (GM-granted "spend freely" / testing batches). While > 0 the
     * character is in the unrestricted "free phase".
     */
    xpFree?: number;
  };
  xp?: {
    totalEarned: number;
    totalSpent: number;
    /** Lifetime Free XP granted (used as the refund cap for the free pool). */
    freeEarned?: number;
    /** Lifetime Free XP spent. */
    freeSpent?: number;
    /** Post-creation floor per attribute (set at finalize; used for XP refunds). */
    attributeBaselines?: Record<string, number>;
    /** Immutable snapshot after creation (attributes, skills, powers); used for GM progression reset. */
    postCreationProgress?: {
      attributes: Record<string, number>;
      skills: Record<string, number>;
      skillsSpent: Record<string, number>;
      powerLevels: Record<string, number>;
    };
    /**
     * New spec — Upgrade Step state. Each individual Attribute / Skill /
     * Power / Artifact can be bumped at most once per Upgrade Step.
     * Cleared when the GM (or owner) ends the step.
     */
    currentStep?: {
      attributes: string[];
      skills: string[];
      powers: string[];
      artifacts: string[];
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
      before: { available: number; totalEarned: number; totalSpent: number };
      after: { available: number; totalEarned: number; totalSpent: number };
    }>;
  };
  // Derived tracked resources for Combat Carousel module
  tracked?: {
    hp?: ResourceData;
    stress?: ResourceData;
    stones?: ResourceData;
  };
  /** Structured, aggregator-computed derived data (Power Mechanics Engine). */
  derived?: DerivedData;
  /** Player/GM-authored manual adjustments applied on top of computed stats. */
  manual?: ManualAdjustments;
  /** @deprecated V1 familiar bindings — migrated to summonBonds. */
  familiars?: BoundFamiliarRecord[];
  /** Summons V2: universal Summon Bonds. */
  summonBonds?: SummonBondRecord[];
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
  /** Reach (Standard/leer) oder Fernkampf — steuert Radial-Reichweite und Angriffsart. */
  npcRangeKind?: 'melee' | 'ranged' | '' | string;
  /**
   * Reach-Modus: Reach in Metern (1–8, Standard 2).
   * Fern-Modus: maximale Reichweite in Metern (12–24, Standard 24).
   */
  npcRangeMeters?: number;
  /** Fern-Modus: minimale Reichweite in Metern (12–24, Standard 12). */
  npcRangeMinMeters?: number;
  /** AoE-Form für Nah-/Fern (Radial-Metadaten; Nah-Burst nutzt „radius“ + Radius). */
  npcAoeShape?: 'none' | 'radius' | 'cone' | 'line' | string;
  /** AoE-Radius in Metern (wenn npcAoeShape === radius). */
  npcAoeRadiusM?: number;
  /** Wie Split-Attack-Powers: zwei Treffer, Pool & Schaden je floor(Hälfte). */
  npcSplitAttack?: boolean;
  /**
   * Spell-Angriff: TN ist der harte MR-Standard (8 × Mastery Rank + Spell Resistance),
   * nicht Evade.
   */
  npcIsSpell?: boolean;
  /**
   * Wie oft diese Power pro Runde genutzt werden darf (1–5).
   * Verbraucht zusätzlich weiterhin globale attackSlots.
   */
  npcAttacksPerRound?: number;
  /** Stress-Schaden bei Treffer (Nd8, plain — Stress-Armor mindert). */
  npcStressD8?: number;
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
  combatSenses?: CombatSensesData;
  resources: ResourcesData;
  skills: Record<string, number>;
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

// === Summon Data (V2 Bond + legacy familiar link) ===
export interface SummonFamiliarLink {
  familiarId: string;
  ownerActorId: string;
  movementType: 'ground' | 'flying';
  size: string;
  sharedSenses: string[];
  boundStoneCount: number;
}

export interface SummonBondLink {
  bondId: string;
  bodyId: string;
  ownerActorId: string;
  movementMode: 'walking' | 'flying' | 'swimming' | 'climbing';
  sharedSenses: string[];
  boundStoneCount: number;
  dormant: boolean;
}

export interface SummonData {
  bio: {
    name: string;
    summonType: string;
    duration: string;
    description: string;
  };
  /** @deprecated Prefer summonBond. */
  familiar?: SummonFamiliarLink;
  summonBond?: SummonBondLink;
  health: {
    bars: HealthBar[];
    currentBar: number;
    tempHP: number;
  };
  combat: {
    evade: number;
    armor: number;
    speed: number;
  };
  npcBaseAttack?: {
    name: string;
    attackDiceCount: number;
    damageDiceCount: number;
    specials?: unknown[];
  };
  attackValues?: unknown[];
  attackSlots?: number;
  npcMovementSlots?: number;
  notes: string;
}

/** @deprecated V1 familiar record. */
export interface BoundFamiliarRecord {
  id: string;
  name: string;
  img: string;
  movementType: 'ground' | 'flying';
  ownerActorId: string;
  baseStone: { attribute: string };
  upgradeStones: {
    id: string;
    attribute: string;
    picks: [string, string];
  }[];
  sharedSenses: { group: string; attribute: string }[];
  boundStoneCount: number;
  stats: {
    hp: number;
    armor: number;
    evade: number;
    attack: string;
    damage: string;
    movementM: number;
  };
  size: string;
  summonActorId?: string;
  locked: boolean;
}

export interface SummonPowerRef {
  templateId: string;
  level: number;
  tokenCost: number;
  category?: string;
}

export interface SummonBodyRecord {
  id: string;
  hp: number;
  armor: number;
  evade: number;
  sharedSenses: string[];
  powers: SummonPowerRef[];
  dormant: boolean;
  summonActorId?: string;
  hpPurchases?: number;
  armorPurchases?: number;
  evadePurchases?: number;
}

export interface SummonBondRecord {
  id: string;
  name: string;
  img: string;
  expression: string;
  ownerActorId: string;
  boundStoneCount: number;
  stoneAttributes: string[];
  bonusTokens: number;
  movementMode: 'walking' | 'flying' | 'swimming' | 'climbing';
  movementM: number;
  attackDice: number;
  damageDice: number;
  summonAttacks: number;
  specialKey?: string | null;
  specialValue: number;
  selectedSkills: string[];
  skillDiceAlloc: Record<string, number>;
  spend: Record<string, unknown>;
  bodies: SummonBodyRecord[];
  activationTiming: 'before' | 'after';
  needsRedistribution: boolean;
  locked: boolean;
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


































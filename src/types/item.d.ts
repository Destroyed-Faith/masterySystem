/**
 * Type definitions for Mastery System Items
 */

export interface MasteryItemData {
  type: 'power' | 'echo' | 'schtick' | 'artifact' | 'condition' | 'weapon' | 'armor' | 'shield' | 'gear';
  system: PowerData | EchoData | SchtickData | ArtifactData | ConditionData | WeaponData | ArmorData | ShieldData | GearData;
}

// === Base Item Data (common to all items) ===
export interface BaseItemData {
  description: string;
  inventorySize: string; // e.g., "1x1", "2x1", "L", "2x2", etc.
  baseDamage: string; // e.g., "1d8", "2d8", "3d8", "4d8", "5d8" or empty
  specials: string[]; // Maximum 3 specials
}

// === Power Structure Types (New Structure) ===

export type PowerCategory = 'active' | 'activeBuff' | 'reaction' | 'passive' | 'movement';
export type PowerActionCost = 'attack' | 'movement' | 'full' | 'reaction' | 'none';
/** Power rank / spell level (1..16). */
export type PowerLevelKey =
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16';
export type PowerRollKind = string;

/** Casting attribute available when an Active is turned into a Spell. */
export type CastingAttribute = 'intellect' | 'resolve';
/** How a Spell resolves: attack roll vs Evade, or casting roll + target Save. */
export type SpellResolution = 'spellAttack' | 'saveSpell';
/** Save family used when `spellResolution === 'saveSpell'`. */
export type SpellSaveType = 'body' | 'mind' | 'spirit';
/** Tier of the Special slot on an Active damage template (cf. Actives.md). */
export type ActiveSpecialTier = 3 | 4 | 5 | 6;

export interface RangeSpec {
  kind: 'self' | 'touch' | 'melee' | 'distance';
  m?: number;
  note?: string;
}

/** Who is affected inside the AoE (distinct from `targets` = max count). */
export type AoeTargetFilter =
  | 'enemies'
  | 'allies'
  | 'allCreatures'
  | 'self'
  | 'sameAsAttackTarget'
  | 'attacker';

/** Where the AoE is centered (merged primitive: logical `area.center`). */
export type AoeCenter = 'self' | 'targetPoint' | 'targetCreature';

export interface AoeSpec {
  shape: 'radius' | 'cone' | 'line' | 'burst' | 'none' | 'single' | 'weapon' | 'aura' | 'zone';
  m?: number;
  /** Radius or zone size in meters (synonym-friendly with JSON `sizeM`). */
  radiusM?: number;
  /** Optional alias for `radiusM` / primary span in meters (import / docs). */
  sizeM?: number;
  lengthM?: number;
  widthM?: number;
  angleDeg?: number;
  /** Max targets or weapon-style count — not the same as `targetFilter`. */
  targets?: number;
  /** Optional: only enemies, only allies, etc. */
  targetFilter?: AoeTargetFilter;
  /** Optional: self-centered vs point vs creature anchor. */
  center?: AoeCenter;
  note?: string;
}

export interface DurationSpec {
  kind:
    | 'instant'
    | 'endOfTurn'
    | 'untilStartOfNextTurn'
    | 'rounds'
    | 'masteryRounds'
    | 'masteryRankRounds'
    | 'untilNextTurn'
    | 'untilUsed'
    | 'untilBroken'
    | 'scene';
  /** For kind `rounds` (and legacy numeric durations). */
  rounds?: number;
  note?: string;
}

export interface EffectSpec {
  text: string;
  dice?: string; // OPTIONAL and has NO TYPE - just untyped dice like "4d8"
}

/**
 * One applied special on a power row (`specials` array).
 * Canonical persisted form: lowercase `key` + optional `rank` (see `normalizePowerSpecial`).
 * `type` / `value` exist only as import aliases and are stripped on persist.
 */
export interface PowerSpecial {
  key: string;
  /** @deprecated Import-only alias for `key`; use `key` after normalization. */
  type?: string;
  rank?: number;
  /** @deprecated Import-only alias for `rank`; use `rank` after normalization. */
  value?: number;
  raiseCost?: number;
  note?: string;
  /** Default target when not the primary power target, e.g. attacker, self. */
  target?: string;
  /** Machine or narrative condition for this special only. */
  condition?: string;
  duration?: string;
  /** When this special applies, e.g. onHit, onSaveFail. */
  applyOn?: string;
}

export type RaiseUpgrade =
  | { kind: 'rangePlus'; m: number; raiseCost: number }
  | { kind: 'aoeRadiusPlus'; m: number; raiseCost: number }
  | { kind: 'specialPlus'; key: string; delta: number; raiseCost: number }
  | { kind: 'custom'; text: string; raiseCost: number };

/**
 * Suggested `mechanics.trigger` values (extensible string).
 * Document full list in docs/power-structure-new.json.
 */
export type PowerMechanicsTrigger =
  | 'onUse'
  | 'onHit'
  | 'onMiss'
  | 'endOfTurn'
  | 'startOfTurn'
  | 'afterAttack'
  | 'onSaveFail'
  | 'onIgniteTickByYou'
  | (string & {});

export interface PowerLevelRow {
  type: string; // Table "Type" column like "Melee", "Ranged", "Buff", or "Passive, Defensive" etc
  range: RangeSpec | null;
  aoe: AoeSpec | null;
  duration: DurationSpec;
  /**
   * Narrative / UI copy only — never the mechanical source of truth.
   * SoT: `specials`, `aoe`, `range`, `duration`, `mechanics`.
   */
  effect: EffectSpec;
  /** Direct specials applied by this rank (not duplicated under `mechanics`). */
  specials: PowerSpecial[];
  trigger?: string;
  lvl?: number;
  /**
   * Optional structured mechanics block. When present the aggregator in
   * prepareDerivedData() and the roll-handler read numeric/diced bonuses
   * from here instead of parsing `effect.text`. Powers without a mechanics
   * block fall back to purely descriptive behavior (GM-ruling only).
   */
  mechanics?: PowerMechanics;
}

/**
 * Structured, machine-readable description of what a power's effects do at
 * a given rank. This is the Source-of-Truth for the aggregator — `effect.text`
 * stays around for flavor and display, but numeric/diced bonuses live here.
 *
 * Do not duplicate the same direct specials as in `PowerLevelRow.specials`;
 * use `modifySpecial`, `grantNextHitEffect`, `healing`, riders, limits, and gates here.
 *
 * Powers that cannot be reduced to this schema (bespoke auras, narrative
 * compound lines, etc.) simply omit `mechanics` and keep running as they do
 * today (GM-ruling).
 */

/** Structured healing (merged primitive; narrative heal may stay in `effect.text`). */
export interface PowerMechanicsHealing {
  flat?: string;
  target?: string;
  condition?: string;
  trigger?: string;
  maxTargets?: number;
}

export type ModifySpecialMode =
  | 'increaseExisting'
  | 'decreaseExisting'
  | 'setIfHigher'
  | 'consume'
  | 'remove'
  | 'refreshDuration';

/** Modify stacks or duration of an existing special on a creature (declarative / future runtime). */
export interface PowerMechanicsModifySpecial {
  type: string;
  mode: ModifySpecialMode;
  amount?: number;
  minExisting?: number;
  maxValue?: number;
  target?: string;
  condition?: string;
}

/**
 * Next qualifying hit / spell riders (merged primitive; broader than a single special).
 * `specials` may be edited via raw JSON on the mechanics block when needed.
 */
export interface PowerMechanicsGrantNextHitEffect {
  damageRiderFlat?: string;
  specials?: PowerSpecial[];
  expires: string;
  qualifier?: string;
  condition?: string;
}

/**
 * Event-triggered slice of a mechanics block. Each sub-object describes
 * what fires on that specific combat event. Extend by adding new keys as
 * the runtime learns to handle additional triggers — unknown keys are
 * safely ignored by the dispatcher.
 */
export interface PowerMechanicsTriggers {
  /**
   * Fires once per combat for the owning actor, at `combatStart`. Values
   * with a dice-string (e.g. `'1d8'`) are rolled exactly once and the
   * resulting pool is persisted until `combatEnd`. Plain numeric strings
   * (e.g. `'3'`) act the same but without a roll. Non-stacking vs. itself.
   */
  combatStart?: {
    /** Temp HP pool to create. Dice-string or flat numeric string. */
    tempHP?: string;
    /** Phasing charges granted at combat start (passive base). */
    phasingCharges?: number;
  };
  /**
   * Fires at the owning actor's own turn-start. The declared value is
   * interpreted as a refresh floor for *this source only*: the pool is
   * raised to at least the declared number (rolled once per turn for dice
   * strings). Between turn-starts the pool can be reduced to 0 by damage;
   * the next turn-start refreshes again. Non-stacking vs. itself.
   */
  turnStartSelf?: {
    /** Temp HP refresh value. Dice-string or flat numeric string. */
    tempHP?: string;
  };
}

export interface PowerMechanics {
  /** Flat Armor bonus/malus (before equipment scaling). */
  armor?: number;
  /** Flat Evade bonus/malus. */
  evade?: number;
  /** Bonus d8 dice on the initiative roll. */
  initiativeD8?: number;
  /** Temp HP gained when the effect applies, as a dice string (e.g. "1d8") or flat ("3"). */
  tempHP?: string;
  /** HP regen per tick (end of turn / Mastery Rank rounds, per category). */
  regen?: number;

  /**
   * Percentage-based Damage Reduction applied to incoming damage AFTER flat
   * Armor mitigation. Closed subsystem: may only originate from the three
   * sanctioned power lines (`Damage Reduction` passive, `Unyielding Shell`
   * active buff, `Unyielding Intercept` reaction). The aggregator enforces
   * gating rules: Buff/Reaction bonuses only count if a Passive DR source is
   * active; otherwise they contribute 0.
   * Range: 0–100 (percentage points). Aggregated additively per rule table.
   */
  damageReductionPct?: number;

  /**
   * Declares this power as a Split-Attack (2 Strikes). Runtime splits the
   * attack pool and damage pool evenly between the two strikes and creates
   * two independent attack rolls. Power-declared (not a runtime toggle).
   */
  splitAttack?: boolean;

  /**
   * Declares this power as Autofire. This is an attack *mode*, not a Special:
   * it does not appear in the Raise-Special catalog. The attacker makes one
   * attack roll against a primary target and may declare up to `extraTargets`
   * additional targets at the cost of +1 Raise each.
   */
  autofire?: {
    extraTargets: number;
  };

  /**
   * Phasing subsystem — a premium, closed defensive axis. Only the three
   * sanctioned powers (`Ghostform` passive, `Ghost Mantle` active buff,
   * `Ghost Slip` reaction) may declare this field. The passive grants base
   * charges at combat start, the buff augments existing charges by +1 (only
   * if a passive base already exists), the reaction grants one charge for
   * exactly the triggering hit.
   */
  phasing?: {
    /** Passive: grant N base charges on combatStart. Idempotent per combat. */
    combatStart?: { charges: number };
    /** Active buff: add N charges to an existing passive base. */
    augment?: { addCharges: number };
    /** Reaction: grant one charge for exactly the triggering attack. */
    reactionSingleHit?: boolean;
  };

  /**
   * Auto-fail condition metadata — declarative mapping from this condition
   * (when present on an actor) to forced skill/attack fails. Currently only
   * `Blinded` (sight) consumes this at runtime via `autoFail.checkTags`; the
   * `attackDicePenalty` is applied to any attack whose weapon/power carries
   * a matching tag, and the penalty scales with condition rank.
   * Status-effect keyed; not a power-level mechanic.
   */
  autoFail?: {
    /** Force check failure if the check carries any of these tags. */
    checkTags?: string[];
    /** Subtract `perRank * rank` attack dice for sight-based / tagged attacks. */
    attackDicePenalty?: { tags: string[]; perRank: number };
  };

  /**
   * Action-lock metadata for conditions like Stunned. Subtracts from the
   * actor's available attack actions for the current round (clamp ≥ 0).
   * Status-effect keyed; not a power-level mechanic.
   */
  actionLock?: {
    /** Attack actions lost; 'perRank' means condition rank, number is flat. */
    attackActions: 'perRank' | number;
  };

  /** Generic heal dice or flat (aggregator lists under breakdown.healing). */
  healing?: PowerMechanicsHealing;

  /** Change an existing special stack (Walking Furnace, cleanse, consume Bulwark, …). */
  modifySpecial?: PowerMechanicsModifySpecial;

  /**
   * Prepared rider on next qualifying hit/spell. Automatic combat application is not
   * implied — stored for tooling, editor, and future roll pipeline.
   */
  grantNextHitEffect?: PowerMechanicsGrantNextHitEffect;

  /** When this block’s non-damage effects fire, if distinct from row `trigger`. */
  trigger?: PowerMechanicsTrigger;

  /**
   * Free-form condition when `condition` enum is insufficient. Do not set both
   * `condition` and `conditionExpr` for the same gate; persist strips `conditionExpr` if `condition` is set.
   */
  conditionExpr?: string;

  /**
   * @deprecated Import-only alias for `usageLimit`. Stripped on persist; use `usageLimit` only.
   */
  triggerLimit?: { per: 'round' | 'combat' | 'day'; max: number };

  /** Dice-pool bonus/malus for saving throws, keyed by save family. */
  saveDice?: { body?: number; mind?: number; spirit?: number };
  /** Dice-pool bonus/malus for specific roll kinds (attack, skill, damage). */
  rollDice?: { attack?: number; skill?: number; damage?: number };

  /**
   * Optional damage rider applied when attacking with this power (or when
   * another active power of the actor rolls damage — context-dependent
   * based on applyWhen).
   */
  damageRider?: {
    flat?: string;                                                        // "+1d8"
    vsCondition?: 'marked' | 'ignited' | 'shocked' | 'frozen' | 'hexed';  // only when target has condition
    vsConditionDamage?: string;                                           // "+2d8" extra under condition
  };

  /** Flat movement bonus in meters. */
  movementBonus?: number;
  /** Ignore difficult-terrain movement penalties. */
  ignoreTerrain?: boolean;

  /**
   * Event-based triggers for this mechanics block. Where the top-level
   * fields (`armor`, `evade`, …) describe *continuous* modifiers while
   * `applyWhen` is satisfied, `triggers.*` declares discrete effects that
   * fire on a specific combat event and may persist with their own
   * lifetime (e.g. a once-per-combat Temp HP roll that survives until
   * combat end).
   *
   * Currently implemented consumers (see `src/combat/passive-triggers.ts`):
   * - `combatStart.tempHP`: rolled once at combat start, kept until combat
   *   end. Non-stacking vs. itself.
   * - `turnStartSelf.tempHP`: refreshed on the owner's turn-start to at
   *   least the declared value. Non-stacking vs. itself.
   *
   * Future-reserved (declarative only, no runtime yet): `turnEndSelf`,
   * `roundStart`, `onceHexedHitPerRound`.
   */
  triggers?: PowerMechanicsTriggers;

  /**
   * When this mechanics block is active.
   * - passive-slotted-active: Passive sitting in a slot that is toggled active.
   * - activeBuff-active: An ActiveEffect flagged activeBuff is currently running.
   * - reaction-once-per-round: Applies when the reaction triggers; limited to 1/round.
   * - attack-rider: Only applies when the actor makes this specific power's attack.
   * - manual: GM applies at their discretion; aggregator ignores unless force-flagged.
   */
  applyWhen:
    | 'passive-slotted-active'
    | 'activeBuff-active'
    | 'reaction-once-per-round'
    | 'attack-rider'
    | 'manual';

  /** Duration family (ignored for passive-slotted-active — those run as long as active). */
  duration?: 'masteryRankRounds' | 'untilNextTurn' | 'scene' | 'instant';

  /** Per-round / per-combat / per-day usage limit (e.g. "first time each round"). */
  usageLimit?: { per: 'round' | 'combat' | 'day'; max: number };

  /** Gate the whole mechanics block behind a condition on the target/self. */
  condition?:
    | 'targetMarked'
    | 'targetIgnited'
    | 'targetShocked'
    | 'targetFrozen'
    | 'targetHexed'
    | 'self-hp-below-50'
    | null;
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

/** Slot on an Active template declaring which Specials can be chosen at item creation. */
export interface ActiveSpecialSlot {
  tier: ActiveSpecialTier;
  eligibleSpecialKeys: string[];
}

/** The Special the user picked when adding an Active variant from the catalog. */
export interface ChosenSpecial {
  key: string;
  tier: ActiveSpecialTier;
}

/** Template-side hints that pre-fill the Spell configuration when an Active is
 *  turned into a Spell. Never persisted on the Item, lives only on the template. */
export interface SpellHints {
  defaultResolution: SpellResolution;
  defaultSaveType?: SpellSaveType;
  /** Future: map a chosenSpecial.key → casting attribute. */
  attributeBySpecial?: Record<string, CastingAttribute>;
}

// Embedded Power Data (the canonical Power definition — shared by templates and items)
export interface EmbeddedPowerData {
  id?: string;
  /** @deprecated Tree depth (1 = root). UI label only — no longer used under Templates. */
  treeDepthDefined?: number;
  name: string;
  /** Narrative flavor copied to power items when added to a character */
  fluff?: string;
  category: PowerCategory;
  tags: string[]; // e.g. "spell", "charged", etc

  /** Template identifier in kebab-case (e.g. "movement-teleport", "active-melee-damage-t3"). */
  templateId?: string;
  /** Display name of the template without the category prefix (e.g. "Teleport"). */
  templateName?: string;
  /** Subfamily key inside the category (e.g. "teleport", "damage-single", "combined"). */
  subfamily?: string;
  /** Only on Active damage templates — declares the Special slot. */
  specialSlot?: ActiveSpecialSlot;
  /** Only on Active items that were instantiated from a template with a slot. */
  chosenSpecial?: ChosenSpecial;
  /** Template-side defaults for Active-as-Spell. Never persisted on the item. */
  spellHints?: SpellHints;

  /** Item-only: the user turned this Active into a Spell at creation time. */
  isSpell?: boolean;
  /** Item-only: which attribute the Spell is cast with. Required if isSpell. */
  castingAttribute?: CastingAttribute;
  /** Item-only: chosen resolution mode for the Spell. */
  spellResolution?: SpellResolution;
  /** Item-only: save family when `spellResolution === 'saveSpell'`. */
  spellSaveType?: SpellSaveType;
  /** Item-only reserved: future Overcast stacks (rules pending). */
  overcast?: number;

  cost: PowerCost;
  trigger?: string; // mainly for reaction/passive
  roll?: {
    kind: PowerRollKind;
    attribute?: string;
    vs?: string;
  };
  levels: Record<PowerLevelKey, PowerLevelRow>;
  /** Optional echo-gating: power is only offered in the picker if the actor's Echo key matches one of these values. */
  requiresEcho?: string[];
  /**
   * Power-level default mechanics block (applies when a rank-specific
   * `levels[rank].mechanics` is not set). Useful when the mechanics are
   * identical across all ranks of the power.
   */
  mechanics?: PowerMechanics;
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
  rank?: number; // 1–16, aktuelles Level der Power (= Spell Level if isSpell)
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

  // Template metadata (Templates replaced Mastery Trees in v0.5+)
  templateId?: string;
  templateName?: string;
  subfamily?: string;
  chosenSpecial?: ChosenSpecial;

  // Active-as-Spell (see plan §6)
  isSpell?: boolean;
  castingAttribute?: CastingAttribute;
  spellResolution?: SpellResolution;
  spellSaveType?: SpellSaveType;
  overcast?: number;
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

/**
 * Canonical artifact slot keys (new spec). Distinct from the legacy
 * `artifactKind` enum which is kept for backwards compatibility.
 */
export type ArtifactSlotKey =
  | 'mainHand'
  | 'offHand'
  | 'body'
  | 'head'
  | 'feet'
  | 'amulet'
  | 'ring';

/** Base Profile (physical/inherent kind) per the new Artifacts spec. */
export type ArtifactBaseProfileKey =
  | 'oneHandedWeapon'
  | 'twoHandedWeapon'
  | 'shield'
  | 'bodyArmor'
  | 'noArmorBody'
  | 'robe'
  | 'headArmor'
  | 'feet'
  | 'amulet'
  | 'ring'
  | 'lantern'
  | 'custom';

/** Type of Base Value (catalog entry from the spec). */
export type ArtifactBaseValueType =
  | 'weaponDamage'
  | 'thrownRange'
  | 'weaponSpecial'
  | 'bodyArmor'
  | 'headArmor'
  | 'shieldValue'
  | 'evade'
  | 'movement'
  | 'sense'
  | 'minorFeature';

/** Stone Function variant on an artifact (max 1 per artifact). */
export type ArtifactStoneFunctionKind =
  | 'stonePowerSupport'
  | 'stonePool'
  | 'stoneRefresh'
  | 'stoneBattery';

/**
 * One Base Value entry on an artifact. The `kind` field hints at the
 * baseline table that should be consulted; `value` holds either the
 * resolved numeric/string baseline (autocomputed at level-up time) or
 * a custom override the GM entered manually.
 */
export interface ArtifactBaseValue {
  /** Stable id within the artifact (`a` / `b` / `c` per the spec). */
  slot: 'a' | 'b' | 'c';
  type: ArtifactBaseValueType;
  /** Human-readable label (shown in builder/sheet). */
  label: string;
  /**
   * Resolved scalar — meaning depends on `type`:
   *   weaponDamage → dice string ("4d8")
   *   thrownRange / movement / armor / evade / shieldValue → numeric meters/points
   *   weaponSpecial → numeric rank
   *   sense / minorFeature → free-form note (kept in `note` field)
   */
  value?: number | string;
  /** Optional descriptive note. */
  note?: string;
  /** True if the value follows the spec baseline, false if GM overrode. */
  isBaseline?: boolean;
}

/** A Stone Function block on an artifact. */
export interface ArtifactStoneFunction {
  kind: ArtifactStoneFunctionKind;
  /** Attribute key (`might`, `agility`, …) the function targets. */
  attribute?: string;
  /** For Stone Power Support: the supported Stone Power id (string). */
  stonePowerId?: string;
  /** Optional descriptive note. */
  note?: string;
}

/**
 * A single row in an Artifact's Level Progression (Level 1..10).
 * Each row describes the named Active / Reaction / Passive / Stone
 * Function the artifact grants at that level.
 */
export interface ArtifactLevelProgressionRow {
  level: number;
  name: string;
  /** Active, Reaction, Passive, Active Buff, Movement, Stone Function, Ultimate, Support. */
  type: string;
  range?: string;
  aoe?: string;
  duration?: string;
  effect?: string;
  special?: string;
  /** Optional structured power if this row also grants a usable Active/Reaction. */
  embeddedPowerId?: string;
}

/** Weapon special line: effect id + optional rank/strength (same shape as SpecialEffectReference). */
export interface ArtifactWeaponSpecialRef {
  specialId: string;
  value?: number;
}

/** Weapon-shaped stats for an artifact tree node (edited in Node Editor). */
export interface ArtifactWeaponProfile {
  weaponType: 'melee' | 'ranged';
  damage: string;
  range: string;
  hands: number;
  innateAbilities: string[];
  specials: ArtifactWeaponSpecialRef[];
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
  /** Paperdoll slot keys this artifact may occupy (required for drag-equip). */
  equipSlots?: string[];
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
  /** When artifactKind is gear: canonical paperdoll slot key (head, amulet, ring, feet, body). */
  gearSlot?: string;
  artifactWeapon?: ArtifactWeaponProfile;
  artifactArmor?: ArtifactArmorProfile;
  artifactShield?: ArtifactShieldProfile;

  // ----- New Artifact spec (Artefacts.md) -----
  /** Canonical Equipment Slot the artifact occupies. */
  slot?: ArtifactSlotKey | '';
  /** Base Profile (physical kind) — drives which Base Values are allowed. */
  baseProfile?: ArtifactBaseProfileKey | '';
  /** Base Values that define what the artifact physically is (max per slot). */
  baseValues?: ArtifactBaseValue[];
  /** Optional Stone Function — at most one per artifact. */
  stoneFunction?: ArtifactStoneFunction | null;
  /** Binding kind on this character. */
  binding?: 'unbound' | 'bound' | 'echo';
  /** When binding is `echo`: which Echo key granted it (e.g. `dwarfs`). */
  echoKey?: string;
  /** Current player-progression level (1..10) on this artifact. */
  currentLevel?: number;
  /** Authored Level Progression — rows for levels 1..10. */
  levelProgression?: ArtifactLevelProgressionRow[];
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





































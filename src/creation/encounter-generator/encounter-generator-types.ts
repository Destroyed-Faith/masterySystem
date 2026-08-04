/**
 * Encounter Generator — shared types.
 *
 * The generator analyses a chosen party of player `character` actors and
 * derives balanced Souls-like enemies (bosses with 2-5 phases + minions),
 * then writes them as `npc` actors into a new, named folder.
 *
 * Engine reality this model is built on (see src/documents/actor.ts):
 *   - NPC effective evade in combat = `MR * 4 + floor(agility / 8)` (the flat
 *     `combat.evade` field is NOT read by the to-hit pipeline).
 *   - NPC effective armor in combat = `MR` (no equipped items).
 *   - NPC HP = explicit `health.bars` (never recomputed from vitality).
 *   - Per-phase attack/damage dice ARE honored via resolveNpcAttackList; the
 *     active phase is `npcActivePhaseIndex`.
 */

export type EncounterStep = 'party' | 'concept' | 'adds' | 'review' | 'name';

export const ENCOUNTER_STEP_ORDER: EncounterStep[] = [
  'party',
  'concept',
  'adds',
  'review',
  'name',
];

export type Difficulty = 'moderate' | 'hard' | 'brutal';

/** Per-PC combat profile extracted from a prepared actor. */
export interface PartyMemberMetrics {
  actorId: string;
  name: string;
  mr: number;
  /** Sum of all health-bar maxima. */
  effectiveHP: number;
  /** Effective evade used by the to-hit pipeline (evadeTotal). */
  evade: number;
  /** Effective flat armor used by mitigation (armorTotal). */
  armor: number;
  /** Continuous damage reduction percent (0-100). */
  drPct: number;
  /** Attack dice pool size (number of d8). */
  attackPool: number;
  /** Kept dice (Mastery Rank). */
  keep: number;
  /**
   * Expected damage dice per hit (pre-raise, pre-Might): best weapon (real or
   * artifact weapon) + best attack power's bonus dice — or the best spell if
   * it hits harder standalone.
   */
  weaponDamageMean: number;
  /** Flat melee damage bonus = 2 * floor(Might / 8). */
  mightMeleeBonus: number;
  /** Attack actions per round (PC base = 1). */
  attacksPerRound: number;
  /** Sorted-ascending Monte-Carlo sample of this member's attack totals. */
  attackTotals: number[];
  /** Number of health bars (health levels). */
  barCount: number;
  /** Actor owns a Cleanse-capable power. */
  canCleanse: boolean;
}

/** Aggregated party metrics consumed by the balance model. */
export interface PartyMetrics {
  members: PartyMemberMetrics[];
  size: number;
  medianMR: number;
  avgEvade: number;
  avgArmor: number;
  avgDrPct: number;
  avgHP: number;
  /** All members' attack-total samples pooled and sorted ascending. */
  pooledAttackTotals: number[];
}

/** One phase of an enemy (minions carry exactly one). */
export interface EnemyPhaseStat {
  name: string;
  hp: number;
  /** Intended evade (display); realized in-engine via mr + agility. */
  evade: number;
  /** Intended armor (display); realized in-engine as mr. */
  armor: number;
  attackDiceCount: number;
  damageDiceCount: number;
}

export interface EnemyStatBlock {
  id: string;
  kind: 'boss' | 'minion';
  name: string;
  mr: number;
  /** Agility chosen so MR*4 + floor(agility/8) ≈ intended evade. */
  agility: number;
  speed: number;
  attackSlots: number;
  movementSlots: number;
  /** Boss: 2-5 phases. Minion: exactly 1. */
  phases: EnemyPhaseStat[];
}

export interface RespawnPlan {
  /** Minions spawned per wave (0 = none). */
  minionsPerWave: number;
  /** Wave cadence in rounds (0 = no respawn). */
  cadenceRounds: number;
  recommendedPerWave: number;
  recommendedCadence: number;
}

export interface EncounterPlan {
  difficulty: Difficulty;
  bosses: EnemyStatBlock[];
  minions: EnemyStatBlock[];
  respawn: RespawnPlan;
  notes: string[];
}

export interface CompositionSelection {
  bossCount: number;
  phasesPerBoss: number;
  minionCount: number;
  /** Desired respawn cadence in rounds (0 = none). */
  respawnCadence: number;
}

export interface EncounterSelection {
  selectedActorIds: string[];
  difficulty: Difficulty;
  composition: CompositionSelection;
  folderName: string;
}

export const ENCOUNTER_LIMITS = {
  minBosses: 1,
  maxBosses: 6,
  minPhases: 2,
  maxPhases: 5,
  minMinions: 0,
  maxMinions: 20,
  minCadence: 0,
  maxCadence: 5,
} as const;

// ─── Concept-driven encounter project (v2 flow) ──────────────────────────
// "Du legst fest, was der Gegner tun soll. Der Generator entscheidet,
//  welche Werte dafür nötig sind."

export type CombatStyle = 'spell' | 'martial' | 'hybrid' | 'summoner' | 'environmental';

export type SecondaryStyle =
  | 'none'
  | 'martial'
  | 'direct-spells'
  | 'aoe-spells'
  | 'control'
  | 'mobility'
  | 'defense'
  | 'summoning';

export type TargetingMode = 'single' | 'aoe' | 'mixed';

export type CycleStyle = 'fixed' | 'weighted' | 'conditional' | 'phase-based';

/** Enemy Rank / Importance — drives the difficulty parameter set + budget. */
export type EnemyRank = 'minor' | 'standard' | 'major' | 'mythic';

export type AddDurability = 'minion' | 'light' | 'standard' | 'elite';

/** How dangerous the full add population should feel. */
export type AddPressure = 'harassment' | 'noticeable' | 'dangerous' | 'lethal';

export type SpawnPattern = 'continuous' | 'burst' | 'phase-start' | 'triggered';

export interface AddsConcept {
  enabled: boolean;
  durability: AddDurability;
  pressure: AddPressure;
  /** Desired steady-state population. */
  targetActive: number;
  /** Hard cap (0 = derive from targetActive). */
  maxActive: number;
  /** New adds per round while spawning is active. */
  spawnPerRound: number;
  spawnPattern: SpawnPattern;
  /** Summoning consumes one of the boss's actions per spawn wave. */
  summonCostsBossAction: boolean;
}

export interface EncounterConcept {
  rank: EnemyRank;
  style: CombatStyle;
  /** Special-effect id (`ruin`, `lacerate`, …) or 'none'. */
  primarySpecial: string;
  secondaryStyle: SecondaryStyle;
  /** Boss actions per round. */
  actionsPerRound: number;
  targeting: TargetingMode;
  /** 1..5 phases. */
  phaseCount: number;
  /** Powers in the rotation (2/3/4/6). */
  cycleLength: number;
  cycleStyle: CycleStyle;
  adds: AddsConcept;
  /** Environmental style: zone/arena actions per round. */
  environmentActionsPerRound: number;
}

/** One entry of a boss power cycle — maps 1:1 onto an NPC attack row. */
export interface CyclePowerEntry {
  slot: number;
  name: string;
  templateId: string;
  attackDiceCount: number;
  damageDiceCount: number;
  special: string | null;
  specialValue: number;
  rangeKind: 'melee' | 'ranged';
  rangeMeters: number;
  aoe: { shape: 'radius' | 'cone' | 'line'; radiusM: number } | null;
  /** Stress damage on hit (Nd8) — the boss's signature attack carries 1–2d8. */
  stressD8?: number;
  note: string;
  /** weighted cycles: relative weight in %. */
  weight?: number;
  /** conditional cycles: trigger text. */
  condition?: string;
  /** True when this slot is the summon action (summoner style). */
  isSummon?: boolean;
  /**
   * Spell attack → NPC `npcIsSpell` (Casting TN = 8 × MR + SR, not Evade).
   * Martial weapon cycles stay false.
   */
  isSpell?: boolean;
  /**
   * Radial copies of this power (1–5) → NPC `npcAttacksPerRound`.
   * Sum across the cycle becomes actor `attackSlots` (ATK).
   */
  attacksPerRound?: number;
}

export interface PhasePlan {
  index: number;
  name: string;
  theme: string;
  /** Human-readable phase changes (not just bigger dice). */
  changes: string[];
  cycle: CyclePowerEntry[];
  stat: EnemyPhaseStat;
  /** Adds spawn during this phase. */
  addsActive: boolean;
  /** Boss actions in this phase (mythic bosses vary per phase). */
  actionsPerRound: number;
}

export interface AddDesign {
  name: string;
  hp: number;
  mr: number;
  armor: number;
  evade: number;
  attackDiceCount: number;
  damageDiceCount: number;
  special: string | null;
  specialValue: number;
  /** Expected player actions needed to kill one add. */
  playerActionsToKill: number;
  /** Expected rounds one add stays alive. */
  expectedLifetimeRounds: number;
  /** Expected damage of one add action vs the average PC (after armor). */
  threatPerAction: number;
  /** Add Threat = expected own actions until death × threat per action. */
  addThreat: number;
}

export interface AddsPlan {
  design: AddDesign;
  spawnPerRound: number;
  targetActive: number;
  maxActive: number;
  spawnPattern: SpawnPattern;
  summonCostsBossAction: boolean;
  /** Projected active adds at the start of rounds 1..5. */
  projectedActive: number[];
  /** Projected add attacks per round (rounds 1..5). */
  projectedAttacks: number[];
  /** Expected group damage per round at full population (after armor). */
  groupDamageAtFullPop: number;
  /** Player actions needed to clear the full population. */
  playerActionsToClear: { min: number; max: number };
}

export interface EnvironmentPlan {
  actionsPerRound: number;
  zoneName: string;
  attackDiceCount: number;
  damageDiceCount: number;
  special: string | null;
  specialValue: number;
  radiusM: number;
  description: string;
}

/** The full concept-driven encounter project. */
export interface EncounterProjectPlan {
  concept: EncounterConcept;
  difficulty: Difficulty;
  boss: EnemyStatBlock;
  phasePlans: PhasePlan[];
  adds: AddsPlan | null;
  environment: EnvironmentPlan | null;
  tactics: string[];
  notes: string[];
}

/** Automatically computed Threat Report (shown on review, saved to journal). */
export interface ThreatReport {
  /** Boss hit chance vs the party's lowest / average / highest evade. */
  hitChanceLowEvade: number;
  hitChanceAvgEvade: number;
  hitChanceHighEvade: number;
  /** Fixed Area TN (8 × Source MR) — null when the cycle has no AoE rows. */
  areaTn: number | null;
  /** AoE hit chance vs the Area TN — predictable, party-independent. */
  hitChanceAreaTn: number | null;
  /** Average expected rolled damage per boss hit, before armor. */
  expectedHitDamageRaw: number;
  /** … after average party armor + DR. */
  expectedHitDamageAfterArmor: number;
  /** Persistent / armor-ignoring damage per round (specials like Ruin/Lacerate). */
  persistentDamagePerRound: number;
  /** Maximum first-round burst against one target (p90, all boss actions). */
  firstRoundBurstOneTarget: number;
  firstRoundBurstHealthLevels: number;
  /** Expected total damage against the group per round (boss + adds + env). */
  expectedGroupDamagePerRound: number;
  expectedGroupDamageHealthLevels: number;
  /** Environment damage per round (expected, after armor). */
  environmentDamagePerRound: number;
  /** Enemy actions per round incl. adds, rounds 1..5. */
  enemyActionsByRound: number[];
  /** Expected encounter duration in rounds (party DPS vs total HP). */
  expectedDurationRounds: number;
  /** Average size of one party health level (HP). */
  avgHealthLevelSize: number;
  /** Expected health levels lost by the squishiest PC in round 1. */
  round1HealthLevelsLowestPc: number;
  warnings: string[];
}

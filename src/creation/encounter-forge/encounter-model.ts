/**
 * Encounter Forge data model.
 *
 * Core principle: THE GM DECIDES WHAT THE ENCOUNTER DOES; THE GENERATOR
 * DETERMINES HOW STRONG THOSE CHOICES MAY BE AGAINST THE SELECTED PARTY.
 *
 * The design (this file) contains only GM choices — fiction, composition,
 * phases, defensive identity, concrete attack concepts. It contains NO
 * solved numbers. Solved numbers live in the EncounterSolution produced by
 * the solvers, so the same design solved against a different party yields
 * different numbers while the design stays identical.
 *
 * There is deliberately NO difficulty, rank, style, targeting, tempo or
 * pressure-style field anywhere in this model.
 */

/** Schema version for persisted designs (legacy v1/v2 projects are not migrated). */
export const ENCOUNTER_DESIGN_SCHEMA = 3;

/* ------------------------------------------------------------------ */
/* Defenses                                                            */
/* ------------------------------------------------------------------ */

/**
 * Selectable NPC defense systems. These are the actual Mastery System
 * defenses, not abstract categories.
 *
 * Primary Defense Pillars: parry, evade, armor, absorption.
 * Premium defenses: phasing, ward, damageNegation, damageReduction.
 * Anti-spell defense: spellResistance.
 *
 * `absorption` is exposed but marked unsupported for generated NPCs: full
 * Absorption converts real HP loss into Temporary Colorless Stones and the
 * NPC schema has no stone pools, so it cannot be represented without
 * silently changing its meaning (see solver notes).
 */
export type DefenseKind =
  | 'evade'
  | 'armor'
  | 'parry'
  | 'absorption'
  | 'phasing'
  | 'ward'
  | 'damageNegation'
  | 'damageReduction'
  | 'spellResistance';

export const PRIMARY_DEFENSE_PILLARS: DefenseKind[] = ['parry', 'evade', 'armor', 'absorption'];

export const SECONDARY_DEFENSE_OPTIONS: DefenseKind[] = [
  'parry',
  'evade',
  'armor',
  'phasing',
  'ward',
  'damageNegation',
  'damageReduction',
  'spellResistance',
];

/** Up to three defense systems, no duplicates; slot 0 is the required primary. */
export interface DefenseSelection {
  primary: DefenseKind;
  secondary?: DefenseKind;
  tertiary?: DefenseKind;
}

/* ------------------------------------------------------------------ */
/* Attacks                                                             */
/* ------------------------------------------------------------------ */

/** How the attack resolves. Martial attacks roll vs Evade; spells vs Spell TN. */
export type AttackResolution = 'martial' | 'spell';

/** Delivery of the attack (affects range bands and melee-pressure modelling). */
export type AttackDelivery = 'melee' | 'ranged';

/** Area shape; 'single' is a single-target attack. */
export type AttackArea = 'single' | 'radius' | 'cone' | 'line';

/**
 * A concrete attack concept chosen by the GM. Numeric strength (attack pool,
 * damage dice, special magnitude) is NOT stored here — the Offense Solver
 * determines it per party. GM overrides live in `overrides`.
 */
export interface AttackConcept {
  id: string;
  /** Display name / flavor, e.g. "Zerreißende Klaue". */
  name: string;
  resolution: AttackResolution;
  delivery: AttackDelivery;
  area: AttackArea;
  /** Area size in meters (radius / cone length / line length); 0 for single. */
  areaSize: number;
  /** Reach or range in meters. */
  range: number;
  /** Canonical special id (special-effects catalog) or null for none. */
  specialId: string | null;
  /** Optional canonical power-catalog template backing this attack. */
  catalogTemplateId: string | null;
  /** 1d8 stress on hit (existing NPC attack mechanic). */
  stress: boolean;
  /** GM numeric overrides; null = solver decides. */
  overrides: {
    attackDice: number | null;
    damageDice: number | null;
    specialValue: number | null;
    penetration: number | null;
  };
}

/* ------------------------------------------------------------------ */
/* Movement / Reactions                                                */
/* ------------------------------------------------------------------ */

/** Concrete movement capability. 'normal' is ground movement with a speed. */
export type MovementKind =
  | 'normal'
  | 'leap'
  | 'flight'
  | 'wallWalk'
  | 'teleport'
  | 'burrow'
  | 'phaseShift';

export interface MovementConcept {
  kind: MovementKind;
  /** Label shown on the sheet, e.g. "Schattenschritt". */
  name: string;
  /**
   * Whether this movement reliably lets the enemy escape melee pressure
   * (teleport, flight vs ground party ...). Feeds the durability simulation
   * as an uptime modifier for melee attackers.
   */
  escapesMelee: boolean;
}

/** Standard NPC reactions (canonical list from npc-reactions). */
export type ReactionId =
  | 'guard'
  | 'evade'
  | 'counterattack'
  | 'dive-for-cover'
  | 'interpose'
  | 'custom';

export interface ReactionConcept {
  id: ReactionId;
  /** Custom display name (only for id 'custom'). */
  customName?: string;
}

/* ------------------------------------------------------------------ */
/* Adds / Reinforcements / Summons / Copies                            */
/* ------------------------------------------------------------------ */

/** Mechanical purpose of an add group — drives which solver consumes it. */
export type AddRole =
  | 'damage' // offensive actions consume encounter offense capacity
  | 'special' // applies a Special; its pressure is simulated
  | 'protect' // increases boss durability (defense solver input)
  | 'sacrifice' // resource for a boss power
  | 'ward' // maintains a ward for the boss
  | 'position'; // positional pressure only (no direct budget effect)

export type AddArrival =
  | { type: 'fixed' } // present when combat begins
  | { type: 'reinforcement'; trigger: ReinforcementTrigger } // enters automatically
  | { type: 'summon'; summonerEnemyId: string }; // actively created; costs the summoner an action

export type ReinforcementTrigger =
  | { kind: 'round'; round: number }
  | { kind: 'phaseStart'; phase: number }
  | { kind: 'custom'; description: string };

export interface AddGroupConcept {
  id: string;
  name: string;
  count: number;
  role: AddRole;
  arrival: AddArrival;
  /** Special applied when role is 'special'. */
  specialId: string | null;
  /** How many player hits an add should survive (1 = one-hit body). */
  hitsToKill: number;
  /** Whether adds attack (consumes hostile offense capacity when true). */
  attacks: boolean;
}

/** Copy / illusion mechanics for a main enemy. */
export interface CopyConcept {
  enabled: boolean;
  count: number;
  /** 'independent' = own health pools; 'shared' = damage hits the original's pool. */
  health: 'independent' | 'shared';
  /** One-hit fragile bodies (only meaningful for independent health). */
  fragile: boolean;
  /** Copies contribute attacks (consumes offense capacity). */
  attack: boolean;
}

/* ------------------------------------------------------------------ */
/* Phases                                                              */
/* ------------------------------------------------------------------ */

/**
 * Phase-specific state of one main enemy. Phase 0 is the base state; later
 * phases describe what CHANGES — there is no automatic phase scaling.
 */
export interface EnemyPhaseConcept {
  /** Defense identity for this phase (may change between phases). */
  defenses: DefenseSelection;
  /** Attack concept ids active in this phase (subset/superset of the enemy's attacks). */
  attackIds: string[];
  /** Movement in this phase. */
  movement: MovementConcept;
  /** Reactions available in this phase (max 2 slots, canonical limit). */
  reactions: ReactionConcept[];
  /** Free-text mechanics note for the journal ("Der Boden brennt", ...). */
  mechanicsNote: string;
  /** GM overrides for solved defensive values; null = solver decides. */
  overrides: {
    health: number | null;
    evade: number | null;
    armor: number | null;
    parry: number | null;
    ward: number | null;
    damageNegation: number | null;
    damageReductionPct: number | null;
    spellResistance: number | null;
    phasingCharges: number | null;
    offensiveActions: number | null;
  };
}

export function emptyPhaseOverrides(): EnemyPhaseConcept['overrides'] {
  return {
    health: null,
    evade: null,
    armor: null,
    parry: null,
    ward: null,
    damageNegation: null,
    damageReductionPct: null,
    spellResistance: null,
    phasingCharges: null,
    offensiveActions: null,
  };
}

/* ------------------------------------------------------------------ */
/* Main enemies and the full design                                    */
/* ------------------------------------------------------------------ */

export interface MainEnemyConcept {
  id: string;
  name: string;
  /** Optional flavor / concept description for the journal. */
  concept: string;
  /** All attack concepts this enemy can have (phases reference subsets). */
  attacks: AttackConcept[];
  /** Per-phase state; length = phaseCount of the design. */
  phases: EnemyPhaseConcept[];
  copies: CopyConcept;
}

/**
 * The complete GM design. Contains only choices, never solved numbers.
 * Persisted with a schema version; legacy generator projects (schema < 3)
 * are not silently reinterpreted.
 */
export interface EncounterDesign {
  schema: typeof ENCOUNTER_DESIGN_SCHEMA;
  name: string;
  /** Selected party member actor ids. */
  partyActorIds: string[];
  /** 1–4 phases; every phase is a genuine combat state with its own health pools. */
  phaseCount: number;
  /** 1–6 main enemies, all part of ONE encounter (shared pressure envelope). */
  enemies: MainEnemyConcept[];
  addGroups: AddGroupConcept[];
}

export const ENCOUNTER_FORGE_LIMITS = {
  minEnemies: 1,
  maxEnemies: 6,
  minPhases: 1,
  maxPhases: 4,
  maxDefenses: 3,
  maxReactionSlots: 2,
  maxAttacksPerEnemy: 6,
} as const;

/* ------------------------------------------------------------------ */
/* Factories                                                           */
/* ------------------------------------------------------------------ */

let idCounter = 0;
/** Deterministic-enough unique id for design elements (not persisted across reloads). */
export function forgeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter.toString(36)}`;
}

export function defaultAttackConcept(partial?: Partial<AttackConcept>): AttackConcept {
  return {
    id: forgeId('atk'),
    name: '',
    resolution: 'martial',
    delivery: 'melee',
    area: 'single',
    areaSize: 0,
    range: 1,
    specialId: null,
    catalogTemplateId: null,
    stress: true,
    overrides: { attackDice: null, damageDice: null, specialValue: null, penetration: null },
    ...partial,
  };
}

export function defaultMovement(): MovementConcept {
  return { kind: 'normal', name: '', escapesMelee: false };
}

export function defaultPhaseConcept(attackIds: string[]): EnemyPhaseConcept {
  return {
    defenses: { primary: 'armor' },
    attackIds: [...attackIds],
    movement: defaultMovement(),
    reactions: [],
    mechanicsNote: '',
    overrides: emptyPhaseOverrides(),
  };
}

export function defaultMainEnemy(name: string, phaseCount: number): MainEnemyConcept {
  const attack = defaultAttackConcept({ name: 'Attack' });
  return {
    id: forgeId('enemy'),
    name,
    concept: '',
    attacks: [attack],
    phases: Array.from({ length: Math.max(1, phaseCount) }, () =>
      defaultPhaseConcept([attack.id]),
    ),
    copies: { enabled: false, count: 1, health: 'independent', fragile: false, attack: false },
  };
}

export function defaultEncounterDesign(): EncounterDesign {
  return {
    schema: ENCOUNTER_DESIGN_SCHEMA,
    name: '',
    partyActorIds: [],
    phaseCount: 1,
    enemies: [defaultMainEnemy('Main Enemy 1', 1)],
    addGroups: [],
  };
}

/** Keep enemy phase arrays in sync with the design's phaseCount. */
export function syncPhaseCount(design: EncounterDesign): void {
  const count = Math.min(
    ENCOUNTER_FORGE_LIMITS.maxPhases,
    Math.max(ENCOUNTER_FORGE_LIMITS.minPhases, Math.floor(design.phaseCount) || 1),
  );
  design.phaseCount = count;
  for (const enemy of design.enemies) {
    while (enemy.phases.length < count) {
      const prev = enemy.phases[enemy.phases.length - 1];
      enemy.phases.push({
        defenses: { ...prev.defenses },
        attackIds: [...prev.attackIds],
        movement: { ...prev.movement },
        reactions: prev.reactions.map((r) => ({ ...r })),
        mechanicsNote: '',
        overrides: emptyPhaseOverrides(),
      });
    }
    if (enemy.phases.length > count) enemy.phases.length = count;
  }
}

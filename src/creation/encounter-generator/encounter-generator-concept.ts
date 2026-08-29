/**
 * Encounter Generator — concept-driven design ("Kampfidee → Werte").
 *
 * Pure and Foundry-free. Takes an EncounterConcept (what the enemy should DO)
 * plus analysed party metrics and derives:
 *   - a boss stat block whose damage budget is SPLIT across boss actions,
 *     adds and environment mechanics (they share one encounter budget),
 *   - a power cycle built from real catalog power templates,
 *   - per-phase plans with real changes (not just bigger dice),
 *   - an adds plan using  Add Threat = expected actions until death × threat
 *     per action,
 *   - an environment plan for environmental encounters.
 *
 * Engine reality (see encounter-generator-types.ts): NPC evade = MR*4 +
 * floor(agility/8), NPC armor = MR, per-phase attack rows are honored.
 */

import {
  EXPLODING_D8_MEAN,
  hitRate,
  quantile,
  simulateAttackTotals,
  type Rng,
} from './encounter-generator-analysis.js';
import {
  DIFFICULTY_PARAMS,
  evadeToMrAgility,
  solveAttackDiceForHitRate,
  splitHpAcrossPhases,
} from './encounter-generator-balance.js';
import type {
  AddDesign,
  AddsConcept,
  AddsPlan,
  AttackShape,
  BossKitMode,
  BossKitPlan,
  CombatStyle,
  CyclePowerEntry,
  Difficulty,
  EncounterConcept,
  EncounterProjectPlan,
  EncounterReactionDraft,
  EncounterReactionKind,
  EnemyPhaseStat,
  EnemyRank,
  EnemyStatBlock,
  EnvironmentPlan,
  PartyMetrics,
  PhasePlan,
  SecondaryStyle,
  TargetingMode,
  WeaponProfile,
} from './encounter-generator-types.js';
import { ALL_SPECIAL_EFFECTS, getEffectBaseName } from '../../utils/special-effects.js';
import { filterCatalog, type CatalogEntry } from '../../utils/power-catalog.js';

// ─── Rank / style parameters ─────────────────────────────────────────────

export const RANK_TO_DIFFICULTY: Record<EnemyRank, Difficulty> = {
  minor: 'moderate',
  standard: 'hard',
  major: 'hard',
  mythic: 'brutal',
};

/** Multiplier on the encounter's per-round damage budget and total HP. */
export const RANK_BUDGET_FACTOR: Record<EnemyRank, number> = {
  minor: 0.75,
  standard: 1.0,
  major: 1.2,
  mythic: 1.45,
};

/**
 * Sheet-mean party DPS undercounts real table damage (raises, exploding keep,
 * multi-power turns). Without this pad, bosses melt in 1–3 hits.
 */
const BOSS_HP_REALISM_FACTOR = 2.4;

const RANK_MR_OFFSET: Record<EnemyRank, number> = {
  minor: -1,
  standard: 0,
  major: 1,
  mythic: 1,
};

/** Preferred catalog tier per rank (Active damage templates come in T3..T6). */
const RANK_TIER: Record<EnemyRank, number> = {
  minor: 3,
  standard: 4,
  major: 5,
  mythic: 6,
};

/**
 * Share of the round budget the boss keeps for his OWN actions. Environment
 * zones and summoned adds are paid out of the same encounter budget.
 */
const STYLE_BOSS_SHARE: Record<CombatStyle, number> = {
  spell: 1.0,
  martial: 1.0,
  hybrid: 1.0,
  summoner: 0.45,
  environmental: 0.55,
};

/** Fraction of a damage action's budget converted into the primary special. */
function persistentShare(specialId: string | null, style: CombatStyle): number {
  if (!specialId) return 0;
  const effect = ALL_SPECIAL_EFFECTS.find((e) => e.id === specialId);
  if (!effect || effect.category !== 'diminishing') return 0;
  // Attrition styles lean harder on their signature special.
  if (specialId === 'lacerate' || specialId === 'ruin') return style === 'martial' ? 0.4 : 0.35;
  return 0.3;
}

export function specialLabel(specialId: string | null): string {
  if (!specialId) return '';
  const effect = ALL_SPECIAL_EFFECTS.find((e) => e.id === specialId);
  return effect ? getEffectBaseName(effect.name) : specialId;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

const REACTION_KINDS: EncounterReactionKind[] = [
  'none',
  'guard',
  'evade',
  'counterattack',
  'dive-for-cover',
  'interpose',
  'custom',
];

export function emptyReactions(): EncounterReactionDraft[] {
  return [
    { kind: 'none', name: '' },
    { kind: 'none', name: '' },
  ];
}

export function normalizeReactions(raw: unknown): EncounterReactionDraft[] {
  const list = Array.isArray(raw) ? raw : [];
  return emptyReactions().map((fallback, i) => {
    const row = list[i];
    if (!row || typeof row !== 'object') return fallback;
    const kindRaw = String((row as EncounterReactionDraft).kind || 'none') as EncounterReactionKind;
    const kind = REACTION_KINDS.includes(kindRaw) ? kindRaw : 'custom';
    return { kind, name: String((row as EncounterReactionDraft).name || '').trim() };
  });
}

/** Per-boss share of a solo-boss HP / damage budget when N Hauptgegner share the fight. */
export function multiBossPacking(bossCount: number): { hpEach: number; dmgEach: number } {
  const n = clamp(Math.round(bossCount) || 1, 1, 6);
  if (n <= 1) return { hpEach: 1, dmgEach: 1 };
  return {
    hpEach: (0.7 + 0.3 * n) / n,
    dmgEach: (0.65 + 0.35 * n) / n,
  };
}

function conceptWeaponProfile(concept: EncounterConcept): WeaponProfile {
  const p = concept.weaponProfile;
  return p === 'two-hand' || p === 'ranged' ? p : 'one-hand';
}

function wantsMeleeWeapon(concept: EncounterConcept): boolean {
  if (conceptWeaponProfile(concept) === 'ranged') return false;
  return concept.style === 'martial' || concept.style === 'hybrid';
}

export function normalizeConcept(raw?: Partial<EncounterConcept> | null): EncounterConcept {
  const base = defaultConcept();
  const src = raw && typeof raw === 'object' ? raw : {};
  const merged: EncounterConcept = {
    ...base,
    ...src,
    adds: { ...base.adds, ...(src.adds || {}) },
  };
  if (merged.attackShape === 'single-and-aoe') {
    merged.targeting = 'mixed';
    merged.actionsPerRound = 2;
    merged.cycleLength = 2;
  }
  merged.bossCount = clamp(Math.round(Number(merged.bossCount) || 1), 1, 6);
  merged.kitMode = merged.kitMode === 'distinct' ? 'distinct' : 'identical';
  merged.weaponProfile = conceptWeaponProfile(merged);
  merged.attackShape = merged.attackShape === 'single-and-aoe' ? 'single-and-aoe' : 'free';
  merged.baseDamageDice = clamp(Math.round(Number(merged.baseDamageDice) || 0), 0, 16);
  merged.hpOverride = Math.max(0, Math.round(Number(merged.hpOverride) || 0));
  merged.armorOverride = Math.max(0, Math.round(Number(merged.armorOverride) || 0));
  merged.evadeOverride = Math.max(0, Math.round(Number(merged.evadeOverride) || 0));
  merged.environmentActionsPerRound = clamp(
    Math.round(Number(merged.environmentActionsPerRound) || 2),
    1,
    4,
  );
  merged.actionsPerRound = clamp(Math.round(Number(merged.actionsPerRound) || 1), 1, 6);
  merged.phaseCount = clamp(Math.round(Number(merged.phaseCount) || 1), 1, 5);
  merged.cycleLength = clamp(Math.round(Number(merged.cycleLength) || 2), 2, 6);
  merged.reactions = normalizeReactions(merged.reactions);
  return merged;
}

// ─── Add pressure targets (in party health levels per round) ─────────────

/**
 * Group damage per round of the FULL add population, expressed in party
 * health levels: Harassment ≈ irrelevant single add, Noticeable ≈ ½ level,
 * Dangerous in Groups ≈ 1 level, Lethal if Ignored ≈ a PC down in 2 rounds.
 */
export function addPressureTargetHL(
  pressure: AddsConcept['pressure'],
  avgBarCount: number,
): number {
  switch (pressure) {
    case 'harassment':
      return 0.2;
    case 'noticeable':
      return 0.5;
    case 'dangerous':
      return 1.0;
    case 'lethal':
      return Math.max(1.5, avgBarCount / 2);
  }
}

/** Expected player attacks needed to kill one add, per durability. */
const DURABILITY_ATTACKS: Record<AddsConcept['durability'], number> = {
  minion: 1,
  light: 1.4,
  standard: 2,
  elite: 3.5,
};

// ─── Party helpers ───────────────────────────────────────────────────────

export function avgHealthLevelSize(party: PartyMetrics): number {
  const avgBars = party.members.length
    ? party.members.reduce((a, m) => a + Math.max(1, m.barCount), 0) / party.members.length
    : 4;
  return Math.max(1, party.avgHP / Math.max(1, avgBars));
}

export function avgBarCount(party: PartyMetrics): number {
  if (!party.members.length) return 4;
  return party.members.reduce((a, m) => a + Math.max(1, m.barCount), 0) / party.members.length;
}

/** Mean player damage per ACTION (hit rate × after-armor damage) vs a target. */
function partyDamagePerAction(party: PartyMetrics, targetEvade: number, targetArmor: number): number {
  if (!party.members.length) return 10;
  let sum = 0;
  for (const m of party.members) {
    const hr = hitRate(m.attackTotals, targetEvade);
    const raises = 0; // conservative for clear-rate estimates
    const dmg = Math.max(0, m.weaponDamageMean + m.mightMeleeBonus + raises - targetArmor);
    sum += hr * dmg;
  }
  return Math.max(1, sum / party.members.length);
}

// ─── Adds plan ───────────────────────────────────────────────────────────

export function deriveAddsPlan(
  party: PartyMetrics,
  concept: EncounterConcept,
  rng: Rng = Math.random,
): AddsPlan | null {
  const cfg = concept.adds;
  if (!cfg.enabled) return null;

  const hlSize = avgHealthLevelSize(party);
  const targetActive = clamp(Math.round(cfg.targetActive) || 4, 1, 12);
  const maxActive = cfg.maxActive > 0 ? clamp(Math.round(cfg.maxActive), 1, 16) : targetActive;
  const spawnPerRound = clamp(Math.round(cfg.spawnPerRound) || 1, 1, 6);

  // Defensive stats: adds are hittable (85% party hit rate like old minions).
  const desiredEvade = quantile(party.pooledAttackTotals, 1 - 0.85);
  const minionMr = clamp(party.medianMR - 1, 1, 8);
  const { mr, realizedEvade } = evadeToMrAgility(desiredEvade, minionMr);
  const armor = mr;

  // Durability → HP from real player damage against these defenses.
  const perActionPlayerDamage = partyDamagePerAction(party, realizedEvade, armor);
  const attacksToKill = DURABILITY_ATTACKS[cfg.durability];
  const hp = Math.max(1, Math.round(perActionPlayerDamage * attacksToKill));

  // Offense: full population should deal the pressure target per round.
  const addHitRate = 0.45;
  const pressureHL = addPressureTargetHL(cfg.pressure, avgBarCount(party));
  const groupTarget = pressureHL * hlSize;
  const perAddAfterArmor = groupTarget / (maxActive * addHitRate);
  const rawPerHit = perAddAfterArmor + party.avgArmor;
  const damageDiceCount = clamp(Math.round(rawPerHit / EXPLODING_D8_MEAN), 1, 10);
  const attackDiceCount = clamp(
    solveAttackDiceForHitRate(party.avgEvade, mr, addHitRate, 2, 12, 1200, rng),
    2,
    12,
  );

  // Population projection: growth if the party IGNORES the adds (worst case,
  // capped at the maximum). Clearing effort is reported separately.
  const projectedActive: number[] = [];
  const projectedAttacks: number[] = [];
  let active = 0;
  for (let round = 1; round <= 5; round++) {
    if (cfg.spawnPattern === 'phase-start') {
      if (round === 1) active = Math.min(maxActive, spawnPerRound * 2);
    } else if (cfg.spawnPattern === 'burst') {
      if (round === 1) active = Math.min(maxActive, targetActive);
    } else {
      active = Math.min(maxActive, active + spawnPerRound);
    }
    projectedActive.push(active);
    projectedAttacks.push(active);
  }

  // Lifetime estimate: roughly half the party actions go into clearing adds.
  const clearActionsPerRound = Math.max(1, party.size / 2);
  const killsPerRound = clearActionsPerRound / attacksToKill;
  const expectedLifetimeRounds = killsPerRound > 0
    ? Math.max(1, Math.min(maxActive, targetActive) / killsPerRound)
    : 3;

  const realizedDamageMean = damageDiceCount * EXPLODING_D8_MEAN;
  const threatPerAction = addHitRate * Math.max(0, realizedDamageMean - party.avgArmor);
  const addThreat = expectedLifetimeRounds * threatPerAction;
  const playerActionsToKill = attacksToKill;

  const design: AddDesign = {
    name: 'Add',
    hp,
    mr,
    armor,
    evade: realizedEvade,
    attackDiceCount,
    damageDiceCount,
    special: null,
    specialValue: 0,
    playerActionsToKill,
    expectedLifetimeRounds: Math.round(expectedLifetimeRounds * 10) / 10,
    threatPerAction: Math.round(threatPerAction * 10) / 10,
    addThreat: Math.round(addThreat * 10) / 10,
  };

  const fullPop = maxActive;
  const groupDamageAtFullPop = Math.round(fullPop * threatPerAction);

  return {
    design,
    spawnPerRound,
    targetActive,
    maxActive,
    spawnPattern: cfg.spawnPattern,
    summonCostsBossAction: cfg.summonCostsBossAction,
    projectedActive,
    projectedAttacks,
    groupDamageAtFullPop,
    playerActionsToClear: {
      min: Math.ceil(fullPop * Math.max(1, playerActionsToKill * 0.8)),
      max: Math.ceil(fullPop * (playerActionsToKill + 0.5)),
    },
  };
}

// ─── Catalog-backed power cycle ──────────────────────────────────────────

interface CyclePick {
  entry: CatalogEntry | null;
  fallbackName: string;
  isAoe: boolean;
  isControl: boolean;
  isSummon: boolean;
}

function entryRangeKind(entry: CatalogEntry): 'melee' | 'ranged' {
  const row = (entry.raw as any)?.levels?.['4'];
  return row?.range?.kind === 'melee' ? 'melee' : 'ranged';
}

function pickEntries(
  filter: { special?: string | null; subfamily: string; melee?: boolean },
  tier: number,
): CatalogEntry[] {
  let entries = filterCatalog({
    category: 'active',
    subfamily: filter.subfamily,
    special: filter.special ?? null,
  });
  if (entries.length === 0 && filter.special) {
    entries = filterCatalog({ category: 'active', subfamily: filter.subfamily });
  }
  if (typeof filter.melee === 'boolean') {
    const flavored = entries.filter((e) => (entryRangeKind(e) === 'melee') === filter.melee);
    if (flavored.length > 0) entries = flavored;
  }
  // Prefer the rank-matched tier, then closest tiers.
  entries.sort((a, b) => {
    const da = Math.abs((Number(a.tier) || tier) - tier);
    const db = Math.abs((Number(b.tier) || tier) - tier);
    return da - db;
  });
  return entries;
}

/** Slot layout: which slots are AoE / control / summon for a given concept. */
function buildSlotLayout(concept: EncounterConcept): CyclePick[] {
  const length = clamp(Math.round(concept.cycleLength) || 3, 2, 6);
  const tier = RANK_TIER[concept.rank];
  const special = concept.primarySpecial !== 'none' ? concept.primarySpecial : null;
  const melee = wantsMeleeWeapon(concept) || concept.style === 'martial';
  const twoHand = conceptWeaponProfile(concept) === 'two-hand';
  const picks: CyclePick[] = [];

  const wantsControlSlot = concept.secondaryStyle === 'control';
  const wantsSummonSlot = concept.style === 'summoner';
  const aoeSlots = (slot: number): boolean => {
    if (concept.targeting === 'aoe') return true;
    if (concept.targeting === 'mixed') return slot % 2 === 1; // every 2nd slot
    return false;
  };

  const singleEntries = pickEntries(
    { special, subfamily: melee ? 'weapon-attack' : 'damage-single', melee },
    tier,
  );
  const singleFallback = pickEntries({ special, subfamily: 'damage-single', melee }, tier);
  const aoeEntries = pickEntries({ special, subfamily: 'damage-aoe' }, tier);
  const controlEntries = [
    ...pickEntries({ subfamily: 'control' }, tier),
    ...pickEntries({ subfamily: 'hard-control' }, tier),
  ];

  let singleIdx = 0;
  let aoeIdx = 0;
  for (let slot = 0; slot < length; slot++) {
    if (wantsSummonSlot && slot === 0) {
      picks.push({ entry: null, fallbackName: 'Beschwörung', isAoe: false, isControl: false, isSummon: true });
      continue;
    }
    if (wantsControlSlot && slot === length - 1) {
      picks.push({
        entry: controlEntries[0] ?? null,
        fallbackName: 'Niederhalten',
        isAoe: false,
        isControl: true,
        isSummon: false,
      });
      continue;
    }
    if (aoeSlots(slot) && aoeEntries.length > 0) {
      picks.push({
        entry: aoeEntries[aoeIdx % aoeEntries.length],
        fallbackName: twoHand ? 'Rundumschlag' : 'Flächenschlag',
        isAoe: true,
        isControl: false,
        isSummon: false,
      });
      aoeIdx++;
      continue;
    }
    const pool = singleEntries.length > 0 ? singleEntries : singleFallback;
    picks.push({
      entry: pool.length > 0 ? pool[singleIdx % pool.length] : null,
      fallbackName: melee
        ? twoHand
          ? 'Zweihandschlag'
          : 'Schwerer Hieb'
        : 'Zerstörerischer Strahl',
      isAoe: false,
      isControl: false,
      isSummon: false,
    });
    singleIdx++;
  }
  return picks;
}

const CYCLE_WEIGHTS = [40, 30, 20, 10, 10, 10];

const CONDITION_TEXTS = {
  aoe: 'Wenn 3+ Ziele gruppiert stehen',
  control: 'Wenn ein Ziel in den Nahkampf kommt',
  summon: 'Wenn weniger als Ziel-Population aktiv ist',
  highSpecial: (label: string) => `Wenn ein Ziel bereits hohes ${label} hat`,
  default: 'Standard-Aktion',
};

/**
 * Build the power cycle for one phase. `perActionBudget` is the after-
 * mitigation damage one action should deal; specials are paid from it.
 */
export function buildPowerCycle(
  party: PartyMetrics,
  concept: EncounterConcept,
  perActionBudget: number,
  bossMr: number,
  options: {
    phaseIndex?: number;
    damageFactor?: number;
    specialBonus?: number;
    hitRateTarget?: number;
  } = {},
  rng: Rng = Math.random,
): CyclePowerEntry[] {
  const picks = buildSlotLayout(concept);
  const damageFactor = options.damageFactor ?? 1;
  const specialBonus = options.specialBonus ?? 0;
  const params = DIFFICULTY_PARAMS[RANK_TO_DIFFICULTY[concept.rank]];
  const hitTarget = options.hitRateTarget ?? params.bossHitRateVsParty;
  const specialId = concept.primarySpecial !== 'none' ? concept.primarySpecial : null;
  const share = persistentShare(specialId, concept.style);
  const drFraction = clamp(party.avgDrPct / 100, 0, 0.95);

  const attackDice = clamp(
    solveAttackDiceForHitRate(party.avgEvade, bossMr, hitTarget, 2, 16, 1200, rng),
    2,
    16,
  );
  // AoE attacks use one roll compared separately against each creature's Evade.
  // Price AoE pools against the same party Evade target as direct attacks.
  const attackDiceAoe = clamp(
    solveAttackDiceForHitRate(party.avgEvade, bossMr, hitTarget, 2, 16, 1200, rng),
    2,
    16,
  );

  const entries: CyclePowerEntry[] = [];
  picks.forEach((pick, i) => {
    if (pick.isSummon) {
      entries.push({
        slot: i + 1,
        name: 'Beschwörung',
        templateId: '',
        attackDiceCount: 0,
        damageDiceCount: 0,
        special: null,
        specialValue: 0,
        rangeKind: 'ranged',
        rangeMeters: 12,
        aoe: null,
        note: 'Ruft neue Adds (siehe Spawn-Regeln). Kostet eine Boss-Aktion.',
        weight: concept.cycleStyle === 'weighted' ? CYCLE_WEIGHTS[i] ?? 10 : undefined,
        condition: concept.cycleStyle === 'conditional' ? CONDITION_TEXTS.summon : undefined,
        isSummon: true,
        isSpell: false,
        attacksPerRound: 1,
      });
      return;
    }

    const budget = perActionBudget * damageFactor * (pick.isControl ? 0.4 : 1);
    // Per-target AoE damage is cheaper (it multiplies across targets).
    const aoeFactor = pick.isAoe ? 0.6 : 1;
    const specialCut = pick.isControl ? 0 : share;
    const directTarget = budget * (1 - specialCut) * aoeFactor;
    const rawPerHit = directTarget / (1 - drFraction) + party.avgArmor;
    const damageDiceCount = clamp(Math.round(rawPerHit / EXPLODING_D8_MEAN), 1, 16);

    let special: string | null = null;
    let specialValue = 0;
    if (pick.isControl) {
      special = 'root';
      specialValue = clamp(Math.round(2 + bossMr / 2) + specialBonus, 1, 8);
    } else if (specialId && specialCut > 0) {
      special = specialId;
      const base = Math.round((budget * specialCut) * (pick.isAoe ? 0.6 : 1));
      specialValue = clamp(base + specialBonus, 1, 12);
    }

    const rangeKind: 'melee' | 'ranged' = pick.entry
      ? entryRangeKind(pick.entry)
      : concept.style === 'martial'
        ? 'melee'
        : 'ranged';
    const row = (pick.entry?.raw as any)?.levels?.['4'];
    const rangeMeters = rangeKind === 'melee' ? 2 : Math.max(8, Number(row?.range?.m) || 16);
    const rawAoe = row?.aoe;
    const aoe = pick.isAoe
      ? {
          shape: (rawAoe?.shape === 'cone' || rawAoe?.shape === 'line' ? rawAoe.shape : 'radius') as
            | 'radius'
            | 'cone'
            | 'line',
          radiusM: Math.max(2, Number(rawAoe?.radiusM ?? rawAoe?.m) || 4),
        }
      : null;

    let condition: string | undefined;
    if (concept.cycleStyle === 'conditional') {
      if (pick.isAoe) condition = CONDITION_TEXTS.aoe;
      else if (pick.isControl) condition = CONDITION_TEXTS.control;
      else if (special) condition = CONDITION_TEXTS.highSpecial(specialLabel(special));
      else condition = CONDITION_TEXTS.default;
    }

    // Martial cycles are weapon/Evade attacks; spell/hybrid/summoner/env use
    // Casting TN (npcIsSpell) for their damage/control powers.
    const isSpell = concept.style !== 'martial';
    entries.push({
      slot: i + 1,
      name: pick.entry?.name ?? pick.fallbackName,
      templateId: pick.entry?.templateId ?? '',
      attackDiceCount: pick.isAoe ? attackDiceAoe : attackDice,
      damageDiceCount,
      special,
      specialValue,
      rangeKind,
      rangeMeters,
      aoe,
      note: pick.isControl ? 'Kontrolle statt Schaden.' : '',
      weight: concept.cycleStyle === 'weighted' ? CYCLE_WEIGHTS[i] ?? 10 : undefined,
      condition,
      isSpell,
      attacksPerRound: 1,
    });
  });

  // Signature attack: the boss's main strike additionally inflicts Stress
  // (1d8, major/mythic 2d8). Only ONE attack in the cycle carries it —
  // prefer the first direct single-target damage row.
  const stressD8 = concept.rank === 'major' || concept.rank === 'mythic' ? 2 : 1;
  const signature =
    entries.find((e) => !e.isSummon && !e.aoe && e.damageDiceCount > 0 && e.special !== 'root') ??
    entries.find((e) => !e.isSummon && e.damageDiceCount > 0);
  if (signature) {
    signature.stressD8 = stressD8;
    signature.note = [signature.note, `Verursacht zusätzlich ${stressD8}d8 Stress bei Treffer.`]
      .filter(Boolean)
      .join(' ');
  }

  const profile = conceptWeaponProfile(concept);
  const damageOverride = clamp(Math.round(Number(concept.baseDamageDice) || 0), 0, 16);
  for (const entry of entries) {
    if (entry.isSummon) continue;
    if (profile === 'ranged') {
      entry.rangeKind = 'ranged';
      entry.rangeMeters = Math.max(12, entry.rangeMeters || 16);
    } else if (entry.rangeKind === 'melee') {
      entry.rangeMeters = profile === 'two-hand' ? 2 : 1;
    }
    if (damageOverride > 0) {
      entry.damageDiceCount = damageOverride;
    } else if (profile === 'two-hand' && concept.style === 'martial') {
      entry.damageDiceCount = clamp(Math.round(entry.damageDiceCount * 1.15), 1, 16);
    }
    if (profile === 'two-hand' && entry.rangeKind === 'melee') {
      entry.note = [entry.note, 'Zweihandwaffe.'].filter(Boolean).join(' ');
    }
  }

  assignAttacksPerRound(
    entries,
    concept.actionsPerRound,
    concept.cycleStyle === 'weighted',
  );
  return entries;
}

/**
 * Fill `attacksPerRound` (1–5) so powers can actually spend the boss's
 * action budget: each non-summon power starts at 1, leftover actions go to
 * the signature (stress) row — or by weight when the cycle is weighted.
 */
function assignAttacksPerRound(
  entries: CyclePowerEntry[],
  actionsPerRound: number,
  weighted: boolean,
): void {
  const targets = entries.filter((e) => !e.isSummon);
  if (!targets.length) return;
  const actions = clamp(Math.round(actionsPerRound) || 1, 1, 8);
  for (const e of targets) e.attacksPerRound = 1;
  let remaining = Math.max(0, actions - targets.length);
  if (remaining <= 0) return;

  if (weighted) {
    const totalW = targets.reduce((s, e) => s + Math.max(1, Number(e.weight) || 1), 0);
    // Largest remainder method: give extras to highest fractional shares.
    const shares = targets.map((e) => {
      const w = Math.max(1, Number(e.weight) || 1);
      const exact = (remaining * w) / totalW;
      return { e, base: Math.floor(exact), frac: exact - Math.floor(exact) };
    });
    let given = 0;
    for (const s of shares) {
      const add = Math.min(4, s.base); // already have 1 → cap at 5
      s.e.attacksPerRound = Math.min(5, 1 + add);
      given += add;
    }
    let left = remaining - given;
    shares.sort((a, b) => b.frac - a.frac);
    for (const s of shares) {
      if (left <= 0) break;
      if ((s.e.attacksPerRound ?? 1) >= 5) continue;
      s.e.attacksPerRound = (s.e.attacksPerRound ?? 1) + 1;
      left--;
    }
    return;
  }

  const preferred =
    targets.find((e) => (e.stressD8 ?? 0) > 0) ?? targets[0];
  let i = Math.max(0, targets.indexOf(preferred));
  let guard = 0;
  while (remaining > 0 && guard < 64) {
    guard++;
    const e = targets[i % targets.length];
    if ((e.attacksPerRound ?? 1) < 5) {
      e.attacksPerRound = (e.attacksPerRound ?? 1) + 1;
      remaining--;
    } else if (targets.every((t) => (t.attacksPerRound ?? 1) >= 5)) {
      break;
    }
    i++;
  }
}

// ─── Phase structures (real changes, not just bigger dice) ───────────────

interface PhaseTheme {
  name: string;
  changes: string[];
  damageFactor: number;
  specialBonus: number;
  armorFactor: number;
  addsActive: boolean;
  actionsDelta: number;
}

function phaseThemes(concept: EncounterConcept): PhaseTheme[] {
  const n = clamp(Math.round(concept.phaseCount) || 1, 1, 5);
  const style = concept.style;
  const themes: PhaseTheme[] = [];

  const base = (name: string, partial: Partial<PhaseTheme>): PhaseTheme => ({
    name,
    changes: [],
    damageFactor: 1,
    specialBonus: 0,
    armorFactor: 1,
    addsActive: concept.adds.enabled,
    actionsDelta: 0,
    ...partial,
  });

  if (n === 1) {
    themes.push(base('Sustained Pressure', { changes: ['Ein durchgehender Power-Cycle.'] }));
    return themes;
  }

  if (style === 'environmental') {
    themes.push(base('Environmental Control', {
      damageFactor: 0.7,
      changes: ['Regelmäßige Feuer-/Gefahrenzonen', 'Kontrollierte Spawns', 'Geringe eigene Mobilität'],
    }));
    themes.push(base('Escalating AoE', {
      damageFactor: 1.0,
      specialBonus: 1,
      changes: ['Größere AoE-Zonen', 'Zonen bewegen sich', 'Weniger Adds, höhere direkte Gefahr'],
      addsActive: false,
    }));
    if (n >= 3) {
      themes.push(base('Collapse (Short Burn)', {
        damageFactor: 1.35,
        armorFactor: 0.6,
        specialBonus: 2,
        addsActive: false,
        changes: ['Keine langfristige Defensive mehr', 'Sehr hoher Burst', 'Arena wird zerstört — Kampf schnell beenden'],
      }));
    }
  } else if (style === 'summoner') {
    themes.push(base('Pack Building', {
      damageFactor: 0.75,
      changes: ['Beschwörung hat Priorität', 'Boss-Schaden bewusst niedrig', 'Adds sind die Haupt-Mechanik'],
    }));
    themes.push(base('Cornered', {
      damageFactor: 1.25,
      specialBonus: 1,
      addsActive: false,
      actionsDelta: 0,
      changes: ['Spawnen stoppt', 'Boss kämpft direkt und aggressiv', 'Verbleibende Adds werden geopfert'],
    }));
    for (let i = 2; i < n; i++) {
      themes.push(base(`Escalation ${i}`, { damageFactor: 1.35, specialBonus: 2, addsActive: false, changes: ['Verzweifelter Endkampf'] }));
    }
  } else if (style === 'martial') {
    themes.push(base('Measured Violence', {
      damageFactor: 0.9,
      changes: ['Kontrollierter Erstrundenschaden', `${specialLabel(concept.primarySpecial) || 'Special'} wird gezielt aufgebaut`, 'Fokus auf ein Ziel'],
    }));
    themes.push(base('Frenzy', {
      damageFactor: 1.2,
      specialBonus: 2,
      armorFactor: 0.75,
      changes: ['Mehr Angriffswürfel, weniger Deckung', `${specialLabel(concept.primarySpecial) || 'Special'}(X) steigt`, 'Schwäche: Distanz & Mobilität werden noch effektiver'],
    }));
    for (let i = 2; i < n; i++) {
      themes.push(base(`Rage ${i}`, { damageFactor: 1.35, specialBonus: 3, armorFactor: 0.6, changes: ['Alles auf Angriff'] }));
    }
  } else {
    // spell / hybrid (mythic multi-profile bosses)
    themes.push(base('Control & Position', {
      damageFactor: 0.8,
      changes: ['Kontrolle und Positionierung', 'Schaden zweitrangig'],
    }));
    themes.push(base('Direct Assault', {
      damageFactor: 1.1,
      specialBonus: 1,
      changes: ['Aggressiver Direktkampf', 'Neuer Power-Cycle'],
    }));
    if (n >= 3) {
      themes.push(base('Demonic Escalation', {
        damageFactor: 1.35,
        specialBonus: 2,
        armorFactor: 0.7,
        changes: ['Eskalierender Schaden', 'Reduzierte Verteidigung', `${specialLabel(concept.primarySpecial) || 'Special'} auf Maximum`],
      }));
    }
  }

  while (themes.length < n) {
    themes.push(base(`Phase ${themes.length + 1}`, { damageFactor: 1 + 0.15 * themes.length, changes: ['Eskalation'] }));
  }
  return themes.slice(0, n);
}

// ─── Environment plan ────────────────────────────────────────────────────

function deriveEnvironmentPlan(
  party: PartyMetrics,
  concept: EncounterConcept,
  roundBudget: number,
): EnvironmentPlan | null {
  if (concept.style !== 'environmental') return null;
  const actions = clamp(Math.round(concept.environmentActionsPerRound) || 2, 1, 4);
  const envBudget = roundBudget * (1 - STYLE_BOSS_SHARE.environmental);
  const perZone = envBudget / actions;
  // Zones auto-hit anyone standing inside (no evade); armor still applies.
  const raw = perZone + party.avgArmor * 0.5;
  const dice = clamp(Math.round(raw / EXPLODING_D8_MEAN), 1, 10);
  const special = concept.primarySpecial !== 'none' ? concept.primarySpecial : null;
  return {
    actionsPerRound: actions,
    zoneName: 'Flammenzone',
    attackDiceCount: 0,
    damageDiceCount: dice,
    special,
    specialValue: special ? clamp(Math.round(dice / 2), 1, 6) : 0,
    radiusM: 4,
    description:
      `${actions}× pro Runde entsteht/wandert eine Zone (Radius ~4 m). Wer die Runde darin beendet, erleidet ${dice}d8` +
      (special ? ` und ${specialLabel(special)}(${clamp(Math.round(dice / 2), 1, 6)})` : '') +
      '. Zonen-Schaden ist Teil des Encounter-Budgets, nicht zusätzlich.',
  };
}

// ─── Main derivation ─────────────────────────────────────────────────────

export function deriveConceptPlan(
  party: PartyMetrics,
  conceptInput: EncounterConcept,
  rng: Rng = Math.random,
): EncounterProjectPlan {
  const concept = normalizeConcept(conceptInput);
  const difficulty = RANK_TO_DIFFICULTY[concept.rank];
  const params = DIFFICULTY_PARAMS[difficulty];
  const rankFactor = RANK_BUDGET_FACTOR[concept.rank];
  const notes: string[] = [];
  const packing = multiBossPacking(concept.bossCount);

  // Boss defensive frame (like the classic model, biased by rank).
  const bossMrBase = clamp(party.medianMR + RANK_MR_OFFSET[concept.rank], 1, 8);
  const desiredEvade = quantile(party.pooledAttackTotals, 1 - params.partyHitRateVsBoss);
  const derivedFrame = evadeToMrAgility(desiredEvade, bossMrBase);
  let mr = derivedFrame.mr;
  let realizedEvade = derivedFrame.realizedEvade;
  if (concept.armorOverride > 0) {
    mr = clamp(concept.armorOverride, 1, 8);
    if (concept.evadeOverride <= 0) realizedEvade = mr * 4;
    notes.push(`Rüstung/MR manuell auf ${mr} gesetzt (Kampf-Rüstung = MR).`);
  }
  if (concept.evadeOverride > 0) {
    realizedEvade = concept.evadeOverride;
    notes.push(`Ausweichen manuell auf ${concept.evadeOverride} gesetzt.`);
  }
  const evadeExtra = Math.max(0, Math.round(realizedEvade - mr * 4));
  const agility = Math.max(2, Math.min(80, evadeExtra * 8));
  realizedEvade = mr * 4 + Math.floor(agility / 8);
  const armor = mr;

  // Encounter round budget (damage AFTER party mitigation, whole group).
  const baselineActions = clamp(Math.round(party.size * params.bossSlotFactor), 1, 6);
  const roundBudget = params.bossHitDamageFrac * party.avgHP * baselineActions * rankFactor;

  // Adds share the budget: their steady-state output is subtracted.
  const adds = deriveAddsPlan(party, concept, rng);
  const addsSteadyDamage = adds
    ? Math.min(adds.groupDamageAtFullPop, roundBudget * 0.6)
    : 0;

  let bossBudget = roundBudget * STYLE_BOSS_SHARE[concept.style];
  if (adds && concept.style !== 'summoner') {
    // Summoner already prices adds into its style share.
    bossBudget = Math.max(roundBudget * 0.3, bossBudget - addsSteadyDamage * 0.5);
    notes.push('Add-Schaden ist im Encounter-Budget eingepreist — der Boss schlägt dafür schwächer zu.');
  }
  if (concept.style === 'summoner') {
    notes.push('Summoner: Boss-Schaden bewusst niedrig, die Action Economy der Adds trägt den Druck.');
  }
  if (concept.style === 'environmental') {
    notes.push('Environmental: Zonen-Schaden gehört zum Encounter-Budget, nicht obendrauf.');
  }

  const actionsPerRound = clamp(Math.round(concept.actionsPerRound) || 3, 1, 6);
  const perActionBudget = (bossBudget * packing.dmgEach) / actionsPerRound;

  // Total HP: party focus-DPS × target TTK (rank-scaled + realism pad).
  // Real table hits (raises / exploding) run hotter than weaponDamageMean, so
  // we pad both the per-hit estimate and the final pool.
  let partyDps = 0;
  let avgHitAfterArmor = 0;
  for (const m of party.members) {
    const hr = hitRate(m.attackTotals, realizedEvade);
    const rawHit = (m.weaponDamageMean + m.mightMeleeBonus) * 1.35;
    const dmg = Math.max(0, rawHit - armor);
    avgHitAfterArmor += dmg;
    partyDps += hr * dmg * m.attacksPerRound;
  }
  partyDps = Math.max(1, partyDps);
  avgHitAfterArmor = Math.max(1, avgHitAfterArmor / Math.max(1, party.members.length));
  // Floor: each phase should survive more than a couple of focus hits.
  const minHitsPerPhase = Math.max(6, Math.round(party.size * 2));
  const hpFromDps = Math.round(
    partyDps * params.bossTTKRounds * rankFactor * BOSS_HP_REALISM_FACTOR,
  );
  const hpFromHitFloor = Math.round(
    avgHitAfterArmor * minHitsPerPhase * Math.max(1, concept.phaseCount),
  );
  let totalHp = Math.max(concept.phaseCount, hpFromDps, hpFromHitFloor);
  if (concept.hpOverride > 0) {
    totalHp = Math.max(concept.phaseCount, concept.hpOverride);
    notes.push(`HP manuell auf ${totalHp} pro Hauptgegner gesetzt.`);
  } else if (concept.bossCount > 1) {
    totalHp = Math.max(concept.phaseCount, Math.round(totalHp * packing.hpEach));
    notes.push(
      `${concept.bossCount} Hauptgegner teilen sich das Encounter-Budget — Werte gelten pro Gegner.`,
    );
  }

  // Phases: own budget + own cycle per phase.
  const themes = phaseThemes(concept);
  const hpPerPhase = splitHpAcrossPhases(totalHp, themes.length);
  const phasePlans: PhasePlan[] = [];
  const phaseStats: EnemyPhaseStat[] = [];

  themes.forEach((theme, i) => {
    const cycle = buildPowerCycle(party, concept, perActionBudget, mr, {
      phaseIndex: i,
      damageFactor: theme.damageFactor,
      specialBonus: theme.specialBonus,
    }, rng);
    const damageRow = cycle.find((c) => !c.isSummon) ?? cycle[0];
    const stat: EnemyPhaseStat = {
      name: `Phase ${i + 1} — ${theme.name}`,
      hp: hpPerPhase[i],
      evade: realizedEvade,
      armor: Math.max(1, Math.round(armor * theme.armorFactor)),
      attackDiceCount: damageRow?.attackDiceCount ?? 6,
      damageDiceCount: damageRow?.damageDiceCount ?? 4,
    };
    phaseStats.push(stat);
    phasePlans.push({
      index: i,
      name: stat.name,
      theme: theme.name,
      changes: theme.changes,
      cycle,
      stat,
      addsActive: theme.addsActive,
      actionsPerRound: clamp(actionsPerRound + theme.actionsDelta, 1, 8),
    });
  });

  const boss: EnemyStatBlock = {
    id: 'boss-0',
    kind: 'boss',
    name: 'Boss',
    mr,
    agility,
    speed: concept.style === 'environmental' ? 0 : 6,
    attackSlots: actionsPerRound,
    movementSlots: concept.style === 'environmental' ? 0 : 1,
    phases: phaseStats,
  };

  const environment = deriveEnvironmentPlan(party, concept, roundBudget);

  // Tactics block for the print sheet.
  const tactics: string[] = [];
  const label = specialLabel(concept.primarySpecial !== 'none' ? concept.primarySpecial : null);
  if (concept.targeting !== 'single') {
    tactics.push('AoE nur einsetzen, wenn 3+ Ziele gruppiert stehen.');
  }
  if (label) {
    tactics.push(`Fokussiere das Ziel mit dem niedrigsten aktuellen ${label}.`);
    tactics.push(`Nicht mehr als ~${Math.round(avgHealthLevelSize(party) * 0.8)} ${label} in Runde 1 auf ein einzelnes Ziel stapeln.`);
  }
  if (concept.style === 'martial') {
    tactics.push('Druck auf EIN Ziel halten; Schwäche: Distanz, Mobilität, Verteidigungs-Reaktionen.');
  }
  if (conceptWeaponProfile(concept) === 'two-hand') {
    tactics.push('Zweihandwaffen: Reichweite 2 m, höherer Einzelschaden, eine Fläche plus ein Einzelziel wenn so gewählt.');
  }
  if (adds) {
    tactics.push(`Spawnen: ${adds.spawnPerRound}/Runde bis max. ${adds.maxActive} aktiv${adds.summonCostsBossAction ? ' (kostet je 1 Boss-Aktion)' : ''}.`);
  }
  const liveReactions = concept.reactions.filter((r) => r.kind !== 'none');
  if (liveReactions.length) {
    tactics.push(
      `Reaktionen (${liveReactions.length}): ${liveReactions
        .map((r) => r.name || r.kind)
        .join(', ')}.`,
    );
  }

  const kitCount = concept.kitMode === 'distinct' ? concept.bossCount : 1;
  const kits: BossKitPlan[] = [];
  for (let i = 0; i < kitCount; i++) {
    const clonedPhases: PhasePlan[] =
      i === 0 ? phasePlans : (JSON.parse(JSON.stringify(phasePlans)) as PhasePlan[]);
    const clonedBoss: EnemyStatBlock =
      i === 0 ? boss : (JSON.parse(JSON.stringify({ ...boss, id: `boss-${i}` })) as EnemyStatBlock);
    if (i > 0) clonedBoss.id = `boss-${i}`;
    kits.push({
      id: `kit-${i}`,
      name: kitCount > 1 ? `Hauptgegner ${i + 1}` : 'Hauptgegner',
      phasePlans: clonedPhases,
      boss: clonedBoss,
      reactions: normalizeReactions(concept.reactions),
    });
  }

  return {
    concept,
    difficulty,
    boss,
    phasePlans,
    kits,
    bossCount: concept.bossCount,
    kitMode: concept.kitMode,
    adds,
    environment,
    tactics,
    notes,
  };
}

// ─── Archetype presets (the four reference encounters + Ruin caster) ─────

export interface ArchetypePreset {
  id: string;
  label: string;
  description: string;
  concept: EncounterConcept;
}

function defaultAdds(partial: Partial<AddsConcept> = {}): AddsConcept {
  return {
    enabled: false,
    durability: 'minion',
    pressure: 'noticeable',
    targetActive: 4,
    maxActive: 0,
    spawnPerRound: 1,
    spawnPattern: 'continuous',
    summonCostsBossAction: false,
    ...partial,
  };
}

export function defaultConcept(): EncounterConcept {
  return {
    rank: 'standard',
    style: 'spell',
    primarySpecial: 'ruin',
    secondaryStyle: 'none',
    actionsPerRound: 3,
    targeting: 'mixed',
    phaseCount: 2,
    cycleLength: 3,
    cycleStyle: 'fixed',
    adds: defaultAdds(),
    environmentActionsPerRound: 2,
    bossCount: 1,
    kitMode: 'identical',
    weaponProfile: 'one-hand',
    attackShape: 'free',
    baseDamageDice: 0,
    hpOverride: 0,
    armorOverride: 0,
    evadeOverride: 0,
    reactions: emptyReactions(),
  };
}

export const ARCHETYPE_PRESETS: ArchetypePreset[] = [
  {
    id: 'ruin-spellcaster',
    label: 'Ruin Spellcaster',
    description: 'Verlässlicher, rüstungsignorierender Druck über Ruin.',
    concept: normalizeConcept({
      rank: 'major',
      style: 'spell',
      primarySpecial: 'ruin',
      secondaryStyle: 'aoe-spells',
      actionsPerRound: 4,
      targeting: 'mixed',
      phaseCount: 2,
      cycleLength: 4,
      cycleStyle: 'fixed',
      adds: defaultAdds(),
      environmentActionsPerRound: 2,
    }),
  },
  {
    id: 'burning-portal',
    label: 'Das brennende Zaubertor',
    description: 'Phasen- und Umgebungskampf: Zonen tragen das Budget.',
    concept: normalizeConcept({
      rank: 'major',
      style: 'environmental',
      primarySpecial: 'ruin',
      secondaryStyle: 'aoe-spells',
      actionsPerRound: 2,
      targeting: 'aoe',
      phaseCount: 3,
      cycleLength: 3,
      cycleStyle: 'phase-based',
      adds: defaultAdds({ enabled: true, durability: 'light', pressure: 'noticeable', targetActive: 2, spawnPerRound: 1, spawnPattern: 'phase-start' }),
      environmentActionsPerRound: 2,
    }),
  },
  {
    id: 'red-priest',
    label: 'Der rote Priester',
    description: 'Summoner: die Hunde-Action-Economy ist die Bedrohung.',
    concept: normalizeConcept({
      rank: 'standard',
      style: 'summoner',
      primarySpecial: 'ruin',
      secondaryStyle: 'summoning',
      actionsPerRound: 3,
      targeting: 'single',
      phaseCount: 2,
      cycleLength: 3,
      cycleStyle: 'conditional',
      adds: defaultAdds({ enabled: true, durability: 'minion', pressure: 'dangerous', targetActive: 6, maxActive: 6, spawnPerRound: 2, spawnPattern: 'continuous', summonCostsBossAction: true }),
      environmentActionsPerRound: 2,
    }),
  },
  {
    id: 'kerkermeister',
    label: 'Der Kerkermeister',
    description: 'Martial Attrition Striker: Lacerate, Single-Target-Druck.',
    concept: normalizeConcept({
      rank: 'major',
      style: 'martial',
      primarySpecial: 'lacerate',
      secondaryStyle: 'control',
      actionsPerRound: 3,
      targeting: 'single',
      phaseCount: 2,
      cycleLength: 3,
      cycleStyle: 'fixed',
      adds: defaultAdds(),
      environmentActionsPerRound: 2,
    }),
  },
  {
    id: 'samael',
    label: 'Samael (Mythic)',
    description: 'Drei Profile hintereinander: Kontrolle → Direktkampf → Eskalation.',
    concept: normalizeConcept({
      rank: 'mythic',
      style: 'hybrid',
      primarySpecial: 'ruin',
      secondaryStyle: 'control',
      actionsPerRound: 4,
      targeting: 'mixed',
      phaseCount: 3,
      cycleLength: 4,
      cycleStyle: 'phase-based',
      adds: defaultAdds({ enabled: true, durability: 'standard', pressure: 'noticeable', targetActive: 2, spawnPerRound: 1, spawnPattern: 'phase-start' }),
      environmentActionsPerRound: 2,
    }),
  },
];

// ─── Option lists for the UI ─────────────────────────────────────────────

export type LabeledOption<T extends string = string> = {
  value: T;
  label: string;
  /** Hover explanation for the option. */
  description?: string;
};

export const STYLE_OPTIONS: Array<LabeledOption<CombatStyle>> = [
  {
    value: 'spell',
    label: 'Spell',
    description: 'Primär Zauberdruck — Casting-TNs, Spell-Specials und Spell-Aktionen tragen den Kampf.',
  },
  {
    value: 'martial',
    label: 'Martial',
    description: 'Primär Waffen-/Körperkampf — Angriffswürfel, Waffenschaden und körperliche Specials.',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Mischt Martial und Spell — der Boss wechselt zwischen Nahkampf und Zaubern.',
  },
  {
    value: 'summoner',
    label: 'Summoner',
    description: 'Boss bringt Verstärkung / Beschwörungen — Adds und Spawn-Druck sind zentral.',
  },
  {
    value: 'environmental',
    label: 'Environmental',
    description: 'Die Umgebung ist die Bedrohung — Zonen, Hazards und Umgebungsaktionen statt klassischem Boss-Körper.',
  },
];

export const SECONDARY_STYLE_OPTIONS: Array<LabeledOption<SecondaryStyle>> = [
  { value: 'none', label: 'Keiner', description: 'Kein zweiter Kampfstil — der Primary Style trägt allein.' },
  { value: 'martial', label: 'Martial Attacks', description: 'Zusätzliche Waffen-/Nahkampf-Angriffe im Power-Cycle.' },
  { value: 'direct-spells', label: 'Direct Spells', description: 'Einzelziel-Zauber als Ergänzung zum Hauptstil.' },
  { value: 'aoe-spells', label: 'AoE Spells', description: 'Flächenzauber — Druck auf die ganze Gruppe.' },
  { value: 'control', label: 'Control', description: 'Kontroll-Effekte (Push, Prone, Root, Position) statt reinem Schaden.' },
  { value: 'mobility', label: 'Mobility', description: 'Bewegung, Repositionierung und schwer greifbare Positionierung.' },
  { value: 'defense', label: 'Defense', description: 'Rüstung, Ausweichen, Damage Reduction oder defensive Reaktionen.' },
  { value: 'summoning', label: 'Summoning', description: 'Beschwört oder spawnt Adds zusätzlich zum Primary Style.' },
];

export const TARGETING_OPTIONS: Array<LabeledOption<TargetingMode>> = [
  {
    value: 'single',
    label: 'Single Target',
    description: 'Fokussiert ein Ziel — hohe Einzelziel-Bedrohung, wenig Flächenabdeckung.',
  },
  {
    value: 'aoe',
    label: 'AoE',
    description: 'Flächenangriffe gegen mehrere Ziele — ein Wurf, pro Kreatur separat gegen Ausweichen.',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Wechselt zwischen Einzelziel- und Flächenangriffen im Cycle.',
  },
];

export const RANK_OPTIONS: Array<LabeledOption<EnemyRank>> = [
  {
    value: 'minor',
    label: 'Minor',
    description: 'Leichter Gegner / Nebenencounter — kürzer, weniger Phasen und Druck.',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Normaler Boss-Encounter — ausgewogene Dauer und Treffergefahr für die Gruppe.',
  },
  {
    value: 'major',
    label: 'Major Encounter',
    description: 'Schwerer Setpiece-Boss — mehr HP/Phasen, härtere Treffer, längerer Kampf.',
  },
  {
    value: 'mythic',
    label: 'Mythic',
    description: 'Höchste Stufe — sehr langer, unnachgiebiger Kampf mit maximalem Encounter-Budget.',
  },
];

export const KIT_MODE_OPTIONS: Array<LabeledOption<BossKitMode>> = [
  {
    value: 'identical',
    label: 'Alle gleich',
    description: 'Jeder Hauptgegner bekommt dasselbe Kit — Angriffe, Werte, Reaktionen.',
  },
  {
    value: 'distinct',
    label: 'Unterschiedliche Kits',
    description: 'Jeder Hauptgegner startet gleich, du passt Angriffe und Werte danach einzeln an.',
  },
];

export const WEAPON_PROFILE_OPTIONS: Array<LabeledOption<WeaponProfile>> = [
  {
    value: 'one-hand',
    label: 'Einhand',
    description: 'Nahkampf 1 m — normale Waffenprofile.',
  },
  {
    value: 'two-hand',
    label: 'Zweihand',
    description: 'Nahkampf 2 m, etwas höherer Waffenschaden, martialische Hiebe.',
  },
  {
    value: 'ranged',
    label: 'Fernkampf',
    description: 'Distanzangriffe (ab 12 m) statt Nahkampf.',
  },
];

export const ATTACK_SHAPE_OPTIONS: Array<LabeledOption<AttackShape>> = [
  {
    value: 'free',
    label: 'Frei (Aktionen + Zielmuster)',
    description: 'Cycle und Aktionen bleiben, wie du sie oben einstellst.',
  },
  {
    value: 'single-and-aoe',
    label: '1 Einzel + 1 Fläche / Runde',
    description: 'Zwei Angriffe pro Runde: ein Einzelziel und eine Fläche.',
  },
];

export const REACTION_KIND_OPTIONS: Array<LabeledOption<EncounterReactionKind>> = [
  { value: 'none', label: 'Keine', description: 'Dieser Reaktions-Slot bleibt leer.' },
  { value: 'guard', label: 'Guard', description: '+MR × 2 Rüstung gegen den auslösenden Treffer.' },
  { value: 'evade', label: 'Evade', description: '+MR × 2 Ausweichen gegen den auslösenden Angriff.' },
  { value: 'counterattack', label: 'Counterattack', description: 'Basisangriff gegen die Kreatur, die dich getroffen hat.' },
  { value: 'dive-for-cover', label: 'Dive for Cover', description: '2 × MR m bewegen, um eine Fläche zu verlassen.' },
  { value: 'interpose', label: 'Interpose', description: 'Nimmt die Hälfte des Schadens eines benachbarten Verbündeten.' },
  { value: 'custom', label: 'Eigene Reaktion', description: 'Name frei eingeben — landet als Custom-Reaktion auf dem NSC.' },
];

export const CYCLE_STYLE_OPTIONS: Array<LabeledOption<EncounterConcept['cycleStyle']>> = [
  {
    value: 'fixed',
    label: 'Fixed — feste Reihenfolge',
    description: 'Powers laufen in fester Reihenfolge ab — vorhersehbar und planbar.',
  },
  {
    value: 'weighted',
    label: 'Weighted — nach Gewichtung',
    description: 'Powers werden nach Gewichtung gewählt — häufigere Signature-Moves, seltener Specials.',
  },
  {
    value: 'conditional',
    label: 'Conditional — reagiert auf den Kampf',
    description: 'Cycle reagiert auf Kampfzustand (HP, Phasen, Adds) statt starrer Liste.',
  },
  {
    value: 'phase-based',
    label: 'Phase-Based — eigener Cycle pro Phase',
    description: 'Jede Boss-Phase hat einen eigenen Power-Cycle.',
  },
];

export function primarySpecialOptions(): Array<LabeledOption> {
  const out: Array<LabeledOption> = [
    {
      value: 'none',
      label: 'Kein Special',
      description: 'Kein primäres Diminishing Special — Druck kommt aus Schaden, Kontrolle oder Adds.',
    },
  ];
  for (const e of ALL_SPECIAL_EFFECTS) {
    if (e.category !== 'diminishing') continue;
    if (e.id === 'regeneration') continue;
    out.push({
      value: e.id,
      label: getEffectBaseName(e.name),
      description: e.description,
    });
  }
  return out;
}

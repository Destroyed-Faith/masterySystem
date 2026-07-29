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
  CombatStyle,
  CyclePowerEntry,
  Difficulty,
  EncounterConcept,
  EncounterProjectPlan,
  EnemyPhaseStat,
  EnemyRank,
  EnemyStatBlock,
  EnvironmentPlan,
  PartyMetrics,
  PhasePlan,
  SecondaryStyle,
  TargetingMode,
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
  const melee = concept.style === 'martial';
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
        fallbackName: 'Flächenschlag',
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
      fallbackName: melee ? 'Schwerer Hieb' : 'Zerstörerischer Strahl',
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
  // AoE attacks roll vs the fixed Area TN = 8 × Source MR (ignores Evade) —
  // that keeps their hit chance predictable regardless of the party.
  const areaTn = 8 * Math.max(1, bossMr);
  const attackDiceAoe = clamp(
    solveAttackDiceForHitRate(areaTn, bossMr, hitTarget, 2, 16, 1200, rng),
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
    });
  });
  return entries;
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
  concept: EncounterConcept,
  rng: Rng = Math.random,
): EncounterProjectPlan {
  const difficulty = RANK_TO_DIFFICULTY[concept.rank];
  const params = DIFFICULTY_PARAMS[difficulty];
  const rankFactor = RANK_BUDGET_FACTOR[concept.rank];
  const notes: string[] = [];

  // Boss defensive frame (like the classic model, biased by rank).
  const bossMrBase = clamp(party.medianMR + RANK_MR_OFFSET[concept.rank], 1, 8);
  const desiredEvade = quantile(party.pooledAttackTotals, 1 - params.partyHitRateVsBoss);
  const { mr, agility, realizedEvade } = evadeToMrAgility(desiredEvade, bossMrBase);
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
  const perActionBudget = bossBudget / actionsPerRound;

  // Total HP: party focus-DPS × target TTK (rank-scaled).
  let partyDps = 0;
  for (const m of party.members) {
    const hr = hitRate(m.attackTotals, realizedEvade);
    const dmg = Math.max(0, m.weaponDamageMean + m.mightMeleeBonus - armor);
    partyDps += hr * dmg * m.attacksPerRound;
  }
  partyDps = Math.max(1, partyDps);
  const totalHp = Math.max(
    concept.phaseCount,
    Math.round(partyDps * params.bossTTKRounds * Math.sqrt(rankFactor)),
  );

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
    saves: { body: mr * 2, mind: mr * 2, spirit: mr * 2 },
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
  if (adds) {
    tactics.push(`Spawnen: ${adds.spawnPerRound}/Runde bis max. ${adds.maxActive} aktiv${adds.summonCostsBossAction ? ' (kostet je 1 Boss-Aktion)' : ''}.`);
  }

  return {
    concept,
    difficulty,
    boss,
    phasePlans,
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
  };
}

export const ARCHETYPE_PRESETS: ArchetypePreset[] = [
  {
    id: 'ruin-spellcaster',
    label: 'Ruin Spellcaster',
    description: 'Verlässlicher, rüstungsignorierender Druck über Ruin.',
    concept: {
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
    },
  },
  {
    id: 'burning-portal',
    label: 'Das brennende Zaubertor',
    description: 'Phasen- und Umgebungskampf: Zonen tragen das Budget.',
    concept: {
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
    },
  },
  {
    id: 'red-priest',
    label: 'Der rote Priester',
    description: 'Summoner: die Hunde-Action-Economy ist die Bedrohung.',
    concept: {
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
    },
  },
  {
    id: 'kerkermeister',
    label: 'Der Kerkermeister',
    description: 'Martial Attrition Striker: Lacerate, Single-Target-Druck.',
    concept: {
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
    },
  },
  {
    id: 'samael',
    label: 'Samael (Mythic)',
    description: 'Drei Profile hintereinander: Kontrolle → Direktkampf → Eskalation.',
    concept: {
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
    },
  },
];

// ─── Option lists for the UI ─────────────────────────────────────────────

export const STYLE_OPTIONS: Array<{ value: CombatStyle; label: string }> = [
  { value: 'spell', label: 'Spell' },
  { value: 'martial', label: 'Martial' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'summoner', label: 'Summoner' },
  { value: 'environmental', label: 'Environmental' },
];

export const SECONDARY_STYLE_OPTIONS: Array<{ value: SecondaryStyle; label: string }> = [
  { value: 'none', label: 'Keiner' },
  { value: 'martial', label: 'Martial Attacks' },
  { value: 'direct-spells', label: 'Direct Spells' },
  { value: 'aoe-spells', label: 'AoE Spells' },
  { value: 'control', label: 'Control' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'defense', label: 'Defense' },
  { value: 'summoning', label: 'Summoning' },
];

export const TARGETING_OPTIONS: Array<{ value: TargetingMode; label: string }> = [
  { value: 'single', label: 'Single Target' },
  { value: 'aoe', label: 'AoE' },
  { value: 'mixed', label: 'Mixed' },
];

export const RANK_OPTIONS: Array<{ value: EnemyRank; label: string }> = [
  { value: 'minor', label: 'Minor' },
  { value: 'standard', label: 'Standard' },
  { value: 'major', label: 'Major Encounter' },
  { value: 'mythic', label: 'Mythic' },
];

export const CYCLE_STYLE_OPTIONS: Array<{ value: EncounterConcept['cycleStyle']; label: string }> = [
  { value: 'fixed', label: 'Fixed — feste Reihenfolge' },
  { value: 'weighted', label: 'Weighted — nach Gewichtung' },
  { value: 'conditional', label: 'Conditional — reagiert auf den Kampf' },
  { value: 'phase-based', label: 'Phase-Based — eigener Cycle pro Phase' },
];

export function primarySpecialOptions(): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [{ value: 'none', label: 'Kein Special' }];
  for (const e of ALL_SPECIAL_EFFECTS) {
    if (e.category !== 'diminishing') continue;
    if (e.id === 'regeneration') continue;
    out.push({ value: e.id, label: getEffectBaseName(e.name) });
  }
  return out;
}

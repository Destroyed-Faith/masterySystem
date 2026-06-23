/**
 * Raise resolution — Players Guide Raise rules.
 *
 * Declared Raises create a Raise TN (+4 each) while Normal TN stays fixed.
 * Raise Cost is paid before the roll; restored only on full Raise success.
 */

import { RAISE_INCREMENT } from '../utils/constants.js';
import { clampAtZero, formatD8Count, parseD8Count } from '../utils/dice-formula.js';
import type { AoeSpec, DurationSpec, PowerSpecial, RangeSpec } from '../types/item.js';

export type RaiseEffectKind =
  | 'damage'
  | 'specialPlus'
  | 'rangePlus'
  | 'aoeRadiusPlus'
  | 'durationPlus';

export type RaiseOutcome = 'fail' | 'partial' | 'full';

export interface PowerSpecialEntry {
  key: string;
  rank: number;
}

export interface PowerSnapshot {
  damageDice: number;
  specials: PowerSpecialEntry[];
  rangeM: number | null;
  aoeRadiusM: number | null;
  durationSteps: number;
  hasRange: boolean;
  hasAoe: boolean;
  hasDuration: boolean;
}

export interface DeclaredRaise {
  effect: RaiseEffectKind;
  targetSpecialKey?: string;
  /** Raise slots consumed (1 or 2 per option). */
  slots: 1 | 2;
}

export interface RaiseCostAllocation {
  /** d8 removed from damage pool for spell mixed cost. */
  damageDice: number;
  /** Special rank value removed, keyed by special key. */
  specialByKey: Record<string, number>;
}

export interface RaiseOption {
  id: string;
  label: string;
  effect: RaiseEffectKind;
  targetSpecialKey?: string;
  slots: 1 | 2;
}

export interface ResolvePowerSnapshotParams {
  base: PowerSnapshot;
  declaredRaises: DeclaredRaise[];
  outcome: RaiseOutcome;
  masteryRank: number;
  isSpell: boolean;
  /** Free bonus raise effects on full success (stones). */
  stoneBonusRaises?: number;
  /** Player-chosen spell raise cost split (from attack card). */
  spellCostOverride?: RaiseCostAllocation;
}

function cloneSnapshot(s: PowerSnapshot): PowerSnapshot {
  return {
    ...s,
    specials: s.specials.map((x) => ({ ...x })),
  };
}

export function computeRaiseTns(
  normalTn: number,
  declaredRaiseSlots: number,
): { normalTn: number; raiseTn: number } {
  const base = Math.max(0, Math.floor(normalTn));
  const slots = Math.max(0, Math.floor(declaredRaiseSlots));
  return {
    normalTn: base,
    raiseTn: slots > 0 ? base + slots * RAISE_INCREMENT : base,
  };
}

/**
 * All-or-nothing: partial only when declared raises > 0 and total meets Normal TN
 * but not Raise TN.
 */
export function resolveRaiseOutcome(
  total: number,
  normalTn: number,
  declaredRaiseSlots: number,
  /** Intellect Spell Raises: bonus applied only when checking Raise TN. */
  raiseTnRollBonus = 0,
): RaiseOutcome {
  const t = Number(total) || 0;
  const normal = Math.max(0, Math.floor(normalTn));
  const slots = Math.max(0, Math.floor(declaredRaiseSlots));
  const raiseBonus = Math.max(0, Math.floor(raiseTnRollBonus));
  if (t < normal) return 'fail';
  if (slots <= 0) return 'full';
  const { raiseTn } = computeRaiseTns(normal, slots);
  return t + raiseBonus >= raiseTn ? 'full' : 'partial';
}

/** Total raise slots from declared raise plan. */
export function countRaiseSlots(raises: DeclaredRaise[]): number {
  return raises.reduce((sum, r) => sum + (r.slots === 2 ? 2 : 1), 0);
}

/** Martial: MR d8 per raise slot. Spell: MR total value per raise slot. */
export function raiseCostPerSlot(masteryRank: number): number {
  return Math.max(1, Math.floor(masteryRank));
}

/**
 * Default spell cost split: damage dice first, then special rank (largest first).
 */
export function defaultSpellCostAllocation(
  snapshot: PowerSnapshot,
  totalValue: number,
): RaiseCostAllocation {
  let remaining = Math.max(0, Math.floor(totalValue));
  const out: RaiseCostAllocation = { damageDice: 0, specialByKey: {} };
  const fromDamage = Math.min(snapshot.damageDice, remaining);
  out.damageDice = fromDamage;
  remaining -= fromDamage;
  if (remaining <= 0) return out;

  const sorted = [...snapshot.specials].sort((a, b) => b.rank - a.rank);
  for (const sp of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(sp.rank, remaining);
    if (take > 0) {
      out.specialByKey[sp.key] = (out.specialByKey[sp.key] ?? 0) + take;
      remaining -= take;
    }
  }
  return out;
}

export function computeTotalRaiseCost(
  raiseSlots: number,
  masteryRank: number,
): number {
  return raiseCostPerSlot(masteryRank) * Math.max(0, Math.floor(raiseSlots));
}

/** Apply raise cost to a snapshot (pre-roll state). */
export function applyRaiseCost(
  snapshot: PowerSnapshot,
  cost: RaiseCostAllocation,
): PowerSnapshot {
  const next = cloneSnapshot(snapshot);
  next.damageDice = clampAtZero(next.damageDice - cost.damageDice);
  for (const sp of next.specials) {
    const paid = cost.specialByKey[sp.key] ?? 0;
    sp.rank = clampAtZero(sp.rank - paid);
  }
  next.specials = next.specials.filter((sp) => sp.rank > 0);
  return next;
}

function applyOneRaiseEffect(
  snap: PowerSnapshot,
  raise: DeclaredRaise,
  masteryRank: number,
  isSpell: boolean,
): void {
  const mr = Math.max(1, Math.floor(masteryRank));
  switch (raise.effect) {
    case 'damage':
      snap.damageDice += isSpell ? 1 : mr;
      break;
    case 'specialPlus': {
      const key = raise.targetSpecialKey;
      if (!key) break;
      const sp = snap.specials.find((s) => s.key === key);
      if (sp) sp.rank += mr;
      break;
    }
    case 'rangePlus':
      if (snap.hasRange && snap.rangeM != null) snap.rangeM += 4;
      break;
    case 'aoeRadiusPlus':
      if (snap.hasAoe && snap.aoeRadiusM != null) snap.aoeRadiusM += 1;
      break;
    case 'durationPlus':
      if (snap.hasDuration) snap.durationSteps += 1;
      break;
    default:
      break;
  }
}

/** Apply stone bonus as default damage raise (martial +MR, spell +1d8 each). */
function applyStoneBonusRaises(
  snap: PowerSnapshot,
  count: number,
  masteryRank: number,
  isSpell: boolean,
): void {
  const n = Math.max(0, Math.floor(count));
  const mr = Math.max(1, Math.floor(masteryRank));
  for (let i = 0; i < n; i++) {
    snap.damageDice += isSpell ? 1 : mr;
  }
}

/**
 * Resolve final power snapshot from base, declared raises, outcome, and stone bonus.
 */
export function resolvePowerSnapshot(params: ResolvePowerSnapshotParams): PowerSnapshot {
  const {
    base,
    declaredRaises,
    outcome,
    masteryRank,
    isSpell,
    stoneBonusRaises = 0,
    spellCostOverride,
  } = params;

  if (outcome === 'fail') {
    return cloneSnapshot(base);
  }

  const slots = countRaiseSlots(declaredRaises);
  const costValue = computeTotalRaiseCost(slots, masteryRank);
  const costAlloc = isSpell
    ? spellCostOverride ?? defaultSpellCostAllocation(base, costValue)
    : { damageDice: costValue, specialByKey: {} as Record<string, number> };

  if (outcome === 'partial') {
    return applyRaiseCost(base, costAlloc);
  }

  // Full success: cost restored (start from base), then apply raise effects + stones.
  const snap = cloneSnapshot(base);
  for (const r of declaredRaises) {
    applyOneRaiseEffect(snap, r, masteryRank, isSpell);
  }
  if (stoneBonusRaises > 0) {
    applyStoneBonusRaises(snap, stoneBonusRaises, masteryRank, isSpell);
  }
  return snap;
}

/** Pre-roll snapshot after paying raise cost (for UI preview). */
export function previewAfterRaiseCost(
  base: PowerSnapshot,
  declaredRaises: DeclaredRaise[],
  masteryRank: number,
  isSpell: boolean,
  spellCostOverride?: RaiseCostAllocation,
): PowerSnapshot {
  const slots = countRaiseSlots(declaredRaises);
  if (slots <= 0) return cloneSnapshot(base);
  const costValue = computeTotalRaiseCost(slots, masteryRank);
  const cost =
    spellCostOverride ??
    (isSpell
      ? defaultSpellCostAllocation(base, costValue)
      : { damageDice: costValue, specialByKey: {} });
  return applyRaiseCost(base, cost);
}

export function buildAvailableRaiseOptions(
  snapshot: PowerSnapshot,
  isSpell: boolean,
): RaiseOption[] {
  const options: RaiseOption[] = [];
  const damageLabel = isSpell ? '+1d8 Spell Damage' : '+MR Damage Dice';
  options.push({
    id: 'damage',
    label: damageLabel,
    effect: 'damage',
    slots: 1,
  });

  for (const sp of snapshot.specials) {
    const name = sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
    options.push({
      id: `special:${sp.key}`,
      label: `Increase ${name}(${sp.rank}) by +MR`,
      effect: 'specialPlus',
      targetSpecialKey: sp.key,
      slots: 1,
    });
  }

  if (snapshot.hasRange) {
    options.push({
      id: 'range',
      label: '+4 m Range',
      effect: 'rangePlus',
      slots: 1,
    });
  }

  if (snapshot.hasAoe) {
    options.push({
      id: 'aoe',
      label: '+1 m AoE Radius (2 Raises)',
      effect: 'aoeRadiusPlus',
      slots: 2,
    });
  }

  if (isSpell && snapshot.hasDuration) {
    options.push({
      id: 'duration',
      label: '+1 Duration Step (2 Raises)',
      effect: 'durationPlus',
      slots: 2,
    });
  }

  return options;
}

export function formatSnapshotSummary(snapshot: PowerSnapshot): string {
  const parts: string[] = [];
  if (snapshot.damageDice > 0) parts.push(formatD8Count(snapshot.damageDice));
  for (const sp of snapshot.specials) {
    const name = sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
    parts.push(`${name}(${sp.rank})`);
  }
  if (snapshot.hasRange && snapshot.rangeM != null) {
    parts.push(`Range ${snapshot.rangeM}m`);
  }
  if (snapshot.hasAoe && snapshot.aoeRadiusM != null) {
    parts.push(`AoE ${snapshot.aoeRadiusM}m`);
  }
  if (snapshot.hasDuration && snapshot.durationSteps > 0) {
    parts.push(`Duration +${snapshot.durationSteps}`);
  }
  return parts.length ? parts.join(', ') : '—';
}

/** Build a PowerSnapshot from level row data (attack card / damage dialog). */
export function buildPowerSnapshotFromLevelData(
  levelData: {
    effect?: { dice?: string };
    roll?: { damage?: string };
    specials?: Array<PowerSpecial | string>;
    range?: RangeSpec | null;
    aoe?: AoeSpec | null;
    duration?: DurationSpec | null;
  } | null,
  fallbackDamage: string,
  fallbackSpecials: string[],
): PowerSnapshot {
  let damageStr = fallbackDamage;
  const specials: PowerSpecialEntry[] = [];

  if (levelData) {
    if (levelData.effect?.dice) damageStr = levelData.effect.dice;
    else if (levelData.roll?.damage) damageStr = levelData.roll.damage;

    if (Array.isArray(levelData.specials)) {
      for (const s of levelData.specials) {
        if (typeof s === 'string') {
          const m = s.match(/^([^(]+)(?:\((\d+)\))?$/i);
          if (m) {
            specials.push({
              key: m[1].trim().toLowerCase().replace(/\s+/g, '-'),
              rank: m[2] ? parseInt(m[2], 10) : 1,
            });
          }
        } else if (s && typeof s === 'object') {
          const key = String(s.key ?? s.type ?? '').toLowerCase();
          const rank = Number(s.rank ?? s.value ?? 1);
          if (key) specials.push({ key, rank: Math.max(0, rank) });
        }
      }
    }
  }

  if (specials.length === 0 && fallbackSpecials.length) {
    for (const s of fallbackSpecials) {
      const m = String(s).match(/^([^(]+)(?:\((\d+)\))?$/i);
      if (m) {
        specials.push({
          key: m[1].trim().toLowerCase().replace(/\s+/g, '-'),
          rank: m[2] ? parseInt(m[2], 10) : 1,
        });
      }
    }
  }

  const range = levelData?.range ?? null;
  const aoe = levelData?.aoe ?? null;
  const duration = levelData?.duration ?? null;

  const hasRange =
    !!range &&
    range.kind === 'distance' &&
    typeof range.m === 'number' &&
    range.m > 0;
  const aoeRadius =
    aoe?.radiusM ?? aoe?.sizeM ?? aoe?.m ?? null;
  const hasAoe =
    !!aoe &&
    aoe.shape !== 'none' &&
    aoe.shape !== 'single' &&
    typeof aoeRadius === 'number' &&
    aoeRadius > 0;
  const hasDuration =
    !!duration &&
    duration.kind !== 'instant' &&
    duration.kind !== 'endOfTurn';

  return {
    damageDice: parseD8Count(damageStr),
    specials,
    rangeM: hasRange ? (range!.m ?? null) : null,
    aoeRadiusM: hasAoe ? Number(aoeRadius) : null,
    durationSteps: hasDuration ? 1 : 0,
    hasRange,
    hasAoe,
    hasDuration,
  };
}

/** Parse raise plan JSON from attack card data attribute. */
export function parseDeclaredRaises(raw: string | null | undefined): DeclaredRaise[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) => r && typeof r.effect === 'string' && (r.slots === 1 || r.slots === 2),
    ) as DeclaredRaise[];
  } catch {
    return [];
  }
}

export function snapshotToDamageFormula(snapshot: PowerSnapshot): string {
  return formatD8Count(snapshot.damageDice);
}

export function snapshotToSpecialStrings(snapshot: PowerSnapshot): string[] {
  return snapshot.specials.map((sp) => {
    const name = sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
    return `${name}(${sp.rank})`;
  });
}

/** Load template level data for a power item (attack card / damage dialog). */
export async function loadPowerSnapshotForItem(
  powerItem: any,
): Promise<{ snapshot: PowerSnapshot; isSpell: boolean; levelData: any | null }> {
  const powerSystem = powerItem?.system ?? {};
  const isSpell =
    powerSystem.isSpell === true ||
    (Array.isArray(powerSystem.tags) && powerSystem.tags.includes('spell'));
  const rawLevel = powerSystem.level || 1;
  const fallbackDamage = String(powerSystem.roll?.damage ?? '0');
  const fallbackSpecials: string[] = Array.isArray(powerSystem.specials)
    ? [...powerSystem.specials]
    : [];

  let levelData: any = null;
  try {
    const powersModule = await import('../utils/powers/index.js' as any);
    const templates = powersModule.ALL_POWER_TEMPLATES || [];
    const templateId: string | undefined = powerSystem.templateId;
    let powerDef: any = null;
    if (templateId) {
      powerDef = templates.find((t: any) => t?.templateId === templateId);
    }
    if (!powerDef) {
      powerDef = templates.find(
        (t: any) => t?.templateName === powerItem.name || t?.name === powerItem.name,
      );
    }
    if (powerDef?.levels) {
      const { getPowerDefinitionRank } = await import('../utils/power-definition-rank.js');
      const definitionRank = getPowerDefinitionRank(rawLevel, powerSystem.levels || powerDef.levels);
      if (Array.isArray(powerDef.levels)) {
        levelData = powerDef.levels.find((l: any) => l.level === definitionRank);
      } else {
        levelData = powerDef.levels[String(definitionRank)];
      }
    }
  } catch {
    /* template optional */
  }

  const snapshot = buildPowerSnapshotFromLevelData(levelData, fallbackDamage, fallbackSpecials);
  return { snapshot, isSpell, levelData };
}

/** Map raise option id from UI to DeclaredRaise. */
export function declaredRaiseFromOptionId(
  optionId: string,
  options: RaiseOption[],
): DeclaredRaise | null {
  const opt = options.find((o) => o.id === optionId);
  if (!opt) return null;
  return {
    effect: opt.effect,
    targetSpecialKey: opt.targetSpecialKey,
    slots: opt.slots,
  };
}

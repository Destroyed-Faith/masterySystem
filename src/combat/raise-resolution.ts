/**
 * Raise resolution — Players Guide Raise rules.
 *
 * Declared Raises create a Raise TN (+4 each) while Normal TN stays fixed.
 * Raise Cost is paid before the roll; restored only on full Raise success.
 */

import { RAISE_INCREMENT } from '../utils/constants.js';
import { clampAtZero, formatD8Count, parseD8Count } from '../utils/dice-formula.js';
import type { AoeSpec, DurationSpec, PowerSpecial, RangeSpec } from '../types/item.js';
import type { RadialCombatOption } from '../radial-menu/types.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getEffect, getEffectBaseName, getEffectById } from '../utils/special-effects.js';

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
  /** GM marked this one Raise free. The others still pay. */
  free?: boolean;
  /** Printed rank turned on by a Special Raise. Not added on top of MR. */
  printedRank?: number;
  /** Attack-card label, so the table can see which Raise was picked. */
  label?: string;
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
  /** Printed rank this Raise turns on. A Special is off until this Raise. */
  printedRank?: number;
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
  /** GM / NPC: do not strip damage or specials to pay Raise Cost. */
  waiveRaiseCost?: boolean;
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

/** Damage Raises stack. Each Special (Penetration, Precision, …) only once per attack. */
export function dedupeDeclaredRaises(raises: DeclaredRaise[]): DeclaredRaise[] {
  const seen = new Set<string>();
  const out: DeclaredRaise[] = [];
  for (const raise of raises) {
    if (raise.effect === 'specialPlus') {
      const key = String(raise.targetSpecialKey || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
    }
    out.push(raise);
  }
  return out;
}

/** Total raise slots from declared raise plan. */
export function countRaiseSlots(raises: DeclaredRaise[]): number {
  return raises.reduce((sum, r) => sum + (r.slots === 2 ? 2 : 1), 0);
}

/** Slots that still pay Raise Cost. A free Raise still raises the TN. */
export function paidRaiseSlots(raises: DeclaredRaise[]): number {
  return raises.reduce((sum, r) => {
    if (r.free) return sum;
    return sum + (r.slots === 2 ? 2 : 1);
  }, 0);
}

export function describeDeclaredRaise(raise: DeclaredRaise): string {
  if (raise.label) return raise.label;
  switch (raise.effect) {
    case 'damage':
      return '+Schaden';
    case 'specialPlus':
      return `+${raise.targetSpecialKey || 'Special'}`;
    case 'rangePlus':
      return '+Reichweite';
    case 'aoeRadiusPlus':
      return '+AoE';
    case 'durationPlus':
      return '+Dauer';
    default:
      return 'Raise';
  }
}

/** One line the whole table can read: which Raises were picked, and which are free. */
export function formatDeclaredRaiseList(raises: DeclaredRaise[]): string {
  const picked = raises.filter((r) => r.effect);
  if (!picked.length) return 'Noch kein Raise gewählt.';
  return picked
    .map((r, i) => `${i + 1}. ${describeDeclaredRaise(r)}${r.free ? ' — kostenlos' : ''}`)
    .join(' · ');
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
      const key = String(raise.targetSpecialKey || '').trim().toLowerCase();
      if (!key) break;
      const printed = Math.max(0, Math.floor(Number(raise.printedRank) || 0));
      const sp = snap.specials.find((s) => s.key === key);
      if (printed > 0) {
        if (sp) sp.rank = printed;
        else snap.specials.push({ key, rank: printed });
        break;
      }
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
    waiveRaiseCost = false,
  } = params;

  const raises = dedupeDeclaredRaises(declaredRaises);

  if (outcome === 'fail') {
    return cloneSnapshot(base);
  }

  const slots = waiveRaiseCost ? 0 : paidRaiseSlots(raises);
  const costValue = computeTotalRaiseCost(slots, masteryRank);
  const costAlloc = isSpell
    ? spellCostOverride ?? defaultSpellCostAllocation(base, costValue)
    : { damageDice: costValue, specialByKey: {} as Record<string, number> };

  if (outcome === 'partial') {
    return applyRaiseCost(base, costAlloc);
  }

  // Full success: cost restored (start from base), then apply raise effects + stones.
  const snap = cloneSnapshot(base);
  for (const r of raises) {
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
  const unique = dedupeDeclaredRaises(declaredRaises);
  const slots = paidRaiseSlots(unique);
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
  const damageLabel = isSpell ? '+1d8 Zauberschaden' : '+MR Schaden';
  options.push({
    id: 'damage',
    label: damageLabel,
    effect: 'damage',
    slots: 1,
  });

  for (const sp of snapshot.specials) {
    const name = displaySpecialName(sp.key);
    options.push({
      id: `special:${sp.key}`,
      label: `${name}(${sp.rank})`,
      effect: 'specialPlus',
      targetSpecialKey: sp.key,
      printedRank: sp.rank,
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

function displaySpecialName(key: string): string {
  const effect = getEffectById(key) ?? getEffect(key);
  if (effect) return getEffectBaseName(effect.name);
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** One line: 11d8 (5d8 Waffe + 4d8 Power + 2d8 Raise). */
export function formatHitBreakdown(
  weaponDice: number | undefined,
  powerDice: number,
  extra?: { raiseDice?: number; specials?: PowerSpecialEntry[] },
): string {
  const w = Math.max(0, Math.floor(weaponDice ?? 0));
  const p = Math.max(0, Math.floor(powerDice));
  const r = Math.max(0, Math.floor(extra?.raiseDice ?? 0));
  const total = w + p + r;
  const parts: string[] = [];
  if (w > 0) parts.push(`${w}d8 Waffe`);
  if (p > 0 || w > 0) parts.push(`${p}d8 Power`);
  if (r > 0) parts.push(`${r}d8 Raise`);
  const head = parts.length ? `${total}d8 (${parts.join(' + ')})` : `${total}d8`;
  const specs = (extra?.specials ?? [])
    .filter((sp) => sp.rank > 0)
    .map((sp) => `${displaySpecialName(sp.key)}(${sp.rank})`);
  return specs.length ? `${head} + ${specs.join(', ')}` : head;
}

/** Weapon dice plus power dice, so 4d8 total is not read as the Raise itself. */
export function formatAttackDiceLine(powerDice: number, weaponDice?: number): string {
  const w = Math.max(0, Math.floor(weaponDice ?? 0));
  const p = Math.max(0, Math.floor(powerDice));
  if (w <= 0) return `${p}d8 Power`;
  if (p <= 0) return `${w}d8 gesamt (nur die Waffe)`;
  return `${w + p}d8 gesamt (${w}d8 Waffe + ${p}d8 Power)`;
}

/**
 * What a full Raise actually changes. Specials that stay put are named, so
 * Penetration on the weapon is not mistaken for a Raise the player took.
 */
export function describeSnapshotDelta(
  base: PowerSnapshot,
  resolved: PowerSnapshot,
  weaponDice?: number,
): string {
  const parts: string[] = [];
  if (resolved.damageDice !== base.damageDice) {
    parts.push(
      `Schaden ${formatAttackDiceLine(base.damageDice, weaponDice)} → ${formatAttackDiceLine(resolved.damageDice, weaponDice)}`,
    );
  } else {
    parts.push(`Schaden bleibt ${formatAttackDiceLine(resolved.damageDice, weaponDice)}`);
  }

  const baseRanks = new Map(base.specials.map((sp) => [sp.key, sp.rank]));
  const seen = new Set<string>();
  for (const sp of resolved.specials) {
    seen.add(sp.key);
    const from = baseRanks.get(sp.key);
    const name = displaySpecialName(sp.key);
    if (from == null) parts.push(`${name}(${sp.rank}) aktiv`);
    else if (from !== sp.rank) parts.push(`${name} ${from} → ${sp.rank}`);
  }
  for (const sp of base.specials) {
    if (seen.has(sp.key) || sp.rank <= 0) continue;
    parts.push(`${displaySpecialName(sp.key)} ${sp.rank} → 0`);
  }

  const unchanged = resolved.specials
    .filter((sp) => baseRanks.get(sp.key) === sp.rank && sp.rank > 0)
    .map((sp) => `${displaySpecialName(sp.key)}(${sp.rank})`);
  if (unchanged.length) {
    parts.push(`schon vorher drauf, kein Raise: ${unchanged.join(', ')}`);
  }
  return `${parts.join('. ')}.`;
}

export function formatRaiseResultLine(params: {
  outcome: 'full' | 'partial';
  base: PowerSnapshot;
  resolved: PowerSnapshot;
  declared: DeclaredRaise[];
  lostCostLabel?: string;
  weaponDice?: number;
}): string {
  const delta = describeSnapshotDelta(params.base, params.resolved, params.weaponDice);
  const picked = params.declared.length
    ? ` Gewählt: ${formatDeclaredRaiseList(params.declared)}.`
    : '';
  if (params.outcome === 'partial') {
    const cost = params.lostCostLabel
      ? ` Die Kosten von ${params.lostCostLabel} bleiben weg.`
      : '';
    return `Raise verfehlt.${cost} ${delta}${picked}`;
  }
  return `Raise gelungen. ${delta}${picked}`;
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

/** Labeled result so "3d8, Range 12m" is not read as the Raise itself. */
export function formatRaiseOutcomeBody(snapshot: PowerSnapshot): string {
  const parts: string[] = [`${Math.max(0, Math.floor(snapshot.damageDice))}d8 Schaden`];
  for (const sp of snapshot.specials) {
    const name = sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
    parts.push(`${name}(${sp.rank})`);
  }
  if (snapshot.hasRange && snapshot.rangeM != null) parts.push(`Reichweite ${snapshot.rangeM} m`);
  if (snapshot.hasAoe && snapshot.aoeRadiusM != null) parts.push(`AoE ${snapshot.aoeRadiusM} m`);
  if (snapshot.hasDuration && snapshot.durationSteps > 0) parts.push(`Dauer +${snapshot.durationSteps}`);
  return parts.join(', ');
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
          // An unbound `SPECIAL` picker placeholder is not a real Special —
          // never let it reach the damage/status pipeline as "Special(X)".
          if (key === 'special') continue;
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

/**
 * Bind the `SPECIAL` picker placeholder in a level row to the item's chosen
 * Special. Catalog Martial/support templates carry `{ key: 'SPECIAL' }` rows;
 * item creation binds them into `system.levels`, but whenever level data is
 * (re-)read from the raw template the placeholder must be bound again —
 * otherwise the damage pipeline emits a meaningless "Special(X)" instead of
 * e.g. "Sundered(X)" and no status effect lands on the target.
 */
export function bindChosenSpecialIntoLevelData(
  levelData: any | null,
  chosenSpecialKey: string | null | undefined,
): any | null {
  if (!levelData || !chosenSpecialKey || !Array.isArray(levelData.specials)) return levelData;
  if (!levelData.specials.some((s: any) => s?.key === 'SPECIAL')) return levelData;
  return {
    ...levelData,
    specials: levelData.specials.map((s: any) =>
      s?.key === 'SPECIAL' ? { ...s, key: chosenSpecialKey } : s,
    ),
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
    const effect = getEffectById(sp.key) ?? getEffect(sp.key);
    const name = effect
      ? getEffectBaseName(effect.name)
      : sp.key.charAt(0).toUpperCase() + sp.key.slice(1);
    return `${name}(${sp.rank})`;
  });
}

/** Load template level data for an artifact radial option flagged as a Spell. */
export async function loadPowerSnapshotForArtifactOption(
  option: RadialCombatOption,
): Promise<{ snapshot: PowerSnapshot; isSpell: boolean; levelData: any | null } | null> {
  if (!option.artifactIsSpell || !option.artifactPowerTemplateId) return null;
  const templateId = option.artifactPowerTemplateId;
  const pl = artifactLevelToTemplateRank(option.artifactRowLevel || 1);
  const chosenKey = option.artifactChosenSpecialKey;

  let levelData: any = null;
  try {
    const powersModule = await import('../utils/powers/index.js' as any);
    const templates = powersModule.ALL_POWER_TEMPLATES || [];
    const powerDef = templates.find((t: any) => t?.templateId === templateId);
    if (powerDef?.levels) {
      levelData = powerDef.levels[pl] ?? null;
      if (levelData && chosenKey) {
        const specials = (levelData.specials || []).map((s: PowerSpecial) =>
          s.key === 'SPECIAL' ? { ...s, key: chosenKey } : s,
        );
        levelData = { ...levelData, specials };
      }
    }
  } catch {
    /* template optional */
  }

  const fallbackSpecials: string[] = (levelData?.specials || []).map((s: PowerSpecial) =>
    s.rank != null ? `${s.key}(${s.rank})` : s.key,
  );
  const snapshot = buildPowerSnapshotFromLevelData(levelData, '0', fallbackSpecials);
  return { snapshot, isSpell: true, levelData };
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
      // Prefer the item's own bound levels (SPECIAL placeholder already
      // replaced by chosenSpecial at item creation) over the raw template.
      const levelsSource = powerSystem.levels || powerDef.levels;
      if (Array.isArray(levelsSource)) {
        levelData = levelsSource.find((l: any) => l.level === definitionRank);
      } else {
        levelData = levelsSource[String(definitionRank)];
      }
    }
  } catch {
    /* template optional */
  }

  levelData = bindChosenSpecialIntoLevelData(levelData, powerSystem.chosenSpecial?.key);
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
    label: opt.label,
    ...(opt.printedRank ? { printedRank: opt.printedRank } : {}),
  };
}

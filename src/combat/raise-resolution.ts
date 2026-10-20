/**
 * Combat Raise resolution — Players Guide Universal Combat Raise Catalog.
 *
 * One decisive Final TN per target:
 *   Final TN = Applicable Base TN + (Paid Raises × 4)
 * Free Raises do not increase TN. Meeting the Final TN is the only hit path —
 * there is no "hit Normal TN / Raises Failed" partial outcome.
 */

import { RAISE_INCREMENT } from '../utils/constants.js';
import { clampAtZero, formatD8Count, parseD8Count } from '../utils/dice-formula.js';
import type { AoeSpec, DurationSpec, PowerSpecial, RangeSpec } from '../types/item.js';
import type { RadialCombatOption } from '../radial-menu/types.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getEffect, getEffectBaseName, getEffectById } from '../utils/special-effects.js';
import { bindPoolSpecialsOnRow } from '../utils/powers/pool-special-ranks.js';
import { injectOptionalWeaponAoeChosenSpecial } from '../artifacts/progression-compiler.js';

export type RaiseEffectKind =
  | 'damage'
  | 'specialPlus'
  | 'rangePlus'
  | 'aoeRadiusPlus'
  | 'durationPlus';

/** Combat outcomes: miss the Final TN, or hit with all declared Raises. */
export type RaiseOutcome = 'fail' | 'full';

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
  /** Free Raise (Intellect): no TN increase. */
  free?: boolean;
  /** Printed rank shown in the Raise menu. */
  printedRank?: number;
  /** Attack-card label, so the table can see which Raise was picked. */
  label?: string;
}

/** @deprecated Combat Raises have no Raise Cost. Kept for legacy call sites. */
export interface RaiseCostAllocation {
  damageDice: number;
  specialByKey: Record<string, number>;
}

export interface RaiseOption {
  id: string;
  label: string;
  effect: RaiseEffectKind;
  targetSpecialKey?: string;
  printedRank?: number;
  slots: 1 | 2;
}

export interface ResolvePowerSnapshotParams {
  base: PowerSnapshot;
  declaredRaises: DeclaredRaise[];
  outcome: RaiseOutcome | 'partial' | string;
  masteryRank: number;
  isSpell: boolean;
  /**
   * @deprecated Do not use for combat. Unassigned Free Raises must be allocated
   * explicitly — never auto-converted to Damage.
   */
  stoneBonusRaises?: number;
  /** @deprecated Ignored — Combat Raises have no Raise Cost. */
  spellCostOverride?: RaiseCostAllocation;
  /** @deprecated Ignored — Combat Raises have no Raise Cost. */
  waiveRaiseCost?: boolean;
}

function cloneSnapshot(s: PowerSnapshot): PowerSnapshot {
  return {
    ...s,
    specials: s.specials.map((x) => ({ ...x })),
  };
}

/** Normalize stored / legacy outcomes. `partial` is always a miss for payload. */
export function normalizeRaiseOutcome(raw: unknown): RaiseOutcome {
  return String(raw || '').toLowerCase() === 'full' ? 'full' : 'fail';
}

/** Final TN for one target resolution. Free Raises are not included in `paidRaiseSlots`. */
export function computeFinalTn(baseTn: number, paidRaiseSlots: number): number {
  const base = Math.max(0, Math.floor(baseTn));
  const slots = Math.max(0, Math.floor(paidRaiseSlots));
  return base + slots * RAISE_INCREMENT;
}

/**
 * Base TN plus Final TN (sole success threshold).
 * `raiseTn` is an alias of `finalTn` for older callers.
 */
export function computeRaiseTns(
  normalTn: number,
  declaredRaiseSlots: number,
): { normalTn: number; raiseTn: number; finalTn: number } {
  const base = Math.max(0, Math.floor(normalTn));
  const finalTn = computeFinalTn(base, declaredRaiseSlots);
  return { normalTn: base, raiseTn: finalTn, finalTn };
}

/**
 * Combat: all-or-nothing against the Final TN.
 * Meeting Base TN but missing Final TN is a miss — never a partial hit.
 */
export function resolveRaiseOutcome(
  total: number,
  normalTn: number,
  declaredRaiseSlots: number,
  /** Optional roll bonus applied only when Paid Raises raised the TN. */
  raiseTnRollBonus = 0,
): RaiseOutcome {
  const t = Number(total) || 0;
  const base = Math.max(0, Math.floor(normalTn));
  const slots = Math.max(0, Math.floor(declaredRaiseSlots));
  const finalTn = computeFinalTn(base, slots);
  const bonus = slots > 0 ? Math.max(0, Math.floor(raiseTnRollBonus)) : 0;
  return t + bonus >= finalTn ? 'full' : 'fail';
}

/**
 * Noncombat declared-raise bands (Rituals, Social): Base TN vs Raise TN.
 * Combat must not use this — use `resolveRaiseOutcome` instead.
 */
export function resolveDeclaredRaiseBands(
  total: number,
  normalTn: number,
  declaredRaiseSlots: number,
  raiseTnRollBonus = 0,
): 'fail' | 'partial' | 'full' {
  const t = Number(total) || 0;
  const normal = Math.max(0, Math.floor(normalTn));
  const slots = Math.max(0, Math.floor(declaredRaiseSlots));
  const raiseBonus = Math.max(0, Math.floor(raiseTnRollBonus));
  if (t < normal) return 'fail';
  if (slots <= 0) return 'full';
  const finalTn = computeFinalTn(normal, slots);
  return t + raiseBonus >= finalTn ? 'full' : 'partial';
}

/**
 * Damage Raises stack. Special Raises stack when assigned to the same Special.
 * (Older code deduped Special Raises once — that contradicted the catalog.)
 */
export function dedupeDeclaredRaises(raises: DeclaredRaise[]): DeclaredRaise[] {
  return raises.filter((r) => r && typeof r.effect === 'string');
}

/** Total raise slots from declared raise plan. */
export function countRaiseSlots(raises: DeclaredRaise[]): number {
  return raises.reduce((sum, r) => sum + (r.slots === 2 ? 2 : 1), 0);
}

/** Slots that increase the Final TN. Free Raises do not. */
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
    .map((r, i) => `${i + 1}. ${describeDeclaredRaise(r)}${r.free ? ' — Free' : ''}`)
    .join(' · ');
}

/** @deprecated Combat Raises have no Raise Cost. */
export function raiseCostPerSlot(masteryRank: number): number {
  return Math.max(1, Math.floor(masteryRank));
}

/** @deprecated Combat Raises have no Raise Cost. */
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

/** @deprecated Combat Raises have no Raise Cost. */
export function computeTotalRaiseCost(raiseSlots: number, masteryRank: number): number {
  return raiseCostPerSlot(masteryRank) * Math.max(0, Math.floor(raiseSlots));
}

/** @deprecated Combat Raises have no Raise Cost. */
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

/** Dice added by one Damage Raise. Single target: MR. AoE: ceil(MR/2). */
export function damageRaiseDicePerRaise(masteryRank: number, aoe: boolean): number {
  const mr = Math.max(1, Math.floor(masteryRank));
  return aoe ? Math.ceil(mr / 2) : mr;
}

function applyOneRaiseEffect(
  snap: PowerSnapshot,
  raise: DeclaredRaise,
  masteryRank: number,
): void {
  switch (raise.effect) {
    case 'damage':
      snap.damageDice += damageRaiseDicePerRaise(masteryRank, snap.hasAoe);
      break;
    case 'specialPlus': {
      const key = String(raise.targetSpecialKey || '').trim().toLowerCase();
      if (!key) break;
      const sp = snap.specials.find((s) => s.key === key);
      if (sp) sp.rank += Math.max(1, Math.floor(masteryRank));
      break;
    }
    default:
      break;
  }
}

/**
 * Successful Raise slots available for post-roll allocation.
 * Free Raises do not raise TN but still grant effects when the Final TN is met.
 */
export function successfulRaiseSlotCount(paidSlots: number, freeSlots: number): number {
  return Math.max(0, Math.floor(paidSlots)) + Math.max(0, Math.floor(freeSlots));
}

/** True when every Raise slot has an eligible effect chosen. */
export function isRaiseAllocationComplete(
  plan: DeclaredRaise[],
  requiredSlots: number,
  options: RaiseOption[],
): boolean {
  const need = Math.max(0, Math.floor(requiredSlots));
  if (need <= 0) return true;
  // No eligible effects (e.g. Special-only Power with no numeric Specials and no Damage).
  if (!options.length) return plan.length === 0;
  if (countRaiseSlots(plan) !== need) return false;
  const allowed = new Set(options.map((o) => o.id));
  for (const raise of plan) {
    if (!raise?.effect) return false;
    if (raise.effect === 'damage') {
      if (!options.some((o) => o.effect === 'damage')) return false;
      continue;
    }
    if (raise.effect === 'specialPlus') {
      const id = `special:${String(raise.targetSpecialKey || '').toLowerCase()}`;
      if (!allowed.has(id)) return false;
      continue;
    }
    return false;
  }
  return true;
}

/**
 * Resolve final power snapshot from base, declared raises, and outcome.
 * Fail → base unchanged (caller must not apply payload).
 * Full → apply every explicitly allocated Raise effect only.
 * Never invent Damage Raises for unassigned slots.
 */
export function resolvePowerSnapshot(params: ResolvePowerSnapshotParams): PowerSnapshot {
  const { base, declaredRaises, outcome, masteryRank } = params;

  const raises = dedupeDeclaredRaises(declaredRaises).filter((r) => !!r.effect);
  if (normalizeRaiseOutcome(outcome) !== 'full') {
    return cloneSnapshot(base);
  }

  const snap = cloneSnapshot(base);
  for (const r of raises) {
    applyOneRaiseEffect(snap, r, masteryRank);
  }
  return snap;
}

/** Pre-roll preview: Combat Raises do not strip the pool. */
export function previewAfterRaiseCost(
  base: PowerSnapshot,
  _declaredRaises: DeclaredRaise[],
  _masteryRank: number,
  _isSpell: boolean,
  _spellCostOverride?: RaiseCostAllocation,
): PowerSnapshot {
  return cloneSnapshot(base);
}

/**
 * Sum every legal Damage Pool component for regression checks.
 * Raise dice are the bonus from successful Damage Raises only.
 */
export function sumCombatDamagePoolDice(parts: {
  weaponDice?: number;
  powerDice?: number;
  passiveDice?: number;
  raiseDice?: number;
  otherDice?: number;
}): number {
  return (
    Math.max(0, Math.floor(Number(parts.weaponDice) || 0)) +
    Math.max(0, Math.floor(Number(parts.powerDice) || 0)) +
    Math.max(0, Math.floor(Number(parts.passiveDice) || 0)) +
    Math.max(0, Math.floor(Number(parts.raiseDice) || 0)) +
    Math.max(0, Math.floor(Number(parts.otherDice) || 0))
  );
}

export function buildAvailableRaiseOptions(
  snapshot: PowerSnapshot,
  _isSpell: boolean,
  opts?: { hasWeaponDamage?: boolean },
): RaiseOption[] {
  const options: RaiseOption[] = [];
  const canDamage =
    Math.max(0, Math.floor(snapshot.damageDice)) > 0 || !!opts?.hasWeaponDamage;
  if (canDamage) {
    const per = snapshot.hasAoe ? 'ceil(MR/2)' : 'MR';
    options.push({
      id: 'damage',
      label: `+${per} d8 Damage`,
      effect: 'damage',
      slots: 1,
    });
  }

  for (const sp of snapshot.specials) {
    if (sp.rank <= 0) continue;
    const name = displaySpecialName(sp.key);
    options.push({
      id: `special:${sp.key}`,
      label: `+MR ${name} (now ${sp.rank})`,
      effect: 'specialPlus',
      targetSpecialKey: sp.key,
      printedRank: sp.rank,
      slots: 1,
    });
  }

  return options;
}

function displaySpecialName(key: string): string {
  const effect = getEffectById(key) ?? getEffect(key);
  if (effect) return getEffectBaseName(effect.name);
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** One line: 11d8 (5d8 Lor-Keth's Staff + 4d8 Power + 2d8 Raise). */
export function formatHitBreakdown(
  weaponDice: number | undefined,
  powerDice: number,
  extra?: { raiseDice?: number; specials?: PowerSpecialEntry[]; weaponName?: string },
): string {
  const w = Math.max(0, Math.floor(weaponDice ?? 0));
  const p = Math.max(0, Math.floor(powerDice));
  const r = Math.max(0, Math.floor(extra?.raiseDice ?? 0));
  const total = w + p + r;
  const weaponLabel = String(extra?.weaponName || '').trim() || 'Waffe';
  const parts: string[] = [];
  if (w > 0) parts.push(`${w}d8 ${weaponLabel}`);
  if (p > 0 || w > 0) parts.push(`${p}d8 Power`);
  if (r > 0) parts.push(`${r}d8 Raise`);
  const head = parts.length ? `${total}d8 (${parts.join(' + ')})` : `${total}d8`;
  const specs = (extra?.specials ?? [])
    .filter((sp) => sp.rank > 0)
    .map((sp) => `${displaySpecialName(sp.key)}(${sp.rank})`);
  return specs.length ? `${head} + ${specs.join(', ')}` : head;
}

/** Weapon dice plus power dice, so 4d8 total is not read as the Raise itself. */
export function formatAttackDiceLine(
  powerDice: number,
  weaponDice?: number,
  weaponName?: string,
): string {
  const w = Math.max(0, Math.floor(weaponDice ?? 0));
  const p = Math.max(0, Math.floor(powerDice));
  const weaponLabel = String(weaponName || '').trim() || 'Waffe';
  if (w <= 0) return `${p}d8 Power`;
  if (p <= 0) return `${w}d8 gesamt (nur ${weaponLabel})`;
  return `${w + p}d8 gesamt (${w}d8 ${weaponLabel} + ${p}d8 Power)`;
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
  outcome: 'full' | 'fail' | 'partial';
  base: PowerSnapshot;
  resolved: PowerSnapshot;
  declared: DeclaredRaise[];
  lostCostLabel?: string;
  weaponDice?: number;
}): string {
  const picked = params.declared.length
    ? ` Gewählt: ${formatDeclaredRaiseList(params.declared)}.`
    : '';
  if (normalizeRaiseOutcome(params.outcome) !== 'full') {
    return `Miss against Final TN — no Raises apply.${picked}`;
  }
  const delta = describeSnapshotDelta(params.base, params.resolved, params.weaponDice);
  return `Hit. Raises apply. ${delta}${picked}`;
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
 * Special.
 */
export function bindChosenSpecialIntoLevelData(
  levelData: any | null,
  chosenSpecialKey: string | null | undefined,
  templateId?: string | null,
  level?: number | null,
): any | null {
  if (!levelData || !chosenSpecialKey) return levelData;
  const pl = Number(level) || 1;
  const injected = injectOptionalWeaponAoeChosenSpecial(
    levelData,
    chosenSpecialKey,
    templateId,
    pl,
  );
  if (injected && injected !== levelData) return injected;
  if (!Array.isArray(levelData.specials)) return levelData;
  if (!levelData.specials.some((s: any) => s?.key === 'SPECIAL')) return levelData;
  return bindPoolSpecialsOnRow(levelData, chosenSpecialKey, templateId, pl);
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

/**
 * Older Dragon Claws rows stored Rending Spiral as a plain weapon AoE
 * (`active-melee-weapon-aoe`), which adds bonus dice and never applies Lacerate.
 * The printed profile is Melee AoE Attack + Lacerate.
 */
export function canonicalArtifactAttackTemplateId(option: RadialCombatOption): string {
  const stored = String(option.artifactPowerTemplateId || '');
  const key = String(option.artifactChosenSpecialKey || '').trim().toLowerCase();
  if (stored === 'active-melee-weapon-aoe' && key === 'lacerate') {
    return 'active-melee-aoe-damage-t4';
  }
  return stored;
}

/** Load catalog level data for an artifact Active (Frost Throw, spells, …). */
export async function loadPowerSnapshotForArtifactOption(
  option: RadialCombatOption,
): Promise<{ snapshot: PowerSnapshot; isSpell: boolean; levelData: any | null } | null> {
  if (!option.artifactPowerTemplateId) return null;
  const templateId = canonicalArtifactAttackTemplateId(option);
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
        levelData = bindChosenSpecialIntoLevelData(
          levelData,
          chosenKey,
          templateId,
          Number(pl) || 1,
        );
      }
    }
  } catch {
    /* template optional */
  }

  const fallbackSpecials: string[] = (levelData?.specials || []).map((s: PowerSpecial) =>
    s.rank != null ? `${s.key}(${s.rank})` : s.key,
  );
  const snapshot = buildPowerSnapshotFromLevelData(levelData, '0', fallbackSpecials);
  return { snapshot, isSpell: option.artifactIsSpell === true, levelData };
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
  let definitionRank = Math.max(1, Math.floor(Number(rawLevel) || 1));
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
      definitionRank = getPowerDefinitionRank(rawLevel, powerSystem.levels || powerDef.levels);
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

  levelData = bindChosenSpecialIntoLevelData(
    levelData,
    powerSystem.chosenSpecial?.key,
    powerSystem.templateId,
    definitionRank,
  );
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

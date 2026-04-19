/**
 * Power Mechanics Engine — Aggregator
 *
 * Reads structured `mechanics` blocks from slot-activated passives and
 * active-buff effects, sums them into per-actor totals, and builds a
 * breakdown list ("Armor +1 from Dragon Scales (slotted)") that the
 * character sheet renders as transparent tooltips.
 *
 * Powers that do not carry a `mechanics` block are ignored here (they are
 * purely descriptive and resolved as GM-ruling, unchanged from prior
 * behavior).
 *
 * This module deliberately does **not** touch Foundry's native
 * `ActiveEffect.changes` pipeline. All addition happens on top of the
 * existing `system.combat.*` values computed earlier in `prepareDerivedData`.
 */

import type { PowerMechanics } from '../types/item';
import type {
  MechanicsBreakdown,
  MechanicsBreakdownEntry,
} from '../types/actor';
import { MASTERY_TREE_POWER_MAP } from './powers/index.js';
import { ALL_MAGIC_POWERS } from './magic-powers.js';

/** Empty breakdown skeleton (all arrays/objects present, all totals zero). */
export function emptyBreakdown(): MechanicsBreakdown {
  return {
    armor: [],
    evade: [],
    initiativeD8: [],
    movementBonus: [],
    regen: [],
    tempHP: [],
    healing: [],
    modifySpecialDeclared: [],
    grantNextHitDeclared: [],
    saveDice: { body: [], mind: [], spirit: [] },
    rollDice: { attack: [], skill: [], damage: [] },
    totals: {
      armor: 0,
      evade: 0,
      initiativeD8: 0,
      movementBonus: 0,
      regen: 0,
      saveDice: { body: 0, mind: 0, spirit: 0 },
      rollDice: { attack: 0, skill: 0, damage: 0 },
    },
  };
}

function mechanicsConditionGate(m: PowerMechanics): string | null | undefined {
  return (m.condition ?? m.conditionExpr) as string | null | undefined;
}

function formatModifySpecialSummary(m: PowerMechanics['modifySpecial']): string {
  if (!m?.type || !m.mode) return '';
  const parts = [m.type, m.mode];
  if (typeof m.amount === 'number') parts.push(String(m.amount));
  if (typeof m.minExisting === 'number') parts.push(`min≥${m.minExisting}`);
  if (typeof m.maxValue === 'number') parts.push(`cap${m.maxValue}`);
  if (m.target) parts.push(`@${m.target}`);
  if (m.condition) parts.push(`if:${m.condition}`);
  return parts.join(' ');
}

function formatGrantNextHitSummary(m: PowerMechanics['grantNextHitEffect']): string {
  if (!m?.expires) return '';
  const parts: string[] = [];
  if (m.qualifier) parts.push(m.qualifier);
  parts.push(`→ expires:${m.expires}`);
  if (m.damageRiderFlat) parts.push(`dmg:${m.damageRiderFlat}`);
  const n = Array.isArray(m.specials) ? m.specials.length : 0;
  if (n > 0) parts.push(`specials×${n}`);
  if (m.condition) parts.push(`if:${m.condition}`);
  return parts.join(' ');
}

/**
 * Resolve the rank-specific mechanics block from a power item.
 * Falls back to the power-level `system.mechanics` when no rank override
 * exists. Returns null when the power has no mechanics at all.
 *
 * Backwards-compatibility: power items created before the `mechanics` blocks
 * were added to the canonical tree/school definitions stored a snapshot of
 * `levels` that lacks those blocks. For those legacy items we look the
 * definition up again in the live catalog by `name` (+ `tree` / `isMagicPower`
 * hints) and pull the mechanics from there. Re-adding the power is no longer
 * required for passives/buffs to apply.
 */
export function resolvePowerMechanics(powerItem: any): PowerMechanics | null {
  if (!powerItem) return null;
  const sys = powerItem.system ?? {};
  const rank = Math.max(1, Math.min(4, Number(sys.rank ?? sys.level ?? 1)));

  const levels = sys.levels ?? {};
  const rankBlock = levels[String(rank)] ?? null;
  const rankMech: PowerMechanics | undefined = rankBlock?.mechanics;
  if (rankMech && typeof rankMech === 'object') return rankMech;
  const topMech: PowerMechanics | undefined = sys.mechanics;
  if (topMech && typeof topMech === 'object') return topMech;

  const fromCatalog = resolveMechanicsFromCatalog(powerItem, rank);
  if (fromCatalog) return fromCatalog;

  return null;
}

/**
 * Look the canonical mechanics up in the live catalog. Matches on `name`
 * first (most robust after user renames are unlikely) and, when a tree is
 * stored on the item, restricts the search to that tree to avoid name
 * collisions (e.g. "Dragon Scales" exists in both `dragon.ts` and
 * `warden-dragon.ts`).
 */
function resolveMechanicsFromCatalog(
  powerItem: any,
  rank: number,
): PowerMechanics | null {
  const sys = powerItem.system ?? {};
  const name: string | undefined = powerItem.name ?? sys.name;
  if (!name) return null;
  const tree: string | undefined = sys.tree ? String(sys.tree) : undefined;
  const isMagic = sys.isMagicPower === true;

  const pools: Array<{ tree?: string; powers: any[] }> = [];
  if (isMagic) {
    pools.push({ powers: ALL_MAGIC_POWERS as any[] });
  } else if (tree && (MASTERY_TREE_POWER_MAP as any)[tree]) {
    pools.push({ tree, powers: (MASTERY_TREE_POWER_MAP as any)[tree] });
  } else {
    // Unknown / legacy tree name — scan every pool.
    for (const [t, powers] of Object.entries(MASTERY_TREE_POWER_MAP)) {
      pools.push({ tree: t, powers: powers as any[] });
    }
    pools.push({ powers: ALL_MAGIC_POWERS as any[] });
  }

  for (const pool of pools) {
    const def = pool.powers.find((p: any) => p?.name === name);
    if (!def) continue;
    const defLevels = def.levels;
    if (defLevels && typeof defLevels === 'object' && !Array.isArray(defLevels)) {
      const lvl = defLevels[String(rank)] ?? defLevels['1'];
      const m = lvl?.mechanics;
      if (m && typeof m === 'object') return m as PowerMechanics;
    }
    const topM = (def as any).mechanics;
    if (topM && typeof topM === 'object') return topM as PowerMechanics;
  }
  return null;
}

/** One collected mechanics contribution with its display source. */
interface MechanicsContribution {
  source: string;
  mechanics: PowerMechanics;
}

/**
 * Enumerate every active mechanics contribution for an actor:
 * - slot-activated passives (system.passives.slotN where active=true) with a mechanics block
 * - live ActiveEffects flagged as activeBuff whose source power has a mechanics block
 */
export function collectMechanicsContributions(actor: any): MechanicsContribution[] {
  const out: MechanicsContribution[] = [];
  const system = actor?.system ?? {};
  const items = actor?.items;

  // 1) Slot-activated passives
  const passives = system.passives ?? {};
  for (const slotKey of Object.keys(passives)) {
    if (!/^slot\d+$/.test(slotKey)) continue;
    const slot = passives[slotKey];
    if (!slot || slot.active !== true || !slot.passive) continue;
    const pid = slot.passive.id;
    if (!pid) continue;
    let powerItem: any = null;
    try {
      powerItem = items?.get?.(pid) ?? null;
      if (!powerItem && Array.isArray(items)) {
        powerItem = items.find((it: any) => it?.id === pid || it?._id === pid);
      }
    } catch {
      // Foundry Collection get may throw on some mocks; ignore.
      powerItem = null;
    }
    const mech = resolvePowerMechanics(powerItem);
    if (!mech) continue;
    // Only honor the two passive-like applyWhen values here; defensive against bad data.
    if (mech.applyWhen !== 'passive-slotted-active') continue;
    out.push({
      source: `${slot.passive.name ?? 'Passive'} (slotted)`,
      mechanics: mech,
    });
  }

  // 2) Active Buff effects
  const effects = actor?.effects;
  if (effects) {
    const iter: any[] = typeof effects[Symbol.iterator] === 'function'
      ? Array.from(effects)
      : Array.isArray(effects) ? effects : [];
    for (const effect of iter) {
      const flags = effect?.flags?.['mastery-system'];
      if (!flags || flags.activeBuff !== true) continue;

      // Prefer mechanics stored directly on the effect flag (survives power deletion).
      let mech: PowerMechanics | null = null;
      if (flags.mechanics && typeof flags.mechanics === 'object') {
        mech = flags.mechanics as PowerMechanics;
      } else if (flags.powerId) {
        let powerItem: any = null;
        try {
          powerItem = items?.get?.(flags.powerId) ?? null;
          if (!powerItem && Array.isArray(items)) {
            powerItem = items.find((it: any) => it?.id === flags.powerId || it?._id === flags.powerId);
          }
        } catch {
          powerItem = null;
        }
        mech = resolvePowerMechanics(powerItem);
      }
      if (!mech) continue;
      if (mech.applyWhen !== 'activeBuff-active') continue;
      out.push({
        source: `${flags.powerName ?? effect.name ?? 'Active Buff'} (buff)`,
        mechanics: mech,
      });
    }
  }

  return out;
}

/** Push a numeric contribution into a breakdown array. */
function pushNum(target: MechanicsBreakdownEntry[], source: string, value: number | undefined): void {
  if (typeof value !== 'number' || !isFinite(value) || value === 0) return;
  target.push({ source, value });
}

/**
 * Sum all collected mechanics contributions into a full breakdown with
 * precomputed totals. The result is ready to be stored on
 * `actor.system.derived.mechanicsBreakdown`.
 */
export function aggregateMechanics(contributions: MechanicsContribution[]): MechanicsBreakdown {
  const bd = emptyBreakdown();
  for (const { source, mechanics } of contributions) {
    // Conditional blocks never contribute to the unconditional breakdown;
    // they are folded in per-roll by `getRollDiceDelta(actor, kind, target)`
    // and per-damage by `collectConditionalDamageRiders`.
    if (mechanicsConditionGate(mechanics)) continue;
    pushNum(bd.armor, source, mechanics.armor);
    pushNum(bd.evade, source, mechanics.evade);
    pushNum(bd.initiativeD8, source, mechanics.initiativeD8);
    pushNum(bd.movementBonus, source, mechanics.movementBonus);
    pushNum(bd.regen, source, mechanics.regen);
    if (typeof mechanics.tempHP === 'string' && mechanics.tempHP.length > 0) {
      bd.tempHP.push({ source, value: mechanics.tempHP });
    }
    const healFlat = mechanics.healing?.flat;
    if (typeof healFlat === 'string' && healFlat.trim().length > 0) {
      const h = mechanics.healing!;
      const detail = [h.target, h.trigger, h.condition].filter(Boolean).join(' · ');
      bd.healing.push({
        source: detail ? `${source} (${detail})` : source,
        value: healFlat.trim(),
      });
    }
    const modSummary = formatModifySpecialSummary(mechanics.modifySpecial);
    if (modSummary) bd.modifySpecialDeclared.push({ source, text: modSummary });
    const gnSummary = formatGrantNextHitSummary(mechanics.grantNextHitEffect);
    if (gnSummary) bd.grantNextHitDeclared.push({ source, text: gnSummary });
    const sd = mechanics.saveDice ?? {};
    pushNum(bd.saveDice.body, source, sd.body);
    pushNum(bd.saveDice.mind, source, sd.mind);
    pushNum(bd.saveDice.spirit, source, sd.spirit);
    const rd = mechanics.rollDice ?? {};
    pushNum(bd.rollDice.attack, source, rd.attack);
    pushNum(bd.rollDice.skill, source, rd.skill);
    pushNum(bd.rollDice.damage, source, rd.damage);
  }

  const sum = (arr: MechanicsBreakdownEntry[]): number =>
    arr.reduce((s, e) => s + (e.value || 0), 0);
  bd.totals.armor = sum(bd.armor);
  bd.totals.evade = sum(bd.evade);
  bd.totals.initiativeD8 = sum(bd.initiativeD8);
  bd.totals.movementBonus = sum(bd.movementBonus);
  bd.totals.regen = sum(bd.regen);
  bd.totals.saveDice.body = sum(bd.saveDice.body);
  bd.totals.saveDice.mind = sum(bd.saveDice.mind);
  bd.totals.saveDice.spirit = sum(bd.saveDice.spirit);
  bd.totals.rollDice.attack = sum(bd.rollDice.attack);
  bd.totals.rollDice.skill = sum(bd.rollDice.skill);
  bd.totals.rollDice.damage = sum(bd.rollDice.damage);
  return bd;
}

/** High-level convenience: contributions + aggregation in one call. */
export function buildActorMechanicsBreakdown(actor: any): MechanicsBreakdown {
  const contributions = collectMechanicsContributions(actor);
  return aggregateMechanics(contributions);
}

/**
 * Roll-dice delta for a given roll kind. Consumed by `roll-handler.ts`
 * right before the numDice pool is committed to `masteryRoll`.
 *
 * When a `target` is provided, passive/buff contributions whose `condition`
 * gate evaluates **against the target** are also folded in (and those
 * contributions are *not* part of the pre-aggregated breakdown totals, which
 * only contain unconditional bonuses).
 */
export function getRollDiceDelta(
  actor: any,
  kind: 'attack' | 'skill' | 'damage' | 'saveBody' | 'saveMind' | 'saveSpirit',
  target?: any,
): number {
  const bd: MechanicsBreakdown | undefined = actor?.system?.derived?.mechanicsBreakdown;
  let base = 0;
  if (bd) {
    switch (kind) {
      case 'attack': base = bd.totals.rollDice.attack; break;
      case 'skill': base = bd.totals.rollDice.skill; break;
      case 'damage': base = bd.totals.rollDice.damage; break;
      case 'saveBody': base = bd.totals.saveDice.body; break;
      case 'saveMind': base = bd.totals.saveDice.mind; break;
      case 'saveSpirit': base = bd.totals.saveDice.spirit; break;
    }
  }
  if (!target) return base;

  // Fold in conditional rollDice that are gated by a target-facing condition.
  const contrib = collectMechanicsContributions(actor);
  let extra = 0;
  for (const { mechanics } of contrib) {
    const gate = mechanicsConditionGate(mechanics);
    if (!gate) continue;
    if (!evaluateConditionGate(actor, target, gate)) continue;
    if (kind === 'attack') extra += mechanics.rollDice?.attack ?? 0;
    else if (kind === 'skill') extra += mechanics.rollDice?.skill ?? 0;
    else if (kind === 'damage') extra += mechanics.rollDice?.damage ?? 0;
    else if (kind === 'saveBody') extra += mechanics.saveDice?.body ?? 0;
    else if (kind === 'saveMind') extra += mechanics.saveDice?.mind ?? 0;
    else if (kind === 'saveSpirit') extra += mechanics.saveDice?.spirit ?? 0;
  }
  return base + extra;
}

// ---------------------------------------------------------------------------
// Conditional Engine
// ---------------------------------------------------------------------------

/**
 * Normalize a condition key or name to a canonical lowercase keyword the
 * checker understands (e.g. "Bleeding(3)" -> "bleeding"; "Target Hexed" ->
 * "hexed"; "targetIgnited" -> "ignited").
 */
function canonicalConditionName(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/^target[-_\s]*/i, '')
    .replace(/\(.*\)$/, '')
    .replace(/[^a-z]/g, '')
    .trim();
}

/** Known condition synonym -> canonical key. */
const CONDITION_SYNONYMS: Record<string, string> = {
  marked: 'marked',
  ignited: 'ignited',
  ignite: 'ignited',
  burning: 'ignited',
  onfire: 'ignited',
  shocked: 'shocked',
  shock: 'shocked',
  frozen: 'frozen',
  freeze: 'frozen',
  hexed: 'hexed',
  hex: 'hexed',
  bleeding: 'bleeding',
  bleed: 'bleeding',
  prone: 'prone',
  stunned: 'stunned',
  disoriented: 'disoriented',
};

function toCanonicalCondition(raw: string): string {
  const k = canonicalConditionName(raw);
  return CONDITION_SYNONYMS[k] ?? k;
}

/**
 * Check whether an actor carries a given condition. Checks (in order):
 *   1. actor.statuses (Foundry v13 Set of status ids)
 *   2. actor.effects (ActiveEffect collection) – name/label match
 *   3. actor.flags['mastery-system'].conditions
 *   4. actor.system.conditions
 *   5. actor.system.specials (array of strings like "Bleeding(3)")
 *
 * This is defensive and works whether the GM tags conditions as Foundry
 * status tokens, applies ActiveEffects via our buff system, or stores them
 * as a system flag.
 */
export function hasCondition(actor: any, condition: string): boolean {
  if (!actor) return false;
  const want = toCanonicalCondition(condition);
  if (!want) return false;

  // 1. actor.statuses (Set<string>)
  try {
    const statuses = (actor as any).statuses;
    if (statuses) {
      if (typeof statuses.has === 'function') {
        if (statuses.has(want)) return true;
      }
      if (typeof statuses[Symbol.iterator] === 'function') {
        for (const s of statuses) {
          const key = toCanonicalCondition(typeof s === 'string' ? s : s?.id || s?.name);
          if (key === want) return true;
        }
      }
    }
  } catch { /* ignore */ }

  // 2. Iterate active effects
  try {
    const effects = actor?.effects;
    const iter: any[] = effects
      ? (typeof effects[Symbol.iterator] === 'function' ? Array.from(effects) : Array.isArray(effects) ? effects : [])
      : [];
    for (const e of iter) {
      const disabled = (e as any)?.disabled ?? (e as any)?.isSuppressed;
      if (disabled) continue;
      const n = toCanonicalCondition((e as any)?.name || (e as any)?.label || '');
      if (n === want) return true;
      const sts = (e as any)?.statuses;
      if (sts && typeof sts.has === 'function' && sts.has(want)) return true;
    }
  } catch { /* ignore */ }

  // 3. Flags
  const masteryFlags = actor?.flags?.['mastery-system'] || {};
  const fc = masteryFlags.conditions;
  if (fc && typeof fc === 'object' && fc[want] === true) return true;
  if (masteryFlags[want] === true) return true;

  // 4. system.conditions
  const sys = actor?.system || {};
  if (sys?.conditions && typeof sys.conditions === 'object' && sys.conditions[want] === true) return true;
  if (sys?.status && typeof sys.status === 'object' && sys.status[want] === true) return true;

  // 5. system.specials array (power-applied specials)
  const specials = Array.isArray(sys?.specials) ? sys.specials : [];
  for (const s of specials) {
    const key = toCanonicalCondition(typeof s === 'string' ? s : s?.name || s?.id);
    if (key === want) return true;
  }

  return false;
}

/**
 * Evaluate a PowerMechanics.condition gate. Returns true when the gate is
 * satisfied (or null/absent). Supports both target-facing (`targetHexed`,
 * `targetMarked`, …) and self-facing (`self-hp-below-50`) flavors.
 */
export function evaluateConditionGate(
  self: any,
  target: any,
  condition: string | null | undefined,
): boolean {
  if (!condition) return true;
  const cond = String(condition);
  if (cond.startsWith('target')) {
    return hasCondition(target, cond);
  }
  if (cond === 'self-hp-below-50') {
    const hp = self?.system?.health;
    const currentBar = Number(hp?.currentBar ?? 0);
    const bars = Array.isArray(hp?.bars) ? hp.bars : [];
    if (!bars.length) return false;
    // Health bar index is 0=Healthy..4=Incapacitated, so "below 50%" -> currentBar >= bars.length/2.
    return currentBar >= Math.floor(bars.length / 2);
  }
  return hasCondition(self, cond);
}

/**
 * A conditional damage rider that fires when attacking a target that carries
 * a given condition. Returned from `collectConditionalDamageRiders`.
 */
export interface ConditionalRider {
  source: string;
  /** Canonical condition keyword (e.g. "hexed"). */
  condition: string;
  /** Dice formula as parsed from the mechanics block (e.g. "+2d8" -> "2d8"). */
  dice: string;
}

function normalizeRiderDice(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/^\+\s*/, '');
  if (!trimmed) return null;
  if (!/^\d*d\d+(\s*[+-]\s*\d+)?$/i.test(trimmed) && !/^\d+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Collect conditional damage riders that apply to a single attack made by
 * `attacker` against `target`. Walks the attacker's slot-activated passives
 * and active buffs (same pool the aggregator uses) plus the currently
 * selected power's own mechanics. A rider fires when the mechanics block's
 * condition / damageRider.vsCondition matches the target.
 */
export function collectConditionalDamageRiders(
  attacker: any,
  target: any,
  selectedPower?: any,
): ConditionalRider[] {
  if (!attacker || !target) return [];
  const out: ConditionalRider[] = [];

  // 1) All slot-activated passives + live active buffs.
  const contributions = collectMechanicsContributions(attacker);
  for (const { source, mechanics } of contributions) {
    pushRidersFromMechanics(out, source, mechanics, attacker, target);
  }

  // 2) The selected power itself (only if it has its own mechanics block,
  //    and its gate matches). This handles attack-rider powers that declare
  //    vsCondition directly on themselves.
  if (selectedPower) {
    const sys = selectedPower.system ?? selectedPower;
    const rank = Math.max(1, Math.min(4, Number(sys.rank ?? 1)));
    const rankBlock = sys.levels?.[String(rank)] ?? null;
    const mech: PowerMechanics | undefined = rankBlock?.mechanics ?? sys.mechanics;
    if (mech) {
      pushRidersFromMechanics(out, `${selectedPower.name ?? 'Power'} (attack)`, mech, attacker, target);
    }
  }

  return out;
}

function pushRidersFromMechanics(
  out: ConditionalRider[],
  source: string,
  mechanics: PowerMechanics,
  attacker: any,
  target: any,
): void {
  const rider = mechanics.damageRider;
  if (!rider) return;

  // Per-target conditional rider: damageRider.vsCondition + vsConditionDamage
  if (rider.vsCondition) {
    const cond = toCanonicalCondition(rider.vsCondition);
    if (hasCondition(target, cond)) {
      const dice = normalizeRiderDice(rider.vsConditionDamage ?? rider.flat);
      if (dice) out.push({ source, condition: cond, dice });
    }
    return;
  }

  // Flat rider on a block with a gating condition (e.g. passive "+1d8 vs hexed")
  const gate = mechanicsConditionGate(mechanics);
  if (gate && rider.flat) {
    if (evaluateConditionGate(attacker, target, gate)) {
      const cond = toCanonicalCondition(gate);
      const dice = normalizeRiderDice(rider.flat);
      if (dice) out.push({ source, condition: cond, dice });
    }
  }
}

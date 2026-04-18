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

/** Empty breakdown skeleton (all arrays/objects present, all totals zero). */
export function emptyBreakdown(): MechanicsBreakdown {
  return {
    armor: [],
    evade: [],
    initiativeD8: [],
    movementBonus: [],
    regen: [],
    tempHP: [],
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

/**
 * Resolve the rank-specific mechanics block from a power item.
 * Falls back to the power-level `system.mechanics` when no rank override
 * exists. Returns null when the power has no mechanics at all.
 */
export function resolvePowerMechanics(powerItem: any): PowerMechanics | null {
  if (!powerItem) return null;
  const sys = powerItem.system ?? {};
  const rank = Math.max(1, Math.min(4, Number(sys.rank ?? 1)));
  const levels = sys.levels ?? {};
  const rankBlock = levels[String(rank)] ?? null;
  const rankMech: PowerMechanics | undefined = rankBlock?.mechanics;
  if (rankMech && typeof rankMech === 'object') return rankMech;
  const topMech: PowerMechanics | undefined = sys.mechanics;
  if (topMech && typeof topMech === 'object') return topMech;
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
    pushNum(bd.armor, source, mechanics.armor);
    pushNum(bd.evade, source, mechanics.evade);
    pushNum(bd.initiativeD8, source, mechanics.initiativeD8);
    pushNum(bd.movementBonus, source, mechanics.movementBonus);
    pushNum(bd.regen, source, mechanics.regen);
    if (typeof mechanics.tempHP === 'string' && mechanics.tempHP.length > 0) {
      bd.tempHP.push({ source, value: mechanics.tempHP });
    }
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
 */
export function getRollDiceDelta(
  actor: any,
  kind: 'attack' | 'skill' | 'damage' | 'saveBody' | 'saveMind' | 'saveSpirit',
): number {
  const bd: MechanicsBreakdown | undefined = actor?.system?.derived?.mechanicsBreakdown;
  if (!bd) return 0;
  switch (kind) {
    case 'attack': return bd.totals.rollDice.attack;
    case 'skill': return bd.totals.rollDice.skill;
    case 'damage': return bd.totals.rollDice.damage;
    case 'saveBody': return bd.totals.saveDice.body;
    case 'saveMind': return bd.totals.saveDice.mind;
    case 'saveSpirit': return bd.totals.saveDice.spirit;
    default: return 0;
  }
}

/**
 * Protective Auras (Core v0.9.9.6): Active Buff: Armor Aura, Evade Aura and
 * Spell Resistance Aura. Self-centered, moves with the caster, affects the
 * caster and every ally inside the radius, never enemies.
 *
 * No stacking: a creature gets only the highest Active Buff bonus to the same
 * value — its own Active Buff or any Protective Aura it is inside. Live query:
 * nothing is written onto the affected actor, so leaving the radius removes
 * the bonus immediately.
 */

import { distanceBetweenActorsMeters } from './reaction-eligibility.js';

export const PROTECTIVE_AURA_TEMPLATE_IDS = [
  'ab-armor-aura',
  'ab-evade-aura',
  'ab-spell-resistance-aura',
] as const;

export type ProtectiveAuraStat = 'armor' | 'evade' | 'spellResistance';

/** Printed bonus for PL 1–16 (identical for all three Auras). */
export const PROTECTIVE_AURA_BONUS = [1, 3, 5, 7, 9, 11, 13, 15, 15, 17, 19, 21, 23, 25, 27, 29] as const;

const RADIUS_SLACK_M = 0.05;

export function isProtectiveAuraTemplateId(id: string | null | undefined): boolean {
  return (PROTECTIVE_AURA_TEMPLATE_IDS as readonly string[]).includes(String(id || '').trim());
}

function clampPl(pl: number): number {
  return Math.max(1, Math.min(16, Math.floor(Number(pl) || 1)));
}

export function protectiveAuraBonus(pl: number): number {
  return PROTECTIVE_AURA_BONUS[clampPl(pl) - 1]!;
}

/** Radius 2 m at PL 1–8, 3 m at PL 9–16. */
export function protectiveAuraRadiusM(pl: number): number {
  return clampPl(pl) >= 9 ? 3 : 2;
}

export interface ProtectiveAuraState {
  stat: ProtectiveAuraStat;
  value: number;
  radiusM: number;
}

const STAT_BY_TEMPLATE: Record<string, ProtectiveAuraStat> = {
  'ab-armor-aura': 'armor',
  'ab-evade-aura': 'evade',
  'ab-spell-resistance-aura': 'spellResistance',
};

function effectsOf(actor: any): any[] {
  const effects = actor?.effects;
  if (!effects) return [];
  if (Array.isArray(effects)) return effects;
  if (Array.isArray(effects?.contents)) return effects.contents;
  if (typeof effects[Symbol.iterator] === 'function') return Array.from(effects);
  return [];
}

/** Protective Auras currently maintained by `owner`. */
export function maintainedProtectiveAuras(owner: any): ProtectiveAuraState[] {
  const out: ProtectiveAuraState[] = [];
  for (const effect of effectsOf(owner)) {
    if (effect?.disabled) continue;
    const flags = effect?.flags?.['mastery-system'];
    if (!flags?.activeBuff) continue;
    const row = flags.mechanics?.protectiveAura;
    if (row && Object.values(STAT_BY_TEMPLATE).includes(row.stat)) {
      const value = Math.max(0, Math.floor(Number(row.value) || 0));
      const radiusM = Math.max(0, Number(row.radiusM) || 0);
      if (value > 0 && radiusM > 0) out.push({ stat: row.stat, value, radiusM });
      continue;
    }
    const tpl = String(flags.powerTemplateId || '').trim();
    const stat = STAT_BY_TEMPLATE[tpl];
    if (!stat) continue;
    const pl = Number(flags.effectiveLevel ?? flags.level ?? flags.rank ?? 0);
    if (!(pl > 0)) continue;
    out.push({ stat, value: protectiveAuraBonus(pl), radiusM: protectiveAuraRadiusM(pl) });
  }
  return out;
}

function primaryTokenOf(actor: any): any {
  const canvas = (globalThis as any).canvas;
  const placeables = canvas?.tokens?.placeables ?? [];
  const id = String(actor?.id || '');
  if (!id) return null;
  return placeables.find((t: any) => String(t?.actor?.id || '') === id) ?? null;
}

function dispositionOf(actor: any): number {
  const token = primaryTokenOf(actor);
  const d = Number(token?.document?.disposition ?? actor?.prototypeToken?.disposition ?? 0);
  return Number.isFinite(d) ? d : 0;
}

/** Same non-neutral disposition side (Summons included). */
export function isProtectiveAuraAlly(owner: any, other: any): boolean {
  if (!owner || !other) return false;
  if (String(owner.id) === String(other.id)) return true;
  const od = dispositionOf(owner);
  const td = dispositionOf(other);
  return od !== 0 && td !== 0 && Math.sign(od) === Math.sign(td);
}

function candidateOwners(actor: any): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  const push = (a: any) => {
    const id = String(a?.id || '');
    if (!a || !id || seen.has(id)) return;
    seen.add(id);
    out.push(a);
  };
  push(actor);
  const bag = (globalThis as any).game?.combat?.combatants;
  const rows = bag
    ? typeof bag.values === 'function'
      ? Array.from(bag.values())
      : Array.isArray(bag)
        ? bag
        : []
    : [];
  for (const row of rows as any[]) push(row?.actor);
  for (const token of (globalThis as any).canvas?.tokens?.placeables ?? []) push(token?.actor);
  return out;
}

/** Highest Protective Aura bonus to `stat` that `actor` currently stands in (0 if none). */
export function bestProtectiveAuraBonus(actor: any, stat: ProtectiveAuraStat): number {
  if (!actor) return 0;
  let best = 0;
  for (const owner of candidateOwners(actor)) {
    const auras = maintainedProtectiveAuras(owner).filter((a) => a.stat === stat && a.value > best);
    if (!auras.length) continue;
    const self = String(owner.id) === String(actor.id);
    if (!self && !isProtectiveAuraAlly(owner, actor)) continue;
    const meters = self ? 0 : distanceBetweenActorsMeters(owner, actor);
    if (meters == null || !Number.isFinite(meters)) continue;
    for (const aura of auras) {
      if (meters <= aura.radiusM + RADIUS_SLACK_M) best = Math.max(best, aura.value);
    }
  }
  return best;
}

/**
 * Extra bonus on top of the creature's own Active Buff value so the Active
 * Buff part equals max(own Buff, every Protective Aura in range).
 */
export function protectiveAuraDelta(actor: any, stat: ProtectiveAuraStat, ownActiveBuffValue: number): number {
  const own = Math.max(0, Math.floor(Number(ownActiveBuffValue) || 0));
  return Math.max(0, bestProtectiveAuraBonus(actor, stat) - own);
}

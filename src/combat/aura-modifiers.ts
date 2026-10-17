/**
 * Special Aura, Summon Damage Aura, and Summon Armor Aura.
 *
 * These are live queries. They never write Special stacks, Armor, or extra
 * damage dice onto the affected actor. Damage Aura and Healing Aura stay
 * end-of-turn pulses in `aura-pulse.ts` and are not handled here.
 */

import { getPassiveSlots } from '../powers/passives.js';

/** Printed Special Aura radii. PL 1–3 are unavailable (0). */
export const SPECIAL_AURA_RADIUS_M = [0, 0, 0, 2, 3, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8] as const;

/** Printed Summon Damage / Summon Armor radii. PL 16 is 40 m. */
export const SUMMON_AURA_RADIUS_M = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40] as const;

/** Printed Summon Damage Aura dice (d8) for PL 1–16. */
export const SUMMON_DAMAGE_AURA_DICE = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8] as const;

/** Printed Summon Armor Aura bonus for PL 1–16. */
export const SUMMON_ARMOR_AURA_BONUS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32] as const;

/**
 * Eligible diminishing Special(X) types from the Special Aura entry.
 * Binary, hard-control, and other unlisted Specials are refused.
 */
export const SPECIAL_AURA_ELIGIBLE = new Set([
  'challenge',
  'corrode',
  'disoriented',
  'expose',
  'hex',
  'lacerate',
  'mark',
  'ruin',
  'slow',
  'soulburn',
  'sundered',
  'weaken',
]);

const RADIUS_SLACK_M = 0.05;

function masteryEffects(actor: any): any[] {
  const effects = actor?.effects;
  if (!effects) return [];
  if (Array.isArray(effects)) return effects;
  if (Array.isArray(effects?.contents)) return effects.contents;
  if (typeof effects[Symbol.iterator] === 'function') return Array.from(effects);
  return [];
}

function sceneActors(): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  const push = (actor: any) => {
    const id = String(actor?.id || '');
    if (!actor || !id || seen.has(id)) return;
    seen.add(id);
    out.push(actor);
  };
  const game = (globalThis as any).game;
  const bag = game?.combat?.combatants;
  const rows = bag
    ? typeof bag.values === 'function'
      ? Array.from(bag.values())
      : Array.isArray(bag)
        ? bag
        : []
    : [];
  for (const row of rows) push(row?.actor);
  const placeables = (globalThis as any).canvas?.tokens?.placeables ?? [];
  for (const token of placeables) push(token?.actor);
  const actors = game?.actors;
  const world = actors?.contents
    ? actors.contents
    : actors && typeof actors.values === 'function'
      ? Array.from(actors.values())
      : [];
  for (const actor of world) push(actor);
  return out;
}

function primaryToken(actor: any): any {
  const canvas = (globalThis as any).canvas;
  const scene = canvas?.scene;
  if (!scene || !actor?.id) return null;
  const placeables = canvas.tokens?.placeables ?? [];
  const mine = placeables.filter(
    (token: any) => token?.scene?.id === scene.id && token.actor?.id === actor.id,
  );
  return mine.find((token: any) => token.controlled) ?? mine[0] ?? null;
}

function distanceMeters(a: any, b: any): number | null {
  const ta = primaryToken(a);
  const tb = primaryToken(b);
  if (!ta?.center || !tb?.center) return null;
  const grid = (globalThis as any).canvas?.grid;
  const distPx = Math.hypot(ta.center.x - tb.center.x, ta.center.y - tb.center.y);
  const gridSize = Number(grid?.size) || 100;
  return (distPx / gridSize) * (Number(grid?.distance) || 1);
}

function insideRadius(origin: any, other: any, radiusM: number): boolean {
  const radius = Math.max(0, Number(radiusM) || 0);
  if (radius <= 0) return false;
  if (String(origin?.id || '') === String(other?.id || '')) return true;
  const meters = distanceMeters(origin, other);
  if (meters == null || !Number.isFinite(meters)) return false;
  return meters <= radius + RADIUS_SLACK_M;
}

function chosenSpecialId(source: any): string {
  const raw =
    source?.specialChoice ??
    source?.chosenSpecial?.key ??
    (typeof source?.chosenSpecial === 'string' ? source.chosenSpecial : '');
  return String(raw || '')
    .trim()
    .toLowerCase();
}

function actorItems(actor: any): any[] {
  const raw = actor?.items;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.contents)) return raw.contents;
  if (typeof raw[Symbol.iterator] === 'function') return Array.from(raw);
  return [];
}

function specialAuraRadiusOf(passive: any): number {
  const level = Math.floor(Number(passive?.level) || 0);
  const fromLevel = level >= 1 && level <= 16 ? SPECIAL_AURA_RADIUS_M[level - 1]! : 0;
  const fromMechanics = Math.floor(Number(passive?.mechanics?.specialAura?.radiusM) || 0);
  if (passive?.mechanics?.specialAuraUnavailable === true) return 0;
  if (fromLevel <= 0) return 0;
  return fromMechanics > 0 ? fromMechanics : fromLevel;
}

function isSpecialAuraPassive(passive: any): boolean {
  const id = String(passive?.templateId || passive?.id || '');
  return id === 'passive-special-aura';
}

/**
 * +1 when at least one in-range Special Aura matches this Special.
 * Overlapping auras do not add again.
 */
export function specialAuraEffectiveStep(actor: any, specialId: string): number {
  const id = String(specialId || '').trim().toLowerCase();
  if (!actor || !SPECIAL_AURA_ELIGIBLE.has(id)) return 0;
  for (const owner of sceneActors()) {
    let slots: Array<{ active: boolean; passive: any }> = [];
    try {
      slots = getPassiveSlots(owner);
    } catch {
      slots = [];
    }
    for (const slot of slots) {
      if (!slot?.active || !slot.passive) continue;
      const item = actorItems(owner).find((row) => String(row?.id || '') === String(slot.passive?.id || ''));
      const passive = {
        ...slot.passive,
        templateId: slot.passive.templateId || item?.system?.templateId,
        level: slot.passive.level || item?.system?.level || item?.system?.rank,
        specialChoice: chosenSpecialId(slot.passive) || chosenSpecialId(item?.system),
      };
      if (!isSpecialAuraPassive(passive)) continue;
      if (passive.specialChoice !== id) continue;
      const radius = specialAuraRadiusOf(passive);
      if (insideRadius(owner, actor, radius)) return 1;
    }
  }
  return 0;
}

function summonOwner(summon: any): any | null {
  if (!summon || summon.type !== 'summon') return null;
  const link = summon.system?.summonBond ?? {};
  const ownerId = link.ownerActorId || summon.system?.familiar?.ownerActorId;
  const bondId = link.bondId || summon.system?.familiar?.familiarId;
  if (!ownerId || !bondId) return null;
  const owner = (globalThis as any).game?.actors?.get?.(ownerId);
  if (!owner || String(owner.id) === String(summon.id)) return null;
  const bonds = owner.system?.summonBonds;
  if (!Array.isArray(bonds)) return null;
  const bond = bonds.find((row: any) => String(row?.id) === String(bondId));
  if (!bond) return null;
  const bodies = Array.isArray(bond.bodies) ? bond.bodies : [];
  const listed = bodies.some(
    (body: any) =>
      String(body?.summonActorId || '') === String(summon.id) ||
      (link.bodyId && String(body?.id) === String(link.bodyId)),
  );
  return listed ? owner : null;
}

function activeBuffMechanics(owner: any): any[] {
  const rows: any[] = [];
  for (const effect of masteryEffects(owner)) {
    if (effect?.disabled) continue;
    const flags = effect?.flags?.['mastery-system'];
    if (!flags?.activeBuff) continue;
    if (flags.mechanics) rows.push(flags.mechanics);
  }
  return rows;
}

/** Extra d8 for one legal attack by this Summon, or 0. */
export function summonDamageAuraBonusDice(attacker: any): number {
  const owner = summonOwner(attacker);
  if (!owner) return 0;
  let best = 0;
  for (const mechanics of activeBuffMechanics(owner)) {
    const row = mechanics?.summonDamageAura;
    const dice = Math.max(0, Math.floor(Number(row?.dice) || 0));
    const radius = Math.max(0, Number(row?.radiusM) || 0);
    if (dice <= 0 || !insideRadius(owner, attacker, radius)) continue;
    best = Math.max(best, dice);
  }
  return best;
}

/** Extra Armor for this Summon while it is inside the owner's aura, or 0. */
export function summonArmorAuraBonus(summon: any): number {
  const owner = summonOwner(summon);
  if (!owner) return 0;
  let best = 0;
  for (const mechanics of activeBuffMechanics(owner)) {
    const row = mechanics?.summonArmorAura;
    const armor = Math.max(0, Math.floor(Number(row?.armor) || 0));
    const radius = Math.max(0, Number(row?.radiusM) || 0);
    if (armor <= 0 || !insideRadius(owner, summon, radius)) continue;
    best = Math.max(best, armor);
  }
  return best;
}

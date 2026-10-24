/**
 * Runtime readers for Offensive Active Buff expansion (2026-10-24).
 * Values come from maintained Active Buff ActiveEffects — never written onto defenders.
 */

import { getActiveBuffs } from '../utils/active-buffs.js';
import { getStoneAreaBonusMeters } from './action-economy.js';

function masteryEffects(actor: any): any[] {
  const effects = actor?.effects;
  if (!effects) return [];
  if (Array.isArray(effects)) return effects;
  if (Array.isArray(effects?.contents)) return effects.contents;
  if (typeof effects[Symbol.iterator] === 'function') return Array.from(effects);
  return [];
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

function maxNum(values: number[]): number {
  let best = 0;
  for (const v of values) {
    const n = Math.max(0, Math.floor(Number(v) || 0));
    if (n > best) best = n;
  }
  return best;
}

/** Personal Active Buff: Armor Reduction (own attacks). */
export function getActiveBuffArmorReduction(attacker: any): number {
  return maxNum(activeBuffMechanics(attacker).map((m) => Number(m?.armorReduction) || 0));
}

/** Active Buff: Enemy Evade Reduction (own Martial Attack Rolls only). */
export function getActiveBuffEnemyEvadeReduction(attacker: any): number {
  return maxNum(activeBuffMechanics(attacker).map((m) => Number(m?.enemyEvadeReduction) || 0));
}

/** Active Buff: Spell Resistance Piercing (own Spells only). */
export function getActiveBuffSpellResistancePiercing(caster: any): number {
  return maxNum(activeBuffMechanics(caster).map((m) => Number(m?.spellResistancePiercing) || 0));
}

/** Active Buff: Maximization uses granted while maintained (0 if none / unavailable PL). */
export function getActiveBuffMaximizationUses(actor: any): number {
  return maxNum(activeBuffMechanics(actor).map((m) => Number(m?.maximization) || 0));
}

/** Active Buff: Area Expansion meters (instant circular AoE only). */
export function getActiveBuffAreaExpansionMeters(actor: any): number {
  return maxNum(activeBuffMechanics(actor).map((m) => Number(m?.areaExpansionM) || 0));
}

/**
 * Radius bonus for eligible instantaneous circular AoEs.
 * Anti-stack: max(Intellect Stone AoE bonus, Area Expansion) — never sum.
 */
export function getEffectiveCircularAoeRadiusBonusMeters(actor: any): number {
  const stone = getStoneAreaBonusMeters(actor, 'aoe');
  const buff = getActiveBuffAreaExpansionMeters(actor);
  return Math.max(stone, buff);
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

const RADIUS_SLACK_M = 0.05;

function insideRadius(origin: any, other: any, radiusM: number): boolean {
  const radius = Math.max(0, Number(radiusM) || 0);
  if (radius <= 0) return false;
  if (String(origin?.id || '') === String(other?.id || '')) return true;
  const meters = distanceMeters(origin, other);
  if (meters == null || !Number.isFinite(meters)) return false;
  return meters <= radius + RADIUS_SLACK_M;
}

function dispositionOf(actor: any): number {
  const token = primaryToken(actor);
  const d = Number(
    token?.document?.disposition ??
      actor?.prototypeToken?.disposition ??
      (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.NEUTRAL ??
      0,
  );
  return Number.isFinite(d) ? d : 0;
}

/** Hostile relative to aura owner (not self, opposite or hostile disposition). */
export function isHostileTo(owner: any, other: any): boolean {
  if (!owner || !other) return false;
  if (String(owner.id) === String(other.id)) return false;
  const HOSTILE = (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
  const FRIENDLY = (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
  const od = dispositionOf(owner);
  const td = dispositionOf(other);
  if (td === HOSTILE && od !== HOSTILE) return true;
  if (od === FRIENDLY && td === HOSTILE) return true;
  if (od === HOSTILE && td === FRIENDLY) return true;
  // Opposite signs (excluding neutrals) count as hostile.
  if (od !== 0 && td !== 0 && Math.sign(od) !== Math.sign(td)) return true;
  return false;
}

function isAllyOf(owner: any, other: any): boolean {
  if (!owner || !other) return false;
  if (String(owner.id) === String(other.id)) return false;
  if (String(other.type || '') === 'summon') return false;
  const FRIENDLY = (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
  const od = dispositionOf(owner);
  const td = dispositionOf(other);
  if (od === FRIENDLY && td === FRIENDLY) return true;
  if (od !== 0 && td !== 0 && Math.sign(od) === Math.sign(td)) return true;
  return false;
}

function isOwnOrAnySummon(actor: any): boolean {
  return String(actor?.type || '') === 'summon';
}

/**
 * Armor Reduction Aura: strongest eligible reduction when `attacker` hits `target`.
 * Target must be hostile to aura owner and inside radius; attacker is owner or ally.
 */
export function getArmorReductionAuraBonus(attacker: any, target: any): number {
  if (!attacker || !target) return 0;
  let best = 0;
  for (const owner of sceneActors()) {
    for (const mechanics of activeBuffMechanics(owner)) {
      const row = mechanics?.armorReductionAura;
      const reduction = Math.max(0, Math.floor(Number(row?.reduction) || 0));
      const radius = Math.max(0, Number(row?.radiusM) || 0);
      if (reduction <= 0 || radius <= 0) continue;
      if (!isHostileTo(owner, target)) continue;
      if (!insideRadius(owner, target, radius)) continue;
      const attackerOk =
        String(owner.id) === String(attacker.id) || isAllyOf(owner, attacker);
      if (!attackerOk) continue;
      best = Math.max(best, reduction);
    }
  }
  return best;
}

/**
 * Allied Damage Aura: bonus d8 for `attacker` (other ally, non-Summon) standing in an owner's aura.
 * Never for aura owner or any Summon.
 */
export function getAlliedDamageAuraBonusDice(attacker: any): number {
  if (!attacker || isOwnOrAnySummon(attacker)) return 0;
  let best = 0;
  for (const owner of sceneActors()) {
    if (String(owner.id) === String(attacker.id)) continue;
    if (!isAllyOf(owner, attacker)) continue;
    for (const mechanics of activeBuffMechanics(owner)) {
      const row = mechanics?.alliedDamageAura;
      const dice = Math.max(0, Math.floor(Number(row?.dice) || 0));
      const radius = Math.max(0, Number(row?.radiusM) || 0);
      if (dice <= 0 || radius <= 0) continue;
      if (!insideRadius(owner, attacker, radius)) continue;
      best = Math.max(best, dice);
    }
  }
  return best;
}

/** True when actor currently maintains any Active Buff (for Maximization spend gate). */
export function actorMaintainsActiveBuff(actor: any): boolean {
  return getActiveBuffs(actor).length > 0;
}

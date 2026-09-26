/**
 * Passive Parry — one pool, two deliveries.
 * Martial: strip Attack Dice (Might or Agility). 0 dice = Fully Parried.
 * Spell: strip Casting Dice (Intellect, Resolve, or Influence) from a direct
 * Spell whose origin is within 22 m. 0 dice = Fully Countered.
 * Entering Parry spends only the base Attack Action. Extra Attacks remain.
 */

import {
  getActionEconomyActor,
  getRoundState,
  setRoundState,
  type RoundState,
} from './action-economy.js';
import { passiveParryPoolForLevel } from '../utils/powers/templates/passives.js';

export const SPELL_PARRY_ORIGIN_M = 22;

export type ParryDelivery = 'martial' | 'spell';
export type ParryAttribute = 'might' | 'agility' | 'intellect' | 'resolve' | 'influence';

export interface ParryState {
  entered: boolean;
  pool: number;
  max: number;
  attribute: ParryAttribute;
  delivery: ParryDelivery;
}

export interface ParryStripResult {
  spent: number;
  remainingDice: number;
  remainingPool: number;
  fullyParried: boolean;
  /** Spell delivery reduced the Casting Pool to 0. */
  countered: boolean;
  note: string;
}

function actorItems(actor: any): any[] {
  const items = actor?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (items instanceof Map) return Array.from(items.values());
  if (typeof items.values === 'function') return Array.from(items.values());
  return [];
}

/** Find the Passive Parry power item on an actor (templateId preferred). */
export function findPassiveParryItem(actor: any): any | null {
  if (!actor) return null;
  for (const item of actorItems(actor)) {
    if (item?.type !== 'power') continue;
    const sys = item.system as any;
    const tid = String(sys?.templateId ?? '').toLowerCase();
    if (tid === 'passive-parry') return item;
  }
  for (const item of actorItems(actor)) {
    if (item?.type !== 'power') continue;
    const sys = item.system as any;
    if (String(sys?.powerType ?? '').toLowerCase() !== 'passive') continue;
    const name = String(item.name ?? '').toLowerCase();
    if (name.includes('reinforced')) continue;
    if (name === 'parry' || name.endsWith(': parry') || name.includes('passive: parry')) {
      return item;
    }
  }
  return null;
}

export function actorHasPassiveParry(actor: any): boolean {
  return !!findPassiveParryItem(actor);
}

/** Max pool from Passive Parry level (printed ceil(5 × Level / 2) table). */
export function parryPoolCapForLevel(level: number): number {
  return passiveParryPoolForLevel(level);
}

export function resolveParryAttribute(
  actor: any,
  delivery: ParryDelivery = 'martial',
): {
  attribute: ParryAttribute;
  value: number;
} {
  const attrs = (actor as any)?.system?.attributes ?? {};
  const read = (key: ParryAttribute) =>
    Math.max(0, Math.floor(Number(attrs?.[key]?.value) || 0));
  const keys: ParryAttribute[] =
    delivery === 'spell'
      ? ['intellect', 'resolve', 'influence']
      : ['might', 'agility'];
  let best: ParryAttribute = keys[0];
  let value = read(best);
  for (const key of keys.slice(1)) {
    const next = read(key);
    if (next > value) {
      best = key;
      value = next;
    }
  }
  return { attribute: best, value };
}

export function computeParryPoolMax(
  actor: any,
  delivery: ParryDelivery = 'martial',
): {
  max: number;
  attribute: ParryAttribute;
  level: number;
  attrValue: number;
  delivery: ParryDelivery;
} | null {
  const item = findPassiveParryItem(actor);
  if (!item) return null;
  const level = Math.max(1, Math.min(16, Math.floor(Number(item.system?.level) || 1)));
  const { attribute, value } = resolveParryAttribute(actor, delivery);
  const cap = parryPoolCapForLevel(level);
  return { max: Math.min(value, cap), attribute, level, attrValue: value, delivery };
}

export function getParryState(actor: Actor, combat: Combat | null): ParryState | null {
  const rs = getRoundState(actor, combat);
  const p = (rs as RoundState).parry;
  const stone = Math.max(0, Math.floor(Number(rs.stoneBonuses?.tempParryPool ?? 0) || 0));
  if (!p?.entered && stone <= 0) return null;
  const delivery: ParryDelivery = p?.delivery === 'spell' ? 'spell' : 'martial';
  const rawAttr = p?.attribute;
  const attribute: ParryAttribute =
    rawAttr === 'might' ||
    rawAttr === 'agility' ||
    rawAttr === 'intellect' ||
    rawAttr === 'resolve' ||
    rawAttr === 'influence'
      ? rawAttr
      : delivery === 'spell'
        ? 'intellect'
        : 'might';
  return {
    entered: true,
    pool: Math.max(0, Math.floor(Number(p?.pool) || 0)) + stone,
    max: Math.max(0, Math.floor(Number(p?.max) || 0)) + stone,
    attribute,
    delivery,
  };
}

export function isInParry(actor: Actor, combat: Combat | null): boolean {
  return !!getParryState(actor, combat)?.entered;
}

/** Pure: spend min(pool, attackDice) → remaining dice / Fully Parried. */
export function computeParryStrip(attackDice: number, pool: number): {
  spent: number;
  remainingDice: number;
  remainingPool: number;
  fullyParried: boolean;
} {
  const dice = Math.max(0, Math.floor(Number(attackDice) || 0));
  const p = Math.max(0, Math.floor(Number(pool) || 0));
  const spent = Math.min(p, dice);
  const remainingDice = dice - spent;
  return {
    spent,
    remainingDice,
    remainingPool: p - spent,
    fullyParried: remainingDice <= 0 && dice > 0,
  };
}

/**
 * Enter Passive Parry for the round. Spends only the base Attack Action
 * (`baseAttackLocked`). Extra Attack actions stay available.
 */
export async function enterParry(
  actor: Actor,
  combat: Combat | null,
  opts?: { delivery?: ParryDelivery },
): Promise<{ ok: boolean; reason?: string; pool?: number; max?: number; attribute?: string }> {
  if (!actor || !combat) {
    return { ok: false, reason: 'Not in combat.' };
  }
  const delivery: ParryDelivery = opts?.delivery === 'spell' ? 'spell' : 'martial';
  const computed = computeParryPoolMax(actor, delivery);
  if (!computed) {
    return { ok: false, reason: 'Requires Passive Parry.' };
  }
  if (computed.max <= 0) {
    return {
      ok: false,
      reason:
        delivery === 'spell'
          ? 'Parry Pool is 0 (check Intellect, Resolve, or Influence).'
          : 'Parry Pool is 0 (check Might or Agility).',
    };
  }

  const economy = (getActionEconomyActor(actor) ?? actor) as Actor;
  const rs = getRoundState(economy, combat);
  if (rs.parry?.entered) {
    return {
      ok: false,
      reason: `Already in Parry (pool ${rs.parry.pool}/${rs.parry.max}).`,
      pool: rs.parry.pool,
      max: rs.parry.max,
      attribute: rs.parry.attribute,
    };
  }
  if (rs.baseAttackLocked || Math.floor(Number(rs.attackActions?.used) || 0) > 0) {
    return {
      ok: false,
      reason: 'Parry spends the base Attack Action and must be entered before that action is used.',
    };
  }

  rs.parry = {
    entered: true,
    pool: computed.max,
    max: computed.max,
    attribute: computed.attribute,
    delivery,
    entryPool: computed.max,
    recoveredThisRound: 0,
  };
  rs.baseAttackLocked = true;
  await setRoundState(economy, rs);

  return {
    ok: true,
    pool: computed.max,
    max: computed.max,
    attribute: computed.attribute,
  };
}

/**
 * Apply Parry strip against an incoming attack dice pool. Persists remaining pool.
 */
export async function applyParryDiceStrip(
  defender: Actor,
  combat: Combat | null,
  attackDice: number,
  opts?: { spell?: boolean; attacker?: any },
): Promise<ParryStripResult> {
  const empty: ParryStripResult = {
    spent: 0,
    remainingDice: Math.max(0, Math.floor(Number(attackDice) || 0)),
    remainingPool: 0,
    fullyParried: false,
    countered: false,
    note: '',
  };
  if (!defender || !combat) return empty;

  const economy = (getActionEconomyActor(defender) ?? defender) as Actor;
  const parry = getParryState(economy, combat);
  if (!parry || parry.pool <= 0) return empty;

  const incomingSpell = opts?.spell === true;
  if (incomingSpell !== (parry.delivery === 'spell')) return empty;
  if (incomingSpell && opts?.attacker) {
    try {
      const { distanceBetweenActorsMeters } = await import('./reaction-eligibility.js');
      const meters = distanceBetweenActorsMeters(opts.attacker, defender);
      if (meters != null && meters > SPELL_PARRY_ORIGIN_M) return empty;
    } catch {
      /* Distance unknown — do not block the counter. */
    }
  }

  const strip = computeParryStrip(attackDice, parry.pool);
  if (strip.spent <= 0) return { ...empty, remainingDice: strip.remainingDice };

  const rs = getRoundState(economy, combat);
  const stone = Math.max(0, Math.floor(Number(rs.stoneBonuses?.tempParryPool ?? 0) || 0));
  const stance = Math.max(0, Math.floor(Number(rs.parry?.pool) || 0));
  const fromStone = Math.min(stone, strip.spent);
  const fromStance = Math.max(0, strip.spent - fromStone);
  if (rs.stoneBonuses) rs.stoneBonuses.tempParryPool = stone - fromStone;
  if (rs.parry) {
    let pool = Math.max(0, stance - fromStance);
    let recoveredThisRound = Math.max(0, Math.floor(Number(rs.parry.recoveredThisRound) || 0));
    try {
      const { computeParryRecovery, readParryRecoveryCap } = await import('./parry-recovery.js');
      const cap = actorHasPassiveParry(defender) ? readParryRecoveryCap(defender) : 0;
      if (cap > 0) {
        const refund = computeParryRecovery({
          spent: fromStance,
          pool,
          entryPool: Math.max(pool, Math.floor(Number(rs.parry.entryPool ?? rs.parry.max) || 0)),
          recoveredThisRound,
          maxRecoverPerRound: cap,
        });
        pool = refund.pool;
        recoveredThisRound = refund.recoveredThisRound;
      }
    } catch {
      /* Recovery is optional. The spend itself still stands. */
    }
    rs.parry = { ...rs.parry, pool, recoveredThisRound };
  }
  await setRoundState(economy, rs);

  const defName = String((defender as any).name ?? 'Defender');
  const countered = incomingSpell && strip.fullyParried;
  const diceName = incomingSpell ? 'Casting Dice' : 'Attack Dice';
  const note = strip.fullyParried
    ? incomingSpell
      ? `Parry: ${defName} spent ${strip.spent} → Fully Countered (0 Casting Dice).`
      : `Parry: ${defName} spent ${strip.spent} → Fully Parried (0 Attack Dice).`
    : `Parry: ${defName} spent ${strip.spent} → ${diceName} ${attackDice}→${strip.remainingDice} (pool ${strip.remainingPool}/${parry.max}).`;

  return {
    spent: strip.spent,
    remainingDice: strip.remainingDice,
    remainingPool: strip.remainingPool,
    fullyParried: strip.fullyParried,
    countered,
    note,
  };
}

/** Equipped weapon / artifact weapon damage dice string (fallback 1d8). */
export function resolveEquippedWeaponDamageFormula(actor: any): string {
  const items = actorItems(actor);
  const weapon =
    items.find((it) => it?.type === 'weapon' && it?.system?.equipped === true) ||
    items.find(
      (it) =>
        it?.type === 'artifact' &&
        it?.system?.equipped === true &&
        (it?.system?.artifactWeapon?.damage || it?.system?.baseProfile),
    ) ||
    null;
  if (!weapon?.system) return '1d8';
  const sys = weapon.system as any;
  const artifactDmg =
    typeof sys.artifactWeapon?.damage === 'string' ? sys.artifactWeapon.damage.trim() : '';
  const raw = artifactDmg || sys.damage || sys.weaponDamage || sys.roll?.damage || null;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return `${Math.floor(raw)}d8`;
  return '1d8';
}

/** Combine weapon base + rider flat (e.g. "2d8" + "+3d8" → "2d8+3d8"). */
export function buildDamageFormula(base: string, riderFlat: string): string {
  const b = String(base || '').trim().replace(/^\+/, '');
  const r = String(riderFlat || '').trim().replace(/^\+/, '');
  if (!b && !r) return '0';
  if (!b) return r;
  if (!r) return b;
  return `${b}+${r}`;
}

export function buildRiposteFormula(actor: any, riderFlat: string): string {
  return buildDamageFormula(resolveEquippedWeaponDamageFormula(actor), riderFlat);
}

/**
 * Reflection returns the triggering payload. Spell delivery uses the printed
 * Power damage, not the attacker's weapon.
 */
export function buildReflectionFormula(
  triggerDamage: number,
  attacker: any,
  riderFlat: string,
  opts?: { spell?: boolean; powerDamageDice?: number },
): string {
  const raw = Math.max(0, Math.floor(Number(triggerDamage) || 0));
  const rider = String(riderFlat || '').trim().replace(/^\+/, '');
  if (opts?.spell) {
    const dice = Math.max(0, Math.floor(Number(opts.powerDamageDice) || 0));
    const base = raw > 0 ? String(raw) : dice > 0 ? `${dice}d8` : '0';
    if (base === '0') return rider || '0';
    return rider ? `${base}+${rider}` : base;
  }
  if (raw > 0) return rider ? `${raw}+${rider}` : String(raw);
  return buildDamageFormula(resolveEquippedWeaponDamageFormula(attacker), riderFlat);
}

export function isRiposteReaction(item: any): boolean {
  const tid = String(item?.system?.templateId ?? '').toLowerCase();
  const name = String(item?.name ?? '').toLowerCase();
  return tid === 'reaction-riposte' || name.includes('riposte') || name.includes('weapon damage');
}

export function isReflectionReaction(item: any): boolean {
  const tid = String(item?.system?.templateId ?? '').toLowerCase();
  return (
    tid === 'reaction-parry-reflection' ||
    String(item?.name ?? '').toLowerCase().includes('reflection')
  );
}

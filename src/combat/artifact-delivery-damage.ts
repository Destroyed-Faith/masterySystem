/**
 * Unified Artifact Delivery Damage.
 *
 * Canonical rule: an Artifact may support any Delivery its wielder already
 * has. Form, equipment slot, weapon classification, and Spell Focus
 * classification do not gate Delivery eligibility for Artifacts.
 *
 * When an Artifact provides eligible delivery damage, that contribution
 * applies once for the selected Delivery — never as both Weapon Damage and
 * Spell Focus on the same attack.
 *
 * Preference when both Base Values exist on one Artifact:
 *   Martial → Weapon Damage (fallback: Spell Focus as Nd8)
 *   Spell   → Spell Focus   (fallback: Weapon Damage dice)
 *
 * Mundane equipment is unchanged; callers must keep mundane paths separate.
 * Special-only Attacks never receive delivery damage (enforced by callers via
 * martialWeaponDamageApplies / spellFocusDamageApplies).
 */

import { getArtifactBindingKind } from '../utils/artifact-actor-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { spellFocusDiceFromSystem } from '../utils/artifact-rules.js';

export type ArtifactDeliveryKind = 'martial' | 'spell';

export type ArtifactDeliveryDamageSource = {
  name: string;
  dice: number;
  formula: string;
  kind: 'weaponDamage' | 'spellFocus';
  itemId?: string;
};

function artifactLevel(sys: Record<string, unknown> | null | undefined): number {
  return Math.max(1, Math.min(10, Number(sys?.currentLevel) || Number(sys?.level) || 1));
}

/** Leading Nd8 count from a damage formula (`5d8`, `+5d8`, bare `5`). */
export function parseNd8DiceCount(formula: unknown): number {
  if (typeof formula === 'number' && Number.isFinite(formula)) {
    return Math.max(0, Math.floor(formula));
  }
  const s = String(formula ?? '').trim();
  if (!s) return 0;
  const m = s.match(/(\d+)\s*d\s*8/i) || s.match(/^(\d+)$/);
  if (!m) return 0;
  return Math.max(0, Math.floor(Number(m[1]) || 0));
}

/**
 * Authored / derived Weapon Damage dice on an Artifact item (0 when none).
 * Does not invent damage for Focus-only gear.
 */
export function resolveArtifactItemWeaponDamageDice(item: any): number {
  return parseNd8DiceCount(resolveArtifactItemWeaponDamageFormula(item));
}

/** Nd8 formula for Artifact Weapon Damage, or '' when the Artifact has none. */
export function resolveArtifactItemWeaponDamageFormula(item: any): string {
  if (!item || item.type !== 'artifact') return '';
  const sys = (item.system as Record<string, unknown>) || {};
  const level = artifactLevel(sys);
  const derived = deriveArtifactWeaponDamage(sys.baseProfile as string | null | undefined, level);
  if (derived) return derived;
  const aw = sys.artifactWeapon as { damage?: unknown } | undefined;
  const baked = typeof aw?.damage === 'string' ? aw.damage.trim() : '';
  if (baked && parseNd8DiceCount(baked) > 0) return baked;
  const bvs = Array.isArray(sys.baseValues) ? sys.baseValues : [];
  for (const bv of bvs) {
    if (String((bv as any)?.type || '') !== 'weaponDamage') continue;
    const n = parseNd8DiceCount((bv as any)?.value);
    if (n > 0) return `${n}d8`;
  }
  return '';
}

function isArtifactEquipped(item: any): boolean {
  if (!item) return false;
  if (getArtifactBindingKind(item) === 'echo') return true;
  if ((item.system as any)?.equipped === true) return true;
  try {
    const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
    if (typeof flagSlot === 'string' && flagSlot.length > 0) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * One Artifact → one delivery contribution for the selected Delivery.
 * Returns null when the Artifact grants no delivery damage.
 *
 * Artifact Damage Only (2026-11-19): a printed Artifact Damage / Weapon Damage
 * value is the complete contribution for Martial or Spell. Prefer that over a
 * separate Spell Focus row on the same Artifact so WD+SF never stack. Focus-only
 * Artifacts still contribute their Focus dice to either Delivery.
 */
export function resolveArtifactItemDeliveryContribution(
  item: any,
  delivery: ArtifactDeliveryKind,
): ArtifactDeliveryDamageSource | null {
  if (!item || item.type !== 'artifact') return null;
  const sys = item.system || {};
  const wdFormula = resolveArtifactItemWeaponDamageFormula(item);
  const wdDice = parseNd8DiceCount(wdFormula);
  const sfDice = spellFocusDiceFromSystem(sys);
  const name = String(item.name || 'Artifact').trim() || 'Artifact';
  const itemId = item.id != null ? String(item.id) : undefined;

  // Complete printed Artifact Damage wins for both Deliveries.
  if (wdDice > 0) {
    return { name, dice: wdDice, formula: wdFormula || `${wdDice}d8`, kind: 'weaponDamage', itemId };
  }
  if (sfDice > 0) {
    return { name, dice: sfDice, formula: `${sfDice}d8`, kind: 'spellFocus', itemId };
  }
  void delivery;
  return null;
}

/**
 * Pick at most one Artifact Damage source for a Damage Roll (highest dice).
 * Callers must not sum multiple Artifact contributions onto one roll.
 */
export function selectPrimaryArtifactDeliverySource(
  actor: any,
  delivery: ArtifactDeliveryKind,
): ArtifactDeliveryDamageSource | null {
  const all = listArtifactDeliveryDamageSources(actor, delivery);
  if (!all.length) return null;
  return all.reduce((best, cur) => (cur.dice > best.dice ? cur : best), all[0]!);
}

/**
 * Martial formula for a resolved Artifact weapon (including Focus-only fallback).
 * Returns null when the item is not an Artifact or grants no delivery damage.
 */
export function resolveMartialArtifactWeaponFormula(weaponOrArtifact: any): string | null {
  if (!weaponOrArtifact) return null;
  // Virtual weapons from artifactToVirtualWeapon keep type 'weapon' + fromArtifact.
  const fromArtifact =
    weaponOrArtifact.type === 'artifact' ||
    !!(weaponOrArtifact.system as any)?.fromArtifact ||
    !!(weaponOrArtifact.flags as any)?.['mastery-system']?.artifactWeaponSourceId;
  if (!fromArtifact && weaponOrArtifact.type !== 'artifact') return null;

  if (weaponOrArtifact.type === 'artifact') {
    const c = resolveArtifactItemDeliveryContribution(weaponOrArtifact, 'martial');
    return c ? c.formula : null;
  }

  // Already virtualized: prefer baked damage, else re-derive from flags if needed.
  const baked = String((weaponOrArtifact.system as any)?.damage || '').trim();
  if (baked && parseNd8DiceCount(baked) > 0) return baked;
  return null;
}

/**
 * Equipped Artifacts' delivery contributions for the selected Delivery.
 * Each Artifact contributes at most once.
 */
export function listArtifactDeliveryDamageSources(
  actor: any,
  delivery: ArtifactDeliveryKind,
): ArtifactDeliveryDamageSource[] {
  const out: ArtifactDeliveryDamageSource[] = [];
  if (!actor?.items) return out;
  const items: any[] = Array.from(actor.items as Iterable<any>);
  for (const item of items) {
    if (item?.type !== 'artifact') continue;
    if (!isArtifactEquipped(item)) continue;
    const c = resolveArtifactItemDeliveryContribution(item, delivery);
    if (c && c.dice > 0) out.push(c);
  }
  return out;
}

export function sumArtifactDeliveryDice(actor: any, delivery: ArtifactDeliveryKind): number {
  return listArtifactDeliveryDamageSources(actor, delivery).reduce((n, s) => n + s.dice, 0);
}

/**
 * Spell delivery damage sources: at most one Artifact contribution, else mundane
 * weapons that print a Spell Focus (+Xd8) innate (unchanged mundane path).
 * Artifact Damage never stacks with a second Artifact or mundane Focus on the
 * same roll.
 */
export function listSpellDeliveryDamageSources(actor: any): Array<{ name: string; dice: number }> {
  const primary = selectPrimaryArtifactDeliverySource(actor, 'spell');
  if (primary && primary.dice > 0) {
    return [{ name: primary.name, dice: primary.dice }];
  }

  const sources: Array<{ name: string; dice: number }> = [];
  const items = actor?.items ? Array.from(actor.items as Iterable<any>) : [];
  for (const it of items) {
    if (it?.type !== 'weapon' || it?.system?.equipped !== true) continue;
    if ((it.system as any)?.fromArtifact) continue;
    const innates = Array.isArray(it.system?.innateAbilities) ? it.system.innateAbilities : [];
    let dice = 0;
    for (const innate of innates) {
      const m = String(innate ?? '').match(/spell\s*focus[^\d]*(\d+)\s*d8/i);
      if (m) dice += Math.max(0, Math.floor(Number(m[1]) || 0));
    }
    if (dice > 0) {
      sources.push({ name: String(it.name || 'Weapon').trim() || 'Weapon', dice });
    }
  }
  return sources;
}

export function getSpellDeliveryBonusDice(actor: any): number {
  return listSpellDeliveryDamageSources(actor).reduce((sum, s) => sum + s.dice, 0);
}

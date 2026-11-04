/**
 * Damage Transfer (Vampyr).
 *
 * Healing is the real HP this one damage instance removed from the target
 * after mitigation, Temporary HP, and other buffers. It is capped by the
 * missing HP on the attacker's current Health Bar. Limited multiplies printed
 * power dice ×4 only; it does not multiply the heal. This is not Life Absorption.
 */

import { applyHealHpAcrossOpenBars } from './heal-resolution.js';

export const MELEE_DAMAGE_TRANSFER_TEMPLATE_ID = 'active-melee-single-target-damage-transfer';
export const RANGED_DAMAGE_TRANSFER_TEMPLATE_ID = 'active-ranged-single-target-damage-transfer';

const processedDamageTransferIds = new Set<string>();

/** Test hook. Production claims live for the session so a replay cannot heal twice. */
export function resetDamageTransferInstances(): void {
  processedDamageTransferIds.clear();
}

export function isDamageTransferTemplateId(templateId: unknown): boolean {
  const tid = String(templateId || '');
  return tid === MELEE_DAMAGE_TRANSFER_TEMPLATE_ID || tid === RANGED_DAMAGE_TRANSFER_TEMPLATE_ID;
}

export function isDamageTransferPower(item: any): boolean {
  if (!item) return false;
  const sys = item.system ?? {};
  if (isDamageTransferTemplateId(sys.templateId)) return true;
  const levels = sys.levels;
  const list = Array.isArray(levels) ? levels : levels ? Object.values(levels) : [];
  return list.some((row: any) => row?.mechanics?.damageTransfer === true);
}

/** A miss never transfers. The attack handler and the damage resolver both use this. */
export function damageTransferApplies(opts: { damageTransfer?: boolean; hit: boolean }): boolean {
  return opts.damageTransfer === true && opts.hit === true;
}

type InstantAoeFlagBag = {
  aoeMeleeWeapon?: boolean | string;
  instantAoe?: boolean | string;
};

type SpecialOnlyFlagBag = {
  specialOnly?: boolean | string;
  templateId?: string | null;
  selectedPowerTemplateId?: string | null;
};

function flagTrue(v: unknown): boolean {
  return v === true || String(v) === 'true';
}

/**
 * Instant AoE (Melee / Ranged AoE Attack, AoE Special Attacks): one shared
 * Attack/Casting roll and — when damaging — one shared Damage Pool roll reused
 * for every hit. No Primary Target. Allies stay excluded by the AoE filter.
 *
 * Instant Damage AoE pools are Power Dice + Weapon (martial) or Spell Focus
 * (spell). Special-only AoEs have no Damage Pool.
 *
 * `aoeMeleeWeapon` is the legacy flag name; `instantAoe` is preferred.
 */
export function isInstantAoeFlags(flags: InstantAoeFlagBag | null | undefined): boolean {
  if (!flags) return false;
  return flagTrue(flags.instantAoe) || flagTrue(flags.aoeMeleeWeapon);
}

/**
 * Canonical Special-only Active template ids (no direct damage axis).
 * Single source for radial options, Instant AoE flags, and damage gates —
 * do not re-implement with divergent string heuristics elsewhere.
 *
 * Covers:
 * - Instant Single-Special (ST): `active-*-instant-special-t[3-6]`
 * - Instant AoE Special (0 Power dice): `active-*-aoe-damage-t[3-6]`
 * - AoE Targeted Special (Exorcism/Requiem, no Power/Weapon/Focus damage)
 *
 * Does NOT cover Damage+Special (`active-*-damage-t*`), ST Targeted Special
 * (weapon damage), or Weapon AoE (shared Damage Pool).
 */
export function isSpecialOnlyTemplateId(templateId: unknown): boolean {
  const id = String(templateId || '').trim();
  if (!id) return false;
  return (
    /^active-(melee|ranged)-instant-special-t[3-6]$/.test(id) ||
    /^active-(melee|ranged)-aoe-damage-t[3-6]$/.test(id) ||
    /^active-(melee|ranged)-aoe-targeted-special$/.test(id)
  );
}

/**
 * Special-only Attacks never deal direct damage (no Power / Weapon / Spell Focus
 * dice, no Damage Roll / Dialog, no Combat Damage Raises, no Maximization).
 * On-hit Specials still apply; follow-up Special ticks (e.g. Ruin 4×X) are unchanged.
 */
export function isSpecialOnlyAttack(
  flags: (SpecialOnlyFlagBag & InstantAoeFlagBag) | null | undefined,
): boolean {
  if (!flags) return false;
  if (flagTrue(flags.specialOnly)) return true;
  return (
    isSpecialOnlyTemplateId(flags.templateId) ||
    isSpecialOnlyTemplateId(flags.selectedPowerTemplateId)
  );
}

/**
 * Martial delivery includes weapon damage on single-target and Instant Damage
 * AoE. Spell delivery, Special-only Attacks, and an explicit ignore flag do not.
 * NPC spell rows are spell delivery.
 */
export function martialWeaponDamageApplies(
  flags: {
    ignoreWeaponDamage?: boolean;
    powerIsSpell?: boolean;
    npcIsSpell?: boolean;
    dragonHeadDamageBreath?: boolean;
  } & InstantAoeFlagBag &
    SpecialOnlyFlagBag,
): boolean {
  if (isSpecialOnlyAttack(flags)) return false;
  if (flags.ignoreWeaponDamage === true) return false;
  if (flags.powerIsSpell === true || flags.npcIsSpell === true) return false;
  // Dragon Head Damage Breath and every other martial Instant Damage AoE keep weapon dice.
  return true;
}

/**
 * Spell Focus dice apply to damaging Spells (single-target and Instant Damage
 * AoE). Special-only Attacks have no Damage Pool and never receive Spell Focus.
 */
export function spellFocusDamageApplies(
  flags: { isSpell?: boolean; isNpcAttackFlow?: boolean } & InstantAoeFlagBag &
    SpecialOnlyFlagBag,
): boolean {
  if (isSpecialOnlyAttack(flags)) return false;
  return flags.isSpell === true && flags.isNpcAttackFlow !== true;
}

/** Multiply only the leading printed Power Dice pool (never a following weapon term). */
export function multiplyPrintedPowerDice(formula: string, factor: number): string {
  const f = Math.max(1, Math.floor(Number(factor) || 1));
  return String(formula || '').replace(
    /^(\+?)(\d+)d(\d+)/i,
    (_m, sign: string, n: string, sides: string) => `${sign}${Number(n) * f}d${sides}`,
  );
}

/** @deprecated Use multiplyPrintedPowerDice(formula, 2) — kept for callers mid-migration. */
export function doublePrintedPowerDice(formula: string): string {
  return multiplyPrintedPowerDice(formula, 2);
}

/**
 * Limited ×4 applies only to printed Power Damage Dice.
 * Damage Transfer is never a legal Limited Power (Batch 5 C07) — no-op.
 */
export function applyLimitedToTransferPowerDamage(
  formula: string,
  _opts: { damageTransfer?: boolean; limited?: boolean },
): string {
  return formula;
}

/**
 * Limited Instant Damage Attacks: ×4 printed Power Dice once.
 * Pass `alreadyMultiplied: true` when the formula / catalog row already stores
 * the Limited output so runtime does not apply ×4 again (no ×16).
 */
export function applyLimitedPowerDamage(
  formula: string,
  opts: { limited?: boolean; alreadyMultiplied?: boolean },
): string {
  if (opts.limited !== true) return formula;
  if (opts.alreadyMultiplied === true) return formula;
  return multiplyPrintedPowerDice(formula, 4);
}

/** Parse leading NdS count from a Power damage formula (`3d8`, `+3d8`). */
export function printedPowerDiceCount(formula: string): number {
  const m = String(formula || '').trim().match(/^\+?(\d+)d\d+/i);
  return m ? Math.max(0, Math.floor(Number(m[1]) || 0)) : 0;
}

export async function settleDamageTransfer(opts: {
  enabled: boolean;
  attacker: any;
  realHpLost: number;
  instanceId?: string | null;
}): Promise<number> {
  if (!opts.enabled || !opts.attacker) return 0;
  const id = String(opts.instanceId || '').trim();
  if (id) {
    if (processedDamageTransferIds.has(id)) return 0;
    processedDamageTransferIds.add(id);
  }
  const lost = Math.max(0, Math.floor(Number(opts.realHpLost) || 0));
  if (lost <= 0) return 0;
  const health = opts.attacker.system?.health ?? {};
  const healed = applyHealHpAcrossOpenBars(health, lost);
  if (healed.restored <= 0) return 0;
  const { updateActorViaGm } = await import('./gm-relay.js');
  await updateActorViaGm(opts.attacker, {
    'system.health.bars': healed.bars,
    'system.health.currentBar': healed.currentBar,
  });
  return healed.restored;
}

/**
 * NPC attack helpers — d8 pool sizes, phase index, damage formula.
 */

import type { AttackValue } from '../types/actor.js';

const MAX_D = 99;

export function resolveNpcAttackList(
  system: any
): { attacks: AttackValue[]; phaseIndex: number | null } {
  if (!system) return { attacks: [], phaseIndex: null };
  const phases = system.phases;
  if (Array.isArray(phases) && phases.length > 0) {
    const pi = Math.max(
      0,
      Math.min(
        phases.length - 1,
        Math.floor(Number(system.npcActivePhaseIndex) || 0)
      )
    );
    const raw = phases[pi]?.attackValues;
    return { attacks: Array.isArray(raw) ? raw : [], phaseIndex: pi };
  }
  const raw = system.attackValues;
  return { attacks: Array.isArray(raw) ? raw : [], phaseIndex: null };
}

export function getNpcAttackByIndex(
  system: any,
  attackIndex: number,
  phaseIndex: number | null | undefined
): AttackValue | null {
  if (!system) return null;
  const idx = Math.max(0, Math.floor(Number(attackIndex) || 0));
  if (Array.isArray(system.phases) && system.phases.length > 0) {
    const pi =
      phaseIndex == null || phaseIndex === undefined
        ? Math.max(
            0,
            Math.min(
              system.phases.length - 1,
              Math.floor(Number(system.npcActivePhaseIndex) || 0)
            )
          )
        : Math.max(0, Math.min(system.phases.length - 1, Math.floor(Number(phaseIndex))));
    const attacks = system.phases[pi]?.attackValues;
    if (!Array.isArray(attacks) || idx >= attacks.length) return null;
    return attacks[idx] as AttackValue;
  }
  const attacks = system.attackValues;
  if (!Array.isArray(attacks) || idx >= attacks.length) return null;
  return attacks[idx] as AttackValue;
}

/** Attack roll pool: explicit count, else parse legacy attackDice as integer, else 0 */
export function npcAttackDiceCount(attack: AttackValue | null | undefined): number {
  if (!attack) return 0;
  const n = Math.floor(Number(attack.attackDiceCount) || 0);
  if (n > 0) return Math.min(MAX_D, n);
  const s = String(attack.attackDice || '').trim();
  const p = parseInt(s, 10);
  if (Number.isFinite(p) && p > 0) return Math.min(MAX_D, p);
  return 0;
}

/** Damage formula: Nd8 from count, else legacy damage string */
export function npcDamageDiceFormula(attack: AttackValue | null | undefined): string {
  if (!attack) return '0';
  const n = Math.floor(Number(attack.damageDiceCount) || 0);
  if (n > 0) return `${Math.min(MAX_D, n)}d8`;
  const legacy = String(attack.damage || '').trim();
  return legacy || '0';
}

export function formatNpcSpecialLabel(name: string, value: string | number | undefined | null): string {
  const v = value === undefined || value === null || String(value).trim() === '' ? '' : String(value).trim();
  if (!v) return name.trim();
  return `${name.trim()} (${v})`;
}

/** Compact "Name(12)" for status / effect application (no spaces). */
export function npcSpecialEffectString(
  name: string,
  value: string | number | undefined | null
): string {
  const n = String(name || '').trim();
  if (!n) return '';
  if (value === undefined || value === null || String(value).trim() === '') return n;
  return `${n}(${String(value).trim()})`;
}

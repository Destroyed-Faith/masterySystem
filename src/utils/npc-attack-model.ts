/**
 * NPC attack helpers — d8 pool sizes, phase index, damage formula.
 */

import type { AttackValue, NpcAttackSpecialEntry } from '../types/actor.js';
import { ALL_SPECIAL_EFFECTS, getEffectBaseName } from './special-effects.js';

/** Legacy sheet values (capitalized) → display label */
const LEGACY_NPC_SPECIAL_LABEL: Record<string, string> = {
  Bleed: 'Lacerate',
  Ignite: 'Ruin',
  Freeze: 'Slow',
  Poison: 'Blight',
  Stun: 'Stun',
  Knockdown: 'Knockdown'
};

/** Human-readable name for chat / attack card (catalog id or legacy key). */
export function displayNpcSpecialName(raw: string): string {
  const k = String(raw || '').trim();
  if (!k) return '';
  if (LEGACY_NPC_SPECIAL_LABEL[k]) return LEGACY_NPC_SPECIAL_LABEL[k];
  const low = k.toLowerCase();
  const hit = ALL_SPECIAL_EFFECTS.find((e) => e.id === low);
  if (hit) {
    return getEffectBaseName(hit.name).replace(/\(X\)/gi, '').trim() || hit.id;
  }
  return k;
}

const MAX_D = 99;

function mergeSpecialsFromLegacy(attack: AttackValue): NpcAttackSpecialEntry[] {
  if (Array.isArray(attack.specials) && attack.specials.length > 0) {
    return attack.specials
      .filter((s) => s && (s.special || s.specialValue != null))
      .map((s) => ({ ...s }));
  }
  if (attack.special && String(attack.special).trim()) {
    return [{ special: attack.special, specialValue: attack.specialValue }];
  }
  return [];
}

/** Effective attack row for display / damage (includes merged specials). */
export function normalizeNpcAttackRow(attack: AttackValue): AttackValue {
  const merged = mergeSpecialsFromLegacy(attack);
  return { ...attack, specials: merged.length ? merged : undefined };
}

function npcBaseAttackRow(raw: unknown): AttackValue | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as AttackValue;
  const ac = Math.floor(Number(a.attackDiceCount) || 0);
  const dc = Math.floor(Number(a.damageDiceCount) || 0);
  const legA = String(a.attackDice || '').trim();
  const legD = String(a.damage || '').trim();
  const has =
    ac > 0 ||
    dc > 0 ||
    (legA && parseInt(legA, 10) > 0) ||
    (legD && legD.length > 0) ||
    (Array.isArray(a.specials) && a.specials.length > 0) ||
    (a.special && String(a.special).trim());
  if (!has) return null;
  return normalizeNpcAttackRow(a);
}

function mergeAttackLists(baseRaw: unknown, extras: AttackValue[] | undefined): AttackValue[] {
  const out: AttackValue[] = [];
  const b = npcBaseAttackRow(baseRaw);
  if (b) out.push(b);
  const ex = Array.isArray(extras) ? extras.map((x) => normalizeNpcAttackRow(x)) : [];
  out.push(...ex);
  return out;
}

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
    const phase = phases[pi];
    const attacks = mergeAttackLists(phase?.npcBaseAttack, phase?.attackValues);
    return { attacks, phaseIndex: pi };
  }
  const attacks = mergeAttackLists(system.npcBaseAttack, system.attackValues);
  return { attacks, phaseIndex: null };
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
    const phase = system.phases[pi];
    const attacks = mergeAttackLists(phase?.npcBaseAttack, phase?.attackValues);
    if (idx >= attacks.length) return null;
    return attacks[idx] ?? null;
  }

  const attacks = mergeAttackLists(system.npcBaseAttack, system.attackValues);
  if (idx >= attacks.length) return null;
  return attacks[idx] ?? null;
}

/** Attack roll pool: explicit count (2–16 typical), else parse legacy attackDice */
export function npcAttackDiceCount(attack: AttackValue | null | undefined): number {
  if (!attack) return 0;
  const n = Math.floor(Number(attack.attackDiceCount) || 0);
  if (n > 0) return Math.min(MAX_D, n);
  const s = String(attack.attackDice || '').trim();
  const p = parseInt(s, 10);
  if (Number.isFinite(p) && p > 0) return Math.min(MAX_D, p);
  return 0;
}

/** Damage formula: Nd8 from count (4–16 typical), else legacy damage string */
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

/** All specials on one attack (array or legacy single). */
export function formatNpcAttackSpecialsLine(attack: AttackValue | null | undefined): string {
  if (!attack) return '';
  return mergeSpecialsFromLegacy(attack)
    .filter((s) => s.special && String(s.special).trim())
    .map((s) => formatNpcSpecialLabel(displayNpcSpecialName(String(s.special)), s.specialValue))
    .join(', ');
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

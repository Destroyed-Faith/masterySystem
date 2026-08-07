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

/**
 * Canonical Melee/Range + AoE resolution for NPC attack rows.
 * AoE is ON only when npcAoeRadiusM ≥ 2 (ignore leftover npcAoeShape).
 */
export type NpcAttackTargeting = {
  isRanged: boolean;
  reachM: number;
  rangedMinM: number;
  rangedMaxM: number;
  rangeM: number;
  hasAoe: boolean;
  aoeRad: number;
  aoeShape: 'none' | 'radius';
  burstMeleeAoE: boolean;
  rangedZone: boolean;
  tags: string[];
};

export function resolveNpcAttackTargeting(atk: AttackValue | null | undefined): NpcAttackTargeting {
  const rangeKind = String(atk?.npcRangeKind || '').toLowerCase();
  const isRanged = rangeKind === 'ranged';
  const metersRaw = Math.floor(Number(atk?.npcRangeMeters));
  const reachM =
    Number.isFinite(metersRaw) && metersRaw > 0 ? Math.min(8, Math.max(1, metersRaw)) : 2;
  const rangedMaxM =
    Number.isFinite(metersRaw) && metersRaw > 0 ? Math.min(24, Math.max(12, metersRaw)) : 24;
  const minRaw = Math.floor(Number(atk?.npcRangeMinMeters));
  let rangedMinM =
    Number.isFinite(minRaw) && minRaw > 0 ? Math.min(24, Math.max(12, minRaw)) : 12;
  if (rangedMinM > rangedMaxM) rangedMinM = rangedMaxM;
  const aoeRad = Math.max(0, Math.floor(Number(atk?.npcAoeRadiusM) || 0));
  const hasAoe = aoeRad >= 2;
  const burstMeleeAoE = !isRanged && hasAoe;
  const rangedZone = isRanged && hasAoe;
  return {
    isRanged,
    reachM,
    rangedMinM,
    rangedMaxM,
    rangeM: isRanged ? rangedMaxM : reachM,
    hasAoe,
    aoeRad: hasAoe ? aoeRad : 0,
    aoeShape: hasAoe ? 'radius' : 'none',
    burstMeleeAoE,
    rangedZone,
    tags: isRanged ? ['attack', 'npc-attack', 'ranged'] : ['attack', 'npc-attack', 'melee'],
  };
}

/** Apply live sheet targeting onto a radial option (call at click time). */
export function applyNpcAttackTargetingToOption<T extends Record<string, any>>(
  option: T,
  atk: AttackValue | null | undefined,
): T {
  const t = resolveNpcAttackTargeting(atk);
  return {
    ...option,
    range: t.rangeM,
    meleeReachMeters: t.isRanged ? undefined : t.reachM,
    rangeMinMeters: t.isRanged ? t.rangedMinM : undefined,
    rangeMeters: t.rangeM,
    aoeShape: t.aoeShape,
    aoeRadiusMeters: t.hasAoe ? t.aoeRad : undefined,
    // Explicit false so a stale true cannot survive a spread/merge.
    burstMeleeAoE: t.burstMeleeAoE,
    burstMeleeRadiusMeters: t.burstMeleeAoE ? t.aoeRad : undefined,
    aoePlacementProfile: t.rangedZone ? 'hostile-zone' : undefined,
    defaultTargetGroup: t.hasAoe ? 'enemy' : undefined,
    allowManualTargetSelection: t.rangedZone ? true : undefined,
    tags: t.tags,
  };
}

/**
 * How many radial copies this power has (sheet dropdown 1–5; default 1).
 * Each copy is one Attack action in the radial menu.
 */
export function npcAttacksPerRoundCap(attack: AttackValue | null | undefined): number {
  const n = Math.floor(Number(attack?.npcAttacksPerRound));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(5, n);
}

/** Stable usage key for an NPC attack row (shared by all radial copies). */
export function npcAttackUsageKey(
  phaseIndex: number | null | undefined,
  attackIndex: number,
): string {
  const phaseKey = phaseIndex == null ? 'root' : String(phaseIndex);
  return `npc-attack-${phaseKey}-${Math.max(0, Math.floor(Number(attackIndex) || 0))}`;
}

/**
 * Sum of Angriffe/Runde across the active attack list (= ATK / attackSlots).
 */
export function sumNpcAttackSlotsFromPowers(system: any): number {
  const { attacks } = resolveNpcAttackList(system);
  if (!attacks.length) return Math.max(1, Math.floor(Number(system?.attackSlots) || 1));
  const sum = attacks.reduce((acc, atk) => acc + npcAttacksPerRoundCap(atk), 0);
  return Math.max(1, Math.min(20, sum));
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

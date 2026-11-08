/**
 * Beta Profession Respec — optional GM World Setting.
 *
 * When enabled, a player may replace one of their original four starting
 * Professions (catalogue or custom) while keeping Rank and invested XP.
 * Perception is never touched. Disabling the setting blocks free replacement
 * but leaves normal XP advancement alone.
 */

import {
  isCharacterPerceptionSpec,
  paidSpecializations,
  professionIdentityKey,
  validateSpecializationList,
  type SpecializationRecord,
} from './specializations.js';

export const PROFESSION_RESPEC_SETTING = 'allowProfessionRespecBeta' as const;

export function isProfessionRespecEnabled(
  settings: { get?: (scope: string, key: string) => unknown } | null | undefined = (globalThis as any)
    ?.game?.settings,
): boolean {
  try {
    return !!settings?.get?.('mastery-system', PROFESSION_RESPEC_SETTING);
  } catch {
    return false;
  }
}

/**
 * Mark the first four paid Professions as starting slots when none are stamped yet.
 * Safe and repeatable for pre-update characters.
 */
export function ensureStartingProfessionSlots(
  specs: SpecializationRecord[],
): SpecializationRecord[] {
  if (specs.some((s) => s.startingSlot === true)) return specs;
  let remaining = 4;
  return specs.map((s) => {
    if (isCharacterPerceptionSpec(s) || remaining <= 0) return s;
    remaining -= 1;
    return { ...s, startingSlot: true };
  });
}

export function isRespecableProfession(
  specs: SpecializationRecord[],
  id: string,
): boolean {
  const stamped = ensureStartingProfessionSlots(specs);
  const target = stamped.find((s) => s.id === id);
  if (!target || isCharacterPerceptionSpec(target)) return false;
  return target.startingSlot === true;
}

export interface ProfessionRespecInput {
  replaceId: string;
  name: string;
  /** Optional legacy fluff; no longer required. */
  origin?: string;
  scope: string;
  category?: string;
}

export interface ProfessionRespecPlan {
  ok: boolean;
  error?: string;
  specializations: SpecializationRecord[];
  preservedRank: number;
  previousName: string;
  nextName: string;
}

/**
 * Replace one starting Profession in place. Rank and startingSlot stay;
 * XP is never refunded or charged. Perception is refused.
 */
export function planProfessionRespec(
  specs: SpecializationRecord[],
  input: ProfessionRespecInput,
): ProfessionRespecPlan {
  const stamped = ensureStartingProfessionSlots(specs);
  const replaceId = String(input.replaceId || '').trim();
  const name = String(input.name || '').trim();
  const origin = String(input.origin || '').trim();
  const scope = String(input.scope || '').trim();
  const category = String(input.category || '').trim();

  if (!replaceId) {
    return { ok: false, error: 'Select a Profession to replace.', specializations: stamped, preservedRank: 0, previousName: '', nextName: name };
  }
  if (!name) {
    return { ok: false, error: 'Name the replacement Profession.', specializations: stamped, preservedRank: 0, previousName: '', nextName: '' };
  }
  if (!scope) {
    return { ok: false, error: 'Agree a one-sentence scope.', specializations: stamped, preservedRank: 0, previousName: '', nextName: name };
  }
  if (isCharacterPerceptionSpec({ name })) {
    return {
      ok: false,
      error: 'Perception is free and separate — it cannot be a Profession respec target or replacement.',
      specializations: stamped,
      preservedRank: 0,
      previousName: '',
      nextName: name,
    };
  }

  const current = stamped.find((s) => s.id === replaceId);
  if (!current) {
    return { ok: false, error: 'Profession not found.', specializations: stamped, preservedRank: 0, previousName: '', nextName: name };
  }
  if (isCharacterPerceptionSpec(current)) {
    return {
      ok: false,
      error: 'Perception cannot be replaced through Beta Profession Respec.',
      specializations: stamped,
      preservedRank: current.rank,
      previousName: current.name,
      nextName: name,
    };
  }
  if (current.startingSlot !== true) {
    return {
      ok: false,
      error: 'Beta Profession Respec only replaces the four free starting Professions.',
      specializations: stamped,
      preservedRank: current.rank,
      previousName: current.name,
      nextName: name,
    };
  }

  const nextId = professionIdentityKey(name);
  const duplicate = stamped.some(
    (s) =>
      s.id !== replaceId &&
      (s.id === nextId || normalizeName(s.name) === normalizeName(name)),
  );
  if (duplicate) {
    return {
      ok: false,
      error: `A Profession named "${name}" already exists.`,
      specializations: stamped,
      preservedRank: current.rank,
      previousName: current.name,
      nextName: name,
    };
  }

  const priorInvested = Math.max(0, Math.floor(Number(current.xpInvested) || 0));
  const replacement: SpecializationRecord = {
    id: nextId,
    name,
    ...(origin ? { origin } : {}),
    scope,
    rank: current.rank,
    startingSlot: true,
    ...(category ? { category } : {}),
    ...(priorInvested > 0 ? { xpInvested: priorInvested } : {}),
    ...(current.gmGranted ? { gmGranted: true } : {}),
  };

  const next = stamped.map((s) => (s.id === replaceId ? replacement : s));
  const check = validateSpecializationList(next);
  if (!check.ok) {
    return {
      ok: false,
      error: check.errors.join(' '),
      specializations: stamped,
      preservedRank: current.rank,
      previousName: current.name,
      nextName: name,
    };
  }

  return {
    ok: true,
    specializations: next,
    preservedRank: current.rank,
    previousName: current.name,
    nextName: name,
  };
}

function normalizeName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Count paid starting slots (for tests / UI). */
export function countStartingProfessionSlots(specs: SpecializationRecord[]): number {
  return ensureStartingProfessionSlots(specs).filter((s) => s.startingSlot === true).length;
}

export function listRespecableProfessions(specs: SpecializationRecord[]): SpecializationRecord[] {
  return ensureStartingProfessionSlots(specs).filter(
    (s) => s.startingSlot === true && !isCharacterPerceptionSpec(s),
  );
}

/** Re-export helper used by UI to confirm paid-only lists. */
export { paidSpecializations };

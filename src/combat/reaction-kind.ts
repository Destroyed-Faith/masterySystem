/**
 * Shared reaction-kind predicates (K8.f / R3).
 * Eligibility, pool filtering and spend must use the same helpers so a reaction
 * cannot be offered under one rule and consumed under another.
 */

import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { compareIdentityDecision } from '../utils/identity-shadow.js';

function templateIdOf(item: any): string {
  return String(item?.system?.templateId ?? '').toLowerCase();
}

function mechanicsOf(item: any) {
  try {
    return resolvePowerMechanics(item);
  } catch {
    return null;
  }
}

/** Parry + Weapon Damage (Riposte). */
export function isRiposteReaction(item: any): boolean {
  const tid = templateIdOf(item);
  const name = String(item?.name ?? '').toLowerCase();
  const legacy =
    tid === 'reaction-riposte' || name.includes('riposte') || name.includes('weapon damage');
  return compareIdentityDecision(
    'reaction.isRiposte',
    legacy,
    () => {
      if (tid === 'reaction-riposte') return true;
      if (!tid) return { kind: 'unresolved', reason: 'missing-identity' };
      return false;
    },
    { tid, name },
    { prefer: 'identity' },
  );
}

/** Attack Reflection. */
export function isReflectionReaction(item: any): boolean {
  const tid = templateIdOf(item);
  const name = String(item?.name ?? '').toLowerCase();
  const legacy = tid === 'reaction-parry-reflection' || name.includes('reflection');
  return compareIdentityDecision(
    'reaction.isReflection',
    legacy,
    () => {
      if (tid === 'reaction-parry-reflection') return true;
      if (!tid) return { kind: 'unresolved', reason: 'missing-identity' };
      return false;
    },
    { tid, name },
    { prefer: 'identity' },
  );
}

/**
 * Explicit exception: Parry + Weapon Damage may be used again this round.
 * Each use still costs 1 Reaction.
 */
export function reactionMayRepeatThisRound(item: any): boolean {
  const tid = templateIdOf(item);
  const name = String(item?.name ?? '').toLowerCase();
  const legacy =
    tid === 'reaction-riposte' ||
    name.includes('parry + weapon damage') ||
    name.includes('riposte') ||
    mechanicsOf(item)?.repeatable === true;
  return compareIdentityDecision(
    'reaction.mayRepeatThisRound',
    legacy,
    () => {
      if (tid === 'reaction-riposte') return true;
      if (mechanicsOf(item)?.repeatable === true) return true;
      if (!tid) return { kind: 'unresolved', reason: 'missing-identity' };
      return false;
    },
    { tid, name },
    { prefer: 'identity' },
  );
}

/**
 * Echo Catalog
 *
 * Central registry for all playable Echos. Accessed by the character-creation
 * Echo picker and the sheet's Echo block.
 */

import type {
  EchoDefinition,
  EchoSubChoice,
  EchoTrait,
  EchoUsage
} from './types.js';

import { HUMANS_ECHO } from './humans.js';
import { HALFLINGS_ECHO } from './halflings.js';
import { DWARFS_ECHO } from './dwarfs.js';
import { ELORIANS_ECHO } from './elorians.js';
import { SENTINELS_ECHO } from './sentinels.js';
import { TITANBORN_ECHO } from './titanborn.js';
import { DRAGONBORN_ECHO } from './dragonborn.js';
import { UNBOUND_ECHO } from './unbound.js';

export type {
  EchoDefinition,
  EchoSize,
  EchoSubChoice,
  EchoTrait,
  EchoUsage
} from './types.js';

/** Display order in pickers (mirrors the Player\u2019s Guide). */
export const ECHO_KEY_ORDER: string[] = [
  'humans',
  'halflings',
  'dwarfs',
  'elorians',
  'sentinels',
  'titanborn',
  'dragonborn',
  'unbound'
];

/** All Echos indexed by stable key. */
export const ALL_ECHOS: Record<string, EchoDefinition> = {
  humans: HUMANS_ECHO,
  halflings: HALFLINGS_ECHO,
  dwarfs: DWARFS_ECHO,
  elorians: ELORIANS_ECHO,
  sentinels: SENTINELS_ECHO,
  titanborn: TITANBORN_ECHO,
  dragonborn: DRAGONBORN_ECHO,
  unbound: UNBOUND_ECHO
};

/** All Echos as an array, in canonical display order. */
export function getAllEchos(): EchoDefinition[] {
  return ECHO_KEY_ORDER.map(k => ALL_ECHOS[k]).filter(Boolean);
}

/** Lookup a single Echo by its key (legacy `elves` resolves to `elorians`). */
export function getEcho(key: string | undefined | null): EchoDefinition | undefined {
  if (!key) return undefined;
  const resolved = key === 'elves' ? 'elorians' : key;
  return ALL_ECHOS[resolved];
}

/** Lookup a sub-choice on an Echo by key (lineage / order). */
export function getEchoSubChoice(
  echoKey: string | undefined | null,
  subChoiceKey: string | undefined | null
): EchoSubChoice | undefined {
  const echo = getEcho(echoKey);
  if (!echo || !echo.subChoices || !subChoiceKey) return undefined;
  return echo.subChoices.find(sc => sc.key === subChoiceKey);
}

/**
 * Resolve all currently-active Core Traits for a character (core + active sub-choice).
 * Sub-choice trait is included only when the character has picked that sub-choice.
 */
export function getActiveEchoTraits(
  echoKey: string | undefined | null,
  subChoiceKey?: string | null
): EchoTrait[] {
  const echo = getEcho(echoKey);
  if (!echo) return [];
  const out = [...echo.coreTraits];
  if (echo.subChoices && subChoiceKey) {
    const sc = echo.subChoices.find(s => s.key === subChoiceKey);
    if (sc) out.push(sc.trait);
  }
  return out;
}

/**
 * Build a fresh `traitUses` record for a given Mastery Rank.
 * `mr-per-rest` traits get `masteryRank` uses; all others are not tracked.
 */
export function buildFreshTraitUses(
  echoKey: string | undefined | null,
  subChoiceKey: string | undefined | null,
  masteryRank: number
): Record<string, number> {
  const out: Record<string, number> = {};
  const traits = getActiveEchoTraits(echoKey, subChoiceKey);
  const mr = Math.max(1, Number(masteryRank) || 1);
  for (const t of traits) {
    if (isMrPerRest(t.usage)) {
      out[t.id] = mr;
    } else if (t.usage === 'once-per-rest' || t.usage === 'unlock-mr6-once') {
      out[t.id] = 1;
    }
  }
  return out;
}

/** Usage kinds that follow the \u201cMastery Rank per Safe Haven Rest\u201d pattern. */
export function isMrPerRest(usage: EchoUsage): boolean {
  return usage === 'mr-per-rest';
}

/** True if a trait is currently gated off by Mastery Rank. */
export function isTraitGatedByMr(usage: EchoUsage, masteryRank: number): boolean {
  const mr = Math.max(1, Number(masteryRank) || 1);
  if (usage === 'unlock-mr3') return mr < 3;
  if (usage === 'unlock-mr6' || usage === 'unlock-mr6-once') return mr < 6;
  return false;
}

/**
 * Stone-Powers Rituals tab — Core Rituals catalogue (DF 2026).
 * Built from the 16 universal Core Rituals; any Stone color may pay and
 * slots accept every pool attribute.
 */

import { coreRitualTierText, stripRitualMarkdown } from '../rules/core-rituals.js';
import { listUniversalCoreRituals } from '../utils/rituals.js';

export type RitualPoolAttr =
  | 'might'
  | 'agility'
  | 'vitality'
  | 'intellect'
  | 'resolve'
  | 'influence'
  | 'wits';

export type RitualSlotRule = { allow: RitualPoolAttr[] };

export type RitualCatalogEntry = {
  id: string;
  name: string;
  slots: RitualSlotRule[];
  roll: string;
  duration: string;
  requirement: string;
  intro: string;
  raises: { label: string; text: string }[];
  danger?: string;
  lore?: string;
};

const ANY_STONE: RitualPoolAttr[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
];

function repeatSlots(n: number, allow: RitualPoolAttr[]): RitualSlotRule[] {
  return Array.from({ length: Math.max(1, n) }, () => ({ allow: [...allow] }));
}

export const STONE_RITUALS_CATALOG: RitualCatalogEntry[] = listUniversalCoreRituals().map((ritual) => ({
  id: ritual.id,
  name: ritual.name,
  slots: repeatSlots(3, ANY_STONE),
  roll: `Skill Check · ${stripRitualMarkdown(ritual.baseTnNote)}`,
  duration: ritual.effectDuration,
  requirement: ritual.requirement ?? '',
  intro: ritual.tagline,
  raises: ([0, 1, 2, 3, 4] as const).map((tier) => ({
    label: `Tier ${tier}`,
    text: coreRitualTierText(ritual, tier),
  })),
  danger: ritual.danger || undefined,
  lore: stripRitualMarkdown(ritual.limits) || undefined,
}));

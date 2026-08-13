/**
 * Stone-Powers Rituals tab — same catalog as Perform Ritual.
 * Any Stone color may pay; slots accept every pool attribute.
 */

import {
  RITUALS,
  ritualMaxRaise,
  type RitualDefinition,
} from '../utils/rituals.js';

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

function categoryLabel(ritual: RitualDefinition): string {
  const map: Record<string, string> = {
    physical: 'Physical',
    knowledge: 'Knowledge & Craft',
    social: 'Social',
    survival: 'Survival',
    martial: 'Martial',
  };
  return ritual.allowedSkillCategories.map((c) => map[c] ?? c).join(', ');
}

export const STONE_RITUALS_CATALOG: RitualCatalogEntry[] = RITUALS.map((ritual) => ({
  id: ritual.id,
  name: ritual.name,
  slots: repeatSlots(ritual.stoneCost, ANY_STONE),
  roll: `Normal Skill Check · ${categoryLabel(ritual)}`,
  duration: ritual.duration,
  requirement: ritual.requirement ?? '',
  intro: ritual.description,
  raises: ritual.raises.slice(0, ritualMaxRaise(ritual) + 1).map((text, i) => ({
    label: `Raise ${i}`,
    text,
  })),
  danger: ritual.danger,
  lore: ritual.specialCostNote,
}));

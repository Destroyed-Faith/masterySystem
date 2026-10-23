/**
 * Echo Imprints — 28 catalogue entries, tiers 4/8/12/16/20.
 * Replaces Minor Expressions. Selection costs no Stones / XP / charges.
 */

import imprintData from './data/echo-imprints-data.js';

export const ECHO_IMPRINT_TIERS = [4, 8, 12, 16, 20] as const;
export type EchoImprintTier = (typeof ECHO_IMPRINT_TIERS)[number];

export type EchoImprintAttribute =
  | 'might'
  | 'agility'
  | 'vitality'
  | 'intellect'
  | 'resolve'
  | 'influence'
  | 'wits';

export interface EchoImprintDefinition {
  id: string;
  attribute: EchoImprintAttribute;
  name: string;
  tagline: string;
  tiers: Record<EchoImprintTier, string>;
  echoMemory: string;
}

export const ECHO_IMPRINTS: readonly EchoImprintDefinition[] =
  imprintData as EchoImprintDefinition[];

export const ECHO_IMPRINT_MIN_ATTRIBUTE = 4;

export function echoImprintTierFromAttribute(attributeValue: number): EchoImprintTier {
  const v = Math.floor(Number(attributeValue) || 0);
  if (v >= 20) return 20;
  if (v >= 16) return 16;
  if (v >= 12) return 12;
  if (v >= 8) return 8;
  return 4;
}

export function findEchoImprint(id: string): EchoImprintDefinition | undefined {
  return ECHO_IMPRINTS.find((e) => e.id === id);
}

export function echoImprintsForAttribute(attribute: EchoImprintAttribute): EchoImprintDefinition[] {
  return ECHO_IMPRINTS.filter((e) => e.attribute === attribute);
}

export interface EchoImprintSelectionValidation {
  ok: boolean;
  errors: string[];
}

export function validateEchoImprintSelections(opts: {
  selectedIds: string[];
  masteryRank: number;
  attributes: Partial<Record<EchoImprintAttribute, number>>;
}): EchoImprintSelectionValidation {
  const errors: string[] = [];
  const mr = Math.max(1, Math.floor(Number(opts.masteryRank) || 1));
  const ids = [...new Set((opts.selectedIds || []).map(String).filter(Boolean))];
  if (ids.length > mr) {
    errors.push(`At most ${mr} Echo Imprint(s) at Mastery Rank ${mr}.`);
  }
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      errors.push(`Duplicate Echo Imprint: ${id}.`);
      continue;
    }
    seen.add(id);
    const def = findEchoImprint(id);
    if (!def) {
      errors.push(`Unknown Echo Imprint: ${id}.`);
      continue;
    }
    const attrVal = Math.floor(Number(opts.attributes[def.attribute]) || 0);
    if (attrVal < ECHO_IMPRINT_MIN_ATTRIBUTE) {
      errors.push(`${def.name} requires ${def.attribute} ${ECHO_IMPRINT_MIN_ATTRIBUTE}+ (have ${attrVal}).`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function resolveEchoImprintUse(id: string, attributeValue: number): {
  definition: EchoImprintDefinition;
  tier: EchoImprintTier;
  effect: string;
  echoMemory: string;
} | null {
  const definition = findEchoImprint(id);
  if (!definition) return null;
  const tier = echoImprintTierFromAttribute(attributeValue);
  return {
    definition,
    tier,
    effect: definition.tiers[tier],
    echoMemory: definition.echoMemory,
  };
}

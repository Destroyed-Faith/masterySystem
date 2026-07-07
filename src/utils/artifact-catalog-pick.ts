/**
 * Catalog Power picks in the Artifact Node Editor — templates that need a
 * chosen Special (Persistent Zone, Special Auras, etc.).
 */

import type { ActiveSpecialTier } from '../types/item.js';
import { getTemplate } from './powers/index.js';
import { getEffect, getEffectBaseName } from './special-effects.js';
import { getEligibleSpecialsForTier } from './powers/templates/_specials.js';
import {
  isMartialDeliveryPickId,
  listMartialDamageSpecialOptions,
  parseMartialDeliveryPickId,
} from './artifact-power-pick.js';

export interface CatalogSpecialOption {
  key: string;
  label: string;
  description: string;
  tier?: ActiveSpecialTier;
}

/** Fixed Special choices for Active Buff aura templates (no SPECIAL placeholder row). */
const SPECIAL_AURA_OPTIONS: Record<string, readonly string[]> = {
  'ab-special-aura-start-3': ['blight', 'regeneration'],
  'ab-special-aura-start-4': ['lacerate', 'slow', 'ruin', 'mark'],
  'ab-special-aura-start-5': ['weaken'],
  'ab-special-aura-start-6': ['corrode', 'disrupt', 'soulburn', 'hex', 'sundered'],
};

function tierFromTemplateId(templateId: string): ActiveSpecialTier | undefined {
  const m = /-t([3456])$/.exec(templateId);
  if (!m) return undefined;
  return Number(m[1]) as ActiveSpecialTier;
}

function templateHasSpecialPlaceholder(templateId: string): boolean {
  const tpl = getTemplate(templateId);
  if (!tpl?.levels) return false;
  for (const lr of Object.values(tpl.levels)) {
    if ((lr.specials || []).some((s) => s.key === 'SPECIAL')) return true;
  }
  return false;
}

/** True when the GM must pick which Special this catalog template applies. */
export function catalogTemplateRequiresSpecial(templateId: string): boolean {
  const id = String(templateId || '').trim();
  if (!id) return false;
  if (isMartialDeliveryPickId(id)) return true;
  if (SPECIAL_AURA_OPTIONS[id]) return true;
  const tpl = getTemplate(id);
  if (tpl?.specialSlot) return true;
  return templateHasSpecialPlaceholder(id);
}

/** Eligible Special keys for a catalog template (empty if none required). */
export function catalogSpecialKeysForTemplate(templateId: string): string[] {
  const id = String(templateId || '').trim();
  if (!id) return [];
  if (isMartialDeliveryPickId(id)) {
    return listMartialDamageSpecialOptions().map((o) => o.key);
  }
  if (SPECIAL_AURA_OPTIONS[id]) return [...SPECIAL_AURA_OPTIONS[id]];
  const tpl = getTemplate(id);
  if (tpl?.specialSlot?.eligibleSpecialKeys?.length) {
    return [...tpl.specialSlot.eligibleSpecialKeys];
  }
  const tier = tierFromTemplateId(id);
  if (tier && templateHasSpecialPlaceholder(id)) {
    return [...getEligibleSpecialsForTier(tier)];
  }
  return [];
}

export function catalogSpecialTierForTemplate(templateId: string): ActiveSpecialTier | undefined {
  const id = String(templateId || '').trim();
  const tpl = getTemplate(id);
  if (tpl?.specialSlot?.tier) return tpl.specialSlot.tier;
  if (SPECIAL_AURA_OPTIONS[id]) {
    const m = /start-(\d)/.exec(id);
    if (m) return Number(m[1]) as ActiveSpecialTier;
  }
  return tierFromTemplateId(id);
}

export function listCatalogSpecialOptions(templateId: string): CatalogSpecialOption[] {
  const delivery = parseMartialDeliveryPickId(templateId);
  if (delivery) {
    return listMartialDamageSpecialOptions().map((o) => ({
      key: o.key,
      tier: o.tier,
      label: o.label,
      description: o.description,
    }));
  }

  const tier = catalogSpecialTierForTemplate(templateId);
  return catalogSpecialKeysForTemplate(templateId).map((key) => {
    const ef = getEffect(key);
    return {
      key,
      tier,
      label: ef ? getEffectBaseName(ef.name) : key,
      description: ef?.description?.trim() || '',
    };
  });
}

export function catalogPowerRowLabel(templateName: string, specialKey: string): string {
  const ef = getEffect(specialKey);
  const specialLabel = ef ? getEffectBaseName(ef.name) : specialKey;
  return `${templateName} (${specialLabel})`;
}

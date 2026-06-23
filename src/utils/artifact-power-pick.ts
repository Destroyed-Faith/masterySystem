/**
 * Special-first martial damage picks for the Artifact Node Editor.
 *
 * Delivery form + Special → tier (from Special eligibility) → existing tier template.
 */

import type { ActiveSpecialTier, ArtifactProgressionPick } from '../types/item.js';
import {
  getEligibleSpecialsForTier,
} from './powers/templates/_specials.js';
import { getEffect, getEffectBaseName } from './special-effects.js';

export type MartialDelivery = 'melee-single' | 'melee-aoe' | 'ranged-single' | 'ranged-aoe';

/** Matches `active-{melee|ranged}-{damage|aoe-damage}-t{3|4|5|6}`. */
export const MARTIAL_DAMAGE_TEMPLATE_RE =
  /^active-(melee|ranged)-(damage|aoe-damage)-t([3456])$/;

export const MARTIAL_DELIVERY_OPTIONS: { value: MartialDelivery; label: string }[] = [
  { value: 'melee-single', label: 'Melee — Single Target Special Damage' },
  { value: 'melee-aoe', label: 'Melee — AoE Special Damage' },
  { value: 'ranged-single', label: 'Ranged — Single Target Special Damage' },
  { value: 'ranged-aoe', label: 'Ranged — AoE Special Damage' },
];

/** Prefix for martial delivery rows in the Active catalog dropdown. */
export const MARTIAL_PICK_PREFIX = 'martial:';

export function martialDeliveryPickId(delivery: MartialDelivery): string {
  return `${MARTIAL_PICK_PREFIX}${delivery}`;
}

export function isMartialDeliveryPickId(id: string): boolean {
  return String(id || '').startsWith(MARTIAL_PICK_PREFIX);
}

export function parseMartialDeliveryPickId(id: string): MartialDelivery | undefined {
  const v = String(id || '').slice(MARTIAL_PICK_PREFIX.length) as MartialDelivery;
  return MARTIAL_DELIVERY_OPTIONS.some((o) => o.value === v) ? v : undefined;
}

/** Martial delivery forms as Active-dropdown entries (delivery + Special picker). */
export function martialDeliveryCatalogOptions(): { id: string; name: string }[] {
  return MARTIAL_DELIVERY_OPTIONS.map((o) => ({
    id: martialDeliveryPickId(o.value),
    name: o.label,
  }));
}

const DELIVERY_SHORT_LABEL: Record<MartialDelivery, string> = {
  'melee-single': 'Melee Special Damage',
  'melee-aoe': 'Melee AoE Special Damage',
  'ranged-single': 'Ranged Special Damage',
  'ranged-aoe': 'Ranged AoE Special Damage',
};

/** Derive damage tier from Special eligibility lists (T3–T6). */
export function tierFromSpecialKey(key: string): ActiveSpecialTier | undefined {
  const k = String(key || '').trim();
  if (!k) return undefined;
  for (const tier of [3, 4, 5, 6] as const) {
    if (getEligibleSpecialsForTier(tier).includes(k)) return tier;
  }
  return undefined;
}

export function isMartialDamageTemplateId(templateId: string): boolean {
  return MARTIAL_DAMAGE_TEMPLATE_RE.test(String(templateId || '').trim());
}

/** Parse delivery + tier from a martial damage template id. */
export function parseMartialDamageTemplateId(templateId: string): {
  delivery: MartialDelivery;
  tier: ActiveSpecialTier;
} | undefined {
  const m = MARTIAL_DAMAGE_TEMPLATE_RE.exec(String(templateId || '').trim());
  if (!m) return undefined;
  const range = m[1] as 'melee' | 'ranged';
  const scope = m[2] === 'aoe-damage' ? 'aoe' : 'single';
  const tier = Number(m[3]) as ActiveSpecialTier;
  const delivery = `${range}-${scope}` as MartialDelivery;
  return { delivery, tier };
}

export function templateIdForDeliveryAndTier(
  delivery: MartialDelivery,
  tier: ActiveSpecialTier,
): string {
  const [range, scope] = delivery.split('-') as ['melee' | 'ranged', 'single' | 'aoe'];
  const damagePart = scope === 'aoe' ? 'aoe-damage' : 'damage';
  return `active-${range}-${damagePart}-t${tier}`;
}

export function resolvePickFromUi(
  delivery: MartialDelivery,
  specialKey: string,
): Pick<ArtifactProgressionPick, 'powerTemplateId' | 'delivery' | 'chosenSpecial'> {
  const tier = tierFromSpecialKey(specialKey);
  if (!tier) {
    throw new Error(`Unknown martial damage Special: ${specialKey}`);
  }
  return {
    delivery,
    powerTemplateId: templateIdForDeliveryAndTier(delivery, tier),
    chosenSpecial: { key: specialKey, tier },
  };
}

export function artifactPowerRowLabel(delivery: MartialDelivery, specialKey: string): string {
  const base = DELIVERY_SHORT_LABEL[delivery];
  const ef = getEffect(specialKey);
  const specialLabel = ef ? getEffectBaseName(ef.name) : specialKey;
  return `${base} (${specialLabel})`;
}

export function listMartialDamageSpecialOptions(): {
  key: string;
  label: string;
  description: string;
  tier: ActiveSpecialTier;
}[] {
  const out: {
    key: string;
    label: string;
    description: string;
    tier: ActiveSpecialTier;
  }[] = [];
  for (const tier of [3, 4, 5, 6] as const) {
    for (const key of getEligibleSpecialsForTier(tier)) {
      const ef = getEffect(key);
      out.push({
        key,
        tier,
        label: ef ? getEffectBaseName(ef.name) : key,
        description: ef?.description?.trim() || '',
      });
    }
  }
  return out;
}

/** Reconstruct UI fields from a stored pick (incl. legacy template-only picks). */
export function parseLegacyPick(pick: ArtifactProgressionPick): {
  delivery: MartialDelivery | '';
  specialKey: string;
  isLegacyNonMartial: boolean;
  needsSpecial: boolean;
} {
  const tid = String(pick.powerTemplateId || '').trim();

  if (pick.delivery) {
    return {
      delivery: pick.delivery,
      specialKey: pick.chosenSpecial?.key || '',
      isLegacyNonMartial: false,
      needsSpecial: !pick.chosenSpecial?.key,
    };
  }

  const parsed = tid ? parseMartialDamageTemplateId(tid) : undefined;
  if (parsed) {
    return {
      delivery: parsed.delivery,
      specialKey: pick.chosenSpecial?.key || '',
      isLegacyNonMartial: false,
      needsSpecial: !pick.chosenSpecial?.key,
    };
  }

  return {
    delivery: '',
    specialKey: '',
    isLegacyNonMartial: !!tid,
    needsSpecial: false,
  };
}

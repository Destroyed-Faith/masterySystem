/**
 * Special-first martial damage picks for the Artifact Node Editor.
 *
 * Delivery form + Special → tier (from Special eligibility) → existing tier template.
 */
import { getEligibleSpecialsForTier, } from './powers/templates/_specials.js';
import { getEffect, getEffectBaseName } from './special-effects.js';
/** Matches `active-{melee|ranged}-{damage|aoe-damage}-t{3|4|5|6}`. */
export const MARTIAL_DAMAGE_TEMPLATE_RE = /^active-(melee|ranged)-(damage|aoe-damage)-t([3456])$/;
export const MARTIAL_DELIVERY_OPTIONS = [
    { value: 'melee-single', label: 'Melee — Single Target Special Damage' },
    { value: 'melee-aoe', label: 'Melee — AoE Special Damage' },
    { value: 'ranged-single', label: 'Ranged — Single Target Special Damage' },
    { value: 'ranged-aoe', label: 'Ranged — AoE Special Damage' },
];
const DELIVERY_SHORT_LABEL = {
    'melee-single': 'Melee Special Damage',
    'melee-aoe': 'Melee AoE Special Damage',
    'ranged-single': 'Ranged Special Damage',
    'ranged-aoe': 'Ranged AoE Special Damage',
};
/** Derive damage tier from Special eligibility lists (T3–T6). */
export function tierFromSpecialKey(key) {
    const k = String(key || '').trim();
    if (!k)
        return undefined;
    for (const tier of [3, 4, 5, 6]) {
        if (getEligibleSpecialsForTier(tier).includes(k))
            return tier;
    }
    return undefined;
}
export function isMartialDamageTemplateId(templateId) {
    return MARTIAL_DAMAGE_TEMPLATE_RE.test(String(templateId || '').trim());
}
/** Parse delivery + tier from a martial damage template id. */
export function parseMartialDamageTemplateId(templateId) {
    const m = MARTIAL_DAMAGE_TEMPLATE_RE.exec(String(templateId || '').trim());
    if (!m)
        return undefined;
    const range = m[1];
    const scope = m[2] === 'aoe-damage' ? 'aoe' : 'single';
    const tier = Number(m[3]);
    const delivery = `${range}-${scope}`;
    return { delivery, tier };
}
export function templateIdForDeliveryAndTier(delivery, tier) {
    const [range, scope] = delivery.split('-');
    const damagePart = scope === 'aoe' ? 'aoe-damage' : 'damage';
    return `active-${range}-${damagePart}-t${tier}`;
}
export function resolvePickFromUi(delivery, specialKey) {
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
export function artifactPowerRowLabel(delivery, specialKey) {
    const base = DELIVERY_SHORT_LABEL[delivery];
    const ef = getEffect(specialKey);
    const specialLabel = ef ? getEffectBaseName(ef.name) : specialKey;
    return `${base} (${specialLabel})`;
}
export function listMartialDamageSpecialOptions() {
    const out = [];
    for (const tier of [3, 4, 5, 6]) {
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
export function parseLegacyPick(pick) {
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
//# sourceMappingURL=artifact-power-pick.js.map
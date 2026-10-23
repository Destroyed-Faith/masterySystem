/**
 * Echo Imprints — 28 catalogue entries, tiers 4/8/12/16/20.
 * Replaces Minor Expressions. Selection costs no Stones / XP / charges.
 */
import imprintData from './data/echo-imprints.json.js';
export const ECHO_IMPRINT_TIERS = [4, 8, 12, 16, 20];
export const ECHO_IMPRINTS = imprintData;
export const ECHO_IMPRINT_MIN_ATTRIBUTE = 4;
export function echoImprintTierFromAttribute(attributeValue) {
    const v = Math.floor(Number(attributeValue) || 0);
    if (v >= 20)
        return 20;
    if (v >= 16)
        return 16;
    if (v >= 12)
        return 12;
    if (v >= 8)
        return 8;
    return 4;
}
export function findEchoImprint(id) {
    return ECHO_IMPRINTS.find((e) => e.id === id);
}
export function echoImprintsForAttribute(attribute) {
    return ECHO_IMPRINTS.filter((e) => e.attribute === attribute);
}
export function validateEchoImprintSelections(opts) {
    const errors = [];
    const mr = Math.max(1, Math.floor(Number(opts.masteryRank) || 1));
    const ids = [...new Set((opts.selectedIds || []).map(String).filter(Boolean))];
    if (ids.length > mr) {
        errors.push(`At most ${mr} Echo Imprint(s) at Mastery Rank ${mr}.`);
    }
    const seen = new Set();
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
export function resolveEchoImprintUse(id, attributeValue) {
    const definition = findEchoImprint(id);
    if (!definition)
        return null;
    const tier = echoImprintTierFromAttribute(attributeValue);
    return {
        definition,
        tier,
        effect: definition.tiers[tier],
        echoMemory: definition.echoMemory,
    };
}
//# sourceMappingURL=echo-imprints.js.map
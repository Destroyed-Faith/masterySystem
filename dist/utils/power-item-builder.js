/**
 * Shared utilities for building embedded power Items from catalog entries.
 */
import { renderRange, renderAoe, renderDuration } from './power-rendering.js';
import { actorAlreadyHasPower, activeTemplateCanBeSpell, findCatalogEntry, } from './power-catalog.js';
/** Build the full item data object for `actor.createEmbeddedDocuments`. */
export function buildPowerItemFromCatalogEntry(entry, rank, spell = { isSpell: false }) {
    const template = entry.raw;
    const chosenSpecial = entry.chosenSpecial
        ? { key: entry.chosenSpecial.key, tier: entry.chosenSpecial.tier }
        : undefined;
    const levelKey = String(rank);
    const levelRow = template.levels?.[levelKey];
    if (!levelRow) {
        return null;
    }
    let levels = template.levels;
    if (chosenSpecial) {
        const next = {};
        for (const [k, row] of Object.entries(template.levels)) {
            const specials = (row.specials || []).map((s) => s.key === 'SPECIAL' ? { ...s, key: chosenSpecial.key } : s);
            next[k] = { ...row, specials };
        }
        levels = next;
    }
    return {
        name: entry.name,
        type: 'power',
        system: {
            category: template.category,
            tags: template.tags || [],
            rank,
            level: rank,
            minLevel: rank,
            fluff: template.fluff || '',
            description: template.fluff || '',
            trigger: template.trigger || levelRow.trigger || undefined,
            cost: {
                action: template.cost?.action,
                stones: template.cost?.stones || 0,
                charges: template.cost?.charges || 0,
            },
            roll: {
                kind: template.roll?.kind,
                attribute: template.roll?.attribute || undefined,
                vs: template.roll?.vs || undefined,
            },
            levels,
            templateId: entry.templateId,
            templateName: entry.templateName,
            subfamily: entry.subfamily,
            chosenSpecial,
            isSpell: spell.isSpell,
            castingAttribute: spell.castingAttribute,
            spellResolution: spell.isSpell ? 'spellAttack' : spell.spellResolution,
            powerType: template.category === 'activeBuff' ? 'buff' : template.category,
            range: renderRange(levelRow.range),
            aoe: renderAoe(levelRow.aoe),
            duration: renderDuration(levelRow.duration),
            effect: levelRow.effect?.text || '',
            specials: (levelRow.specials || []).map((s) => s.rank !== undefined ? `${s.key}(${s.rank})` : s.key),
            ap: 30,
        },
    };
}
export function resolveGrantSpecEntry(spec) {
    return findCatalogEntry(spec.templateId, spec.special ?? null);
}
/** Batch-create power items from grant specs. Skips duplicates already on actor. */
export async function grantPowerSpecs(actor, specs) {
    const existing = actor.items.filter((i) => i.type === 'power');
    const itemDataList = [];
    for (const spec of specs) {
        const entry = resolveGrantSpecEntry(spec);
        if (!entry) {
            throw new Error(`Catalog entry not found: ${spec.templateId}${spec.special ? ` (${spec.special})` : ''}`);
        }
        if (actorAlreadyHasPower(existing, entry))
            continue;
        const canSpell = activeTemplateCanBeSpell(entry.templateId);
        const itemData = buildPowerItemFromCatalogEntry(entry, spec.rank, {
            isSpell: canSpell && !!spec.isSpell,
            castingAttribute: canSpell ? spec.castingAttribute : undefined,
            spellResolution: canSpell ? spec.spellResolution : undefined,
        });
        if (!itemData) {
            throw new Error(`Rank ${spec.rank} data not found for ${entry.name}`);
        }
        itemDataList.push(itemData);
    }
    if (itemDataList.length === 0)
        return 0;
    await actor.createEmbeddedDocuments('Item', itemDataList);
    return itemDataList.length;
}
//# sourceMappingURL=power-item-builder.js.map
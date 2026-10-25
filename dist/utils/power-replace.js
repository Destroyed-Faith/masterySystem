/**
 * GM power replace — swap one embedded Power for another of the same
 * category and level, preserving XP provenance (starting / GM / purchased).
 */
import { CATEGORY_LABELS, actorAlreadyHasPower, activeTemplateCanBeSpell, canLearnAnotherSpeciallessSpell, countSpeciallessSpells, powerHasConfiguredSpecial, resolvePowerCategoryFromItem, } from './power-catalog.js';
import { buildPowerItemFromCatalogEntry } from './power-item-builder.js';
import { getRulesMasteryRank } from './mastery-rank-sync.js';
import { readPowerFavorites, writePowerFavorites } from '../ui/power-favorites.js';
function readMsFlag(item, key) {
    try {
        if (typeof item.getFlag === 'function' && item.getFlag('mastery-system', key) === true) {
            return true;
        }
    }
    catch {
        /* optional */
    }
    return item.flags?.['mastery-system']?.[key] === true;
}
/** Artifact / Echo-bound powers are not catalog-replaceable. */
export function isNonReplaceableGrantedPower(item) {
    if (readMsFlag(item, 'fromArtifact') || readMsFlag(item, 'artifactGranted') || readMsFlag(item, 'echoBound')) {
        return true;
    }
    const sys = item.system ?? {};
    return sys.fromArtifact === true || sys.artifactGranted === true || sys.echoBound === true;
}
export function readPowerProvenanceFlags(item) {
    const provenance = {};
    if (readMsFlag(item, 'startingPower'))
        provenance.startingPower = true;
    if (readMsFlag(item, 'gmGranted'))
        provenance.gmGranted = true;
    if (readMsFlag(item, 'xpPurchased'))
        provenance.xpPurchased = true;
    return provenance;
}
export function powerReplaceLevel(item) {
    const lvl = Number(item.system?.level ?? item.system?.rank ?? 1);
    return Math.max(1, Math.floor(Number.isFinite(lvl) ? lvl : 1));
}
export function powerReplaceMinLevel(item, level) {
    const raw = item.system?.minLevel;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1) {
        return Math.min(Math.floor(raw), level);
    }
    return level;
}
export function describePowerReplaceConstraints(item) {
    const category = resolvePowerCategoryFromItem(item);
    if (!category)
        return null;
    const level = powerReplaceLevel(item);
    return {
        category,
        categoryLabel: CATEGORY_LABELS[category],
        level,
    };
}
/**
 * Build replacement item data at the same level, copying provenance and
 * sheet toggles. Does not touch XP.
 */
export function planPowerReplace(oldItem, entry, spell = { isSpell: false }) {
    const constraints = describePowerReplaceConstraints(oldItem);
    if (!constraints) {
        return { error: 'Could not determine this power’s category.' };
    }
    if (entry.category !== constraints.category) {
        return {
            error: `Replacement must be the same category (${constraints.categoryLabel}).`,
        };
    }
    if (isNonReplaceableGrantedPower(oldItem)) {
        return { error: 'Artifact- or Echo-granted powers cannot be catalog-replaced.' };
    }
    const level = constraints.level;
    const itemData = buildPowerItemFromCatalogEntry(entry, level, spell);
    if (!itemData) {
        return {
            error: `"${entry.name}" has no Rank ${level} row — cannot keep the same power level.`,
        };
    }
    const minLevel = powerReplaceMinLevel(oldItem, level);
    const provenance = readPowerProvenanceFlags(oldItem);
    const sys = itemData.system;
    sys.level = level;
    sys.rank = level;
    sys.minLevel = minLevel;
    if (oldItem.system?.showInRadialMenu === false) {
        sys.showInRadialMenu = false;
    }
    if (Object.keys(provenance).length) {
        itemData.flags = {
            ...(itemData.flags || {}),
            'mastery-system': {
                ...(itemData.flags?.['mastery-system'] || {}),
                ...provenance,
            },
        };
    }
    return {
        category: constraints.category,
        level,
        minLevel,
        provenance,
        showInRadialMenu: oldItem.system?.showInRadialMenu,
        itemData,
    };
}
/**
 * Delete the old power and create the replacement. Remaps combat-carousel
 * favorites. Never adjusts XP pools.
 */
export async function applyPowerReplace(actor, oldItem, entry, spell) {
    const { assertProgressionEditable } = await import('../sheets/actor-sheet-identity.js');
    if (!assertProgressionEditable(actor)) {
        return { ok: false, error: 'Progression locked on unlinked token.' };
    }
    const existing = actor.items.filter((i) => i.type === 'power' && i.id !== oldItem.id);
    if (actorAlreadyHasPower(existing, entry)) {
        const specialSuffix = entry.chosenSpecial?.key ? ` (${entry.chosenSpecial.key})` : '';
        return {
            ok: false,
            error: `Already have "${entry.templateName}"${specialSuffix} on this character.`,
        };
    }
    const asSpell = !!spell.isSpell && activeTemplateCanBeSpell(entry.templateId);
    if (asSpell && !powerHasConfiguredSpecial(entry)) {
        const masteryRank = getRulesMasteryRank(actor);
        const list = actor.items.filter((i) => i.type === 'power' && i.id !== oldItem.id);
        if (!canLearnAnotherSpeciallessSpell(countSpeciallessSpells(list), masteryRank)) {
            return {
                ok: false,
                error: `Spell Powers without a Special are limited to Mastery Rank (${masteryRank}).`,
            };
        }
    }
    const plan = planPowerReplace(oldItem, entry, {
        isSpell: asSpell,
        castingAttribute: asSpell ? spell.castingAttribute : undefined,
        spellResolution: asSpell ? (spell.spellResolution ?? 'spellAttack') : undefined,
    });
    if ('error' in plan) {
        return { ok: false, error: plan.error };
    }
    const oldId = oldItem.id;
    const oldName = String(oldItem.name || 'Power');
    const wasFavorite = readPowerFavorites(actor).includes(oldId);
    if (typeof oldItem.delete === 'function') {
        await oldItem.delete();
    }
    else {
        await actor.deleteEmbeddedDocuments('Item', [oldId]);
    }
    const created = await actor.createEmbeddedDocuments('Item', [plan.itemData]);
    const newItem = Array.isArray(created) ? created[0] : created;
    const newItemId = String(newItem?.id || '');
    if (!newItemId) {
        return { ok: false, error: 'Replacement was created but no item id was returned.' };
    }
    if (wasFavorite) {
        const favs = readPowerFavorites(actor).filter((id) => id !== oldId);
        if (!favs.includes(newItemId))
            favs.push(newItemId);
        await writePowerFavorites(actor, favs);
    }
    else {
        const favs = readPowerFavorites(actor);
        if (favs.includes(oldId)) {
            await writePowerFavorites(actor, favs.map((id) => (id === oldId ? newItemId : id)));
        }
    }
    return {
        ok: true,
        newItemId,
        oldName,
        newName: entry.name,
        level: plan.level,
        categoryLabel: CATEGORY_LABELS[plan.category],
    };
}
//# sourceMappingURL=power-replace.js.map
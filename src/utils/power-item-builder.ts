/**
 * Shared utilities for building embedded power Items from catalog entries.
 */

import type {
    CastingAttribute,
    ChosenSpecial,
    EmbeddedPowerData,
    PowerLevelKey,
    PowerSpecial,
    SpellResolution,
} from '../types/item.js';
import { renderRange, renderAoe, renderDuration } from './power-rendering.js';
import { masteryRankFromLifetimeXp } from './mastery-rank-sync.js';
import { SPECIAL_EFFECTS_BY_ID } from './special-effects.js';
import { bindPoolSpecialsOnRow } from './powers/pool-special-ranks.js';
import {
    actorAlreadyHasPower,
    activeTemplateCanBeSpell,
    canLearnAnotherSpeciallessSpell,
    countSpeciallessSpells,
    findCatalogEntry,
    powerHasConfiguredSpecial,
    type CatalogEntry,
} from './power-catalog.js';
import type { PowerTemplate } from './powers/templates/index.js';

export type { CatalogEntry };

export interface PowerGrantSpec {
    templateId: string;
    special?: string | null;
    rank: number;
    isSpell?: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}

export interface PowerSpellOptions {
    isSpell: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}

/** Build the full item data object for `actor.createEmbeddedDocuments`. */
export function buildPowerItemFromCatalogEntry(
    entry: CatalogEntry,
    rank: number,
    spell: PowerSpellOptions = { isSpell: false },
): Record<string, unknown> | null {
    const template = entry.raw as EmbeddedPowerData;
    const chosenSpecial: ChosenSpecial | undefined = entry.chosenSpecial
        ? { key: entry.chosenSpecial.key, tier: entry.chosenSpecial.tier }
        : undefined;

    const levelKey = String(rank) as PowerLevelKey;
    const levelRow = template.levels?.[levelKey];
    if (!levelRow) {
        return null;
    }

    let levels: Record<PowerLevelKey, unknown> = template.levels;
    if (chosenSpecial) {
        const next: Record<string, unknown> = {};
        for (const [k, row] of Object.entries(template.levels)) {
            next[k] = bindPoolSpecialsOnRow(
                row as { specials?: PowerSpecial[]; effect?: { text?: string } },
                chosenSpecial.key,
                template.templateId,
                Number(k),
            );
        }
        levels = next as Record<PowerLevelKey, unknown>;
    }

    /* PG Spell Design Rule: the `spell` tag marks an actual Spell. Items only
     * carry it when converted (isSpell) or inherently mental (always resolved
     * as Spells). Template-level 'spell' tags just mean "convertible". */
    const baseTags = template.tags || [];
    const isMental = baseTags.includes('mental');
    const itemTags = spell.isSpell || isMental
        ? baseTags
        : baseTags.filter((t: string) => t !== 'spell');

    return {
        name: entry.name,
        type: 'power',
        system: {
            category: template.category,
            tags: itemTags,
            rank,
            level: rank,
            minLevel: rank,
            fluff: template.fluff || '',
            description: template.fluff || '',
            trigger: template.trigger || (levelRow as { trigger?: string }).trigger || undefined,
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
            specials: (levelRow.specials || []).map((s: PowerSpecial) =>
                s.rank !== undefined ? `${s.key}(${s.rank})` : s.key,
            ),
            ap: 30,
        },
    };
}

export function resolveGrantSpecEntry(spec: PowerGrantSpec): CatalogEntry | null {
    return findCatalogEntry(spec.templateId, spec.special ?? null);
}

/** Batch-create power items from grant specs. Skips duplicates already on actor. */
export async function grantPowerSpecs(actor: Actor, specs: PowerGrantSpec[]): Promise<number> {
    const existing = (actor as any).items.filter((i: any) => i.type === 'power');
    const itemDataList: Record<string, unknown>[] = [];
    const lifetimeXp = (actor as any).system?.progression?.lifetimeXp;
    const masteryRank = lifetimeXp == null
        ? Math.max(1, Math.floor(Number((actor as any).system?.mastery?.rank) || 2))
        : masteryRankFromLifetimeXp(Number(lifetimeXp) || 0);
    let specialless = countSpeciallessSpells(existing);

    for (const spec of specs) {
        const entry = resolveGrantSpecEntry(spec);
        if (!entry) {
            throw new Error(`Catalog entry not found: ${spec.templateId}${spec.special ? ` (${spec.special})` : ''}`);
        }
        if (actorAlreadyHasPower(existing, entry)) continue;

        const canSpell = activeTemplateCanBeSpell(entry.templateId);
        const asSpell = canSpell && !!spec.isSpell;
        if (asSpell && !powerHasConfiguredSpecial({ special: spec.special, chosenSpecial: entry.chosenSpecial })) {
            if (!canLearnAnotherSpeciallessSpell(specialless, masteryRank)) {
                throw new Error(`Spell Powers without a Special are limited to Mastery Rank (${masteryRank}).`);
            }
            specialless += 1;
        }
        const itemData = buildPowerItemFromCatalogEntry(entry, spec.rank, {
            isSpell: asSpell,
        castingAttribute: canSpell ? spec.castingAttribute : undefined,
        spellResolution: canSpell ? spec.spellResolution : undefined,
    });
        if (!itemData) {
            throw new Error(`Rank ${spec.rank} data not found for ${entry.name}`);
        }
        itemDataList.push(itemData);
    }

    if (itemDataList.length === 0) return 0;
    await (actor as any).createEmbeddedDocuments('Item', itemDataList);
    return itemDataList.length;
}

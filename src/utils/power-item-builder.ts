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
    SpellSaveType,
} from '../types/item.js';
import { renderRange, renderAoe, renderDuration } from './power-rendering.js';
import { SPECIAL_EFFECTS_BY_ID } from './special-effects.js';
import {
    actorAlreadyHasPower,
    findCatalogEntry,
    findTemplateById,
    type CatalogEntry,
} from './power-catalog.js';
import type { PowerTemplate } from './powers/templates/index.js';
import { resolveSpellSaveTypeForEntry } from './spell-save-type.js';

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
    const templateDoc = findTemplateById(entry.templateId);
    let spellSaveType: SpellSaveType | undefined;
    if (spell.isSpell && spell.spellResolution === 'saveSpell') {
        spellSaveType = resolveSpellSaveTypeForEntry(entry, templateDoc);
    }
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
            const specials = (row.specials || []).map((s: PowerSpecial) =>
                s.key === 'SPECIAL' ? { ...s, key: chosenSpecial.key } : s,
            );
            next[k] = { ...row, specials };
        }
        levels = next as Record<PowerLevelKey, unknown>;
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
            spellResolution: spell.spellResolution,
            spellSaveType,
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

    for (const spec of specs) {
        const entry = resolveGrantSpecEntry(spec);
        if (!entry) {
            throw new Error(`Catalog entry not found: ${spec.templateId}${spec.special ? ` (${spec.special})` : ''}`);
        }
        if (actorAlreadyHasPower(existing, entry)) continue;

        const itemData = buildPowerItemFromCatalogEntry(entry, spec.rank, {
            isSpell: !!spec.isSpell,
            castingAttribute: spec.castingAttribute,
            spellResolution: spec.spellResolution,
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

/**
 * Shared types & helpers for Power Templates.
 *
 * A Power Template is the canonical, catalog-level definition of a Power.
 * It lives here (fully authored, 16 Levels) and is expanded into one or more
 * CatalogEntries at runtime (Actives with a specialSlot get expanded per
 * eligible Special, cf. plan §5).
 */

import type {
    EmbeddedPowerData,
    PowerCategory,
    PowerLevelKey,
    PowerLevelRow,
    PowerMechanics,
    RangeSpec,
    AoeSpec,
    DurationSpec,
    EffectSpec,
    PowerSpecial,
    SpellHints,
    ActiveSpecialSlot,
} from '../../../types/item.js';

import { POWER_LEVEL_KEYS } from '../../../types/power-levels.js';

/** A Power Template is an EmbeddedPowerData that is the SoT for the catalog.
 *  All 16 level rows are mandatory. */
export interface PowerTemplate extends EmbeddedPowerData {
    templateId: string;
    templateName: string;
    subfamily: string;
    category: PowerCategory;
    levels: Record<PowerLevelKey, PowerLevelRow>;
    spellHints?: SpellHints;
    specialSlot?: ActiveSpecialSlot;
}

/** Build a fully-populated 16-level levels record from a factory callback. */
export function buildLevels(factory: (level: number) => PowerLevelRow): Record<PowerLevelKey, PowerLevelRow> {
    const out = {} as Record<PowerLevelKey, PowerLevelRow>;
    for (let i = 1; i <= 16; i++) {
        out[String(i) as PowerLevelKey] = { lvl: i, ...factory(i) };
    }
    return out;
}

/** Helper for Movement templates: identical shape per level, distance varies. */
export function movementRow(distanceM: number, effectText: string): PowerLevelRow {
    return {
        type: 'Movement',
        range: { kind: 'self' },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: effectText },
        specials: [],
        mechanics: { movementBonus: distanceM, applyWhen: 'manual', duration: 'instant' },
    };
}

/** Helper for Reaction templates: self-target, reaction-gated mechanics. */
export function reactionRow(partial: {
    type?: string;
    effectText: string;
    specials?: PowerSpecial[];
    mechanics?: Partial<PowerMechanics>;
    range?: RangeSpec | null;
    aoe?: AoeSpec | null;
    duration?: DurationSpec;
}): PowerLevelRow {
    return {
        type: partial.type ?? 'Reaction',
        range: partial.range ?? { kind: 'self' },
        aoe: partial.aoe ?? { shape: 'none' },
        duration: partial.duration ?? { kind: 'instant' },
        effect: { text: partial.effectText } as EffectSpec,
        specials: partial.specials ?? [],
        mechanics: {
            applyWhen: 'reaction-once-per-round',
            duration: 'instant',
            ...(partial.mechanics || {}),
        } as PowerMechanics,
    };
}

/** Helper for Active-Buff templates: self/aura, activeBuff-active mechanics. */
export function activeBuffRow(partial: {
    type?: string;
    effectText: string;
    specials?: PowerSpecial[];
    mechanics?: Partial<PowerMechanics>;
    range?: RangeSpec | null;
    aoe?: AoeSpec | null;
    duration?: DurationSpec;
}): PowerLevelRow {
    return {
        type: partial.type ?? 'Active Buff',
        range: partial.range ?? { kind: 'self' },
        aoe: partial.aoe ?? { shape: 'none' },
        duration: partial.duration ?? { kind: 'untilStartOfNextTurn' },
        effect: { text: partial.effectText } as EffectSpec,
        specials: partial.specials ?? [],
        mechanics: {
            applyWhen: 'activeBuff-active',
            duration: 'untilNextTurn',
            ...(partial.mechanics || {}),
        } as PowerMechanics,
    };
}

/** Helper for Passive templates: permanent slot, passive-slotted-active mechanics. */
export function passiveRow(partial: {
    type?: string;
    effectText: string;
    specials?: PowerSpecial[];
    mechanics?: Partial<PowerMechanics>;
    range?: RangeSpec | null;
    aoe?: AoeSpec | null;
    duration?: DurationSpec;
}): PowerLevelRow {
    return {
        type: partial.type ?? 'Passive',
        range: partial.range ?? { kind: 'self' },
        aoe: partial.aoe ?? { shape: 'none' },
        duration: partial.duration ?? { kind: 'scene' },
        effect: { text: partial.effectText } as EffectSpec,
        specials: partial.specials ?? [],
        mechanics: {
            applyWhen: 'passive-slotted-active',
            ...(partial.mechanics || {}),
        } as PowerMechanics,
    };
}

/** Helper for Active templates: attack/ability with template slot. */
export function activeRow(partial: {
    type?: string;
    effectText: string;
    dice?: string;
    specials?: PowerSpecial[];
    mechanics?: Partial<PowerMechanics>;
    range?: RangeSpec | null;
    aoe?: AoeSpec | null;
    duration?: DurationSpec;
}): PowerLevelRow {
    return {
        type: partial.type ?? 'Melee',
        range: partial.range ?? { kind: 'touch' },
        aoe: partial.aoe ?? { shape: 'none' },
        duration: partial.duration ?? { kind: 'instant' },
        effect: { text: partial.effectText, dice: partial.dice } as EffectSpec,
        specials: partial.specials ?? [],
        mechanics: {
            applyWhen: 'attack-rider',
            duration: 'instant',
            ...(partial.mechanics || {}),
        } as PowerMechanics,
    };
}

/** Internal use: re-export level-key array for iteration. */
export { POWER_LEVEL_KEYS };

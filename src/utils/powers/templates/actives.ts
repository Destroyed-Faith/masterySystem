/**
 * Active Power Templates (~46)
 *
 * Source: d:\DestroyedFaith\Powers\Actives.md — Levels 1..16.
 *
 * Categories encoded via subfamily:
 *   damage-single, damage-aoe, persistent-zone, control, support-heal,
 *   support-cleanse, support-dispel, mixed, barrier, hard-control
 *
 * Damage templates (singleg-target + aoe, per tier T3/T4/T5/T6 in melee &
 * ranged flavours) carry a `specialSlot`. The catalog expands each such
 * template into one entry per eligible Special (see _specials.ts and
 * power-catalog.ts buildEntries()).
 *
 * `spellHints` pre-fills Active-as-Spell resolution defaults per subfamily
 * (plan §6.2): damage-single → spellAttack, AoE/zone → saveSpell(Body),
 * hard-control → saveSpell(Mind), support → saveSpell(no save).
 */

import type { PowerTemplate } from './_shared.js';
import { buildLevels, activeRow } from './_shared.js';
import type { ActiveSpecialSlot, ActiveSpecialTier, AoeSpec, RangeSpec, SpellHints } from '../../../types/item.js';
import { getEligibleSpecialsForTier } from './_specials.js';

const MELEE_RANGE: RangeSpec = { kind: 'melee', note: 'Melee Reach' };
const R_NONE: AoeSpec = { shape: 'none' };

function rangedRange(lvl: number, base = 8): RangeSpec {
    return { kind: 'distance', m: base + (lvl - 1) * 4 };
}

function aoeRadius(lvl: number, step = 1, base = 2): AoeSpec {
    return { shape: 'radius', radiusM: base + Math.floor((lvl - 1) * step), center: 'targetPoint', targetFilter: 'enemies' };
}

/** Start-PP table → damage dice progression per level (soft heuristic). */
function damageDiceForTier(tier: ActiveSpecialTier, lvl: number): string {
    // Higher tier = lower damage rider (more PP goes into the special).
    // T3/T4: ~ceil(lvl/2)d8; T5: ~ceil(lvl/3)d8 + 1; T6: flat 1d8.
    switch (tier) {
        case 3: return `${Math.max(1, Math.ceil(lvl / 2))}d8`;
        case 4: return `${Math.max(1, Math.ceil(lvl / 2))}d8`;
        case 5: return `${Math.max(1, Math.ceil(lvl / 3) + 1)}d8`;
        case 6: return `1d8`;
    }
}

/** Special rank progression per level (from Actives.md T(X)=X(X+1)/2 tables). */
function specialRankForTier(tier: ActiveSpecialTier, lvl: number): number {
    // Approximate curves from actives.md calculations.
    switch (tier) {
        case 3: return Math.min(17, [3, 5, 6, 8, 9, 10, 11, 12, 12, 13, 14, 14, 15, 16, 16, 17][lvl - 1]);
        case 4: return Math.min(14, [2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14][lvl - 1]);
        case 5: return Math.min(10, [1, 2, 3, 3, 4, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10][lvl - 1]);
        case 6: return Math.min(8, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8][lvl - 1]);
    }
}

// ─── Factory helpers ─────────────────────────────────────────────────────

function damageSingleTemplate(def: {
    flavour: 'melee' | 'ranged';
    tier: ActiveSpecialTier;
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    const id = `active-${isRanged ? 'ranged' : 'melee'}-damage-t${def.tier}`;
    const name = `${isRanged ? 'Ranged' : 'Melee'} Damage — Tier ${def.tier}`;
    const slot: ActiveSpecialSlot = { tier: def.tier, eligibleSpecialKeys: [...getEligibleSpecialsForTier(def.tier)] };
    const spellHints: SpellHints = { defaultResolution: 'spellAttack' };
    return {
        templateId: id,
        templateName: name,
        name,
        subfamily: 'damage-single',
        category: 'active',
        tags: [],
        specialSlot: slot,
        spellHints,
        fluff: isRanged
            ? `A focused ranged strike that applies a Tier ${def.tier} Special.`
            : `A close-range martial strike that applies a Tier ${def.tier} Special.`,
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const dice = damageDiceForTier(def.tier, lvl);
            const rank = specialRankForTier(def.tier, lvl);
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Deal **+${dice} damage** on hit.`,
                dice,
                specials: [{ key: 'SPECIAL', rank, note: 'bound at item-create via chosenSpecial' }],
                mechanics: { damageRider: { flat: `+${dice}` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

function damageAoeTemplate(def: {
    flavour: 'melee' | 'ranged';
    tier: ActiveSpecialTier;
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    const id = `active-${isRanged ? 'ranged' : 'melee'}-aoe-damage-t${def.tier}`;
    const name = `${isRanged ? 'Ranged' : 'Melee'} AoE Damage — Tier ${def.tier}`;
    const slot: ActiveSpecialSlot = { tier: def.tier, eligibleSpecialKeys: [...getEligibleSpecialsForTier(def.tier)] };
    const spellHints: SpellHints = { defaultResolution: 'saveSpell', defaultSaveType: 'body' };
    return {
        templateId: id,
        templateName: name,
        name,
        subfamily: 'damage-aoe',
        category: 'active',
        tags: [],
        specialSlot: slot,
        spellHints,
        fluff: `A ${isRanged ? 'ranged' : 'melee'} area strike that applies a Tier ${def.tier} Special to everything in the blast.`,
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const dice = damageDiceForTier(def.tier, lvl);
            const rank = specialRankForTier(def.tier, lvl);
            return activeRow({
                type: isRanged ? 'Ranged AoE' : 'Melee AoE',
                range: isRanged ? rangedRange(lvl, 12) : MELEE_RANGE,
                aoe: aoeRadius(lvl),
                effectText: `Deal **+${dice} damage** to every affected creature.`,
                dice,
                specials: [{ key: 'SPECIAL', rank, note: 'bound at item-create via chosenSpecial' }],
                mechanics: { damageRider: { flat: `+${dice}` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

function persistentZoneTemplate(tier: ActiveSpecialTier): PowerTemplate {
    const id = `active-ranged-zone-t${tier}`;
    const name = `Ranged Persistent Zone — Tier ${tier}`;
    const slot: ActiveSpecialSlot = { tier, eligibleSpecialKeys: [...getEligibleSpecialsForTier(tier)] };
    const spellHints: SpellHints = { defaultResolution: 'saveSpell', defaultSaveType: 'body' };
    return {
        templateId: id,
        templateName: name,
        name,
        subfamily: 'persistent-zone',
        category: 'active',
        tags: [],
        specialSlot: slot,
        spellHints,
        fluff: `A lingering hazard zone that applies a Tier ${tier} Special to creatures inside.`,
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: 'intellect' },
        levels: buildLevels((lvl) => {
            const rank = specialRankForTier(tier, lvl);
            return activeRow({
                type: 'Ranged Zone',
                range: rangedRange(lvl, 12),
                aoe: { shape: 'zone', radiusM: 2 + Math.floor((lvl - 1) / 2), center: 'targetPoint', targetFilter: 'enemies' },
                duration: { kind: 'masteryRankRounds' },
                effectText: `Creatures inside the zone suffer the chosen Tier ${tier} Special at **rank ${rank}** while inside.`,
                specials: [{ key: 'SPECIAL', rank, note: 'bound at item-create via chosenSpecial' }],
                mechanics: { applyWhen: 'attack-rider' },
            });
        }),
    };
}

function controlTemplate(def: {
    id: string;
    flavour: 'melee' | 'ranged';
    name: string;
    specials: string[];
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    return {
        templateId: def.id,
        templateName: def.name,
        name: def.name,
        subfamily: 'control',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell', defaultSaveType: 'body' },
        fluff: 'Forceful positioning — push, pull, trip, or disarm.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const m = Math.min(16, 2 + lvl);
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Apply **${def.specials.join(' + ')}** at rank/${m} m as appropriate.`,
                specials: def.specials.map((k) => ({ key: k, rank: m })),
                mechanics: { applyWhen: 'attack-rider' },
            });
        }),
    };
}

function supportTemplate(def: {
    id: string;
    flavour: 'melee' | 'ranged';
    aoe: boolean;
    mode: 'heal' | 'cleanse' | 'dispel';
    name: string;
}): PowerTemplate {
    const HEAL_DICE = ['1d8', '2d8', '3d8', '4d8', '5d8', '6d8', '7d8', '8d8', '9d8', '10d8', '11d8', '12d8', '13d8', '14d8', '15d8', '16d8'];
    const spellHints: SpellHints = { defaultResolution: 'saveSpell' };
    return {
        templateId: def.id,
        templateName: def.name,
        name: def.name,
        subfamily: `support-${def.mode}`,
        category: 'active',
        tags: [],
        spellHints,
        fluff: `A ${def.aoe ? 'wide' : 'single-target'} ${def.flavour} ${def.mode} effect.`,
        cost: { action: 'attack' },
        roll: { kind: 'none', attribute: 'resolve' },
        levels: buildLevels((lvl) => {
            const effect =
                def.mode === 'heal'
                    ? `Restore **${HEAL_DICE[lvl - 1]} HP** to the ${def.aoe ? 'targets in the area' : 'target'}.`
                    : def.mode === 'cleanse'
                    ? `Remove one eligible Special from the ${def.aoe ? 'targets' : 'target'} (at rank ≤ ${lvl + 2}).`
                    : `Dispel one eligible magical effect on the ${def.aoe ? 'targets' : 'target'} (at level ≤ ${lvl}).`;
            return activeRow({
                type: def.aoe ? `${def.flavour === 'ranged' ? 'Ranged' : 'Melee'} AoE` : def.flavour === 'ranged' ? 'Ranged' : 'Melee',
                range: def.flavour === 'ranged' ? rangedRange(lvl, 8) : MELEE_RANGE,
                aoe: def.aoe ? aoeRadius(lvl, 1, 2) : R_NONE,
                effectText: effect,
                specials: def.mode === 'cleanse' ? [{ key: 'cleanse', rank: lvl }] : def.mode === 'dispel' ? [{ key: 'dispel-magic', rank: lvl }] : [],
                mechanics: def.mode === 'heal' ? { healing: { flat: HEAL_DICE[lvl - 1], target: def.aoe ? 'aoe' : 'target' } } : {},
            });
        }),
    };
}

function mixedTemplate(def: {
    id: string;
    flavour: 'melee' | 'ranged';
    name: string;
    kind: 'heal-cleanse' | 'damage-dispel';
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    return {
        templateId: def.id,
        templateName: def.name,
        name: def.name,
        subfamily: 'mixed',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell' },
        fluff: def.kind === 'heal-cleanse'
            ? 'A single act of restoration that both heals and clears a lingering affliction.'
            : 'A blow that both damages and strips a magical effect.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            if (def.kind === 'heal-cleanse') {
                return activeRow({
                    type: isRanged ? 'Ranged' : 'Melee',
                    range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                    aoe: R_NONE,
                    effectText: `Heal **${lvl}d8 HP** and remove one Special at rank ≤ ${lvl}.`,
                    specials: [{ key: 'cleanse', rank: lvl }],
                    mechanics: { healing: { flat: `${lvl}d8`, target: 'target' } },
                });
            }
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Deal **+${Math.ceil(lvl / 2)}d8 damage** and dispel one magical effect of level ≤ ${lvl}.`,
                dice: `${Math.ceil(lvl / 2)}d8`,
                specials: [{ key: 'dispel-magic', rank: lvl }],
                mechanics: { damageRider: { flat: `+${Math.ceil(lvl / 2)}d8` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// ─── Template registry ───────────────────────────────────────────────────

export const ACTIVE_TEMPLATES: PowerTemplate[] = [
    // Damage Single — Melee (4) + Ranged (4)
    damageSingleTemplate({ flavour: 'melee', tier: 3 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 3 }),
    damageSingleTemplate({ flavour: 'melee', tier: 4 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 4 }),
    damageSingleTemplate({ flavour: 'melee', tier: 5 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 5 }),
    damageSingleTemplate({ flavour: 'melee', tier: 6 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 6 }),

    // Damage AoE — Melee (4) + Ranged (4)
    damageAoeTemplate({ flavour: 'melee', tier: 3 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 3 }),
    damageAoeTemplate({ flavour: 'melee', tier: 4 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 4 }),
    damageAoeTemplate({ flavour: 'melee', tier: 5 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 5 }),
    damageAoeTemplate({ flavour: 'melee', tier: 6 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 6 }),

    // Persistent Zone — Ranged only (4)
    persistentZoneTemplate(3),
    persistentZoneTemplate(4),
    persistentZoneTemplate(5),
    persistentZoneTemplate(6),

    // Control — Melee + Ranged × (push-pull, pull-disarm, push-prone) = 6
    controlTemplate({ id: 'active-melee-control-push-pull', flavour: 'melee', name: 'Melee Control — Push + Pull', specials: ['push', 'pull'] }),
    controlTemplate({ id: 'active-ranged-control-push-pull', flavour: 'ranged', name: 'Ranged Control — Push + Pull', specials: ['push', 'pull'] }),
    controlTemplate({ id: 'active-melee-control-pull-disarm', flavour: 'melee', name: 'Melee Control — Pull + Disarm', specials: ['pull'] }),
    controlTemplate({ id: 'active-ranged-control-pull-disarm', flavour: 'ranged', name: 'Ranged Control — Pull + Disarm', specials: ['pull'] }),
    controlTemplate({ id: 'active-melee-control-push-prone', flavour: 'melee', name: 'Melee Control — Push + Prone', specials: ['push', 'prone'] }),
    controlTemplate({ id: 'active-ranged-control-push-prone', flavour: 'ranged', name: 'Ranged Control — Push + Prone', specials: ['push', 'prone'] }),

    // Support — heal / cleanse / dispel × (single-target, aoe) × (melee, ranged) = 12
    supportTemplate({ id: 'active-melee-single-heal', flavour: 'melee', aoe: false, mode: 'heal', name: 'Melee Single-Target Heal' }),
    supportTemplate({ id: 'active-ranged-single-heal', flavour: 'ranged', aoe: false, mode: 'heal', name: 'Ranged Single-Target Heal' }),
    supportTemplate({ id: 'active-melee-aoe-heal', flavour: 'melee', aoe: true, mode: 'heal', name: 'Melee AoE Heal' }),
    supportTemplate({ id: 'active-ranged-aoe-heal', flavour: 'ranged', aoe: true, mode: 'heal', name: 'Ranged AoE Heal' }),
    supportTemplate({ id: 'active-melee-single-cleanse', flavour: 'melee', aoe: false, mode: 'cleanse', name: 'Melee Single-Target Cleanse' }),
    supportTemplate({ id: 'active-ranged-single-cleanse', flavour: 'ranged', aoe: false, mode: 'cleanse', name: 'Ranged Single-Target Cleanse' }),
    supportTemplate({ id: 'active-melee-aoe-cleanse', flavour: 'melee', aoe: true, mode: 'cleanse', name: 'Melee AoE Cleanse' }),
    supportTemplate({ id: 'active-ranged-aoe-cleanse', flavour: 'ranged', aoe: true, mode: 'cleanse', name: 'Ranged AoE Cleanse' }),
    supportTemplate({ id: 'active-melee-single-dispel', flavour: 'melee', aoe: false, mode: 'dispel', name: 'Melee Single-Target Dispel' }),
    supportTemplate({ id: 'active-ranged-single-dispel', flavour: 'ranged', aoe: false, mode: 'dispel', name: 'Ranged Single-Target Dispel' }),
    supportTemplate({ id: 'active-melee-aoe-dispel', flavour: 'melee', aoe: true, mode: 'dispel', name: 'Melee AoE Dispel' }),
    supportTemplate({ id: 'active-ranged-aoe-dispel', flavour: 'ranged', aoe: true, mode: 'dispel', name: 'Ranged AoE Dispel' }),

    // Mixed — heal+cleanse / damage+dispel × (melee, ranged) = 4
    mixedTemplate({ id: 'active-melee-heal-cleanse-mixed', flavour: 'melee', name: 'Melee Heal + Cleanse (Mixed)', kind: 'heal-cleanse' }),
    mixedTemplate({ id: 'active-ranged-heal-cleanse-mixed', flavour: 'ranged', name: 'Ranged Heal + Cleanse (Mixed)', kind: 'heal-cleanse' }),
    mixedTemplate({ id: 'active-melee-damage-dispel-mixed', flavour: 'melee', name: 'Melee Damage + Dispel (Mixed)', kind: 'damage-dispel' }),
    mixedTemplate({ id: 'active-ranged-damage-dispel-mixed', flavour: 'ranged', name: 'Ranged Damage + Dispel (Mixed)', kind: 'damage-dispel' }),

    // Barrier — Ranged (1)
    {
        templateId: 'active-ranged-barrier',
        templateName: 'Ranged Barrier — 4 Rounds',
        name: 'Ranged Barrier — 4 Rounds',
        subfamily: 'barrier',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell', defaultSaveType: 'body' },
        fluff: 'A summoned wall of force, stone, wood, or ice that lasts for several rounds.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const hp = lvl * 10;
            const length = 4 + lvl;
            return activeRow({
                type: 'Ranged Barrier',
                range: rangedRange(lvl, 8),
                aoe: { shape: 'line', lengthM: length, widthM: 1 },
                duration: { kind: 'rounds', rounds: 4 },
                effectText: `Create a **${length} m** barrier with **${hp} HP** for **4 rounds**.`,
                mechanics: {},
            });
        }),
    },

    // Hard Control — damage + Stunned × (melee, ranged) = 2
    {
        templateId: 'active-melee-damage-stunned',
        templateName: 'Melee Damage + Stunned',
        name: 'Melee Damage + Stunned',
        subfamily: 'hard-control',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell', defaultSaveType: 'mind' },
        fluff: 'A decisive blow that stuns the target.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: 'might' },
        levels: buildLevels((lvl) => {
            const rank = specialRankForTier(6, lvl);
            return activeRow({
                type: 'Melee',
                range: MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Deal **+1d8 damage** on hit and apply **Stunned(${rank})**.`,
                dice: '1d8',
                specials: [{ key: 'stunned', rank }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' },
            });
        }),
    },
    {
        templateId: 'active-ranged-damage-stunned',
        templateName: 'Ranged Damage + Stunned',
        name: 'Ranged Damage + Stunned',
        subfamily: 'hard-control',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell', defaultSaveType: 'mind' },
        fluff: 'A precise ranged strike that stuns the target.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: buildLevels((lvl) => {
            const rank = specialRankForTier(6, lvl);
            return activeRow({
                type: 'Ranged',
                range: rangedRange(lvl, 8),
                aoe: R_NONE,
                effectText: `Deal **+1d8 damage** on hit and apply **Stunned(${rank})**.`,
                dice: '1d8',
                specials: [{ key: 'stunned', rank }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' },
            });
        }),
    },
];

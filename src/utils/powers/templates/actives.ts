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
// NB: Uses a lazy build() closure so the registry can reference template
// factories and progression tables declared further down in this file
// without hitting "Cannot access before initialization" TDZ errors. The
// module export is frozen on first use so downstream iterators still see
// a stable array.

function buildActiveTemplates(): PowerTemplate[] {
    return [
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

    // Hard Control — Stunning Strike: Damage + fixed Stunned × (melee, ranged) = 2
    stunningStrikeTemplate('melee'),
    stunningStrikeTemplate('ranged'),

    // Illusion — Ranged Images (4 Rounds) = 1
    rangedImagesTemplate(),

    // Weapon Attacks — pure attack templates (no Specials) = 7
    singleWeaponAttackTemplate('melee'),
    singleWeaponAttackTemplate('ranged'),
    aoeWeaponAttackTemplate('melee'),
    aoeWeaponAttackTemplate('ranged'),
    splitWeaponAttackTemplate('melee'),
    splitWeaponAttackTemplate('ranged'),
    autofireWeaponAttackTemplate(),
    ];
}

// ─── Stunning Strike (Damage + fixed Stunned) ────────────────────────────
//
// Stunned is a binary Hard-Control add-on (fixed 120 PP). Damage is the
// scaling axis once the Power can afford Stunned:
//   • Melee  → unlocks at Level 4 (no extra dice), then +2d8 per level.
//   • Ranged → pays Range every level; unlocks at Level 5 (no extra dice),
//     then irregular progression per Actives.md.

const MELEE_STUN_EXTRA_DICE: readonly number[] = [
    0, 0, 0, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24,
];
const RANGED_STUN_EXTRA_DICE: readonly number[] = [
    0, 0, 0, 0, 0, 2, 4, 5, 7, 9, 10, 12, 14, 15, 17, 19,
];

function stunningStrikeTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const unlockLvl = isRanged ? 5 : 4;
    return {
        templateId: isRanged ? 'active-ranged-damage-stunned' : 'active-melee-damage-stunned',
        templateName: isRanged ? 'Ranged Damage + Stunned' : 'Melee Damage + Stunned',
        name: isRanged ? 'Ranged Damage + Stunned' : 'Melee Damage + Stunned',
        subfamily: 'hard-control',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell', defaultSaveType: 'body' },
        fluff: isRanged
            ? 'A precise ranged strike that staggers the target and briefly denies its ability to attack.'
            : 'A close-range martial blow that staggers the target and briefly denies its ability to attack.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            if (lvl < unlockLvl) {
                return activeRow({
                    type: isRanged ? 'Ranged' : 'Melee',
                    range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                    aoe: R_NONE,
                    effectText: 'No Stun version is available at this Power rank.',
                    specials: [],
                    mechanics: {},
                });
            }
            const extra = (isRanged ? RANGED_STUN_EXTRA_DICE : MELEE_STUN_EXTRA_DICE)[lvl - 1];
            const diceText = extra === 0 ? '' : `+${extra}d8`;
            const effectText = extra === 0
                ? 'No damage. Target is **Stunned**.'
                : `Deal **+${extra}d8 damage** on hit. Target is **Stunned**.`;
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: R_NONE,
                duration: { kind: 'untilStartOfNextTurn' },
                effectText,
                dice: diceText || undefined,
                specials: [{ key: 'stunned' }],
                mechanics: extra === 0
                    ? { applyWhen: 'attack-rider' }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// ─── Ranged Images — Illusion Field (4 Rounds) ───────────────────────────

const RANGED_IMAGES_ROWS: readonly { radiusM: number; imageTier: number; imageLabel: string }[] = [
    { radiusM: 1, imageTier: 1, imageLabel: 'a simple static visual image' },          // L1
    { radiusM: 1, imageTier: 1, imageLabel: 'a simple static visual image' },          // L2
    { radiusM: 1, imageTier: 2, imageLabel: 'a moving visual image' },                 // L3
    { radiusM: 2, imageTier: 2, imageLabel: 'a moving visual image' },                 // L4
    { radiusM: 2, imageTier: 3, imageLabel: 'a sight and sound image' },               // L5
    { radiusM: 2, imageTier: 3, imageLabel: 'a sight and sound image' },               // L6
    { radiusM: 2, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L7
    { radiusM: 2, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L8
    { radiusM: 3, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L9
    { radiusM: 3, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L10
    { radiusM: 3, imageTier: 5, imageLabel: 'a multi-sense image' },                   // L11
    { radiusM: 3, imageTier: 5, imageLabel: 'a multi-sense image' },                   // L12
    { radiusM: 3, imageTier: 6, imageLabel: 'a small scene with several moving parts' }, // L13
    { radiusM: 3, imageTier: 6, imageLabel: 'a small scene with several moving parts' }, // L14
    { radiusM: 3, imageTier: 6, imageLabel: 'a small scene with several moving parts' }, // L15
    { radiusM: 3, imageTier: 7, imageLabel: 'a complex battlefield illusion' },        // L16
];

const IMAGE_ROMAN: readonly string[] = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function rangedImagesTemplate(): PowerTemplate {
    return {
        templateId: 'active-ranged-illusion-image',
        templateName: 'Ranged Images — 4 Rounds',
        name: 'Ranged Images — 4 Rounds',
        subfamily: 'illusion',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell', defaultSaveType: 'mind' },
        fluff: 'A ranged illusion Active that creates false sensory information for 4 Rounds. Images do not deal damage, block movement, or apply Specials — they only make creatures believe things are present.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const row = RANGED_IMAGES_ROWS[lvl - 1];
            const aoe: AoeSpec = row.radiusM <= 1
                ? { shape: 'single', note: lvl === 1 ? 'Single Small Image' : 'Single Human-Sized Image' }
                : { shape: 'radius', radiusM: row.radiusM, center: 'targetPoint' };
            return activeRow({
                type: 'Ranged Illusion',
                range: rangedRange(lvl),
                aoe,
                duration: { kind: 'rounds', rounds: 4 },
                effectText: `Create **Image ${IMAGE_ROMAN[row.imageTier]}**: ${row.imageLabel}.`,
                specials: [],
                mechanics: { applyWhen: 'manual' },
            });
        }),
    };
}

// ─── Weapon Attack Templates (pure — no Specials) ────────────────────────

// Single Weapon Attack damage progression.
const MELEE_SINGLE_DICE: readonly number[] = [
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32,
];
const RANGED_SINGLE_DICE: readonly number[] = [
    2, 3, 5, 7, 8, 10, 12, 13, 15, 17, 18, 20, 22, 23, 25, 27,
];

function singleWeaponAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const dice = isRanged ? RANGED_SINGLE_DICE : MELEE_SINGLE_DICE;
    return {
        templateId: isRanged ? 'active-ranged-weapon-single' : 'active-melee-weapon-single',
        templateName: isRanged ? 'Ranged Single Attack' : 'Melee Single Attack',
        name: isRanged ? 'Ranged Single Attack' : 'Melee Single Attack',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: isRanged
            ? 'A clean ranged weapon attack with no Special, rider, movement, or secondary effect.'
            : 'A clean melee weapon attack with no Special, rider, movement, or secondary effect.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const d = dice[lvl - 1];
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Make **one ${isRanged ? 'ranged' : 'melee'} weapon attack**. On hit, deal weapon damage + **${d}d8 damage**.`,
                dice: `+${d}d8`,
                specials: [],
                mechanics: { damageRider: { flat: `+${d}d8` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// AoE Weapon Attack progression: (radius in meters, bonus dice).
const MELEE_AOE_PROG: readonly { radiusM: number; dice: number }[] = [
    { radiusM: 2, dice: 0 }, { radiusM: 2, dice: 2 }, { radiusM: 3, dice: 2 }, { radiusM: 3, dice: 4 },
    { radiusM: 4, dice: 4 }, { radiusM: 4, dice: 6 }, { radiusM: 5, dice: 4 }, { radiusM: 5, dice: 6 },
    { radiusM: 6, dice: 4 }, { radiusM: 6, dice: 6 }, { radiusM: 7, dice: 4 }, { radiusM: 7, dice: 6 },
    { radiusM: 8, dice: 2 }, { radiusM: 8, dice: 4 }, { radiusM: 8, dice: 6 }, { radiusM: 8, dice: 8 },
];
const RANGED_AOE_PROG: readonly { radiusM: number; dice: number }[] = [
    { radiusM: 2, dice: 0 }, { radiusM: 2, dice: 2 }, { radiusM: 3, dice: 2 }, { radiusM: 3, dice: 3 },
    { radiusM: 4, dice: 2 }, { radiusM: 4, dice: 4 }, { radiusM: 5, dice: 2 }, { radiusM: 5, dice: 4 },
    { radiusM: 6, dice: 2 }, { radiusM: 6, dice: 3 }, { radiusM: 7, dice: 0 }, { radiusM: 7, dice: 2 },
    { radiusM: 8, dice: 0 }, { radiusM: 8, dice: 0 }, { radiusM: 8, dice: 2 }, { radiusM: 8, dice: 3 },
];

function aoeWeaponAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const prog = isRanged ? RANGED_AOE_PROG : MELEE_AOE_PROG;
    return {
        templateId: isRanged ? 'active-ranged-weapon-aoe' : 'active-melee-weapon-aoe',
        templateName: isRanged ? 'Ranged AoE Attack' : 'Melee AoE Attack',
        name: isRanged ? 'Ranged AoE Attack' : 'Melee AoE Attack',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'saveSpell', defaultSaveType: 'body' },
        fluff: isRanged
            ? 'A ranged weapon attack that bursts around a target point.'
            : 'A self-centered weapon sweep or burst around the attacker.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const p = prog[lvl - 1];
            const aoe: AoeSpec = {
                shape: 'radius',
                radiusM: p.radiusM,
                center: isRanged ? 'targetPoint' : 'self',
                targetFilter: 'enemies',
            };
            const diceText = p.dice === 0 ? '' : `+${p.dice}d8`;
            const effect = p.dice === 0
                ? `Make a ${isRanged ? 'ranged' : 'melee'} AoE attack. Affected creatures take weapon damage.`
                : `Make a ${isRanged ? 'ranged' : 'melee'} AoE attack. Affected creatures take weapon damage + **${p.dice}d8 damage**.`;
            return activeRow({
                type: isRanged ? 'Ranged AoE' : 'Melee AoE',
                range: isRanged ? rangedRange(lvl) : { kind: 'self' },
                aoe,
                effectText: effect,
                dice: diceText || undefined,
                specials: [],
                mechanics: p.dice === 0
                    ? { applyWhen: 'attack-rider' }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// Split Weapon Attack progression: (attack count, bonus dice).
const MELEE_SPLIT_PROG: readonly { attacks: number; dice: number }[] = [
    { attacks: 2, dice: 0 }, { attacks: 2, dice: 2 }, { attacks: 2, dice: 4 }, { attacks: 2, dice: 6 },
    { attacks: 2, dice: 8 }, { attacks: 2, dice: 10 }, { attacks: 3, dice: 10 }, { attacks: 3, dice: 12 },
    { attacks: 3, dice: 14 }, { attacks: 3, dice: 16 }, { attacks: 3, dice: 18 }, { attacks: 3, dice: 20 },
    { attacks: 4, dice: 20 }, { attacks: 4, dice: 22 }, { attacks: 4, dice: 24 }, { attacks: 4, dice: 26 },
];
const RANGED_SPLIT_PROG: readonly { attacks: number; dice: number }[] = [
    { attacks: 2, dice: 0 }, { attacks: 2, dice: 1 }, { attacks: 2, dice: 3 }, { attacks: 2, dice: 5 },
    { attacks: 2, dice: 6 }, { attacks: 2, dice: 8 }, { attacks: 3, dice: 8 }, { attacks: 3, dice: 9 },
    { attacks: 3, dice: 11 }, { attacks: 3, dice: 13 }, { attacks: 3, dice: 14 }, { attacks: 3, dice: 16 },
    { attacks: 4, dice: 16 }, { attacks: 4, dice: 17 }, { attacks: 4, dice: 19 }, { attacks: 4, dice: 21 },
];

function splitWeaponAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const prog = isRanged ? RANGED_SPLIT_PROG : MELEE_SPLIT_PROG;
    return {
        templateId: isRanged ? 'active-ranged-weapon-split' : 'active-melee-weapon-split',
        templateName: isRanged ? 'Ranged Split Attack' : 'Melee Split Attack',
        name: isRanged ? 'Ranged Split Attack' : 'Melee Split Attack',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: isRanged
            ? 'A ranged technique that divides one attack sequence between multiple targets.'
            : 'A melee technique that divides one attack sequence between multiple targets.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const p = prog[lvl - 1];
            const diceText = p.dice === 0 ? '' : `+${p.dice}d8`;
            const base = `Make up to **${p.attacks} ${isRanged ? 'ranged' : 'melee'} weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage`;
            const effect = p.dice === 0
                ? `${base}, then split that damage between successful hits.`
                : `${base} + **${p.dice}d8 damage**, then split that damage between successful hits.`;
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: { shape: 'weapon', targets: p.attacks },
                effectText: effect,
                dice: diceText || undefined,
                specials: [{ key: 'split-attack', value: p.attacks }],
                mechanics: p.dice === 0
                    ? { applyWhen: 'attack-rider' }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// Autofire progression: (additional targets, bonus dice); range = 8 + 4*(L-1).
const AUTOFIRE_PROG: readonly { extra: number; dice: number }[] = [
    { extra: 1, dice: 0 }, { extra: 1, dice: 2 }, { extra: 2, dice: 2 }, { extra: 2, dice: 4 },
    { extra: 3, dice: 4 }, { extra: 3, dice: 6 }, { extra: 4, dice: 6 }, { extra: 4, dice: 8 },
    { extra: 5, dice: 8 }, { extra: 5, dice: 10 }, { extra: 6, dice: 10 }, { extra: 6, dice: 12 },
    { extra: 7, dice: 12 }, { extra: 7, dice: 14 }, { extra: 8, dice: 14 }, { extra: 8, dice: 16 },
];

function autofireWeaponAttackTemplate(): PowerTemplate {
    return {
        templateId: 'active-ranged-weapon-autofire',
        templateName: 'Ranged Autofire',
        name: 'Ranged Autofire',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: 'A ranged weapon attack that sprays fire across several targets without creating separate attacks.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: buildLevels((lvl) => {
            const p = AUTOFIRE_PROG[lvl - 1];
            const diceText = p.dice === 0 ? '' : `+${p.dice}d8`;
            const primary = p.dice === 0 ? 'weapon damage' : `weapon damage + **${p.dice}d8 damage**`;
            const effect =
                `Make **one ranged weapon attack** against a primary target. You may declare up to **${p.extra} additional target${p.extra === 1 ? '' : 's'}** within range. Each additional target requires **+1 Raise**. Primary target takes ${primary}. Additional targets take only printed weapon damage.`;
            return activeRow({
                type: 'Ranged',
                range: rangedRange(lvl),
                aoe: { shape: 'weapon', targets: 1 + p.extra },
                effectText: effect,
                dice: diceText || undefined,
                specials: [{ key: 'autofire', value: p.extra }],
                mechanics: p.dice === 0
                    ? { applyWhen: 'attack-rider' }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// Frozen, lazily-built export so TDZ issues don't strike at module load.
export const ACTIVE_TEMPLATES: PowerTemplate[] = buildActiveTemplates();

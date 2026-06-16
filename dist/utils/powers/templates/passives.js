/**
 * Passive Power Templates.
 *
 * Canonical source: `docs/passives.md` (Passive Design Rules + Catalog).
 *
 * Structure:
 *   - Base unconditional passives (one axis per template): Armor, Damage
 *     Reduction, Evade, Temporary HP, Healing, Phasing, Damage, Health,
 *     Awareness.
 *   - Conditional passives (one axis, gated on a combat condition): Armor
 *     (Stone Stance / Surrounded Bulwark), Evade (Flowing Step / Duelist
 *     Footwork), Damage (Momentum / Ambusher / Bloodlust / Executioner),
 *     Healing (Blood Feast / Battle Trance / Stillness Recovery).
 *   - Combined passives (two axes, unconditional): 12 entries per spec.
 *   - Conditional Combined passives (two axes, gated): 12 entries per spec.
 *   - Passive Special Aura: fixed +1 step on a chosen eligible Special(X),
 *     radius scales with level.
 *
 * Structural axes without a dedicated mechanics key (extra Health Bars and
 * Combat Senses) are encoded as narrative `effect.text`; the aggregator
 * falls back to descriptive behaviour for rows without a mechanical delta.
 */
import { buildLevels, passiveRow } from './_shared.js';
// ─── Per-spec progression tables ─────────────────────────────────────────
/** Fortified Frame — unconditional Armor (15 PP per +1 Armor). */
const ARMOR_UNCOND = [1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21];
/** Conditional Armor curve (Stone Stance, Surrounded Bulwark; 7.5 PP / +1). */
const ARMOR_COND = [3, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29, 32, 35, 37, 40, 43];
/** Unconditional Evade curve (10 PP / +1). */
const EVADE_UNCOND = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Conditional Evade curve (Flowing Step, Duelist Footwork; 5 PP / +1). */
const EVADE_COND = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64];
/** Temporary HP curve (2 PP / 1 THP). */
const TEMP_HP_UNCOND = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
/** Regeneration / unconditional Healing curve (8 PP / 1 HP). */
const HEAL_UNCOND = [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40];
/** Conditional Healing curve (Blood Feast / Battle Trance / Stillness Recovery; 4 PP / 1 HP). */
const HEAL_COND = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
/** Killing Intent — unconditional Damage dice per level (40 PP / +1d6). */
const DMG_KILLING_INTENT = ['', '+1d6', '+1d6', '+2d6', '+2d6', '+3d6', '+3d6', '+4d6',
    '+4d6', '+5d6', '+5d6', '+6d6', '+6d6', '+7d6', '+7d6', '+8d6'];
/** Conditional Damage dice (Momentum, Ambusher, Bloodlust, Executioner; +1d6 per level). */
const DMG_COND = ['+1d6', '+2d6', '+3d6', '+4d6', '+5d6', '+6d6', '+7d6', '+8d6',
    '+9d6', '+10d6', '+11d6', '+12d6', '+13d6', '+14d6', '+15d6', '+16d6'];
function deepVitalityBars(lvl) {
    if (lvl <= 3)
        return { wounded: 1, injured: 0, bruised: 0, healthy: 0 };
    if (lvl <= 7)
        return { wounded: 1, injured: 1, bruised: 0, healthy: 0 };
    if (lvl <= 11)
        return { wounded: 1, injured: 1, bruised: 1, healthy: 0 };
    return { wounded: 1, injured: 1, bruised: 1, healthy: 1 };
}
function combinedHealthBars(lvl) {
    if (lvl <= 3)
        return { wounded: 0, injured: 0, bruised: 0, healthy: 0 };
    if (lvl <= 7)
        return { wounded: 1, injured: 0, bruised: 0, healthy: 0 };
    if (lvl <= 11)
        return { wounded: 1, injured: 1, bruised: 0, healthy: 0 };
    return { wounded: 1, injured: 1, bruised: 1, healthy: 0 };
}
function healthBarText(h) {
    const parts = [];
    if (h.wounded)
        parts.push(`**+${h.wounded} Wounded Health Bar${h.wounded > 1 ? 's' : ''}**`);
    if (h.injured)
        parts.push(`**+${h.injured} Injured Health Bar${h.injured > 1 ? 's' : ''}**`);
    if (h.bruised)
        parts.push(`**+${h.bruised} Bruised Health Bar${h.bruised > 1 ? 's' : ''}**`);
    if (h.healthy)
        parts.push(`**+${h.healthy} Healthy Health Bar${h.healthy > 1 ? 's' : ''}**`);
    if (parts.length === 0)
        return '';
    if (parts.length === 1)
        return parts[0];
    if (parts.length === 2)
        return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}
// Awareness / Combat Sense progression (Heightened Senses unconditional).
function combatSenseCount(lvl) {
    if (lvl <= 3)
        return { count: 0, presence: false };
    if (lvl <= 7)
        return { count: 1, presence: false };
    if (lvl <= 11)
        return { count: 2, presence: false };
    if (lvl <= 14)
        return { count: 3, presence: true };
    return { count: 4, presence: true };
}
// Combined Awareness progression (fewer milestones vs the pure Heightened Senses).
function combinedSenseCount(lvl) {
    if (lvl <= 3)
        return { count: 0, presence: false };
    if (lvl <= 11)
        return { count: 1, presence: false };
    return { count: 2, presence: true };
}
/** Damage Reduction step by level per spec (closed subsystem). */
function damageReductionPct(lvl) {
    if (lvl <= 2)
        return 0;
    if (lvl <= 7)
        return 10;
    if (lvl <= 14)
        return 20;
    return 30;
}
/** Ghostform Phasing charges by level. */
function phasingCharges(lvl) {
    if (lvl <= 3)
        return 0;
    if (lvl <= 7)
        return 1;
    if (lvl <= 14)
        return 2;
    return 3;
}
/** Special Aura radius (meters) by level. */
function specialAuraRadius(lvl) {
    const table = [0, 0, 0, 2, 3, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8];
    return table[lvl - 1];
}
// ─── Factory helper ──────────────────────────────────────────────────────
function basePassive(def) {
    return {
        templateId: def.id,
        templateName: def.name,
        name: `Passive: ${def.name}`,
        subfamily: def.subfamily,
        category: 'passive',
        tags: def.tags ?? [],
        fluff: def.fluff,
        cost: { action: 'none' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const row = def.perLevel(lvl);
            return passiveRow({
                effectText: row.text,
                mechanics: row.mechanics,
            });
        }),
    };
}
// ─── Combined Passive per-level tables (spec) ────────────────────────────
const COMB_ARMOR_THP = {
    armor: [1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11],
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
const COMB_ARMOR_HEAL = {
    armor: [1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11],
    heal: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20],
};
const COMB_ARMOR_HEALTH = {
    armor: [1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11],
};
const COMB_EVADE_THP = {
    evade: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
const COMB_EVADE_HEAL = {
    evade: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    heal: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20],
};
const COMB_EVADE_DMG = {
    evade: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    dmg: ['', '', '', '+1d6', '+1d6', '+1d6', '+1d6', '+2d6',
        '+2d6', '+2d6', '+2d6', '+3d6', '+3d6', '+3d6', '+3d6', '+4d6'],
};
const COMB_DMG_HEAL = {
    dmg: ['', '', '', '+1d6', '+1d6', '+1d6', '+1d6', '+2d6',
        '+2d6', '+2d6', '+2d6', '+3d6', '+3d6', '+3d6', '+3d6', '+4d6'],
    heal: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20],
};
const COMB_DMG_THP = {
    dmg: ['', '', '', '+1d6', '+1d6', '+1d6', '+1d6', '+2d6',
        '+2d6', '+2d6', '+2d6', '+3d6', '+3d6', '+3d6', '+3d6', '+4d6'],
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
const COMB_AWARE_EVADE = {
    evade: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
};
const COMB_AWARE_DMG = {
    dmg: ['', '', '', '+1d6', '+1d6', '+1d6', '+1d6', '+2d6',
        '+2d6', '+2d6', '+2d6', '+3d6', '+3d6', '+3d6', '+3d6', '+4d6'],
};
const COMB_HEALTH_HEAL = {
    heal: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20],
};
const COMB_HEALTH_THP = {
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
// ─── Conditional Combined Passive per-level tables (spec) ────────────────
const CC_ARMOR_THP = {
    armor: [1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21],
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
const CC_ARMOR_HEAL = {
    armor: [1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21],
    heal: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40],
};
const CC_ARMOR_HEALTH = {
    armor: [1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21],
};
const CC_EVADE_THP = {
    evade: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
const CC_EVADE_HEAL = {
    evade: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
    heal: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40],
};
const CC_EVADE_DMG = {
    evade: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
    dmg: ['', '+1d6', '+1d6', '+2d6', '+2d6', '+3d6', '+3d6', '+4d6',
        '+4d6', '+5d6', '+5d6', '+6d6', '+6d6', '+7d6', '+7d6', '+8d6'],
};
const CC_DMG_HEAL = {
    dmg: ['', '+1d6', '+1d6', '+2d6', '+2d6', '+3d6', '+3d6', '+4d6',
        '+4d6', '+5d6', '+5d6', '+6d6', '+6d6', '+7d6', '+7d6', '+8d6'],
    heal: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40],
};
const CC_DMG_THP = {
    dmg: ['', '+1d6', '+1d6', '+2d6', '+2d6', '+3d6', '+3d6', '+4d6',
        '+4d6', '+5d6', '+5d6', '+6d6', '+6d6', '+7d6', '+7d6', '+8d6'],
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
const CC_AWARE_EVADE = {
    evade: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
};
const CC_AWARE_DMG = {
    dmg: ['', '+1d6', '+1d6', '+2d6', '+2d6', '+3d6', '+3d6', '+4d6',
        '+4d6', '+5d6', '+5d6', '+6d6', '+6d6', '+7d6', '+7d6', '+8d6'],
};
const CC_HEALTH_HEAL = {
    heal: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40],
};
const CC_HEALTH_THP = {
    thp: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
};
// ─── Helpers for sense-milestone text ────────────────────────────────────
function senseText(info) {
    if (info.count === 0)
        return '';
    const plural = info.count === 1 ? '' : 's total';
    const presence = info.presence ? ' **Presence Sense** is available.' : '';
    return `Choose **${info.count} Combat Sense${plural}**.${presence}`;
}
// ─── Buff Empowerment (artifact lineage meta-passives) ───────────────────
/**
 * Empower amount per Power Level. Banded so an artifact's Stage I / II / III
 * (which read PL 4 / 10 / 16) resolve to +1 / +2 / +3 — matching the authored
 * Elven Stride lineage lines (Ember Surge / Stoneweave Guard / Tidal Slip /
 * Wind-First). These are artifact-only meta-passives with no stat delta of
 * their own; they raise the Power Level + duration of a matching Active Buff.
 */
const BUFF_EMPOWER = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3];
function empowermentPassive(def) {
    return {
        templateId: def.id,
        templateName: def.name,
        name: `Passive: ${def.name}`,
        subfamily: 'buff-empowerment',
        category: 'passive',
        tags: ['artifact-only'],
        fluff: 'A lineage gift that pushes one kind of Active Buff past its normal limits.',
        cost: { action: 'none' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const amt = BUFF_EMPOWER[lvl - 1];
            const rounds = amt === 1 ? '1 round' : `${amt} rounds`;
            return passiveRow({
                type: 'Support',
                effectText: `When you activate an Active Buff that grants ${def.axisLabel} as one of its effects, ` +
                    `you may increase that Buff's effective Power Level by +${amt} and its duration by +${rounds}. ` +
                    `Uses per Safe Haven Rest: half Mastery Rank, rounded up. The Active Buff cannot exceed Power Level 16.`,
            });
        }),
    };
}
/** Damage / Armor / Evade / Wind buff-empowerment lineage passives. */
const EMPOWER_BUFF_TEMPLATES = [
    empowermentPassive({ id: 'empower-buff-damage', name: 'Damage Buff Empowerment', axisLabel: 'Damage' }),
    empowermentPassive({ id: 'empower-buff-armor', name: 'Armor Buff Empowerment', axisLabel: 'Armor' }),
    empowermentPassive({ id: 'empower-buff-evade', name: 'Evade Buff Empowerment', axisLabel: 'Evade' }),
    empowermentPassive({
        id: 'empower-buff-wind',
        name: 'Wind Buff Empowerment',
        axisLabel: 'Evade or movement-related positioning',
    }),
];
// ─── Templates ───────────────────────────────────────────────────────────
export const PASSIVE_TEMPLATES = [
    // ─── Base unconditional (Armor / DR / Evade / THP / Healing / Phasing / Damage / Health / Awareness) ───
    basePassive({
        id: 'passive-fortified-frame', name: 'Fortified Frame', subfamily: 'armor',
        fluff: 'Your body learns to carry steel as if it were a second skin.',
        perLevel: (lvl) => ({
            text: `Gain **+${ARMOR_UNCOND[lvl - 1]} Armor**.`,
            mechanics: { armor: ARMOR_UNCOND[lvl - 1] },
        }),
    }),
    basePassive({
        id: 'passive-damage-reduction', name: 'Damage Reduction', subfamily: 'damage-reduction',
        fluff: 'Blows, blasts, and spells find you stubbornly harder to harm.',
        perLevel: (lvl) => {
            const pct = damageReductionPct(lvl);
            return pct === 0
                ? { text: '—', mechanics: {} }
                : { text: `Gain **${pct}% Damage Reduction**.`, mechanics: { damageReductionPct: pct } };
        },
    }),
    basePassive({
        id: 'passive-evade', name: 'Evade', subfamily: 'evade',
        fluff: 'You are not faster in one moment. You are harder to catch in every moment.',
        perLevel: (lvl) => ({
            text: `Gain **+${EVADE_UNCOND[lvl - 1]} Evade**.`,
            mechanics: { evade: EVADE_UNCOND[lvl - 1] },
        }),
    }),
    basePassive({
        id: 'passive-temp-hp', name: 'Temporary Hit Points', subfamily: 'temp-hp',
        fluff: 'A reserve layer of protection that exists only at the moment battle begins.',
        perLevel: (lvl) => ({
            text: `At the start of combat, gain **${TEMP_HP_UNCOND[lvl - 1]} Temporary HP**.`,
            mechanics: { triggers: { combatStart: { tempHP: String(TEMP_HP_UNCOND[lvl - 1]) } } },
        }),
    }),
    basePassive({
        id: 'passive-regeneration', name: 'Regeneration', subfamily: 'regen',
        fluff: 'Your body steadily reclaims lost vitality while the fight continues.',
        perLevel: (lvl) => ({
            text: `At the start of your turn, heal **${HEAL_UNCOND[lvl - 1]} HP**.`,
            mechanics: { regen: HEAL_UNCOND[lvl - 1] },
        }),
    }),
    basePassive({
        id: 'passive-ghostform', name: 'Ghostform', subfamily: 'phasing',
        fluff: 'Your body no longer fully agrees to be where the world says it is.',
        perLevel: (lvl) => {
            const charges = phasingCharges(lvl);
            return charges === 0
                ? { text: '—', mechanics: {} }
                : {
                    text: `At the start of combat, gain **${charges} Phasing charge${charges === 1 ? '' : 's'}**. Each charge lets you ignore one hit against you.`,
                    mechanics: { phasing: { combatStart: { charges } } },
                };
        },
    }),
    basePassive({
        id: 'passive-killing-intent', name: 'Killing Intent', subfamily: 'damage',
        fluff: 'Your blows carry more weight because your intent no longer wavers.',
        perLevel: (lvl) => {
            const dice = DMG_KILLING_INTENT[lvl - 1];
            return dice
                ? { text: `Gain **${dice} Damage** on all damage rolls you make.`,
                    mechanics: { damageRider: { flat: dice } } }
                : { text: '—', mechanics: {} };
        },
    }),
    basePassive({
        id: 'passive-deep-vitality', name: 'Deep Vitality', subfamily: 'health',
        fluff: 'Your body does not merely endure more punishment. It learns to fail more slowly.',
        perLevel: (lvl) => ({
            text: `Gain ${healthBarText(deepVitalityBars(lvl))}.`,
            mechanics: {},
        }),
    }),
    basePassive({
        id: 'passive-heightened-senses', name: 'Heightened Senses', subfamily: 'awareness',
        fluff: 'You no longer trust only your eyes. The world reaches you through sound, pressure, breath, and presence.',
        perLevel: (lvl) => {
            const info = combatSenseCount(lvl);
            return info.count === 0
                ? { text: '—', mechanics: {} }
                : { text: senseText(info), mechanics: {} };
        },
    }),
    // ─── Conditional base passives (Armor / Evade / Damage / Healing) ───
    basePassive({
        id: 'passive-stone-stance', name: 'Stone Stance', subfamily: 'armor',
        fluff: 'You become hardest to break when you refuse to yield even a step.',
        perLevel: (lvl) => ({
            text: `If you moved **0 m** on your last turn, gain **+${ARMOR_COND[lvl - 1]} Armor** until the start of your next turn.`,
            mechanics: { armor: ARMOR_COND[lvl - 1], conditionExpr: 'self.lastTurnMoved == 0' },
        }),
    }),
    basePassive({
        id: 'passive-surrounded-bulwark', name: 'Surrounded Bulwark', subfamily: 'armor',
        fluff: 'A single enemy can test you. A crowd only gives you something to brace against.',
        perLevel: (lvl) => ({
            text: `While adjacent to at least **two enemies**, gain **+${ARMOR_COND[lvl - 1]} Armor**.`,
            mechanics: { armor: ARMOR_COND[lvl - 1], conditionExpr: 'self.adjacentEnemies >= 2' },
        }),
    }),
    basePassive({
        id: 'passive-flowing-step', name: 'Flowing Step', subfamily: 'evade',
        fluff: 'You are safest when you refuse to become a fixed point.',
        perLevel: (lvl) => ({
            text: `If you moved at least **8 m** on your turn, gain **+${EVADE_COND[lvl - 1]} Evade** until the start of your next turn.`,
            mechanics: { evade: EVADE_COND[lvl - 1], conditionExpr: 'self.turnMoved >= 8' },
        }),
    }),
    basePassive({
        id: 'passive-duelist-footwork', name: 'Duelist Footwork', subfamily: 'evade',
        fluff: 'You do not dodge the battlefield. You reduce it to a duel.',
        perLevel: (lvl) => ({
            text: `While exactly **one enemy** is adjacent to you, gain **+${EVADE_COND[lvl - 1]} Evade**.`,
            mechanics: { evade: EVADE_COND[lvl - 1], conditionExpr: 'self.adjacentEnemies == 1' },
        }),
    }),
    basePassive({
        id: 'passive-momentum', name: 'Momentum', subfamily: 'damage',
        fluff: 'Speed becomes weight. Weight becomes impact.',
        perLevel: (lvl) => ({
            text: `If you moved at least **8 m** this turn, gain **${DMG_COND[lvl - 1]} Damage** on all damage rolls you make until the end of your turn.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'self.turnMoved >= 8' },
        }),
    }),
    basePassive({
        id: 'passive-ambusher', name: 'Ambusher', subfamily: 'damage',
        fluff: 'The wound arrives before the enemy understands where you are.',
        perLevel: (lvl) => ({
            text: `Against a target that cannot see or otherwise perceive you, gain **${DMG_COND[lvl - 1]} Damage** on damage rolls you make.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'target.unseenBySelf' },
        }),
    }),
    basePassive({
        id: 'passive-bloodlust', name: 'Bloodlust', subfamily: 'damage',
        fluff: 'Your own blood teaches your hands to stop hesitating.',
        perLevel: (lvl) => ({
            text: `While you are affected by **Bleeding**, gain **${DMG_COND[lvl - 1]} Damage** on all damage rolls you make.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'self.hasSpecial.bleeding' },
        }),
    }),
    basePassive({
        id: 'passive-executioner', name: 'Executioner', subfamily: 'damage',
        fluff: 'You do not waste strength on enemies who have not started dying.',
        perLevel: (lvl) => ({
            text: `Against targets that are **Injured or worse**, gain **${DMG_COND[lvl - 1]} Damage** on damage rolls you make.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'target.healthState <= injured' },
        }),
    }),
    basePassive({
        id: 'passive-blood-feast', name: 'Blood Feast', subfamily: 'recovery',
        fluff: 'Pain opens the hunger that keeps you standing.',
        perLevel: (lvl) => ({
            text: `At the start of your turn, if you are **Wounded or worse**, heal **${HEAL_COND[lvl - 1]} HP**.`,
            mechanics: { regen: HEAL_COND[lvl - 1], conditionExpr: 'self.healthState <= wounded' },
        }),
    }),
    basePassive({
        id: 'passive-battle-trance', name: 'Battle Trance', subfamily: 'recovery',
        fluff: 'The closer death stands, the clearer your body remembers how to live.',
        perLevel: (lvl) => ({
            text: `At the start of your turn, if at least one enemy is adjacent to you, heal **${HEAL_COND[lvl - 1]} HP**.`,
            mechanics: { regen: HEAL_COND[lvl - 1], conditionExpr: 'self.adjacentEnemies >= 1' },
        }),
    }),
    basePassive({
        id: 'passive-stillness-recovery', name: 'Stillness Recovery', subfamily: 'recovery',
        fluff: 'Breath returns where motion ends.',
        perLevel: (lvl) => ({
            text: `At the start of your turn, if you moved **0 m** on your last turn, heal **${HEAL_COND[lvl - 1]} HP**.`,
            mechanics: { regen: HEAL_COND[lvl - 1], conditionExpr: 'self.lastTurnMoved == 0' },
        }),
    }),
    // ─── Combined (unconditional) ────────────────────────────────────────
    basePassive({
        id: 'passive-armor-temp-hp', name: 'Armor / Temporary HP', subfamily: 'combined',
        fluff: 'Hardened frame plus a renewing buffer.',
        perLevel: (lvl) => ({
            text: `Gain **+${COMB_ARMOR_THP.armor[lvl - 1]} Armor**. At the start of combat, gain **${COMB_ARMOR_THP.thp[lvl - 1]} Temporary HP**.`,
            mechanics: {
                armor: COMB_ARMOR_THP.armor[lvl - 1],
                triggers: { combatStart: { tempHP: String(COMB_ARMOR_THP.thp[lvl - 1]) } },
            },
        }),
    }),
    basePassive({
        id: 'passive-armor-healing', name: 'Armor / Healing', subfamily: 'combined',
        fluff: 'You are hard to hurt, and you mend what still lands.',
        perLevel: (lvl) => ({
            text: `Gain **+${COMB_ARMOR_HEAL.armor[lvl - 1]} Armor**. At the start of your turn, heal **${COMB_ARMOR_HEAL.heal[lvl - 1]} HP**.`,
            mechanics: {
                armor: COMB_ARMOR_HEAL.armor[lvl - 1],
                regen: COMB_ARMOR_HEAL.heal[lvl - 1],
            },
        }),
    }),
    basePassive({
        id: 'passive-armor-health', name: 'Armor / Health', subfamily: 'combined',
        fluff: 'Tough skin, deep reserves.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const armorStr = `**+${COMB_ARMOR_HEALTH.armor[lvl - 1]} Armor**`;
            const text = barStr ? `Gain ${armorStr} and ${barStr}.` : `Gain ${armorStr}.`;
            return { text, mechanics: { armor: COMB_ARMOR_HEALTH.armor[lvl - 1] } };
        },
    }),
    basePassive({
        id: 'passive-evade-temp-hp', name: 'Evade / Temporary HP', subfamily: 'combined',
        fluff: 'Slip what you can; buffer what you can’t.',
        perLevel: (lvl) => ({
            text: `Gain **+${COMB_EVADE_THP.evade[lvl - 1]} Evade**. At the start of combat, gain **${COMB_EVADE_THP.thp[lvl - 1]} Temporary HP**.`,
            mechanics: {
                evade: COMB_EVADE_THP.evade[lvl - 1],
                triggers: { combatStart: { tempHP: String(COMB_EVADE_THP.thp[lvl - 1]) } },
            },
        }),
    }),
    basePassive({
        id: 'passive-evade-healing', name: 'Evade / Healing', subfamily: 'combined',
        fluff: 'Hard to hit, quick to mend.',
        perLevel: (lvl) => ({
            text: `Gain **+${COMB_EVADE_HEAL.evade[lvl - 1]} Evade**. At the start of your turn, heal **${COMB_EVADE_HEAL.heal[lvl - 1]} HP**.`,
            mechanics: {
                evade: COMB_EVADE_HEAL.evade[lvl - 1],
                regen: COMB_EVADE_HEAL.heal[lvl - 1],
            },
        }),
    }),
    basePassive({
        id: 'passive-evade-damage', name: 'Evade / Damage', subfamily: 'combined',
        fluff: 'Nimble fighter, dangerous strikes.',
        perLevel: (lvl) => {
            const dmg = COMB_EVADE_DMG.dmg[lvl - 1];
            const tailText = dmg ? ` and **${dmg} Damage** on all damage rolls you make` : '';
            return {
                text: `Gain **+${COMB_EVADE_DMG.evade[lvl - 1]} Evade**${tailText}.`,
                mechanics: {
                    evade: COMB_EVADE_DMG.evade[lvl - 1],
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                },
            };
        },
    }),
    basePassive({
        id: 'passive-damage-healing', name: 'Damage / Healing', subfamily: 'combined',
        fluff: 'You hurt them; you mend yourself.',
        perLevel: (lvl) => {
            const dmg = COMB_DMG_HEAL.dmg[lvl - 1];
            const heal = COMB_DMG_HEAL.heal[lvl - 1];
            const head = dmg ? `Gain **${dmg} Damage** on all damage rolls you make. ` : '';
            return {
                text: `${head}At the start of your turn, heal **${heal} HP**.`,
                mechanics: {
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    regen: heal,
                },
            };
        },
    }),
    basePassive({
        id: 'passive-damage-temp-hp', name: 'Damage / Temporary HP', subfamily: 'combined',
        fluff: 'Your aggression steels you against retaliation.',
        perLevel: (lvl) => {
            const dmg = COMB_DMG_THP.dmg[lvl - 1];
            const thp = COMB_DMG_THP.thp[lvl - 1];
            const head = dmg ? `Gain **${dmg} Damage** on all damage rolls you make. ` : '';
            return {
                text: `${head}At the start of combat, gain **${thp} Temporary HP**.`,
                mechanics: {
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    triggers: { combatStart: { tempHP: String(thp) } },
                },
            };
        },
    }),
    basePassive({
        id: 'passive-awareness-evade', name: 'Awareness / Evade', subfamily: 'combined',
        fluff: 'You see it coming and you’re already gone.',
        perLevel: (lvl) => {
            const sense = combinedSenseCount(lvl);
            const tail = sense.count > 0 ? ` ${senseText(sense)}` : '';
            return {
                text: `Gain **+${COMB_AWARE_EVADE.evade[lvl - 1]} Evade**.${tail}`,
                mechanics: { evade: COMB_AWARE_EVADE.evade[lvl - 1] },
            };
        },
    }),
    basePassive({
        id: 'passive-awareness-damage', name: 'Awareness / Damage', subfamily: 'combined',
        fluff: 'You see the opening and you take it.',
        perLevel: (lvl) => {
            const dmg = COMB_AWARE_DMG.dmg[lvl - 1];
            const sense = combinedSenseCount(lvl);
            const head = dmg ? `Gain **${dmg} Damage** on all damage rolls you make.` : '';
            const tail = sense.count > 0 ? ` ${senseText(sense)}` : '';
            const text = (head + tail).trim() || '—';
            return {
                text,
                mechanics: dmg ? { damageRider: { flat: dmg } } : {},
            };
        },
    }),
    basePassive({
        id: 'passive-health-healing', name: 'Health / Healing', subfamily: 'combined',
        fluff: 'Deep reserves that refill themselves.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const heal = COMB_HEALTH_HEAL.heal[lvl - 1];
            const head = barStr ? `Gain ${barStr}. ` : '';
            return {
                text: `${head}At the start of your turn, heal **${heal} HP**.`,
                mechanics: { regen: heal },
            };
        },
    }),
    basePassive({
        id: 'passive-health-temp-hp', name: 'Health / Temporary HP', subfamily: 'combined',
        fluff: 'More life, more buffer.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const thp = COMB_HEALTH_THP.thp[lvl - 1];
            const head = barStr ? `Gain ${barStr}. ` : '';
            return {
                text: `${head}At the start of combat, gain **${thp} Temporary HP**.`,
                mechanics: { triggers: { combatStart: { tempHP: String(thp) } } },
            };
        },
    }),
    // ─── Conditional Combined (gated) ───────────────────────────────────
    basePassive({
        id: 'conditional-passive-armor-temp-hp', name: 'Armor / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'An ally beside you turns your frame into a bulwark.',
        perLevel: (lvl) => ({
            text: `While adjacent to at least one ally, gain **+${CC_ARMOR_THP.armor[lvl - 1]} Armor**. At the start of combat, if you are adjacent to at least one ally, gain **${CC_ARMOR_THP.thp[lvl - 1]} Temporary HP**.`,
            mechanics: {
                armor: CC_ARMOR_THP.armor[lvl - 1],
                triggers: { combatStart: { tempHP: String(CC_ARMOR_THP.thp[lvl - 1]) } },
                conditionExpr: 'self.adjacentAllies >= 1',
            },
        }),
    }),
    basePassive({
        id: 'conditional-passive-armor-healing', name: 'Armor / Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Plant your feet and the world starts healing you.',
        perLevel: (lvl) => ({
            text: `If you moved **0 m** on your last turn, gain **+${CC_ARMOR_HEAL.armor[lvl - 1]} Armor** and heal **${CC_ARMOR_HEAL.heal[lvl - 1]} HP** at the start of your turn.`,
            mechanics: {
                armor: CC_ARMOR_HEAL.armor[lvl - 1],
                regen: CC_ARMOR_HEAL.heal[lvl - 1],
                conditionExpr: 'self.lastTurnMoved == 0',
            },
        }),
    }),
    basePassive({
        id: 'conditional-passive-armor-health', name: 'Armor / Health (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Beside an ally, your body becomes its own second wall.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const base = `While adjacent to at least one ally, gain **+${CC_ARMOR_HEALTH.armor[lvl - 1]} Armor**.`;
            const tail = barStr
                ? ` At the start of combat, if you are adjacent to at least one ally, gain ${barStr} for that combat.`
                : '';
            return {
                text: base + tail,
                mechanics: {
                    armor: CC_ARMOR_HEALTH.armor[lvl - 1],
                    conditionExpr: 'self.adjacentAllies >= 1',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-evade-temp-hp', name: 'Evade / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Motion buys you space and a heartbeat’s worth of armor.',
        perLevel: (lvl) => ({
            text: `If you moved at least **8 m** on your turn, gain **+${CC_EVADE_THP.evade[lvl - 1]} Evade** until the start of your next turn. Once per combat, after you first move at least **8 m**, gain **${CC_EVADE_THP.thp[lvl - 1]} Temporary HP**.`,
            mechanics: {
                evade: CC_EVADE_THP.evade[lvl - 1],
                triggers: { combatStart: { tempHP: String(CC_EVADE_THP.thp[lvl - 1]) } },
                conditionExpr: 'self.turnMoved >= 8',
            },
        }),
    }),
    basePassive({
        id: 'conditional-passive-evade-healing', name: 'Evade / Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'You move, you mend.',
        perLevel: (lvl) => ({
            text: `If you moved at least **8 m** on your last turn, gain **+${CC_EVADE_HEAL.evade[lvl - 1]} Evade** and heal **${CC_EVADE_HEAL.heal[lvl - 1]} HP** at the start of your turn.`,
            mechanics: {
                evade: CC_EVADE_HEAL.evade[lvl - 1],
                regen: CC_EVADE_HEAL.heal[lvl - 1],
                conditionExpr: 'self.lastTurnMoved >= 8',
            },
        }),
    }),
    basePassive({
        id: 'conditional-passive-evade-damage', name: 'Evade / Damage (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Speed sharpens into a blade.',
        perLevel: (lvl) => {
            const dmg = CC_EVADE_DMG.dmg[lvl - 1];
            const base = `If you moved at least **8 m** this turn, gain **+${CC_EVADE_DMG.evade[lvl - 1]} Evade** until the start of your next turn`;
            const tail = dmg ? ` and **${dmg} Damage** on all damage rolls you make until the end of your turn` : '';
            return {
                text: `${base}${tail}.`,
                mechanics: {
                    evade: CC_EVADE_DMG.evade[lvl - 1],
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    conditionExpr: 'self.turnMoved >= 8',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-damage-healing', name: 'Damage / Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Your own blood teaches you how to strike and endure at once.',
        perLevel: (lvl) => {
            const dmg = CC_DMG_HEAL.dmg[lvl - 1];
            const heal = CC_DMG_HEAL.heal[lvl - 1];
            const dmgStr = dmg ? `gain **${dmg} Damage** on all damage rolls you make and ` : '';
            return {
                text: `While you are affected by **Bleeding**, ${dmgStr}heal **${heal} HP** at the start of your turn.`,
                mechanics: {
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    regen: heal,
                    conditionExpr: 'self.hasSpecial.bleeding',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-damage-temp-hp', name: 'Damage / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Charge in; the shock buffers you on the way.',
        perLevel: (lvl) => {
            const dmg = CC_DMG_THP.dmg[lvl - 1];
            const thp = CC_DMG_THP.thp[lvl - 1];
            const head = dmg
                ? `If you moved at least **8 m** this turn, gain **${dmg} Damage** on all damage rolls you make until the end of your turn. `
                : '';
            return {
                text: `${head}Once per combat, after you first move at least **8 m**, gain **${thp} Temporary HP**.`,
                mechanics: {
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    triggers: { combatStart: { tempHP: String(thp) } },
                    conditionExpr: 'self.turnMoved >= 8',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-awareness-evade', name: 'Awareness / Evade (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Your extra senses bend your body out of the blow.',
        perLevel: (lvl) => {
            const sense = combinedSenseCount(lvl);
            const senseStr = sense.count > 0 ? `${senseText(sense)} ` : '';
            return {
                text: `${senseStr}Against creatures you perceive through a Combat Sense other than sight, gain **+${CC_AWARE_EVADE.evade[lvl - 1]} Evade**.`,
                mechanics: {
                    evade: CC_AWARE_EVADE.evade[lvl - 1],
                    conditionExpr: 'target.perceivedByNonSightSense',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-awareness-damage', name: 'Awareness / Damage (Conditional)', subfamily: 'conditional-combined',
        fluff: 'You hear, smell, feel the target — and the blow lands clean.',
        perLevel: (lvl) => {
            const dmg = CC_AWARE_DMG.dmg[lvl - 1];
            const sense = combinedSenseCount(lvl);
            const senseStr = sense.count > 0 ? `${senseText(sense)} ` : '';
            if (!dmg) {
                return {
                    text: senseStr.trim() || '—',
                    mechanics: {},
                };
            }
            return {
                text: `${senseStr}Against targets you perceive through a Combat Sense other than sight, gain **${dmg} Damage** on damage rolls you make.`,
                mechanics: {
                    damageRider: { flat: dmg },
                    conditionExpr: 'target.perceivedByNonSightSense',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-health-healing', name: 'Health / Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'The worse it gets, the harder your body fights back.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const heal = CC_HEALTH_HEAL.heal[lvl - 1];
            const head = barStr
                ? `At the start of combat, if you are Wounded or worse, gain ${barStr} for that combat. `
                : '';
            return {
                text: `${head}At the start of your turn, if you are **Wounded or worse**, heal **${heal} HP**.`,
                mechanics: { regen: heal, conditionExpr: 'self.healthState <= wounded' },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-health-temp-hp', name: 'Health / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Allies at your side, extra life in your bones.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const thp = CC_HEALTH_THP.thp[lvl - 1];
            const barTail = barStr ? `gain ${barStr} for that combat and ` : '';
            return {
                text: `At the start of combat, if you are adjacent to at least one ally, ${barTail}gain **${thp} Temporary HP**.`,
                mechanics: {
                    triggers: { combatStart: { tempHP: String(thp) } },
                    conditionExpr: 'self.adjacentAllies >= 1',
                },
            };
        },
    }),
    // ─── Passive Special Aura (fixed +1 step on chosen Special(X)) ───────
    basePassive({
        id: 'passive-special-aura', name: 'Special Aura', subfamily: 'special-aura',
        fluff: 'Choose one eligible diminishing Special(X). Inside your aura, it bites a little deeper.',
        perLevel: (lvl) => {
            const radius = specialAuraRadius(lvl);
            if (radius === 0)
                return { text: '—', mechanics: {} };
            return {
                text: `While a creature inside your **${radius} m** aura is already affected by your chosen eligible **Special(X)**, increase that Special by **+1 step**. This aura never applies, refreshes, extends, spreads, or triggers the Special.`,
                mechanics: { modifySpecial: { type: 'chosen', mode: 'increaseExisting', amount: 1 } },
            };
        },
    }),
    // ─── Buff Empowerment (artifact lineage meta-passives) ───────────────
    EMPOWER_BUFF_TEMPLATES[0],
    EMPOWER_BUFF_TEMPLATES[1],
    EMPOWER_BUFF_TEMPLATES[2],
    EMPOWER_BUFF_TEMPLATES[3],
];
//# sourceMappingURL=passives.js.map
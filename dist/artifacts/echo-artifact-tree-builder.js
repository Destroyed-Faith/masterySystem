/**
 * Echo Artifact Tree Builder (pure)
 *
 * Turns an `EchoArtifactDefinition` (see `src/utils/echo-artifacts.ts`) into a
 * full Artifact Builder *tree*: one Folder + ten linked `artifact` node items
 * (Level 1 .. Level 10), exactly the shape the Node Editor / Artifact Builder
 * produce. Nodes are linked through the stable custom `nodeId` flags
 * (`parentIds` / `childIds`), NOT document `_id`, so a generated tree survives
 * compendium import and duplication intact.
 *
 * This module is **pure**: no Foundry globals, no `game`, no DOM, no random.
 * Node ids are deterministic (`<key>-l<level>`) so repeated builds — at runtime
 * seeding and at pack-compile time (plain Node) — produce identical, stable
 * trees. That is exactly what lets the world library and the shipped pack stay
 * in sync with zero drift.
 */
import { ECHO_ARTIFACTS, buildEchoStoneFunction, buildEchoProgressionPicks, } from '../utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../utils/general-artifacts.js';
import { artifactArmorBonusForLevel, artifactArmorEvadeForLevel, feetEvadeForLevel, minorArmorForLevel, weaponDamageForLevel, spellFocusForLevel, } from '../utils/artifact-base-derive.js';
import { getArmorDefinitionForType } from '../utils/equipment.js';
import { resolveFullLevelProgression, visibleAbilityRows, } from '../utils/artifact-visible-abilities.js';
import { getMinorMovementBaselineB, getPaperdollSlotsForArtifact, } from '../utils/artifact-rules.js';
import { getEchoArtifactAltIcon, getEchoArtifactIcon } from '../utils/item-icons.js';
/**
 * Content version of the generated trees. Bump this whenever the generator's
 * output (base values, powers, slot/profile, etc.) changes so the world seeder
 * can detect stale library copies and refresh them in place.
 */
export const ECHO_ARTIFACT_SEED_VERSION = 52;
const ARTIFACT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ALL_POWER_LEVEL_KEYS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
];
// ---------------------------------------------------------------------------
// Per-level Base Value tables (exact, per the Player's Guide / Artefacts.md)
// ---------------------------------------------------------------------------
/** Two-handed weapon damage — 4d8 base + 1d8 per level (5d8 L1 … 14d8 L10). */
function twoHandedEchoDamageForLevel(level) {
    return weaponDamageForLevel(level, 'twoHandedWeapon');
}
/** Dragon Claws printed damage table — 4d8 L1 … 16d8 L10 (PG "Claw / Tail Base"). */
const DRAGON_CLAWS_DAMAGE_TABLE = [4, 5, 6, 8, 9, 10, 12, 14, 15, 16];
function dragonClawsDamageForLevel(level) {
    return `${DRAGON_CLAWS_DAMAGE_TABLE[clampLevel(level) - 1]}d8`;
}
/** Dragon Claws Penetration — (2) L4, (3) L5-6, (4) L7-8, (5) L9-10. */
const DRAGON_CLAWS_PENETRATION_TABLE = [0, 0, 0, 2, 3, 3, 4, 4, 5, 5];
function dragonClawsPenetrationForLevel(level) {
    return DRAGON_CLAWS_PENETRATION_TABLE[clampLevel(level) - 1];
}
/** Dragon Claws Brutal Impact — (4) L7-8, (5) L9-10. */
const DRAGON_CLAWS_BRUTAL_TABLE = [0, 0, 0, 0, 0, 0, 4, 4, 5, 5];
function dragonClawsBrutalForLevel(level) {
    return DRAGON_CLAWS_BRUTAL_TABLE[clampLevel(level) - 1];
}
/** Stonebound Soles Tunneling — +1 m L4-5, +2 m L6-7, +3 m L8-9, +4 m L10. */
function tunnelingMetersForLevel(level) {
    const l = clampLevel(level);
    if (l < 4)
        return 0;
    if (l >= 10)
        return 4;
    return Math.floor((l - 2) / 2);
}
/** Value-based Weapon Special rank by Artifact level breakpoints (L1/L4/L7/L10). */
function weaponSpecialRankForLevel(table, level) {
    const l = clampLevel(level);
    if (l >= 10)
        return table[3];
    if (l >= 7)
        return table[2];
    if (l >= 4)
        return table[1];
    return table[0];
}
function clampLevel(level) {
    return Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
}
/** Scent of Blood tier — Detect L4, Locate L7, Identify L10. */
// --- General-artifact per-level tables (Artifact Examples, Player's Guide) ---
/** One-handed weapon damage — 2d8 at Level 1, then +1d8 per level (2d8 … 11d8). */
function oneHandedGeneralDamageForLevel(level) {
    return weaponDamageForLevel(level, 'oneHandedWeapon');
}
/** Staff of the Dark Spell Focus Bonus — one-handed: 1:1 weapon damage (+2d8 L1 … +11d8 L10). */
function staffSpellFocusBonusForLevel(level) {
    return spellFocusForLevel(level, 'oneHandedWeapon');
}
/** Staff of the Dark Hex rank — Hex(2) L4-5, Hex(3) L6-7, Hex(4) L8-9, Hex(5) L10. */
function hexRankForLevel(level) {
    const l = clampLevel(level);
    if (l >= 10)
        return 5;
    if (l >= 8)
        return 4;
    if (l >= 6)
        return 3;
    return 2;
}
/** Starfallen Forceshield Shield Value — +4,+4,+4,+5,+5,+5,+6,+6,+6,+8. */
const STARFALLEN_SHIELD_TABLE = [4, 4, 4, 5, 5, 5, 6, 6, 6, 8];
function starfallenShieldValueForLevel(level) {
    return STARFALLEN_SHIELD_TABLE[clampLevel(level) - 1];
}
/** Heart of Winter Shield Armor — +5 (L1) … +14 (L10); includes Medium Shield +4. */
function heartOfWinterShieldArmorForLevel(level) {
    return clampLevel(level) + 4;
}
/** Heartseeker artifact Precision bonus — 0 (L1–3), 2/3/4 from L4/L7/L10 (stacks on crossbow Precision(4)). */
function heartseekerPrecisionBonusForLevel(level) {
    return weaponSpecialRankForLevel([0, 2, 3, 4], level);
}
/** Falcon Wide Brim Evade — +1 (L1–2), +2 (L3–4), … +5 (L9–10). */
function falconWideBrimEvadeForLevel(level) {
    return Math.ceil(clampLevel(level) / 2);
}
/** Predator Sense label unlocks at L4. */
function falconPredatorSenseForLevel(level) {
    return clampLevel(level) >= 4 ? 'Predator Sense' : '';
}
/** Frostbound Returning Axe thrown range — 9 m (L4) … 15 m (L10). */
function frostboundThrownRangeForLevel(level) {
    return clampLevel(level) + 5;
}
/** Lor-Keth's Staff weapon damage — two-handed: 4d8 base + 1d8/level (5d8 … 14d8). */
function lorKethStaffDamageForLevel(level) {
    return weaponDamageForLevel(level, 'twoHandedWeapon');
}
/** Lor-Keth's Staff Storm Rune tier — Shock Rune L4-6, Greater L7-9, True L10. */
function lorKethStormRuneForLevel(level) {
    const l = clampLevel(level);
    if (l < 4)
        return '';
    if (l >= 10)
        return 'True Shock Rune';
    if (l >= 7)
        return 'Greater Shock Rune';
    return 'Shock Rune';
}
/** Lor-Keth's Staff Giant Weight tier — Giant Weight L7-9, True L10. */
function lorKethGiantWeightForLevel(level) {
    const l = clampLevel(level);
    if (l < 7)
        return '';
    if (l >= 10)
        return 'True Giant Weight';
    return 'Giant Weight';
}
/** Unbound weapon / bite / staff / scourge — 4d8 L1 … 12d8 L9, 14d8 L10. */
function unboundGuideDamageForLevel(level) {
    const l = clampLevel(level);
    return `${l >= 10 ? 14 : l + 3}d8`;
}
/** Witch Tradition Special — 2 at L4–5, 3 at L6–7, 4 at L8–9, 5 at L10. */
function witchTraditionSpecialForLevel(level) {
    const l = clampLevel(level);
    if (l >= 10)
        return 5;
    if (l >= 8)
        return 4;
    if (l >= 6)
        return 3;
    return 2;
}
/** Hunter's Scourge extra Reach beyond the Whip's +1 m. */
function huntersScourgeExtraReachForLevel(level) {
    const l = clampLevel(level);
    if (l < 4)
        return '';
    if (l >= 10)
        return '+4 m';
    if (l >= 8)
        return '+3 m';
    if (l >= 6)
        return '+2 m';
    return '+1 m';
}
const BODY_ARMOR_CLASS_NOTE = {
    light: 'Light Armor Artifact: Armor + Evade on slot A. No Initiative or Physical Skill penalty.',
    medium: 'Medium Armor Artifact: Armor + Final Evade on slot A (Final includes −2). Keeps −4 Initiative and −1d8 Physical Skills.',
    heavy: 'Heavy Armor Artifact: Armor + Final Evade on slot A (Final includes −4). Keeps −8 Initiative and −2d8 Physical Skills.',
};
const BODY_ARMOR_LABEL = {
    light: 'Light Armor',
    medium: 'Medium Armor',
    heavy: 'Heavy Armor',
};
/** Canonical Body Armor Base Values: Armor + Evade, both on slot A from Level 1. */
function bodyArmorBaseValueSpecs(weight, opts) {
    return [
        {
            slot: 'a',
            type: 'bodyArmor',
            label: opts?.armorLabel || BODY_ARMOR_LABEL[weight],
            armorWeightClass: weight,
            unlock: 1,
            valueAt: (l) => artifactArmorBonusForLevel(weight, l),
            note: BODY_ARMOR_CLASS_NOTE[weight],
        },
        {
            slot: 'a',
            type: 'evade',
            label: opts?.evadeLabel || 'Evade',
            unlock: 1,
            valueAt: (l) => artifactArmorEvadeForLevel(weight, l),
            note: 'Final Evade Modifier for this Artifact armor weight class (slot A).',
        },
    ];
}
/**
 * Per-echo-artifact Base Value tables. The numbers are the system's canonical
 * baselines (see `artifact-base-derive.ts` / Artefacts.md). Echo body armor
 * stores the artifact bonus only; mundane Light/Medium/Heavy base is added at runtime.
 * Every Artifact Body Armor also stores Final Evade as a second slot-A Base Value.
 */
const BASE_VALUE_TABLES = {
    // PG "Stonebound Soles Base": A = Armor (+1 L1 … +5 L9-10), B = Tunneling
    // (+1 m L4-5 … +4 m L10). Tremor Sense is a Sense Slot option, not A/B.
    stoneboundSoles: [
        { slot: 'a', type: 'headArmor', label: 'Armor (Feet)', unlock: 1, valueAt: (l) => minorArmorForLevel(l) },
        {
            slot: 'b',
            type: 'minorFeature',
            label: 'Tunneling',
            unlock: 4,
            valueAt: (l) => `+${tunnelingMetersForLevel(l)} m`,
            note: 'Tunneling is not Burrow — digging, mining, and moving through workable tunnel material.',
        },
        {
            slot: 'c',
            type: 'sense',
            label: 'Tremor Sense',
            unlock: 1,
            valueAt: () => '20 m',
            note: 'Sense Slot option. Does not scale with Artifact Level; works through a shared solid surface.',
        },
    ],
    elorianStride: [
        { slot: 'a', type: 'evade', label: 'Evade', unlock: 1, valueAt: (l) => feetEvadeForLevel(l) },
        { slot: 'b', type: 'movement', label: 'Movement', unlock: 4, valueAt: (l) => getMinorMovementBaselineB(l) },
    ],
    titanScars: bodyArmorBaseValueSpecs('medium', { armorLabel: 'Medium Echo Armor' }),
    ringchainOfKeptNames: [],
    // Heavy Artifact Armor progression (Armor 12→16, Final Evade −4→−2).
    wyrmScalesHeavy: bodyArmorBaseValueSpecs('heavy', { armorLabel: 'Heavy Echo Armor' }),
    wyrmScalesLight: bodyArmorBaseValueSpecs('light', { armorLabel: 'Light Echo Armor' }),
    // PG "Claw / Tail Base": printed per-level table (4d8 L1 … 16d8 L10;
    // Penetration 2→5 from L4; Brutal Impact 4→5 from L7).
    dragonClaws: [
        { slot: 'a', type: 'weaponDamage', label: 'Claw / Tail Damage', unlock: 1, valueAt: (l) => dragonClawsDamageForLevel(l) },
        { slot: 'b', type: 'weaponSpecial', label: 'Penetration', unlock: 4, valueAt: (l) => dragonClawsPenetrationForLevel(l) },
        { slot: 'c', type: 'weaponSpecial', label: 'Brutal Impact', unlock: 7, valueAt: (l) => dragonClawsBrutalForLevel(l) },
    ],
    sentinelFrame: bodyArmorBaseValueSpecs('light', { armorLabel: 'Light Echo Armor' }),
    judicatorFrame: bodyArmorBaseValueSpecs('light', { armorLabel: 'Light Echo Armor' }),
    oracleFrame: bodyArmorBaseValueSpecs('light', { armorLabel: 'Light Echo Armor' }),
    // PG "Bite and Head Armor Base": A = Bite 1d8/level, B = Head Armor (+1 L1
    // … +5 L9-10). Predator Sense is a Sense Slot option, not a Base Value.
    dragonHead: [
        { slot: 'a', type: 'weaponDamage', label: 'Bite Weapon Damage', unlock: 1, valueAt: (l) => weaponDamageForLevel(l) },
        { slot: 'b', type: 'headArmor', label: 'Head Armor', unlock: 1, valueAt: (l) => minorArmorForLevel(l) },
        {
            slot: 'c',
            type: 'sense',
            label: 'Predator Sense',
            unlock: 1,
            valueAt: () => '20 m',
            note: 'Sense Slot option. Does not scale with Artifact Level.',
        },
    ],
    ...Object.fromEntries(['predatorCrownMight', 'predatorCrownWits', 'predatorCrownIntellect'].map((key) => [
        key,
        [
            { slot: 'a', type: 'weaponDamage', label: 'Bite Damage', unlock: 1, valueAt: (l) => unboundGuideDamageForLevel(l) },
            { slot: 'b', type: 'headArmor', label: 'Head Armor', unlock: 1, valueAt: (l) => minorArmorForLevel(l) },
            {
                slot: 'c',
                type: 'sense',
                label: 'Predator Sense',
                unlock: 1,
                valueAt: () => '20 m',
                note: 'Sense Slot option. Does not scale with Artifact Level.',
            },
        ],
    ])),
    ...Object.fromEntries([
        ['witchStaffRoot', 'Slow'],
        ['witchStaffRuin', 'Hex'],
        ['witchStaffBlight', 'Corrode'],
    ].map(([key, special]) => [
        key,
        [
            { slot: 'a', type: 'weaponDamage', label: 'Staff Damage', unlock: 1, valueAt: (l) => unboundGuideDamageForLevel(l) },
            {
                slot: 'b',
                type: 'weaponSpecial',
                label: special,
                unlock: 4,
                valueAt: (l) => witchTraditionSpecialForLevel(l),
                note: `Tradition Special (${special}) applies only on a legal Staff attack or Power.`,
            },
            {
                slot: 'c',
                type: 'spellFocus',
                label: 'Spell Focus',
                unlock: 1,
                valueAt: (l) => spellFocusForLevel(l, 'twoHandedWeapon'),
                note: 'Spell Focus from Level 1. May be used with Intellect.',
            },
        ],
    ])),
    alchemistCoat: bodyArmorBaseValueSpecs('medium'),
    greenWardenMantle: bodyArmorBaseValueSpecs('medium'),
    huntersScourge: [
        { slot: 'a', type: 'weaponDamage', label: 'Scourge Damage', unlock: 1, valueAt: (l) => unboundGuideDamageForLevel(l) },
        {
            slot: 'b',
            type: 'weaponSpecial',
            label: 'Reach',
            unlock: 4,
            valueAt: (l) => huntersScourgeExtraReachForLevel(l),
            note: 'Keeps Whip Finesse and Reach (+1 m). Extra reach from Level 4.',
        },
    ],
    // --- General artifacts (Artifact Examples) ---
    moonlightGreatsword: [
        { slot: 'a', type: 'weaponDamage', label: 'Weapon Damage', unlock: 1, valueAt: (l) => twoHandedEchoDamageForLevel(l) },
        { slot: 'b', type: 'weaponSpecial', label: 'Requiem', unlock: 4, valueAt: (l) => weaponSpecialRankForLevel([0, 4, 8, 8], l) },
        { slot: 'c', type: 'weaponSpecial', label: 'Expose', unlock: 7, valueAt: (l) => weaponSpecialRankForLevel([0, 0, 4, 8], l) },
    ],
    soulSigil: bodyArmorBaseValueSpecs('light', {
        armorLabel: 'Light Armor',
        evadeLabel: 'Evade (Silver Veil)',
    }),
    frostboundReturningAxe: [
        { slot: 'a', type: 'weaponDamage', label: 'Weapon Damage', unlock: 1, valueAt: (l) => oneHandedGeneralDamageForLevel(l) },
        {
            slot: 'b',
            type: 'thrownRange',
            label: 'Thrown Return',
            unlock: 4,
            valueAt: (l) => `${frostboundThrownRangeForLevel(l)} m`,
            note: 'Returning: the Axe returns to the wielder after the attack resolves.',
        },
    ],
    shadowgraveArmor: bodyArmorBaseValueSpecs('light', {
        armorLabel: 'Hybrid Defense (Armor)',
        evadeLabel: 'Hybrid Defense (Evade)',
    }),
    staffOfTheDark: [
        {
            slot: 'a',
            type: 'minorFeature',
            label: 'Spell Focus Bonus',
            unlock: 1,
            valueAt: (l) => staffSpellFocusBonusForLevel(l),
            note: 'Added to damage of Spells cast through the Staff; never to weapon attacks.',
        },
        {
            slot: 'b',
            type: 'weaponSpecial',
            label: 'Hex',
            unlock: 4,
            valueAt: (l) => hexRankForLevel(l),
            note: 'Focus Special — applies only if the Spell can legally carry it.',
        },
    ],
    starfallenForceshield: [
        {
            slot: 'a',
            type: 'shieldValue',
            label: 'Shield Value',
            unlock: 1,
            valueAt: (l) => starfallenShieldValueForLevel(l),
            note: 'Drawback: -2d8 Physical Skill Checks. Stacks with Armor Value as normal Armor resolution.',
        },
    ],
    heartOfWinter: [
        {
            slot: 'a',
            type: 'shieldValue',
            label: 'Shield Armor',
            unlock: 1,
            valueAt: (l) => heartOfWinterShieldArmorForLevel(l),
            note: 'Includes Medium Shield +4. Drawback: -2d8 Physical Skill Checks.',
        },
    ],
    heartseeker: [
        {
            slot: 'a',
            type: 'weaponDamage',
            label: 'Weapon Damage',
            unlock: 1,
            valueAt: (l) => weaponDamageForLevel(l, 'twoHandedWeaponRanged'),
            note: 'Includes Heavy Crossbow 4d8 at Level 1, then +1d8 per level.',
        },
        {
            slot: 'b',
            type: 'weaponSpecial',
            label: 'Precision',
            unlock: 4,
            valueAt: (l) => heartseekerPrecisionBonusForLevel(l),
            note: 'Added to Heavy Crossbow Precision(4). True Heartseeker at L10.',
        },
    ],
    falconWideBrim: [
        {
            slot: 'a',
            type: 'evade',
            label: 'Evade',
            unlock: 1,
            valueAt: (l) => falconWideBrimEvadeForLevel(l),
            note: 'Wide brim conceals intent; final +5 Evade at L9–10.',
        },
        {
            slot: 'b',
            type: 'sense',
            label: 'Combat Sense',
            unlock: 4,
            valueAt: (l) => falconPredatorSenseForLevel(l),
            note: 'Predator Sense from L4.',
        },
    ],
    lanternOfTheHollowStar: [],
    lorKethsStaff: [
        { slot: 'a', type: 'weaponDamage', label: 'Staff Damage', unlock: 1, valueAt: (l) => lorKethStaffDamageForLevel(l) },
        {
            slot: 'b',
            type: 'sense',
            label: 'Storm Rune',
            unlock: 4,
            valueAt: (l) => lorKethStormRuneForLevel(l),
            note: 'Base item feature; does not create attacks, actions, Stone uses, or reactions by itself.',
        },
        {
            slot: 'c',
            type: 'sense',
            label: 'Giant Weight',
            unlock: 7,
            valueAt: (l) => lorKethGiantWeightForLevel(l),
            note: 'Base item feature; requires both hands.',
        },
    ],
};
// ---------------------------------------------------------------------------
// Level Progression row → embedded power mapping
// ---------------------------------------------------------------------------
/** Map the Player's-Guide "Type" column onto an embedded-power category. */
function categoryForRowType(rowType) {
    const t = String(rowType || '').toLowerCase();
    if (t.includes('reaction'))
        return 'reaction';
    if (t.includes('movement'))
        return 'movement';
    if (t.includes('active buff') || t.includes('buff'))
        return 'activeBuff';
    if (t.startsWith('active') || t === 'active' || t.includes('active,'))
        return 'active';
    // Catalog martial / attack row types (e.g. "Ranged AoE", "Melee", "Ranged
    // Single") are Actives that deliver an attack.
    if (t.includes('aoe') ||
        t.includes('attack') ||
        t === 'melee' ||
        t === 'ranged' ||
        t.startsWith('melee ') ||
        t.startsWith('ranged ')) {
        return 'active';
    }
    // Stone Functions, Support, Base Armor, Passive, Ultimate → passive (descriptive).
    return 'passive';
}
function actionCostForCategory(cat) {
    switch (cat) {
        case 'active':
            return 'attack';
        case 'activeBuff':
            return 'full';
        case 'reaction':
            return 'reaction';
        case 'movement':
            return 'movement';
        case 'passive':
        default:
            return 'none';
    }
}
/** Power Level a power is granted at, by Artifact Stage (Basic 4 / Improved 10 / Greater 16). */
function powerLevelForArtifactLevel(level) {
    const l = clampLevel(level);
    if (l <= 3)
        return '4';
    if (l <= 6)
        return '10';
    return '16';
}
function parseRange(raw) {
    const s = String(raw || '').trim();
    if (!s || s === '-' || s === '—')
        return null;
    const low = s.toLowerCase();
    if (low === 'self')
        return { kind: 'self' };
    if (low.includes('touch'))
        return { kind: 'touch' };
    if (low.includes('melee') || low.includes('reach'))
        return { kind: 'melee' };
    if (low.includes('thrown'))
        return { kind: 'distance', note: 'Thrown Range' };
    const m = s.match(/(\d+)\s*m/);
    if (m)
        return { kind: 'distance', m: Number(m[1]) };
    return { kind: 'self', note: s };
}
function parseAoe(raw) {
    const s = String(raw || '').trim();
    if (!s || s === '-' || s === '—')
        return null;
    const m = s.match(/(\d+)\s*m/);
    const meters = m ? Number(m[1]) : undefined;
    const low = s.toLowerCase();
    if (low.includes('cone'))
        return { shape: 'cone', m: meters, radiusM: meters };
    if (low.includes('line'))
        return { shape: 'line', m: meters, lengthM: meters };
    if (low.includes('aura'))
        return { shape: 'aura', m: meters, radiusM: meters };
    if (low.includes('radius') || meters != null)
        return { shape: 'radius', m: meters, radiusM: meters };
    return { shape: 'radius', note: s };
}
function parseDuration(raw) {
    const s = String(raw || '').trim();
    const low = s.toLowerCase();
    if (!s || low === 'instant')
        return { kind: 'instant' };
    if (low.includes('mastery rank'))
        return { kind: 'masteryRankRounds' };
    if (low.includes('mastery'))
        return { kind: 'masteryRounds' };
    if (low.includes('passive') || low.includes('permanent'))
        return { kind: 'scene' };
    const m = s.match(/(\d+)\s*round/);
    if (m)
        return { kind: 'rounds', rounds: Number(m[1]) };
    if (low.includes('round'))
        return { kind: 'rounds', rounds: 1 };
    if (low.includes('trigger'))
        return { kind: 'untilNextTurn', note: s };
    if (low === 'special')
        return { kind: 'instant', note: 'Special' };
    return { kind: 'instant', note: s };
}
function emptyLevelRow() {
    return { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] };
}
/** Build the EmbeddedPowerData for a single Level Progression row of an artifact. */
function buildEmbeddedPower(echoArtifactKey, row) {
    const category = categoryForRowType(row.type);
    const plKey = powerLevelForArtifactLevel(row.level);
    const levels = {};
    for (const k of ALL_POWER_LEVEL_KEYS)
        levels[k] = emptyLevelRow();
    levels[plKey] = {
        type: row.type || '',
        range: parseRange(row.range),
        aoe: parseAoe(row.aoe),
        duration: parseDuration(row.duration),
        effect: { text: row.effect || '' },
        specials: [],
        lvl: row.level,
    };
    const tags = [];
    const lowType = String(row.type || '').toLowerCase();
    if (lowType.includes('spell') || row.isSpell)
        tags.push('spell');
    if (lowType.includes('stone'))
        tags.push('stone-function');
    return {
        id: `${echoArtifactKey}-pw-${row.level}`,
        name: row.name,
        fluff: row.special ? `Special: ${row.special}` : undefined,
        category,
        tags,
        cost: { action: actionCostForCategory(category) },
        levels,
    };
}
// ---------------------------------------------------------------------------
// Tree assembly
// ---------------------------------------------------------------------------
function deriveArtifactKind(baseProfile) {
    switch (baseProfile) {
        case 'oneHandedWeapon':
        case 'oneHandedWeaponRanged':
        case 'twoHandedWeapon':
        case 'twoHandedWeaponRanged':
            return 'weapon';
        case 'shield':
            return 'shield';
        case 'bodyArmor':
        case 'noArmorBody':
        case 'robe':
            return 'armor';
        default:
            return 'gear';
    }
}
function iconForKind(kind) {
    switch (kind) {
        case 'weapon':
            return 'icons/svg/sword.svg';
        case 'shield':
            return 'icons/svg/shield.svg';
        case 'armor':
            return 'icons/svg/statue.svg';
        default:
            return 'icons/svg/upgrade.svg';
    }
}
/** Resolve the exact Base Values present on a node at the given artifact level. */
function baseValuesAtLevel(echoArtifactKey, level) {
    const specs = BASE_VALUE_TABLES[echoArtifactKey] || [];
    const out = [];
    for (const spec of specs) {
        if (level < spec.unlock)
            continue; // slot not unlocked yet at this level
        out.push({
            slot: spec.slot,
            type: spec.type,
            label: spec.label,
            value: spec.valueAt(level),
            note: spec.note,
            isBaseline: true,
            ...(spec.armorWeightClass ? { armorWeightClass: spec.armorWeightClass } : {}),
            ...(spec.evadeModifierAt ? { evadeModifier: spec.evadeModifierAt(level) } : {}),
            ...(spec.initiativeModifierAt ? { initiativeModifier: spec.initiativeModifierAt(level) } : {}),
        });
    }
    return out;
}
/** Weapon profile for weapon-kind echo artifacts at the given level (damage scales). */
function weaponProfileAtLevel(def, level) {
    const table = BASE_VALUE_TABLES[def.key] || [];
    const hasSpellFocus = table.some((b) => b.type === 'spellFocus');
    const dmgBv = table.find((b) => b.type === 'weaponDamage');
    // Pure Spell Focus weapons (no weaponDamage row) deal no weapon damage.
    // Witch Staffs carry both Staff Damage and Spell Focus.
    const damage = dmgBv
        ? String(dmgBv.valueAt(level))
        : hasSpellFocus
            ? '0'
            : weaponDamageForLevel(level, def.baseProfile);
    const isRanged = def.baseProfile === 'oneHandedWeaponRanged' || def.baseProfile === 'twoHandedWeaponRanged';
    const hands = def.baseProfile === 'twoHandedWeapon' || def.baseProfile === 'twoHandedWeaponRanged' ? 2 : 1;
    const base = {
        weaponType: isRanged ? 'ranged' : 'melee',
        damage,
        range: '0m',
        hands,
        innateAbilities: [],
        specials: [],
    };
    if (def.key === 'huntersScourge') {
        const reachBv = table.find((b) => b.type === 'weaponSpecial' && b.label === 'Reach');
        const extra = reachBv && level >= reachBv.unlock ? String(reachBv.valueAt(level) || '') : '';
        const reachLabel = extra ? `Reach (+1 m, ${extra})` : 'Reach (+1 m)';
        return {
            ...base,
            weaponType: 'melee',
            hands: 2,
            innateAbilities: ['Finesse', reachLabel],
            specials: [{ specialId: 'finesse' }, { specialId: 'reach', value: 1 }],
        };
    }
    if (def.key === 'heartseeker') {
        const precBv = table.find((b) => b.type === 'weaponSpecial' && b.label === 'Precision');
        const artifactPrec = precBv && level >= precBv.unlock ? Number(precBv.valueAt(level)) || 0 : 0;
        return {
            ...base,
            weaponType: 'ranged',
            range: '32m',
            hands: 2,
            innateAbilities: ['Ranged (32 m)', 'Load'],
            specials: [
                { specialId: 'penetration', value: 4 },
                { specialId: 'precision', value: 4 + artifactPrec },
            ],
        };
    }
    return base;
}
/**
 * Natural-weapon profile for a non-weapon-slot artifact that still grants a
 * usable attack (e.g. Dragon Head's Bite). Damage comes from the artifact's
 * `weaponDamage` Base Value table so it scales 1d8…10d8 across levels.
 */
function naturalWeaponProfileAtLevel(def, level) {
    const nw = def.naturalWeapon;
    const dmgBv = (BASE_VALUE_TABLES[def.key] || []).find((b) => b.type === 'weaponDamage');
    const damage = dmgBv ? String(dmgBv.valueAt(level)) : weaponDamageForLevel(level);
    const weaponType = nw.weaponType || 'melee';
    const hands = Number.isFinite(nw.hands) ? Number(nw.hands) : 0;
    const range = weaponType === 'ranged' && nw.rangeM ? `${nw.rangeM}m` : '0m';
    return {
        weaponType,
        damage,
        range,
        hands,
        isNatural: true,
        innateAbilities: [],
        specials: nw.specials || [],
        ...(nw.name ? { name: nw.name } : {}),
    };
}
/** Shield profile for shield-kind artifacts at the given level (Shield Value scales). */
function shieldProfileAtLevel(def, level) {
    const shieldBv = (BASE_VALUE_TABLES[def.key] || []).find((b) => b.type === 'shieldValue');
    const shieldValue = shieldBv ? Number(shieldBv.valueAt(level)) || 0 : 0;
    return { type: 'medium', shieldValue, evadeBonus: 0, skillPenalty: '-2d8 Physical Skill Checks' };
}
/** Body armor profile for armor-kind artifacts (weight class + level progression). */
function armorProfileAtLevel(def, level) {
    const bodySpec = (BASE_VALUE_TABLES[def.key] || []).find((b) => b.type === 'bodyArmor');
    if (!bodySpec?.armorWeightClass)
        return null;
    const armorDef = getArmorDefinitionForType(bodySpec.armorWeightClass);
    if (!armorDef)
        return null;
    const weight = bodySpec.armorWeightClass;
    return {
        type: weight,
        armorValue: artifactArmorBonusForLevel(weight, level),
        evadeModifier: artifactArmorEvadeForLevel(weight, level),
        skillPenalty: armorDef.skillPenalty === '—' ? '' : armorDef.skillPenalty,
    };
}
/**
 * Build the full 10-node linear tree for one Echo Artifact.
 *
 * Node naming matches the Artifact Builder convention (`<Name> - Level N-1`).
 * Each node stores only the abilities unlocked at that level (1 / 2 / 3 slots,
 * upgrading in place at L4 and L7) plus embedded powers for those rows. Base
 * Values are resolved to their exact value at each node's level.
 */
export function buildEchoArtifactTree(def) {
    // General (non-Echo) artifacts use the same authoring shape with an empty
    // `echoKey`: they bind as 'bound', never carry the `echoBound` flag, and
    // their authored Level Progression tables are the source of truth (no
    // picks-derived recompilation).
    const isGeneral = !def.echoKey;
    const kind = deriveArtifactKind(def.baseProfile);
    const img = getEchoArtifactIcon(def.key) ?? iconForKind(kind);
    const imgAlt = String(def.imgAlt || getEchoArtifactAltIcon(def.key) || '').trim();
    const paperdollOverride = def.paperdollSlots;
    const paperdoll = paperdollOverride && paperdollOverride.length > 0
        ? paperdollOverride
        : getPaperdollSlotsForArtifact(def.slot, def.baseProfile);
    const picks = buildEchoProgressionPicks(def);
    // General artifacts normally use their authored table verbatim. When a general
    // artifact opts into standard catalog Powers via `progressionPickSpecs` (e.g.
    // the Moonlight Greatsword), derive its 1–9 rows from those picks and keep only
    // the authored L10 Ultimate — so the rows are real Powers, not "authored" text.
    const generalUsesPicks = isGeneral && !!def.progressionPickSpecs;
    const fullProgression = isGeneral && !generalUsesPicks
        ? [...def.levelProgression]
        : resolveFullLevelProgression(def.levelProgression, picks);
    const nodeId = (level) => `${def.key}-l${level}`;
    const nodes = ARTIFACT_LEVELS.map((level) => {
        const isRoot = level === 1;
        const parentNodeId = isRoot ? null : nodeId(level - 1);
        const childNodeId = level === 10 ? null : nodeId(level + 1);
        const isWeapon = kind === 'weapon';
        const levelProgression = visibleAbilityRows(fullProgression, level);
        const powers = levelProgression.map((row) => buildEmbeddedPower(def.key, row));
        const system = {
            level,
            currentLevel: level,
            equipped: false,
            effects: [],
            artifactKind: kind,
            gearSlot: def.slot === 'head' || def.slot === 'feet' || def.slot === 'amulet' || def.slot === 'ring'
                ? def.slot
                : '',
            slot: def.slot,
            baseProfile: def.baseProfile,
            binding: isGeneral ? 'bound' : 'echo',
            echoKey: def.echoKey,
            baseValues: baseValuesAtLevel(def.key, level),
            levelProgression,
            stoneFunction: def.stoneFunction && level >= def.stoneFunction.level
                ? buildEchoStoneFunction(def)
                : null,
            extraStoneFunctions: def.extraStoneFunctions ?? [],
            progressionPicks: picks,
            lore: def.description,
            description: def.restriction ? `${def.description}\n\n${def.restriction}` : def.description,
            bonuses: { attack: 0, damage: '', defense: 0, specials: [] },
            requirements: { stones: 0, masteryRank: 1 },
            imgAlt,
            powers,
            inventorySize: '1x1',
            ...(isWeapon
                ? { artifactWeapon: weaponProfileAtLevel(def, level) }
                : def.naturalWeapon
                    ? {
                        naturalWeapon: def.naturalWeapon,
                        artifactWeapon: naturalWeaponProfileAtLevel(def, level),
                    }
                    : {}),
            ...(kind === 'shield' ? { artifactShield: shieldProfileAtLevel(def, level) } : {}),
            ...(kind === 'armor' ? { artifactArmor: armorProfileAtLevel(def, level) } : {}),
            ...(paperdoll.length ? { equipSlots: paperdoll } : {}),
        };
        const itemData = {
            name: `${def.name} - Level ${level}-1`,
            type: 'artifact',
            img,
            system,
            flags: {
                'mastery-system': {
                    nodeId: nodeId(level),
                    parentIds: parentNodeId ? [parentNodeId] : [],
                    childIds: childNodeId ? [childNodeId] : [],
                    ...(isRoot ? { isRoot: true } : {}),
                    ...(isGeneral ? {} : { echoBound: def.echoKey }),
                    echoArtifactKey: def.key,
                    seedVersion: ECHO_ARTIFACT_SEED_VERSION,
                },
            },
        };
        return { nodeId: nodeId(level), level, isRoot, parentNodeId, childNodeId, itemData };
    });
    return {
        echoArtifactKey: def.key,
        echoKey: def.echoKey,
        folderName: def.name,
        nodes,
    };
}
/** Build trees for every Echo Artifact in the catalog. */
export function buildAllEchoArtifactTrees() {
    return Object.values(ECHO_ARTIFACTS).map((def) => buildEchoArtifactTree(def));
}
/** Build trees for every General (bound, non-Echo) Artifact in the catalog. */
export function buildAllGeneralArtifactTrees() {
    return Object.values(GENERAL_ARTIFACTS).map((def) => buildEchoArtifactTree(def));
}
//# sourceMappingURL=echo-artifact-tree-builder.js.map
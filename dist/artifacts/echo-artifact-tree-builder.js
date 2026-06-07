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
import { bodyArmorBonusForLevel, feetEvadeForLevel, minorArmorForLevel, weaponDamageForLevel, } from '../utils/artifact-base-derive.js';
import { resolveFullLevelProgression, visibleAbilityRows, } from '../utils/artifact-visible-abilities.js';
import { getMinorMovementBaselineB, getPaperdollSlotsForArtifact, } from '../utils/artifact-rules.js';
/**
 * Content version of the generated trees. Bump this whenever the generator's
 * output (base values, powers, slot/profile, etc.) changes so the world seeder
 * can detect stale library copies and refresh them in place.
 */
export const ECHO_ARTIFACT_SEED_VERSION = 7;
const ARTIFACT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ALL_POWER_LEVEL_KEYS = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
];
// ---------------------------------------------------------------------------
// Per-level Base Value tables (exact, per the Player's Guide / Artefacts.md)
// ---------------------------------------------------------------------------
/** Light Echo Armor total = Light base (4) + Artifact Armor Bonus. L1=8 … L10=18. */
function lightEchoArmorForLevel(level) {
    return 4 + bodyArmorBonusForLevel(level);
}
/** Medium Echo Armor total = Medium base (8) + Artifact Armor Bonus. L1=12 … L10=22. */
function mediumEchoArmorForLevel(level) {
    return 8 + bodyArmorBonusForLevel(level);
}
/** Heavy Echo Armor total = Heavy base (12) + Artifact Armor Bonus. L1=16 … L10=26. */
function heavyEchoArmorForLevel(level) {
    return 12 + bodyArmorBonusForLevel(level);
}
/** Two-handed Echo weapon damage (Claws/Tail) — the stronger 4d8…16d8 table. */
const TWO_HANDED_ECHO_DAMAGE = ['4d8', '5d8', '6d8', '8d8', '9d8', '10d8', '12d8', '13d8', '14d8', '16d8'];
function twoHandedEchoDamageForLevel(level) {
    return TWO_HANDED_ECHO_DAMAGE[clampLevel(level) - 1];
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
function scentOfBloodTierForLevel(level) {
    const l = clampLevel(level);
    if (l >= 10)
        return 'Identify';
    if (l >= 7)
        return 'Locate';
    if (l >= 4)
        return 'Detect';
    return '';
}
/**
 * Per-echo-artifact Base Value tables. The numbers are the system's canonical
 * baselines (see `artifact-base-derive.ts` / Artefacts.md). Echo body armor
 * uses the full Echo Armor total (mundane base + Artifact Armor Bonus).
 */
const BASE_VALUE_TABLES = {
    stoneboundSoles: [
        { slot: 'a', type: 'sense', label: 'Tremorsense', unlock: 1, valueAt: () => 0, note: 'Ground-contact detection; depth scales with level.' },
        { slot: 'b', type: 'headArmor', label: 'Armor (Feet)', unlock: 4, valueAt: (l) => minorArmorForLevel(l) },
    ],
    elvenStrideFire: [
        { slot: 'a', type: 'evade', label: 'Evade', unlock: 1, valueAt: (l) => feetEvadeForLevel(l) },
        { slot: 'b', type: 'movement', label: 'Clinging', unlock: 4, valueAt: (l) => getMinorMovementBaselineB(l) },
    ],
    elvenStrideEarth: [
        { slot: 'a', type: 'evade', label: 'Evade', unlock: 1, valueAt: (l) => feetEvadeForLevel(l) },
        { slot: 'b', type: 'movement', label: 'Clinging', unlock: 4, valueAt: (l) => getMinorMovementBaselineB(l) },
    ],
    elvenStrideWater: [
        { slot: 'a', type: 'evade', label: 'Evade', unlock: 1, valueAt: (l) => feetEvadeForLevel(l) },
        { slot: 'b', type: 'movement', label: 'Clinging', unlock: 4, valueAt: (l) => getMinorMovementBaselineB(l) },
    ],
    elvenStrideAir: [
        { slot: 'a', type: 'evade', label: 'Evade', unlock: 1, valueAt: (l) => feetEvadeForLevel(l) },
        { slot: 'b', type: 'movement', label: 'Clinging', unlock: 4, valueAt: (l) => getMinorMovementBaselineB(l) },
    ],
    titanScars: [
        { slot: 'a', type: 'bodyArmor', label: 'Medium Echo Armor', unlock: 1, valueAt: (l) => mediumEchoArmorForLevel(l), note: 'Counts as Medium Armor (Evade −2, Initiative −4, −1d8 Physical).' },
    ],
    wyrmScales: [
        { slot: 'a', type: 'bodyArmor', label: 'Heavy Echo Armor', unlock: 1, valueAt: (l) => heavyEchoArmorForLevel(l), note: 'Heavy drawbacks scale with level.' },
    ],
    serpentScales: [
        { slot: 'a', type: 'bodyArmor', label: 'Light Echo Armor', unlock: 1, valueAt: (l) => lightEchoArmorForLevel(l), note: 'No Light Armor drawback.' },
    ],
    dragonClaws: [
        { slot: 'a', type: 'weaponDamage', label: 'Claw / Tail Damage', unlock: 1, valueAt: (l) => twoHandedEchoDamageForLevel(l) },
        { slot: 'b', type: 'weaponSpecial', label: 'Penetration', unlock: 4, valueAt: (l) => weaponSpecialRankForLevel([2, 4, 6, 8], l) },
        { slot: 'c', type: 'weaponSpecial', label: 'Brutal Impact', unlock: 7, valueAt: (l) => weaponSpecialRankForLevel([3, 5, 7, 9], l) },
    ],
    sentinelFrame: [
        { slot: 'a', type: 'bodyArmor', label: 'Light Echo Armor', unlock: 1, valueAt: (l) => lightEchoArmorForLevel(l), note: 'No Light Armor drawback.' },
    ],
    judicatorFrame: [
        { slot: 'a', type: 'bodyArmor', label: 'Light Echo Armor', unlock: 1, valueAt: (l) => lightEchoArmorForLevel(l), note: 'No Light Armor drawback.' },
    ],
    oracleFrame: [
        { slot: 'a', type: 'bodyArmor', label: 'Light Echo Armor', unlock: 1, valueAt: (l) => lightEchoArmorForLevel(l), note: 'No Light Armor drawback.' },
    ],
    dragonHead: [
        { slot: 'a', type: 'weaponDamage', label: 'Bite Weapon Damage', unlock: 1, valueAt: (l) => weaponDamageForLevel(l) },
        {
            slot: 'b',
            type: 'sense',
            label: 'Scent of Blood',
            unlock: 4,
            valueAt: (l) => scentOfBloodTierForLevel(l),
            note: 'Detect from L4, Locate from L7, Identify at L10.',
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
    if (lowType.includes('spell'))
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
        case 'twoHandedWeapon':
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
        });
    }
    return out;
}
/** Weapon profile for weapon-kind echo artifacts at the given level (damage scales). */
function weaponProfileAtLevel(def, level) {
    const dmgBv = (BASE_VALUE_TABLES[def.key] || []).find((b) => b.type === 'weaponDamage');
    const damage = dmgBv ? String(dmgBv.valueAt(level)) : weaponDamageForLevel(level);
    const hands = def.baseProfile === 'twoHandedWeapon' ? 2 : 1;
    return { weaponType: 'melee', damage, range: '0m', hands, innateAbilities: [], specials: [] };
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
    const kind = deriveArtifactKind(def.baseProfile);
    const img = iconForKind(kind);
    const paperdoll = getPaperdollSlotsForArtifact(def.slot, def.baseProfile);
    const picks = buildEchoProgressionPicks(def);
    const fullProgression = resolveFullLevelProgression(def.levelProgression, picks);
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
            binding: 'echo',
            echoKey: def.echoKey,
            baseValues: baseValuesAtLevel(def.key, level),
            levelProgression,
            stoneFunction: def.stoneFunction && level >= def.stoneFunction.level
                ? buildEchoStoneFunction(def)
                : null,
            progressionPicks: picks,
            lore: def.description,
            description: def.restriction ? `${def.description}\n\n${def.restriction}` : def.description,
            bonuses: { attack: 0, damage: '', defense: 0, specials: [] },
            requirements: { stones: 0, masteryRank: 1 },
            powers,
            inventorySize: '1x1',
            ...(isWeapon ? { artifactWeapon: weaponProfileAtLevel(def, level) } : {}),
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
                    echoBound: def.echoKey,
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
//# sourceMappingURL=echo-artifact-tree-builder.js.map
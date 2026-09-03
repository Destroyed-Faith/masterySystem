/**
 * Echo Artifact Catalog
 *
 * Per the Player's Guide (Echo Artifacts chapter), each Echo has zero or
 * more Echo-bound Artifacts that must be selected at character creation:
 *
 *   • Human:      0 required, 0 maximum.
 *   • Halfling:   0 required, 1 maximum.   (Ringchain of Kept Names — Amulet)
 *   • Dwarf:      1 required, 1 maximum.   (Stonebound Soles — Feet)
 *   • Elorian:    1 required, 1 maximum.   (Elorian Stride — Feet)
 *   • Sentinel:   1 required, 1 maximum.   (One frame per Order)
 *   • Titanborn:  1 required, 1 maximum.   (Titan Scars — Body)
 *   • Dragonborn: 1 required, 3 maximum.   (Dragon Claws, Dragon Head, and one
 *                  of Wyrm Scales / Serpent Scales — the two body armors are
 *                  mutually exclusive.)
 *   • Unbound:    1 required, 1 maximum.   (one identity artifact)
 *
 * Each entry below describes:
 *   • `key`           — stable id used by flags / picker lookups.
 *   • `name`          — display name.
 *   • `slot`          — canonical Equipment Slot.
 *   • `baseProfile`   — physical Base Profile per the new spec.
 *   • `baseValues`    — Base Value description (informational; UI shows them).
 *   • `binding`       — always `'echo'` for echo-bound artifacts.
 *   • `description`   — one-line flavor.
 *   • `requiresSubChoice` — when present, the player must have picked this
 *                            Echo sub-choice (e.g. Sentinel order, Elf lineage)
 *                            before this artifact is selectable.
 *   • `levelProgression` — the spec's 1..10 level table.
 *
 * The catalog is pure data; it is consumed by `character-sheet-echo-dialog.ts`
 * during creation, and by `artifact-actor-rules.ts` for echo-bound checks.
 */
import { resolvePickFromUi, tierFromSpecialKey } from './artifact-power-pick.js';
import { catalogSpecialTierForTemplate } from './artifact-catalog-pick.js';
import { UNBOUND_ECHO_ARTIFACTS, UNBOUND_ECHO_ARTIFACT_KEYS, UNBOUND_PREDATOR_CROWN_KEYS, } from './echo-artifacts-unbound.js';
// ----------------------------------------------------------------------
// Stonebound Soles (Dwarf)
// ----------------------------------------------------------------------
const STONEBOUND_SOLES = {
    key: 'stoneboundSoles',
    name: 'Stonebound Soles',
    echoKey: 'dwarfs',
    slot: 'feet',
    baseProfile: 'feet',
    description: 'Ancestral weight, deep-road memory, and the old bond between dwarven bodies and stone.',
    restriction: 'A dwarf with Stonebound Soles cannot wear another Feet Artifact, magical boots, hooves, talons, or similar Feet-based Artifact.',
    progressionPickSpecs: {
        1: { name: 'Anchoring Stance', templateId: 'ab-immovable-temp-hp' },
        2: { name: 'Stone-Sure Step', templateId: 'movement-safe-movement' },
        3: { name: 'Stoneweave Guard', templateId: 'empower-buff-armor' },
    },
    baseValues: [
        { slot: 'a', label: 'Armor (Feet)', note: '+1 Armor at Level 1 up to +5 Armor at Levels 9–10.' },
        { slot: 'b', label: 'Tunneling', note: '+1 m Tunneling at Levels 4–5 up to +4 m at Level 10 (not Burrow).' },
        { slot: 'c', label: 'Tremor Sense (Sense Option)', note: 'Slot instead of Normal Combat Awareness; 20 m, shared solid surface. Does not scale.' },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Anchoring Stance I',
            type: 'Active Buff',
            range: 'Self',
            duration: '2 Rounds',
            effect: 'You become Immovable and gain 40 Temporary HP.',
            special: 'Immovable + Temporary HP',
        },
        {
            level: 2,
            name: 'Stone-Sure Step I',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'Move up to 8 m along a legal ground path. This movement does not provoke movement-triggered Reactions.',
            special: 'Safe Movement',
        },
        {
            level: 3,
            name: 'Stoneweave Guard I',
            type: 'Support',
            range: 'Self',
            duration: 'Special',
            effect: "When you activate an Active Buff that grants Armor, you may increase that Buff's effective Power Level by +1 and its duration by +1 round (cannot exceed PL 16). Uses per Safe Haven Rest: half MR, rounded up.",
            special: 'Armor Buff Empowerment',
        },
        {
            level: 4,
            name: 'Anchoring Stance II',
            type: 'Active Buff',
            range: 'Self',
            duration: '2 Rounds',
            effect: 'You become Immovable and gain 220 Temporary HP.',
            special: 'Immovable + Temporary HP',
        },
        {
            level: 5,
            name: 'Stone-Sure Step II',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'Move up to 14 m along a legal ground path. This movement does not provoke movement-triggered Reactions.',
            special: 'Safe Movement',
        },
        {
            level: 6,
            name: 'Stoneweave Guard II',
            type: 'Support',
            range: 'Self',
            duration: 'Special',
            effect: 'When you activate an Active Buff that grants Armor, you may increase its Power Level by +2 and duration by +2 rounds (cannot exceed PL 16).',
            special: 'Armor Buff Empowerment',
        },
        {
            level: 7,
            name: 'Anchoring Stance III',
            type: 'Active Buff',
            range: 'Self',
            duration: '2 Rounds',
            effect: 'You become Immovable and gain 400 Temporary HP.',
            special: 'Immovable + Temporary HP',
        },
        {
            level: 8,
            name: 'Stone-Sure Step III',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'Move up to 20 m along a legal ground path. This movement does not provoke movement-triggered Reactions.',
            special: 'Safe Movement',
        },
        {
            level: 9,
            name: 'Stoneweave Guard III',
            type: 'Support',
            range: 'Self',
            duration: 'Special',
            effect: 'When you activate an Active Buff that grants Armor, you may increase its Power Level by +3 and duration by +3 rounds (cannot exceed PL 16).',
            special: 'Armor Buff Empowerment',
        },
        {
            level: 10,
            name: 'True Stonebound Soles',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Stonebound Soles fully awaken. Choose or define one final Tremorsense, Armor, Immovable, Safe Movement, or stone defense effect with GM approval.',
            special: 'True Stonebound Soles',
        },
    ],
};
// ----------------------------------------------------------------------
// Elorian Stride (Elorian)
// ----------------------------------------------------------------------
const ELORIAN_STRIDE = {
    key: 'elorianStride',
    name: 'Elorian Stride',
    echoKey: 'elorians',
    slot: 'feet',
    baseProfile: 'feet',
    description: 'Elorian Stride is an Elorian Echo Artifact representing otherworldly balance, reflex, clinging movement and focus in combat.',
    restriction: 'An Elorian with Elorian Stride cannot wear another Feet Artifact, magical boots, hooves, talons, or similar Feet-based Artifact. Elorian Stride is Echo-bound and cannot normally be removed, replaced, sold, stolen, or unbound.',
    progressionPickSpecs: {
        // Players' Guide: Reaction: Evade at PL 2 / 4 / 6 → +2 / +4 / +6 Evade.
        1: {
            templateId: 'reaction-evade',
            name: 'Otherworld Reflex',
            stagePowerLevels: ['2', '4', '6'],
        },
        2: { templateId: 'movement-wall-walk', name: 'Elorian Cling' },
        3: {
            name: 'Elorian Focus',
            stoneFunction: {
                // Follow-up: support begins at T2, the first published Crit tier.
                // Do not invent replacement Level Progression values here.
                kind: 'stonePowerSupport',
                attribute: 'agility',
                stonePowerId: 'agility.crit',
            },
        },
    },
    baseValues: [
        { slot: 'a', label: 'Evade', note: '+1 to +5 Evade across levels (paired bands L1–2 / L3–4 / …); Level 10 grants True Elorian Stride.' },
        { slot: 'b', label: 'Movement', note: '+1 to +4 m Movement from Level 4 onward.' },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Otherworld Reflex I',
            type: 'Reaction',
            range: 'Self',
            duration: 'Triggering attack only',
            effect: 'Gain +2 Evade against the triggering attack.',
            special: 'Otherworld Reflex',
        },
        {
            level: 2,
            name: 'Elorian Cling I',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'Move up to 10 m along walls, ceilings, or similar solid surfaces.',
            special: 'Wall Walk',
        },
        {
            level: 3,
            name: 'Elorian Focus I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Supports the Agility Ability: Crit Stone Power and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
            special: 'agility.crit',
        },
        {
            level: 4,
            name: 'Otherworld Reflex II',
            type: 'Reaction',
            range: 'Self',
            duration: 'Triggering attack only',
            effect: 'Gain +4 Evade against the triggering attack.',
            special: 'Otherworld Reflex',
        },
        {
            level: 5,
            name: 'Elorian Cling II',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'Move up to 25 m along walls, ceilings, or similar solid surfaces.',
            special: 'Wall Walk',
        },
        {
            level: 6,
            name: 'Elorian Focus II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Supports the Agility Ability: Crit Stone Power and pre-fills Tier 3. You must still pay Tiers 1, 2 yourself. If Tiers 1, 2 are not paid, the pre-filled Tier 3 has no effect.',
            special: 'agility.crit',
        },
        {
            level: 7,
            name: 'Otherworld Reflex III',
            type: 'Reaction',
            range: 'Self',
            duration: 'Triggering attack only',
            effect: 'Gain +6 Evade against the triggering attack.',
            special: 'Otherworld Reflex',
        },
        {
            level: 8,
            name: 'Elorian Cling III',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'Move up to 28 m along walls, ceilings, or similar solid surfaces.',
            special: 'Wall Walk',
        },
        {
            level: 9,
            name: 'Elorian Focus III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Supports the Agility Ability: Crit Stone Power and pre-fills Tier 4. You must still pay Tiers 1, 2, 3 yourself. If Tiers 1, 2, 3 are not paid, the pre-filled Tier 4 has no effect.',
            special: 'agility.crit',
        },
        {
            level: 10,
            name: 'True Elorian Stride',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Elorian Stride fully awakens. Choose or define one final movement, reflex, clinging, focus, or agility effect with GM approval.',
            special: 'True Elorian Stride',
        },
    ],
};
// ----------------------------------------------------------------------
// Titan Scars (Titanborn)
// ----------------------------------------------------------------------
const TITAN_SCARS = {
    key: 'titanScars',
    name: 'Titan Scars',
    echoKey: 'titanborn',
    slot: 'body',
    baseProfile: 'bodyArmor',
    description: 'Ancient scars, stone-like tissue, Titan blood, and broken divine bindings grown into the body.',
    restriction: 'A Titanborn with Titan Scars cannot wear mundane armor or bind another Body Artifact. Titan Scars are Echo-bound and cannot normally be removed, replaced, sold, stolen, unequipped, or unbound.',
    progressionPickSpecs: {
        1: { templateId: 'ab-growth-form', name: 'Titan Growth' },
        2: {
            name: 'Titan Might',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'might',
                stonePowerId: 'might.meleeDamage',
            },
        },
        3: {
            name: 'Titan Healing',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'vitality',
                stonePowerId: 'vitality.removeScar',
            },
        },
    },
    baseValues: [
        {
            slot: 'a',
            label: 'Medium Armor',
            note: '+12 to +22 Armor; counts as Medium Armor (Evade −2, Initiative −4, −1d8 Physical).',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Titan Growth I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use Active Buff: Size + Damage + Armor at Power Level 4.',
            special: 'Titan Growth',
        },
        {
            level: 2,
            name: 'Titan Might I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Supports Might Ability: Melee Damage and pre-fills Tier 2. Tier 1 must still be paid.',
            special: 'might.meleeDamage',
        },
        {
            level: 3,
            name: 'Titan Healing I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Use Remove Scar through Titan Scars and pay its normal Stone cost.',
            special: 'vitality.removeScar',
        },
        {
            level: 4,
            name: 'Titan Growth II',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use Active Buff: Size + Damage + Armor at Power Level 10. This replaces Titan Growth I.',
            special: 'Titan Growth',
        },
        {
            level: 5,
            name: 'Titan Might II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 3. Tiers 1 and 2 must still be paid.',
            special: 'might.meleeDamage',
        },
        {
            level: 6,
            name: 'Titan Healing II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Remove Scar used through Titan Scars may recover 1 Scarred Health Bar, as written by the Stone Power. Pay its normal Stone cost.',
            special: 'vitality.removeScar',
        },
        {
            level: 7,
            name: 'Titan Growth III',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use Active Buff: Size + Damage + Armor at Power Level 16. This replaces Titan Growth II.',
            special: 'Titan Growth',
        },
        {
            level: 8,
            name: 'Titan Might III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 4. Tiers 1, 2, and 3 must still be paid.',
            special: 'might.meleeDamage',
        },
        {
            level: 9,
            name: 'Titan Healing III',
            type: 'Stone Power Support',
            range: 'Self / Touch',
            duration: 'Instant',
            effect: 'Use Remove Scar on yourself or one touched willing creature. Pay its normal Stone cost.',
            special: 'vitality.removeScar',
        },
        {
            level: 10,
            name: 'True Titan Scars',
            type: 'Ultimate',
            range: 'Self / Touch',
            duration: 'Instant',
            effect: 'Once per Safe Haven Rest, use Remove Scar through Titan Scars without paying its Stone cost. This can recover 1 Scarred Health Bar and follows all normal limits.',
            special: 'True Titan Scars',
        },
    ],
};
// ----------------------------------------------------------------------
// Wyrm Scales variants (Dragonborn — pick one body armor line)
// ----------------------------------------------------------------------
export const WYRM_SCALES_VARIANT_GROUP = 'wyrmScales';
/** Legacy compendium / character keys → current variant keys. */
export const ECHO_ARTIFACT_KEY_ALIASES = {
    wyrmScales: 'wyrmScalesHeavy',
    wyrmScalesMedium: 'wyrmScalesHeavy',
    serpentScales: 'wyrmScalesLight',
    titanScarsMight: 'titanScars',
    titanScarsAgility: 'titanScars',
    titanScarsVitality: 'titanScars',
    titanScarsIntellect: 'titanScars',
    titanScarsResolve: 'titanScars',
    titanScarsInfluence: 'titanScars',
    titanScarsWits: 'titanScars',
    elvenStride: 'elorianStride',
    elvenStrideFire: 'elorianStride',
    elvenStrideEarth: 'elorianStride',
    elvenStrideWater: 'elorianStride',
    elvenStrideAir: 'elorianStride',
};
const WYRM_BODY_RESTRICTION = 'A Dragonborn with Wyrm Scales cannot wear mundane armor or another Body Artifact.';
const WYRM_SCALES_HEAVY = {
    key: 'wyrmScalesHeavy',
    name: 'Wyrm Scales (Heavy)',
    echoKey: 'dragonborn',
    slot: 'body',
    baseProfile: 'bodyArmor',
    description: 'The heaviest Dragonborn scale-form — maximum armor, heavy class drawbacks.',
    restriction: WYRM_BODY_RESTRICTION,
    variantGroupKey: WYRM_SCALES_VARIANT_GROUP,
    variantRow: {
        armorClass: 'Heavy',
        focus: 'Armor',
        flightL1: 'Dragon Wings (Flight)',
        activeBuffL2: 'Active Buff: Armor (Wyrm Scales)',
        stonePowerL3: 'Might — ARMOR Stone Power',
    },
    // L1 Dragon Wings → movement-flight; L2 Wyrm Scales → ab-armor;
    // L3 Armor Stone Support → might.armor (the ARMOR stone power lives in the
    // Might pool; the old vitality.armor was removed when Vitality was aligned
    // with the rules table: TempHP / Damage Negation / Remove Scar / Extend Active Buff).
    progressionPickSpecs: {
        1: { name: 'Dragon Wings', templateId: 'movement-flight' },
        2: {
            name: 'Wyrm Scales',
            templateId: 'ab-armor',
            stageEffectTexts: [
                'Gain **+6 Armor**.',
                'Gain **+12 Armor**. This replaces Wyrm Scales I.',
                'Gain **+18 Armor**. This replaces Wyrm Scales II.',
            ],
        },
        3: {
            name: 'Armor Stone Support',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'might',
                stonePowerId: 'might.armor',
            },
        },
    },
    baseValues: [
        {
            slot: 'a',
            label: 'Heavy Echo Armor',
            note: 'Heavy Armor +16 (L1) … +25 (L10). Drawbacks −2/−4/−6 Evade & Initiative; −2d8 Physical Skills.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Dragon Wings I',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'You may fly up to 6 m.',
            special: 'Flight',
        },
        {
            level: 2,
            name: 'Wyrm Scales I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'You gain +6 Armor.',
            special: 'Armor',
        },
        {
            level: 3,
            name: 'Armor Stone Support I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Wyrm Scales support the Vitality Ability ARMOR Stone Power and pre-fill Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
            special: 'ARMOR Stone Power',
        },
        {
            level: 4,
            name: 'Dragon Wings II',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'You may fly up to 15 m.',
            special: 'Flight',
        },
        {
            level: 5,
            name: 'Wyrm Scales II',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'You gain +12 Armor.',
            special: 'Armor',
        },
        {
            level: 6,
            name: 'Armor Stone Support II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Wyrm Scales pre-fill Tier 3 of the Vitality Ability ARMOR Stone Power. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.',
            special: 'ARMOR Stone Power',
        },
        {
            level: 7,
            name: 'Dragon Wings III',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'You may fly up to 24 m.',
            special: 'Flight',
        },
        {
            level: 8,
            name: 'Wyrm Scales III',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'You gain +18 Armor.',
            special: 'Armor',
        },
        {
            level: 9,
            name: 'Armor Stone Support III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Wyrm Scales pre-fill Tier 4 of the Vitality Ability ARMOR Stone Power. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If Tier 1, Tier 2, and Tier 3 are not paid, the pre-filled Tier 4 has no effect.',
            special: 'ARMOR Stone Power',
        },
        {
            level: 10,
            name: 'Dragon Transformation',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'You unlock your Wyrm Dragon Form. Choose the shape of this form when this Artifact reaches Level 10. The form occupies a large space, uses the transformation rules below, and grants the listed Dragon Form benefits.',
            special: 'Wyrm Dragon Form',
        },
    ],
};
const WYRM_SCALES_LIGHT = {
    key: 'wyrmScalesLight',
    name: 'Serpent Scales',
    echoKey: 'dragonborn',
    slot: 'body',
    baseProfile: 'bodyArmor',
    description: 'Light serpent scale-form — evasion, mobility, and aerial grace over raw soak.',
    restriction: WYRM_BODY_RESTRICTION,
    variantGroupKey: WYRM_SCALES_VARIANT_GROUP,
    variantRow: {
        armorClass: 'Light',
        focus: 'Evade',
        flightL1: 'Dragon Wings (Flight)',
        activeBuffL2: 'Active Buff: Evade (Serpent Evasion)',
        stonePowerL3: 'Agility — EVADE Stone Power',
    },
    // L1 Dragon Wings → movement-flight; L2 Serpent Evasion (ab-evade) +
    // Mobility Extension (extend-buff-mobility) at L5/L8; L3 → agility.evade.
    progressionPickSpecs: {
        1: { name: 'Dragon Wings', templateId: 'movement-flight' },
        2: {
            name: 'Serpent Evasion',
            templateId: 'ab-evade',
            // Stage I only uses ab-evade; guide prints +6 Evade → AB Evade PL 3.
            stagePowerLevels: ['3', '10', '16'],
            stageTemplateIds: ['ab-evade', 'extend-buff-mobility', 'extend-buff-mobility'],
            stageNames: ['Serpent Evasion I', 'Mobility Buff Extension II', 'Mobility Buff Extension III'],
        },
        3: {
            name: 'Evasion Stone Support',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'agility',
                stonePowerId: 'agility.evade',
            },
        },
    },
    baseValues: [
        {
            slot: 'a',
            label: 'Light Echo Armor',
            note: 'Light Armor base + artifact bonus; no armor-class drawbacks.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Dragon Wings I',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'You may fly up to 6 m.',
            special: 'Flight',
        },
        {
            level: 2,
            name: 'Serpent Evasion I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Gain +6 Evade.',
            special: 'Evade',
            powerTemplateId: 'ab-evade',
        },
        {
            level: 3,
            name: 'Evasion Stone Support I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Serpent Scales support the Agility Ability EVADE Stone Power and pre-fill Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
            special: 'EVADE Stone Power',
        },
        {
            level: 4,
            name: 'Dragon Wings II',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'You may fly up to 15 m.',
            special: 'Flight',
        },
        {
            level: 5,
            name: 'Mobility Buff Extension II',
            type: 'Support',
            range: 'Self',
            duration: 'Passive',
            effect: "Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase that Buff's duration by +2 rounds. This does not increase the Buff's value. This does not allow you to maintain a second Active Buff.",
            special: 'Mobility Buff Extension',
            powerTemplateId: 'extend-buff-mobility',
        },
        {
            level: 6,
            name: 'Evasion Stone Support II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Serpent Scales pre-fill Tier 3 of the Agility Ability EVADE Stone Power. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.',
            special: 'EVADE Stone Power',
        },
        {
            level: 7,
            name: 'Dragon Wings III',
            type: 'Movement',
            range: 'Self',
            duration: 'Instant',
            effect: 'You may fly up to 24 m.',
            special: 'Flight',
        },
        {
            level: 8,
            name: 'Mobility Buff Extension III',
            type: 'Support',
            range: 'Self',
            duration: 'Passive',
            effect: "Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase that Buff's duration by +3 rounds. This does not increase the Buff's value. This does not allow you to maintain a second Active Buff.",
            special: 'Mobility Buff Extension',
            powerTemplateId: 'extend-buff-mobility',
        },
        {
            level: 9,
            name: 'Evasion Stone Support III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Serpent Scales pre-fill Tier 4 of the Agility Ability EVADE Stone Power. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If Tier 1, Tier 2, and Tier 3 are not paid, the pre-filled Tier 4 has no effect.',
            special: 'EVADE Stone Power',
        },
        {
            level: 10,
            name: 'True Serpent Form',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Your body becomes perfectly adapted to motion. Choose or define one final mobility, evasion, or light-dragon transformation effect with GM approval.',
            special: 'True Serpent Form',
        },
    ],
};
// ----------------------------------------------------------------------
// Dragon Claws (Dragonborn — two-handed natural weapon)
// ----------------------------------------------------------------------
const DRAGON_CLAWS = {
    key: 'dragonClaws',
    name: 'Dragon Claws',
    echoKey: 'dragonborn',
    slot: 'bothHands',
    baseProfile: 'twoHandedWeapon',
    description: 'Both hands become natural weapons: claws, scales, and tail.',
    restriction: 'A Dragonborn with Dragon Claws cannot wield another weapon, shield, or hand-based Artifact while using them. Occupies both hand slots.',
    // Stone Power Support targets an Attribute's Stone Power. The generic Extra
    // Attack power is not attribute-bound, so it cannot be a support target;
    // Dragon Claws instead support the Might: Melee Damage Stone Power.
    stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'might',
        stonePowerId: 'might.meleeDamage',
        level: 1,
        name: 'Extra Damage Support',
    },
    // Rending Spiral and Tail Sweep are real, editable catalog Powers — both are
    // self-centered Melee AoE weapon attacks that deal the current Claw / Tail
    // Weapon Damage in a radius. Only the names are overridden; the GM can add the
    // Lacerate / Push Specials and tune them freely in the Node Editor.
    progressionPickSpecs: {
        2: { name: 'Rending Spiral', templateId: 'active-melee-weapon-aoe', special: 'lacerate' },
        3: { name: 'Tail Sweep', templateId: 'active-melee-weapon-aoe', special: 'push' },
    },
    baseValues: [
        {
            slot: 'a',
            label: 'Claw / Tail Damage',
            note: '4d8 at Level 1 up to 16d8 at Level 10 (printed per-level table).',
        },
        {
            slot: 'b',
            label: 'Weapon Special',
            note: 'Penetration(2) at L4 up to Penetration(5) at L9–10.',
        },
        {
            slot: 'c',
            label: 'Weapon Special',
            note: 'Brutal Impact(4) at L7–8, Brutal Impact(5) at L9–10.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Extra Damage Support I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Dragon Claws support the Might Ability Melee Damage Stone Power. They pre-fill Tier 2. You must still pay Tier 1 yourself.',
            special: '',
        },
        {
            level: 2,
            name: 'Rending Spiral I',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 3 m',
            duration: 'Instant',
            effect: 'Affected creatures take your current Claw / Tail Weapon Damage.',
            special: 'Lacerate(5)',
        },
        {
            level: 3,
            name: 'Tail Sweep I',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 3 m',
            duration: 'Instant',
            effect: 'Affected creatures take Claw / Tail Damage and are pushed 2 m.',
            special: 'Push',
        },
        {
            level: 4,
            name: 'Extra Damage Support II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Dragon Claws support the Might Ability Melee Damage Stone Power. They pre-fill Tier 3. You must still pay Tier 1 and 2 yourself.',
            special: '',
        },
        {
            level: 5,
            name: 'Rending Spiral II',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 6 m',
            duration: 'Instant',
            effect: 'Affected creatures take Claw / Tail Damage.',
            special: 'Lacerate(7)',
        },
        {
            level: 6,
            name: 'Tail Sweep II',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 5 m',
            duration: 'Instant',
            effect: 'Affected creatures take Claw / Tail Damage and are pushed 6 m.',
            special: 'Push',
        },
        {
            level: 7,
            name: 'Extra Damage Support III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Dragon Claws support the Might Ability Melee Damage Stone Power. They pre-fill Tier 4. You must still pay Tier 1, 2 and 3 yourself.',
            special: '',
        },
        {
            level: 8,
            name: 'Rending Spiral III',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 7 m',
            duration: 'Instant',
            effect: 'Affected creatures take Claw / Tail Damage.',
            special: 'Lacerate(10)',
        },
        {
            level: 9,
            name: 'Tail Sweep III',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 7 m',
            duration: 'Instant',
            effect: 'Affected creatures take Claw / Tail Damage and are pushed 10 m.',
            special: 'Push',
        },
        {
            level: 10,
            name: 'True Dragon Claws',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Dragon Claws fully awaken. Choose or define one final Claw or Tail effect.',
            special: 'True Dragon Claws',
        },
    ],
};
// ----------------------------------------------------------------------
// Dragon Head (Dragonborn)
// ----------------------------------------------------------------------
const DRAGON_HEAD = {
    key: 'dragonHead',
    name: 'Dragon Head',
    echoKey: 'dragonborn',
    slot: 'head',
    baseProfile: 'headArmor',
    description: 'A draconic head: a scaling Bite weapon, a Breath Weapon, the Draconic Roar armor aura, and stone-refreshing Draconic Recovery. Pick a Breath Shape and a Breath Special when the artifact is created.',
    restriction: 'A Dragonborn with Dragon Head cannot wear another Head Artifact, helmet, mask, crown, or magical headgear.',
    // The Bite is a real, usable natural weapon (1d8…10d8) even though the Head
    // slot's artifactKind is gear. Occupies no hand slots.
    naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
    // The three Level Progression lines are real, editable catalog Powers, just
    // flavored with the Dragon Head names. Breath Weapon = a Ranged AoE Special
    // Damage active (Tier 4, default Ruin); Draconic Roar = the Armor Aura
    // Active Buff; Draconic Recovery = a Stone Refresh (Might). All editable in
    // the Node Editor; only the names are overridden.
    progressionPickSpecs: {
        1: { name: 'Breath Weapon', delivery: 'ranged-aoe', special: 'ruin' },
        2: { name: 'Draconic Roar', templateId: 'ab-armor-aura' },
    },
    stoneFunction: { level: 3, kind: 'stoneRefresh', attribute: 'might', name: 'Draconic Recovery' },
    baseValues: [
        {
            slot: 'a',
            label: 'Bite Weapon Damage',
            note: '1d8 to 10d8 across levels.',
        },
        {
            slot: 'b',
            label: 'Head Armor',
            note: '+1 Armor at Level 1 up to +5 Armor at Levels 9–10 (minor Armor, stacks normally).',
        },
        {
            slot: 'c',
            label: 'Predator Sense (Sense Option)',
            note: 'Sense Slot option, 20 m. Does not scale with Artifact Level.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Breath Weapon I',
            type: 'Active',
            range: 'Self',
            aoe: 'Chosen Breath Shape',
            duration: 'Instant',
            effect: 'Bite Damage + 8d8 damage to affected creatures.',
            special: 'Chosen Breath Special',
        },
        {
            level: 2,
            name: 'Draconic Roar I',
            type: 'Active Buff',
            range: 'Self',
            aoe: 'Radius 8 m',
            duration: 'Mastery Rank Rounds',
            effect: 'You and allies in the area gain +12 Armor.',
            special: 'Armor Aura',
        },
        {
            level: 3,
            name: 'Draconic Recovery I',
            type: 'Stone Refresh',
            range: 'Self',
            duration: 'Instant',
            effect: 'Restore 1 spent Stone of the chosen Attribute.',
            special: 'Stone Refresh',
        },
        {
            level: 4,
            name: 'Breath Weapon II',
            type: 'Active',
            range: 'Self',
            aoe: 'Chosen Breath Shape',
            duration: 'Instant',
            effect: 'Bite Damage + 16d8 damage to affected creatures.',
            special: 'Chosen Breath Special',
        },
        {
            level: 5,
            name: 'Draconic Roar II',
            type: 'Active Buff',
            range: 'Self',
            aoe: 'Radius 20 m',
            duration: 'Mastery Rank Rounds',
            effect: 'You and allies in the area gain +28 Armor.',
            special: 'Armor Aura',
        },
        {
            level: 6,
            name: 'Draconic Recovery II',
            type: 'Stone Refresh',
            range: 'Self',
            duration: 'Instant',
            effect: 'Restore 2 spent Stones of the chosen Attribute.',
            special: 'Stone Refresh',
        },
        {
            level: 7,
            name: 'Breath Weapon III',
            type: 'Active',
            range: 'Self',
            aoe: 'Chosen Breath Shape',
            duration: 'Instant',
            effect: 'Bite Damage + 24d8 damage to affected creatures.',
            special: 'Chosen Breath Special',
        },
        {
            level: 8,
            name: 'Draconic Roar III',
            type: 'Active Buff',
            range: 'Self',
            aoe: 'Radius 32 m',
            duration: 'Mastery Rank Rounds',
            effect: 'You and allies in the area gain +44 Armor.',
            special: 'Armor Aura',
        },
        {
            level: 9,
            name: 'Draconic Recovery III',
            type: 'Stone Refresh',
            range: 'Self',
            duration: 'Instant',
            effect: 'Restore 4 spent Stones of the chosen Attribute.',
            special: 'Stone Refresh',
        },
        {
            level: 10,
            name: 'True Dragon Head',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Choose or define one final Breath, Bite, Roar, Recovery, or Head effect with GM approval.',
            special: 'True Dragon Head',
        },
    ],
};
// ----------------------------------------------------------------------
// Sentinel Frames (Sentinel — one frame per Order)
// ----------------------------------------------------------------------
const SENTINEL_FRAME = {
    key: 'sentinelFrame',
    name: 'Sentinel Frame',
    echoKey: 'sentinels',
    slot: 'body',
    baseProfile: 'bodyArmor',
    description: 'The armored enforcer frame — an iron wall of heavenly order.',
    requiresSubChoice: 'sentinel',
    restriction: 'A character with a Sentinel Body Artifact cannot wear mundane armor or bind another Body Artifact.',
    // Printed table: Heal 1/4/7, Resolve Pool 2/6, Healing Support 3/8,
    // Special Reduction 5/9. The 1/2/3 compiler covers Heal + Pool + Healing;
    // Special Reduction is an extra Stone Function from Artifact Level 5.
    progressionPickSpecs: {
        1: { templateId: 'active-ranged-single-heal', name: 'Single Heal' },
        2: { name: 'Resolve Core', stoneFunction: { kind: 'stonePool', attribute: 'resolve' } },
        3: {
            name: 'Healing Support',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'resolve',
                stonePowerId: 'resolve.healing',
            },
        },
    },
    extraStoneFunctions: [
        {
            level: 5,
            name: 'Special Reduction Support',
            kind: 'stonePowerSupport',
            attribute: 'resolve',
            stonePowerId: 'resolve.ward',
            supportStages: [5, 5, 9],
        },
    ],
    baseValues: [
        {
            slot: 'a',
            label: 'Light Echo Armor',
            note: '+8 to +18 Armor; no Light Armor drawback.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Single Heal I',
            type: 'Active',
            range: '8 m',
            duration: 'Instant',
            effect: 'Use a single-target healing Active at Power Level 4.',
            special: 'Healing',
        },
        {
            level: 2,
            name: 'Resolve Core I',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: 'Store 2 Resolve Stones after each Safe Haven Rest. They may be spent only on Sentinel Frame\'s listed Resolve Stone functions.',
            special: 'Resolve Stones',
        },
        {
            level: 3,
            name: 'Healing Support I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Sentinel Frame supports the Resolve Ability: Healing Stone Power and pre-fills Tier 2.',
            special: 'Healing Stone Power',
        },
        {
            level: 4,
            name: 'Single Heal II',
            type: 'Active',
            range: '8 m',
            duration: 'Instant',
            effect: 'Single Heal improves to Power Level 10.',
            special: 'Healing',
        },
        {
            level: 5,
            name: 'Special Reduction Support I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Supports Resolve Ability: Special Reduction and pre-fills Tier 3. Tiers 1 and 2 must still be paid.',
            special: 'resolve.ward',
        },
        {
            level: 6,
            name: 'Resolve Core II',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: 'Store 4 Resolve Stones after each Safe Haven Rest. They may be spent only on Sentinel Frame\'s listed Resolve Stone functions.',
            special: 'Resolve Stones',
        },
        {
            level: 7,
            name: 'Single Heal III',
            type: 'Active',
            range: '8 m',
            duration: 'Instant',
            effect: 'Single Heal improves to Power Level 16.',
            special: 'Healing',
        },
        {
            level: 8,
            name: 'Healing Support II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 4 of Resolve Ability: Healing. Tiers 1, 2, and 3 must still be paid.',
            special: 'Healing Stone Power',
        },
        {
            level: 9,
            name: 'Special Reduction Support II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 4 of Resolve Ability: Special Reduction. Tiers 1, 2, and 3 must still be paid.',
            special: 'resolve.ward',
        },
        {
            level: 10,
            name: 'True Sentinel Frame',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Once per Safe Haven Rest, when you use Healing through Sentinel Frame, treat one required lower Tier as already paid.',
            special: 'Resolve Stone Power',
        },
    ],
};
const JUDICATOR_FRAME = {
    key: 'judicatorFrame',
    name: 'Judicator Frame',
    echoKey: 'sentinels',
    slot: 'body',
    baseProfile: 'bodyArmor',
    description: 'A judge, inquisitor, and divine executioner frame.',
    requiresSubChoice: 'judicator',
    restriction: 'A character with a Sentinel Body Artifact cannot wear mundane armor or bind another Body Artifact.',
    // Three clean tracks mapped to real, editable Powers / Stone Functions:
    //   L1 Armor Hasten → `empower-buff-armor` (Armor Buff Empowerment passive),
    //   L2 Wits Core    → Stone Pool (Wits),
    //   L3 Regeneration → Stone Power Support (Influence: Regeneration).
    // The Stone Functions live on their own picks, so both apply mechanically.
    progressionPickSpecs: {
        1: { templateId: 'empower-buff-armor', name: 'Armor Hasten' },
        2: { name: 'Wits Core', stoneFunction: { kind: 'stonePool', attribute: 'wits' } },
        3: {
            name: 'Regeneration Support',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'influence',
                stonePowerId: 'influence.regeneration',
            },
        },
    },
    baseValues: [
        {
            slot: 'a',
            label: 'Light Echo Armor',
            note: '+8 to +18 Armor; no Light Armor drawback.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Armor Hasten I',
            type: 'Active Buff Empowerment',
            range: 'Self',
            duration: 'Passive',
            effect: 'When activating an Active Buff that grants Armor, empower it by +1 Power Level and +1 round (cannot exceed PL 16).',
            special: 'Armor Buff Empowerment',
        },
        {
            level: 2,
            name: 'Wits Core I',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: 'After each Safe Haven Rest, Judicator Frame stores 2 Wits Stones.',
            special: 'Wits Stones',
        },
        {
            level: 3,
            name: 'Regeneration Support I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Judicator Frame supports the Regeneration Stone Power and pre-fills Tier 2.',
            special: 'Regeneration Stone Power',
        },
        {
            level: 4,
            name: 'Armor Hasten II',
            type: 'Active Buff Empowerment',
            range: 'Self',
            duration: 'Passive',
            effect: 'Armor Buff Empowerment improves to +2 PL and +2 rounds.',
            special: 'Armor Buff Empowerment',
        },
        {
            level: 5,
            name: 'Wits Core II',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: 'After each Safe Haven Rest, Judicator Frame stores 4 Wits Stones.',
            special: 'Wits Stones',
        },
        {
            level: 6,
            name: 'Regeneration Support II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fills Tier 3 of the Regeneration Stone Power.',
            special: 'Regeneration Stone Power',
        },
        {
            level: 7,
            name: 'Armor Hasten III',
            type: 'Active Buff Empowerment',
            range: 'Self',
            duration: 'Passive',
            effect: 'Armor Buff Empowerment improves to +3 PL and +3 rounds.',
            special: 'Armor Buff Empowerment',
        },
        {
            level: 8,
            name: 'Wits Core III',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: 'After each Safe Haven Rest, Judicator Frame stores 8 Wits Stones.',
            special: 'Wits Stones',
        },
        {
            level: 9,
            name: 'Regeneration Support III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fills Tier 4 of the Regeneration Stone Power.',
            special: 'Regeneration Stone Power',
        },
        {
            level: 10,
            name: 'True Judicator Frame',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Once per Safe Haven Rest, when activating an Armor Active Buff through Armor Hasten, you may also use the supported Regeneration Stone Power as part of the same activation.',
            special: 'Armor / Regeneration',
        },
    ],
};
const ORACLE_FRAME = {
    key: 'oracleFrame',
    name: 'Oracle Frame',
    echoKey: 'sentinels',
    slot: 'body',
    baseProfile: 'bodyArmor',
    description: 'An arcane vessel of command, prophecy, and divine will.',
    requiresSubChoice: 'oracle',
    restriction: 'A character with a Sentinel Body Artifact cannot wear mundane armor or bind another Body Artifact.',
    // L1 Oracle Field → `ab-armor-aura` (PL 1 / 3 / 5 → I / III / V),
    // L2 Oracle Aid → Stone Power Support (Influence: Aid Roll),
    // L3 Influence Core → Stone Pool (Influence).
    progressionPickSpecs: {
        1: {
            name: 'Oracle Field',
            templateId: 'ab-armor-aura',
            stagePowerLevels: ['1', '3', '5'],
            stageNumerals: ['I', 'III', 'V'],
        },
        2: {
            name: 'Oracle Aid',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'influence',
                stonePowerId: 'influence.aidRoll',
            },
        },
        3: { name: 'Influence Core', stoneFunction: { kind: 'stonePool', attribute: 'influence' } },
    },
    baseValues: [
        {
            slot: 'a',
            label: 'Light Echo Armor',
            note: '+8 to +18 Armor; no Light Armor drawback.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Oracle Field I',
            type: 'Active Buff',
            range: 'Self',
            aoe: 'Radius 2 m',
            duration: 'Mastery Rank Rounds',
            effect: 'You and allies in the area gain +4 Armor.',
            special: 'Armor Aura',
        },
        {
            level: 2,
            name: 'Oracle Aid I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Oracle Frame supports the Influence Ability: Aid Roll Stone Power and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.',
            special: 'Aid Roll Stone Power',
        },
        {
            level: 3,
            name: 'Influence Core I',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: "After each Safe Haven Rest, Oracle Frame stores 2 Influence Stones. These Stones may only be used for Oracle Frame's listed Influence Stone functions.",
            special: 'Influence Stones',
        },
        {
            level: 4,
            name: 'Oracle Field III',
            type: 'Active Buff Upgrade',
            range: 'Self',
            aoe: 'Radius 6 m',
            duration: 'Mastery Rank Rounds',
            effect: 'You and allies in the area gain +9 Armor.',
            special: 'Armor Aura',
        },
        {
            level: 5,
            name: 'Oracle Aid II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Oracle Frame pre-fills Tier 3 of the Influence Ability: Aid Roll Stone Power. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.',
            special: 'Aid Roll Stone Power',
        },
        {
            level: 6,
            name: 'Influence Core II',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: "After each Safe Haven Rest, Oracle Frame stores 4 Influence Stones. These Stones may only be used for Oracle Frame's listed Influence Stone functions.",
            special: 'Influence Stones',
        },
        {
            level: 7,
            name: 'Oracle Field V',
            type: 'Active Buff Upgrade',
            range: 'Self',
            aoe: 'Radius 10 m',
            duration: 'Mastery Rank Rounds',
            effect: 'You and allies in the area gain +14 Armor.',
            special: 'Armor Aura',
        },
        {
            level: 8,
            name: 'Oracle Aid III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Oracle Frame pre-fills Tier 4 of the Influence Ability: Aid Roll Stone Power. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If Tier 1, Tier 2, and Tier 3 are not paid, the pre-filled Tier 4 has no effect.',
            special: 'Aid Roll Stone Power',
        },
        {
            level: 9,
            name: 'Influence Core III',
            type: 'Stone Pool',
            range: 'Self',
            duration: 'Passive',
            effect: "After each Safe Haven Rest, Oracle Frame stores 8 Influence Stones. These Stones may only be used for Oracle Frame's listed Influence Stone functions.",
            special: 'Influence Stones',
        },
        {
            level: 10,
            name: 'True Oracle Frame',
            type: 'Ultimate',
            range: 'Self',
            duration: 'Special',
            effect: 'Once per Safe Haven Rest, when you use Aid Roll through Oracle Frame, you may treat one required lower Tier as already paid.',
            special: 'Aid Roll Stone Power',
        },
    ],
};
// ----------------------------------------------------------------------
// Ringchain of Kept Names (Halfling — optional Amulet)
// ----------------------------------------------------------------------
const RINGCHAIN_OF_KEPT_NAMES = {
    key: 'ringchainOfKeptNames',
    name: 'Ringchain of Kept Names',
    echoKey: 'halflings',
    slot: 'amulet',
    baseProfile: 'noArmorBody',
    description: 'Halfling Echo Artifact: family rings on one chain. No numeric Base Values. Influence Ability: Not a Target, Cleanse, Healing Aura, and Single Heal.',
    restriction: 'The Ringchain occupies the Amulet Slot. A Halfling with the Ringchain cannot wear another Amulet Artifact. Echo-bound and cannot normally be removed, replaced, sold, stolen, or unbound.',
    extraStoneFunctions: [
        {
            level: 1,
            name: 'Kept from Sight',
            kind: 'stonePowerSupport',
            attribute: 'influence',
            stonePowerId: 'influence.notATarget',
            // Follow-up: T2 support at L1 tries to activate the first published
            // Not a Target tier. Do not invent replacement Level Progression values here.
            supportStages: [1, 5, 9],
        },
    ],
    baseValues: [
        {
            slot: 'a',
            label: 'No numeric Base Values',
            note: 'Grants no Armor, Evade, Movement, or weapon value. Power comes from Level Progression.',
        },
    ],
    levelProgression: [
        {
            level: 1,
            name: 'Kept from Sight I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 2 of Influence Ability: Not a Target. Tier 1 must still be paid.',
            special: 'influence.notATarget',
        },
        {
            level: 2,
            name: 'Burden Lifted I',
            type: 'Active, Support',
            range: '20 m',
            duration: 'Instant',
            effect: 'Remove up to 6 total points of eligible negative Special value from one creature.',
            special: 'Ranged Single Target Cleanse (PL 4)',
        },
        {
            level: 3,
            name: 'Hearth Circle I',
            type: 'Active Buff',
            range: 'Self',
            aoe: 'Radius 2 m',
            duration: 'Mastery Rank Rounds',
            effect: 'At the end of each of your turns, allies inside the aura heal 3d8 HP. Each creature can be affected only once per Round.',
            special: 'Active Buff: Healing Aura (PL 4)',
        },
        {
            level: 4,
            name: 'Remembered Hands I',
            type: 'Active, Support',
            range: '44 m',
            duration: 'Instant',
            effect: 'Heal one creature for 13d8 HP. This profile has a pool of 2 Health Levels per Safe Haven Rest.',
            special: 'Ranged Single Target Heal (PL 10)',
        },
        {
            level: 5,
            name: 'Kept from Sight II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 3 of Influence Ability: Not a Target. Tiers 1 and 2 must still be paid.',
            special: 'influence.notATarget',
        },
        {
            level: 6,
            name: 'Burden Lifted II',
            type: 'Active, Support',
            range: '44 m',
            duration: 'Instant',
            effect: 'Remove up to 10 total points of eligible negative Special value from one creature. This replaces Burden Lifted I.',
            special: 'Ranged Single Target Cleanse (PL 10)',
        },
        {
            level: 7,
            name: 'Remembered Hands II',
            type: 'Active, Support',
            range: '68 m',
            duration: 'Instant',
            effect: 'Heal one creature for 19d8 HP. This profile has a pool of 4 Health Levels per Safe Haven Rest and replaces Remembered Hands I.',
            special: 'Ranged Single Target Heal (PL 16)',
        },
        {
            level: 8,
            name: 'Hearth Circle II',
            type: 'Active Buff',
            range: 'Self',
            aoe: 'Radius 4 m',
            duration: 'Mastery Rank Rounds',
            effect: 'At the end of each of your turns, allies inside the aura heal 11d8 HP. Each creature can be affected only once per Round. This replaces Hearth Circle I.',
            special: 'Active Buff: Healing Aura (PL 16)',
        },
        {
            level: 9,
            name: 'Kept from Sight III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 4 of Influence Ability: Not a Target. Tiers 1, 2, and 3 must still be paid.',
            special: 'influence.notATarget',
        },
        {
            level: 10,
            name: 'True Ringchain of Kept Names',
            type: 'Ultimate',
            range: 'As defined',
            duration: 'As defined',
            effect: 'Define the complete final effect with the GM. It is unavailable until its full profile and Technical Reference are recorded.',
            special: 'Artifact Ultimate: GM-Defined Ringchain Effect',
        },
    ],
};
// ----------------------------------------------------------------------
// Registry
// ----------------------------------------------------------------------
export const ECHO_ARTIFACTS = {
    stoneboundSoles: STONEBOUND_SOLES,
    elorianStride: ELORIAN_STRIDE,
    titanScars: TITAN_SCARS,
    wyrmScalesHeavy: WYRM_SCALES_HEAVY,
    wyrmScalesLight: WYRM_SCALES_LIGHT,
    dragonClaws: DRAGON_CLAWS,
    dragonHead: DRAGON_HEAD,
    sentinelFrame: SENTINEL_FRAME,
    judicatorFrame: JUDICATOR_FRAME,
    oracleFrame: ORACLE_FRAME,
    ringchainOfKeptNames: RINGCHAIN_OF_KEPT_NAMES,
    ...UNBOUND_ECHO_ARTIFACTS,
};
export const ECHO_ARTIFACT_RULES = {
    humans: { echoKey: 'humans', requiredAtCreation: 0, maxAtCreation: 0, availableKeys: [] },
    dwarfs: {
        echoKey: 'dwarfs',
        requiredAtCreation: 1,
        maxAtCreation: 1,
        availableKeys: ['stoneboundSoles'],
    },
    elorians: {
        echoKey: 'elorians',
        requiredAtCreation: 1,
        maxAtCreation: 1,
        availableKeys: ['elorianStride'],
    },
    sentinels: {
        echoKey: 'sentinels',
        requiredAtCreation: 1,
        maxAtCreation: 1,
        availableKeys: ['sentinelFrame', 'judicatorFrame', 'oracleFrame'],
    },
    titanborn: {
        echoKey: 'titanborn',
        requiredAtCreation: 1,
        maxAtCreation: 1,
        availableKeys: ['titanScars'],
    },
    halflings: {
        echoKey: 'halflings',
        requiredAtCreation: 0,
        maxAtCreation: 1,
        availableKeys: ['ringchainOfKeptNames'],
    },
    dragonborn: {
        echoKey: 'dragonborn',
        requiredAtCreation: 1,
        maxAtCreation: 3,
        // Claws (both hands), Head (head) and one Body armor. Wyrm Scales and
        // Serpent Scales both occupy the Body slot, so they are mutually exclusive.
        availableKeys: ['dragonClaws', 'dragonHead', 'wyrmScalesHeavy', 'wyrmScalesLight'],
        exclusiveGroups: [['wyrmScalesHeavy', 'wyrmScalesLight']],
    },
    unbound: {
        echoKey: 'unbound',
        requiredAtCreation: 1,
        maxAtCreation: 1,
        availableKeys: UNBOUND_ECHO_ARTIFACT_KEYS,
        exclusiveGroups: [UNBOUND_PREDATOR_CROWN_KEYS],
    },
};
/** Lookup an Echo Artifact by key (legacy aliases resolve to current variant keys). */
export function getEchoArtifact(key) {
    if (!key)
        return null;
    const resolved = ECHO_ARTIFACT_KEY_ALIASES[key] ?? key;
    return ECHO_ARTIFACTS[resolved] ?? null;
}
/** Echo Artifact defs that share a variant comparison group, in display order. */
export function listEchoArtifactsInVariantGroup(groupKey) {
    const order = ['Heavy', 'Light'];
    return Object.values(ECHO_ARTIFACTS)
        .filter((d) => d.variantGroupKey === groupKey && d.variantRow)
        .sort((a, b) => order.indexOf(a.variantRow.armorClass) - order.indexOf(b.variantRow.armorClass));
}
/** Resolve legacy echo keys (e.g. elves → elorians). */
function resolveEchoKey(echoKey) {
    if (!echoKey)
        return null;
    if (echoKey === 'elves')
        return 'elorians';
    if (echoKey === 'halfling')
        return 'halflings';
    return echoKey;
}
/** Rules block for an Echo (returns Human default if unknown). */
export function getEchoArtifactRules(echoKey) {
    const resolved = resolveEchoKey(echoKey);
    if (!resolved)
        return ECHO_ARTIFACT_RULES.humans;
    return ECHO_ARTIFACT_RULES[resolved] ?? ECHO_ARTIFACT_RULES.humans;
}
/**
 * Build the list of Echo Artifacts a character may pick at creation,
 * filtered by sub-choice gating. Used by the Echo creation dialog.
 */
export function listSelectableEchoArtifacts(echoKey, subChoiceKey) {
    const rules = getEchoArtifactRules(echoKey);
    const out = [];
    for (const k of rules.availableKeys) {
        const def = getEchoArtifact(k);
        if (!def)
            continue;
        if (def.requiresSubChoice && def.requiresSubChoice !== subChoiceKey)
            continue;
        out.push(def);
    }
    return out;
}
/**
 * Validate a set of selected Echo Artifact keys against an Echo's rules
 * (count + mutually-exclusive groups). Returns an error string, or null if OK.
 */
export function validateEchoArtifactSelection(echoKey, selectedKeys) {
    const rules = getEchoArtifactRules(echoKey);
    const unique = Array.from(new Set(selectedKeys.filter(Boolean)));
    if (unique.length < rules.requiredAtCreation) {
        return `This Echo requires at least ${rules.requiredAtCreation} Echo Artifact(s).`;
    }
    if (unique.length > rules.maxAtCreation) {
        return `This Echo allows at most ${rules.maxAtCreation} Echo Artifact(s).`;
    }
    for (const group of rules.exclusiveGroups ?? []) {
        const chosen = unique.filter((k) => group.includes(k));
        if (chosen.length > 1) {
            const names = chosen
                .map((k) => getEchoArtifact(k)?.name ?? k)
                .join(' / ');
            return `You may pick only one of: ${names}.`;
        }
    }
    return null;
}
/**
 * Build a partial `system` object for an artifact item from an Echo
 * Artifact definition — used when seeding the embedded artifact item
 * on character creation.
 */
export function buildEchoStoneFunction(def) {
    const sf = def.stoneFunction;
    if (!sf)
        return null;
    const out = {
        kind: sf.kind,
        attribute: sf.attribute,
    };
    if (sf.kind === 'stonePowerSupport' && sf.stonePowerId)
        out.stonePowerId = sf.stonePowerId;
    return out;
}
/**
 * Build the up-to-three Level Progression picks from an Echo definition.
 * Each Basic level (1-3) becomes a catalog Power pick (from `progressionPickIds`)
 * or, when claimed by `stoneFunction`, the Stone Function pick. The 1-10 table is
 * generated from these picks by `deriveLevelProgressionFromPicks`.
 */
export function buildEchoProgressionPicks(def) {
    const picks = [
        { level: 1, kind: 'none' },
        { level: 2, kind: 'none' },
        { level: 3, kind: 'none' },
    ];
    // Catalog Power picks per level.
    const ids = def.progressionPickIds || {};
    for (const lvl of [1, 2, 3]) {
        const tplId = ids[lvl];
        if (tplId) {
            picks[lvl - 1] = { level: lvl, kind: 'power', powerTemplateId: tplId };
        }
    }
    // Rich pick specs (martial delivery+Special or non-martial template) with
    // optional flavor names — take precedence over `progressionPickIds`.
    const specs = def.progressionPickSpecs || {};
    for (const lvl of [1, 2, 3]) {
        const spec = specs[lvl];
        if (!spec)
            continue;
        const displayName = spec.name?.trim() || undefined;
        const stageOverrides = {
            ...(spec.stagePowerLevels ? { stagePowerLevels: spec.stagePowerLevels } : {}),
            ...(spec.stageNumerals ? { stageNumerals: spec.stageNumerals } : {}),
            ...(spec.stageTemplateIds ? { stageTemplateIds: spec.stageTemplateIds } : {}),
            ...(spec.stageNames ? { stageNames: spec.stageNames } : {}),
            ...(spec.stageEffectTexts ? { stageEffectTexts: spec.stageEffectTexts } : {}),
            ...(spec.isSpell ? { isSpell: true } : {}),
            ...(spec.castingAttribute ? { castingAttribute: spec.castingAttribute } : {}),
            ...(spec.spellResolution ? { spellResolution: spec.spellResolution } : {}),
        };
        if (spec.stoneFunction) {
            const sfSpec = spec.stoneFunction;
            const stoneFunction = {
                kind: sfSpec.kind,
                attribute: sfSpec.attribute,
            };
            if (sfSpec.kind === 'stonePowerSupport' && sfSpec.stonePowerId) {
                stoneFunction.stonePowerId = sfSpec.stonePowerId;
            }
            picks[lvl - 1] = { level: lvl, kind: 'stoneFunction', stoneFunction, displayName, ...stageOverrides };
        }
        else if (spec.delivery && spec.special) {
            const resolved = resolvePickFromUi(spec.delivery, spec.special);
            picks[lvl - 1] = {
                level: lvl,
                kind: 'power',
                powerTemplateId: resolved.powerTemplateId,
                delivery: resolved.delivery,
                chosenSpecial: resolved.chosenSpecial,
                displayName,
                ...stageOverrides,
            };
        }
        else if (spec.templateId) {
            const pick = {
                level: lvl,
                kind: 'power',
                powerTemplateId: spec.templateId,
                displayName,
                ...stageOverrides,
            };
            if (spec.special && !spec.delivery) {
                const tier = tierFromSpecialKey(spec.special) ??
                    catalogSpecialTierForTemplate(spec.templateId) ??
                    4;
                pick.chosenSpecial = { key: spec.special, tier: tier };
            }
            picks[lvl - 1] = pick;
        }
    }
    // Stone Function pick claims its level (overrides any Power pick there).
    const sf = def.stoneFunction;
    if (sf) {
        picks[sf.level - 1] = {
            level: sf.level,
            kind: 'stoneFunction',
            stoneFunction: buildEchoStoneFunction(def),
            displayName: sf.name?.trim() || undefined,
        };
    }
    // Authored fallback: any base level (1/2/3) still empty but covered by the
    // hand-written `levelProgression` table (e.g. Dragon Head's Breath Weapon /
    // Draconic Roar / Draconic Recovery) becomes an `authored` pick carrying its
    // staged rows. This keeps bespoke lines visible in the Node Editor and stops
    // a save/inheritance from recompiling them away.
    const authoredRows = Array.isArray(def.levelProgression) ? def.levelProgression : [];
    if (authoredRows.length > 0) {
        for (const baseLevel of [1, 2, 3]) {
            if (picks[baseLevel - 1].kind !== 'none')
                continue;
            // Collect the slot's rows at levels base / base+3 / base+6 (skip L10 Ultimate).
            const stages = [baseLevel, baseLevel + 3, baseLevel + 6]
                .map((lvl) => authoredRows.find((r) => Number(r.level) === lvl))
                .filter((r) => !!r)
                .map((r) => ({
                level: Number(r.level),
                name: r.name || '',
                type: r.type || '',
                range: r.range || '',
                aoe: r.aoe || '',
                duration: r.duration || '',
                effect: r.effect || '',
                special: r.special || '',
            }));
            if (stages.length > 0) {
                picks[baseLevel - 1] = { level: baseLevel, kind: 'authored', authoredStages: stages };
            }
        }
    }
    return picks;
}
export function buildArtifactSystemFromEchoDef(def) {
    return {
        level: 1,
        currentLevel: 1,
        equipped: true,
        effects: [],
        artifactKind: def.baseProfile === 'twoHandedWeapon' ||
            def.baseProfile === 'twoHandedWeaponRanged' ||
            def.baseProfile === 'oneHandedWeapon' ||
            def.baseProfile === 'oneHandedWeaponRanged'
            ? 'weapon'
            : def.baseProfile === 'shield'
                ? 'shield'
                : def.baseProfile === 'bodyArmor' || def.baseProfile === 'noArmorBody'
                    ? 'armor'
                    : 'gear',
        slot: def.slot,
        baseProfile: def.baseProfile,
        binding: 'echo',
        echoKey: def.echoKey,
        baseValues: def.baseValues.map((bv) => ({
            slot: bv.slot,
            type: bv.label.toLowerCase().includes('damage')
                ? 'weaponDamage'
                : bv.label.toLowerCase().includes('armor')
                    ? bv.label.toLowerCase().includes('feet') || bv.label.toLowerCase().includes('head')
                        ? 'headArmor'
                        : 'bodyArmor'
                    : bv.label.toLowerCase().includes('evade')
                        ? 'evade'
                        : bv.label.toLowerCase().includes('clinging') ||
                            bv.label.toLowerCase().includes('move') ||
                            bv.label.toLowerCase().includes('cling')
                            ? 'movement'
                            : 'minorFeature',
            label: bv.label,
            note: bv.note,
            isBaseline: true,
        })),
        levelProgression: def.levelProgression,
        stoneFunction: buildEchoStoneFunction(def),
        extraStoneFunctions: def.extraStoneFunctions ?? [],
        progressionPicks: buildEchoProgressionPicks(def),
        lore: def.description,
        bonuses: { attack: 0, damage: '', defense: 0, specials: [] },
        requirements: { stones: 0, masteryRank: 1 },
        powers: [],
        inventorySize: '1x1',
        baseDamage: '',
        specials: [],
        description: def.description,
    };
}
//# sourceMappingURL=echo-artifacts.js.map
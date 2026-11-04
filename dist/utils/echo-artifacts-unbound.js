/**
 * Unbound Echo Artifacts — Player's Guide technical names.
 * Each Unbound identity grants exactly one of these at creation.
 */
/** Matches Titan Scars / Hollow Crown / Core universal Awakening effect text. */
const ARTIFACT_AWAKENING_EFFECT = "Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and Stone resources. Permanent Passives remain unchanged.";
function artifactAwakeningStage(artifactName) {
    return {
        name: 'Artifact Awakening',
        type: 'Artifact Function',
        range: 'Self',
        duration: 'Special',
        effect: ARTIFACT_AWAKENING_EFFECT,
        special: `Artifact Level 10: Awakening (${artifactName})`,
    };
}
function tenLevels(a, b, c, ultimate) {
    const placed = [
        [1, a[0]],
        [2, b[0]],
        [3, c[0]],
        [4, a[1]],
        [5, b[1]],
        [6, c[1]],
        [7, a[2]],
        [8, b[2]],
        [9, c[2]],
        [10, ultimate],
    ];
    return placed.map(([level, row]) => ({
        level,
        name: row.name,
        type: row.type,
        range: row.range,
        aoe: row.aoe,
        duration: row.duration,
        effect: row.effect,
        special: row.special,
    }));
}
const RETALIATORY_BITE = [
    {
        name: 'Retaliatory Bite I',
        type: 'Reaction',
        range: 'Melee Reach',
        duration: 'Triggering damage instance only',
        effect: 'Use Reaction: Damage at PL 4, delivered through the chosen head-based natural strike. The triggering enemy must be within melee reach.',
        special: 'Reaction: Damage (PL 4; Artifact Delivery Restriction)',
    },
    {
        name: 'Retaliatory Bite II',
        type: 'Reaction',
        range: 'Melee Reach',
        duration: 'Triggering damage instance only',
        effect: 'Use Reaction: Damage at PL 10 with the same delivery restriction. This replaces Retaliatory Bite I.',
        special: 'Reaction: Damage (PL 10; Artifact Delivery Restriction)',
    },
    {
        name: 'Retaliatory Bite III',
        type: 'Reaction',
        range: 'Melee Reach',
        duration: 'Triggering damage instance only',
        effect: 'Use Reaction: Damage at PL 16 with the same delivery restriction. This replaces Retaliatory Bite II.',
        special: 'Reaction: Damage (PL 16; Artifact Delivery Restriction)',
    },
];
const RED_HUNT = [
    {
        name: 'Red Hunt I',
        type: 'Active Buff',
        range: 'Self',
        duration: 'Mastery Rank Rounds',
        effect: 'Use the normal Damage Active Buff profile at PL 4.',
        special: 'Active Buff: Damage (PL 4)',
    },
    {
        name: 'Red Hunt II',
        type: 'Active Buff',
        range: 'Self',
        duration: 'Mastery Rank Rounds',
        effect: 'Use the normal Damage Active Buff profile at PL 10. This replaces Red Hunt I.',
        special: 'Active Buff: Damage (PL 10)',
    },
    {
        name: 'Red Hunt III',
        type: 'Active Buff',
        range: 'Self',
        duration: 'Mastery Rank Rounds',
        effect: 'Use the normal Damage Active Buff profile at PL 16. This replaces Red Hunt II.',
        special: 'Active Buff: Damage (PL 16)',
    },
];
function predatorStoneTrack(label, technical) {
    return [
        {
            name: 'Predator Stone I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: `Pre-fill Tier 2 of the fixed Predator Stone choice (${label}). Tier 1 must still be paid.`,
            special: technical,
        },
        {
            name: 'Predator Stone II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: `Pre-fill Tier 3 of the same Predator Stone choice. Tiers 1 and 2 must still be paid.`,
            special: technical,
        },
        {
            name: 'Predator Stone III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: `Pre-fill Tier 4 of the same Predator Stone choice. Tiers 1, 2, and 3 must still be paid.`,
            special: technical,
        },
    ];
}
function makePredatorCrown(opts) {
    return {
        key: opts.key,
        name: 'Predator Crown',
        echoKey: 'unbound',
        slot: 'head',
        baseProfile: 'headArmor',
        requiresSubChoice: 'beast',
        description: 'Beast Unbound Echo Artifact: the awakened hunting mind written into the head. Choose a Predator Shape; all Predator Crowns use the same rules.',
        restriction: 'A Beast with Predator Crown cannot wear another Head Artifact, helmet, mask, crown, horn Artifact, magical headgear, or similar Head-based Artifact.',
        naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
        stoneFunction: opts.stoneFunction,
        progressionPickSpecs: {
            2: { name: 'Retaliatory Bite', templateId: 'reaction-counter-damage' },
            3: { name: 'Red Hunt', templateId: 'ab-damage' },
        },
        baseValues: [
            { slot: 'a', label: 'Bite Damage', note: '4d8 to 14d8. Natural Weapon; bite, beak, horn, tusk, or throat snap.' },
            { slot: 'b', label: 'Head Armor', note: '+1 to +5 minor Armor. Stacks with Body Armor and Shield Armor.' },
            { slot: 'c', label: 'Predator Sense', note: 'Sense Slot option. Standard 20 m range. Does not scale with Artifact Level.' },
        ],
        levelProgression: tenLevels(predatorStoneTrack(opts.stoneLabel, opts.stoneTechnical), RETALIATORY_BITE, RED_HUNT, artifactAwakeningStage('Predator Crown')),
    };
}
const PREDATOR_CROWN_MIGHT = makePredatorCrown({
    key: 'predatorCrownMight',
    stoneLabel: 'Might — Martial Damage',
    stoneTechnical: 'Might Ability: Martial Damage (choose one, Tier 2+)',
    stoneFunction: {
        level: 1,
        kind: 'stonePowerSupport',
        attribute: 'might',
        stonePowerId: 'might.meleeDamage',
        name: 'Predator Stone',
    },
});
const PREDATOR_CROWN_WITS = makePredatorCrown({
    key: 'predatorCrownWits',
    stoneLabel: 'Wits — Initiative Boost',
    stoneTechnical: 'Wits Ability: Initiative Boost (choose one, Tier 2+)',
    stoneFunction: {
        level: 1,
        kind: 'stonePowerSupport',
        attribute: 'wits',
        stonePowerId: 'wits.initiativeBoost',
        name: 'Predator Stone',
    },
});
const PREDATOR_CROWN_INTELLECT = makePredatorCrown({
    key: 'predatorCrownIntellect',
    stoneLabel: 'Intellect — Raise Focus',
    stoneTechnical: 'Intellect Ability: Raise Focus (choose one, Tier 2+)',
    stoneFunction: {
        level: 1,
        kind: 'stonePowerSupport',
        attribute: 'intellect',
        stonePowerId: 'intellect.raises',
        name: 'Predator Stone',
    },
});
/** Binding Circle — identical for all three Witch Staff traditions (PH ~3283–3289). */
function witchBindingCircle() {
    return [
        {
            name: 'Binding Circle I',
            type: 'Active, Spell',
            range: '20 m',
            aoe: 'Radius 3 m',
            duration: 'Instant',
            effect: 'Make one AoE Attack Roll against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Root(3)**; **no Power damage**.',
            special: 'Ranged AoE Special: Root (PL 4)',
        },
        {
            name: 'Binding Circle II',
            type: 'Active, Spell',
            range: '44 m',
            aoe: 'Radius 6 m',
            duration: 'Instant',
            effect: 'Make one AoE Attack Roll against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Root(5)**; **no Power damage**. This replaces Binding Circle I.',
            special: 'Ranged AoE Special: Root (PL 10)',
        },
        {
            name: 'Binding Circle III',
            type: 'Active, Spell',
            range: '68 m',
            aoe: 'Radius 7 m',
            duration: 'Instant',
            effect: 'Make one AoE Attack Roll against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Root(7)**; **no Power damage**. This replaces Binding Circle II.',
            special: 'Ranged AoE Special: Root (PL 16)',
        },
    ];
}
function witchMainSpellPrinted(special) {
    switch (special) {
        case 'weaken':
            return { label: 'Weaken', ranks: [2, 3, 4] };
        case 'ruin':
            return { label: 'Ruin', ranks: [6, 10, 13] };
        case 'blight':
            return { label: 'Blight', ranks: [7, 12, 15] };
    }
}
function witchMainSpell(special) {
    const { label, ranks } = witchMainSpellPrinted(special);
    const tech = (pl) => `Ranged Single Target Special: ${label} (PL ${pl})`;
    return [
        {
            name: 'Main Spell I',
            type: 'Active, Spell',
            range: '20 m',
            aoe: 'None',
            duration: 'Instant',
            effect: `Use the Main Spell of this Staff's tradition at PL 4: **${label}(${ranks[0]})**. One creature; **no Power damage**.`,
            special: tech(4),
        },
        {
            name: 'Main Spell II',
            type: 'Active, Spell',
            range: '44 m',
            aoe: 'None',
            duration: 'Instant',
            effect: `Use the Main Spell of this Staff's tradition at PL 10: **${label}(${ranks[1]})**. One creature; **no Power damage**. This replaces Main Spell I.`,
            special: tech(10),
        },
        {
            name: 'Main Spell III',
            type: 'Active, Spell',
            range: '68 m',
            aoe: 'None',
            duration: 'Instant',
            effect: `Use the Main Spell of this Staff's tradition at PL 16: **${label}(${ranks[2]})**. One creature; **no Power damage**. This replaces Main Spell II.`,
            special: tech(16),
        },
    ];
}
const WITCH_STONE = [
    {
        name: 'Witch Stone I',
        type: 'Stone Power Support',
        range: 'Self',
        duration: 'Instant',
        effect: 'Pre-fill Tier 2. Tier 1 must still be paid.',
        special: 'Intellect Ability: Raise Focus (Stone Power Support, Tier 2)',
    },
    {
        name: 'Witch Stone II',
        type: 'Stone Power Support',
        range: 'Self',
        duration: 'Instant',
        effect: 'Pre-fill Tier 3. Tiers 1 and 2 must still be paid.',
        special: 'Intellect Ability: Raise Focus (Stone Power Support, Tier 3)',
    },
    {
        name: 'Witch Stone III',
        type: 'Stone Power Support',
        range: 'Self',
        duration: 'Instant',
        effect: 'Pre-fill Tier 4. Tiers 1, 2, and 3 must still be paid.',
        special: 'Intellect Ability: Raise Focus (Stone Power Support, Tier 4)',
    },
];
function mainSpellInstantTemplateId(special) {
    // Instant Single-Special tier = Start-PP group of the Main Spell Special.
    switch (special) {
        case 'weaken':
            return 'active-ranged-instant-special-t6';
        case 'ruin':
            return 'active-ranged-instant-special-t4';
        case 'blight':
            return 'active-ranged-instant-special-t3';
    }
}
function makeWitchStaff(opts) {
    const mainPrinted = witchMainSpellPrinted(opts.mainSpecial);
    const bindingCircleSpecs = {
        name: 'Binding Circle',
        // Instant AoE Special-only vehicle (dice 0). Root ranks/radii bind from Actives.md.
        templateId: 'active-ranged-aoe-damage-t5',
        special: 'root',
        isSpell: true,
        castingAttribute: 'intellect',
        spellResolution: 'spellAttack',
        stageEffectTexts: [
            'Make one AoE Attack Roll against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Root(3)**; **no Power damage**.',
            'Make one AoE Attack Roll against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Root(5)**; **no Power damage**. This replaces Binding Circle I.',
            'Make one AoE Attack Roll against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Root(7)**; **no Power damage**. This replaces Binding Circle II.',
        ],
    };
    const mainSpellSpecs = {
        name: 'Main Spell',
        templateId: mainSpellInstantTemplateId(opts.mainSpecial),
        special: opts.mainSpecial,
        isSpell: true,
        castingAttribute: 'intellect',
        spellResolution: 'spellAttack',
        stageEffectTexts: [
            `Use the Main Spell of this Staff's tradition at PL 4: **${mainPrinted.label}(${mainPrinted.ranks[0]})**. One creature; **no Power damage**.`,
            `Use the Main Spell of this Staff's tradition at PL 10: **${mainPrinted.label}(${mainPrinted.ranks[1]})**. One creature; **no Power damage**. This replaces Main Spell I.`,
            `Use the Main Spell of this Staff's tradition at PL 16: **${mainPrinted.label}(${mainPrinted.ranks[2]})**. One creature; **no Power damage**. This replaces Main Spell II.`,
        ],
    };
    return {
        key: opts.key,
        name: opts.name,
        echoKey: 'unbound',
        slot: 'bothHands',
        baseProfile: 'twoHandedWeapon',
        requiresSubChoice: opts.subChoice,
        description: opts.description,
        restriction: 'Witch Staff occupies both hand Slots. A Witch cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item at the same time. Counts as a Spell Focus from Level 1. May be used with Intellect.',
        stoneFunction: {
            level: 1,
            kind: 'stonePowerSupport',
            attribute: 'intellect',
            stonePowerId: 'intellect.raises',
            name: 'Witch Stone',
        },
        progressionPickSpecs: {
            2: bindingCircleSpecs,
            3: mainSpellSpecs,
        },
        baseValues: [
            { slot: 'a', label: 'Staff Damage', note: '4d8 to 14d8 two-handed weapon damage.' },
            {
                slot: 'b',
                label: `Tradition Special (${opts.traditionSpecial})`,
                note: `${opts.tradition}: ${opts.traditionSpecial} from Level 4 (2 / 2 / 3 / 3 / 4 / 4 / 5).`,
            },
            { slot: 'c', label: 'Spell Focus', note: 'Spell Focus from Level 1. Boosts Spells cast through the Staff.' },
        ],
        levelProgression: tenLevels(WITCH_STONE, witchBindingCircle(), witchMainSpell(opts.mainSpecial), artifactAwakeningStage('Witch Staff')),
    };
}
const WITCH_STAFF_ROOT = makeWitchStaff({
    key: 'witchStaffRoot',
    name: 'Root Staff',
    subChoice: 'witch-root',
    tradition: 'Root Witch',
    traditionSpecial: 'Slow',
    mainSpecial: 'weaken',
    description: 'Witch Unbound Echo Artifact grown from buried wood, grave roots, thorn knots, and old circles. Tradition Special: Slow. Binding Circle: Ranged AoE Special Root. Main Spell: Ranged Single Target Special Weaken.',
});
const WITCH_STAFF_RUIN = makeWitchStaff({
    key: 'witchStaffRuin',
    name: 'Ruin Staff',
    subChoice: 'witch-ruin',
    tradition: 'Ruin Witch',
    traditionSpecial: 'Hex',
    mainSpecial: 'ruin',
    description: 'Witch Unbound Echo Artifact of blackened wood, cracked bone, ash, and erased names. Tradition Special: Hex. Binding Circle: Ranged AoE Special Root. Main Spell: Ranged Single Target Special Ruin.',
});
const WITCH_STAFF_BLIGHT = makeWitchStaff({
    key: 'witchStaffBlight',
    name: 'Blight Staff',
    subChoice: 'witch-blight',
    tradition: 'Blight Witch',
    traditionSpecial: 'Corrode',
    mainSpecial: 'blight',
    description: 'Witch Unbound Echo Artifact swollen with fungus, rust, sour water, and living decay. Tradition Special: Corrode. Binding Circle: Ranged AoE Special Root. Main Spell: Ranged Single Target Special Blight.',
});
const ALCHEMIST_COAT = {
    key: 'alchemistCoat',
    name: 'Alchemist Coat',
    echoKey: 'unbound',
    slot: 'body',
    baseProfile: 'bodyArmor',
    requiresSubChoice: 'bane-alchemist',
    description: 'Bane Echo Artifact: hardened leather, sealed vials, and a potion harness. Real Medium Armor. Red Potion is Active Buff: Damage. Black Potion is Active Buff: Critical.',
    restriction: 'A Bane with Alchemist Coat cannot wear another Body Artifact, magical armor, robe Artifact, natural armor Artifact, or body-based transformation Artifact at the same time.',
    // PH ~3381–3402: Alchemist Stone is an Artifact Function (Potion Active Buff
    // Empowerment +1/+2/+3 PL & rounds on Red/Black Potions), not Maximization Support.
    progressionPickSpecs: {
        1: { name: 'Red Potion', templateId: 'ab-damage' },
        2: {
            name: 'Alchemist Stone',
            templateId: 'empower-buff-damage',
            stageNames: ['Alchemist Stone I', 'Alchemist Stone II', 'Alchemist Stone III'],
            stageEffectTexts: [
                'When activating Red Potion or Black Potion, increase its effective PL by **+1** and duration by **+1 Rounds** (within the Power Level cap). This replaces any earlier Alchemist Stone value.',
                'When activating Red Potion or Black Potion, increase its effective PL by **+2** and duration by **+2 Rounds** (within the Power Level cap). This replaces any earlier Alchemist Stone value.',
                'When activating Red Potion or Black Potion, increase its effective PL by **+3** and duration by **+3 Rounds** (within the Power Level cap). This replaces any earlier Alchemist Stone value.',
            ],
        },
        3: { name: 'Black Potion', templateId: 'ab-critical' },
    },
    baseValues: [
        { slot: 'a', label: 'Medium Armor', note: '12 Armor at Level 1 to 22 Armor at Level 10. Normal Medium Armor drawbacks.' },
    ],
    levelProgression: tenLevels([
        {
            name: 'Red Potion I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Damage Active Buff profile at PL 4. Alchemist Stone may enhance both its PL and duration.',
            special: 'Active Buff: Damage (PL 4)',
        },
        {
            name: 'Red Potion II',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Damage Active Buff profile at PL 10. This replaces Red Potion I.',
            special: 'Active Buff: Damage (PL 10)',
        },
        {
            name: 'Red Potion III',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Damage Active Buff profile at PL 16. This replaces Red Potion II.',
            special: 'Active Buff: Damage (PL 16)',
        },
    ], [
        {
            name: 'Alchemist Stone I',
            type: 'Artifact Function',
            range: 'Self',
            duration: 'On Potion activation',
            effect: 'When activating Red Potion or Black Potion, increase its effective PL by **+1** and duration by **+1 Rounds** (within the Power Level cap). This replaces any earlier Alchemist Stone value.',
            special: 'Artifact Function: Active Buff Empowerment (+1 PL, +1 Rounds)',
        },
        {
            name: 'Alchemist Stone II',
            type: 'Artifact Function',
            range: 'Self',
            duration: 'On Potion activation',
            effect: 'When activating Red Potion or Black Potion, increase its effective PL by **+2** and duration by **+2 Rounds** (within the Power Level cap). This replaces any earlier Alchemist Stone value.',
            special: 'Artifact Function: Active Buff Empowerment (+2 PL, +2 Rounds)',
        },
        {
            name: 'Alchemist Stone III',
            type: 'Artifact Function',
            range: 'Self',
            duration: 'On Potion activation',
            effect: 'When activating Red Potion or Black Potion, increase its effective PL by **+3** and duration by **+3 Rounds** (within the Power Level cap). This replaces any earlier Alchemist Stone value.',
            special: 'Artifact Function: Active Buff Empowerment (+3 PL, +3 Rounds)',
        },
    ], [
        {
            name: 'Black Potion I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Critical Active Buff profile at PL 4. Alchemist Stone may enhance both its PL and duration.',
            special: 'Active Buff: Critical (PL 4)',
        },
        {
            name: 'Black Potion II',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Critical Active Buff profile at PL 10. This replaces Black Potion I.',
            special: 'Active Buff: Critical (PL 10)',
        },
        {
            name: 'Black Potion III',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Critical Active Buff profile at PL 16. This replaces Black Potion II.',
            special: 'Active Buff: Critical (PL 16)',
        },
    ], artifactAwakeningStage('Alchemist Coat')),
};
const GREEN_WARDEN_MANTLE = {
    key: 'greenWardenMantle',
    name: 'Green Warden Mantle',
    echoKey: 'unbound',
    slot: 'body',
    baseProfile: 'bodyArmor',
    requiresSubChoice: 'bane-greenwarden',
    description: 'Bane Echo Artifact grown from bark, thorn, moss, and the last living strength of the wild places. Thorns is Active Buff: Thorns. Warden\'s Guard is Reaction: Ally Armor.',
    restriction: 'A Green Warden with Green Warden Mantle cannot wear another Body Artifact, magical armor, robe Artifact, natural armor Artifact, or body-based transformation Artifact at the same time.',
    stoneFunction: {
        level: 3,
        kind: 'stonePowerSupport',
        attribute: 'resolve',
        stonePowerId: 'resolve.ward',
        name: 'Green Warden Stone',
    },
    progressionPickSpecs: {
        1: { name: 'Thorns', templateId: 'ab-thorns' },
        2: { name: "Warden's Guard", templateId: 'reaction-ally-armor' },
    },
    baseValues: [
        { slot: 'a', label: 'Medium Armor', note: '12 Armor at Level 1 to 22 Armor at Level 10. Normal Medium Armor drawbacks.' },
    ],
    levelProgression: tenLevels([
        {
            name: 'Thorns I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Active Buff: Thorns profile at PL 4.',
            special: 'Active Buff: Thorns (PL 4)',
        },
        {
            name: 'Thorns II',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Active Buff: Thorns profile at PL 10. This replaces Thorns I.',
            special: 'Active Buff: Thorns (PL 10)',
        },
        {
            name: 'Thorns III',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Active Buff: Thorns profile at PL 16. This replaces Thorns II.',
            special: 'Active Buff: Thorns (PL 16)',
        },
    ], [
        {
            name: "Warden's Guard I",
            type: 'Reaction',
            range: '4 m',
            duration: 'Triggering hit or damage instance only',
            effect: 'The triggering ally gains +7 Armor against that attack or damage instance.',
            special: 'Reaction: Ally Armor (PL 4)',
        },
        {
            name: "Warden's Guard II",
            type: 'Reaction',
            range: '4 m',
            duration: 'Triggering hit or damage instance only',
            effect: 'The triggering ally gains +19 Armor against that attack or damage instance. This replaces Warden\'s Guard I.',
            special: 'Reaction: Ally Armor (PL 10)',
        },
        {
            name: "Warden's Guard III",
            type: 'Reaction',
            range: '4 m',
            duration: 'Triggering hit or damage instance only',
            effect: 'The triggering ally gains +31 Armor against that attack or damage instance. This replaces Warden\'s Guard II.',
            special: 'Reaction: Ally Armor (PL 16)',
        },
    ], [
        {
            name: 'Green Warden Stone I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 2. Tier 1 must still be paid.',
            special: 'Resolve Ability: Ward (Stone Power Support, Tier 2)',
        },
        {
            name: 'Green Warden Stone II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 3. Tiers 1 and 2 must still be paid.',
            special: 'Resolve Ability: Ward (Stone Power Support, Tier 3)',
        },
        {
            name: 'Green Warden Stone III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 4. Tiers 1, 2, and 3 must still be paid.',
            special: 'Resolve Ability: Ward (Stone Power Support, Tier 4)',
        },
    ], artifactAwakeningStage('Green Warden Mantle')),
};
const HUNTERS_SCOURGE = {
    key: 'huntersScourge',
    name: "Hunter's Scourge",
    echoKey: 'unbound',
    slot: 'bothHands',
    baseProfile: 'twoHandedWeapon',
    requiresSubChoice: 'bane-relic-hunter',
    description: "Demon Hunter / Relic Hunter Echo Artifact: a two-handed chain-whip. Keeps Finesse and Reach from the Whip base. Scourge Strike is Limited Melee Single Target Attack. Maximization Support is Vitality: Maximization. Unmask the Prey is Melee Single Target Special: Expose.",
    restriction: "Hunter's Scourge occupies both hand Slots. A Relic Hunter cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item at the same time.",
    // Core (2026-11-04): L1/4/7 Scourge Strike (Limited); L2/5/8 Maximization Support;
    // L3/6/9 Unmask the Prey (Expose). Replaces the prior Exorcism Lash / Snap Chain /
    // Whirling Scourge pick set.
    progressionPickSpecs: {
        1: {
            name: 'Scourge Strike',
            templateId: 'active-melee-limited-single',
            limited: true,
            stageEffectTexts: [
                "Use **Limited Melee Single Target Attack** (PL 4) with Hunter's Scourge: on hit, deal Weapon Damage + printed **+8d8** Power Damage (**×4** at resolution = **+32d8** Power). Weapon Damage is added once and is not multiplied. **Shares the character's one global Limited use per Safe Haven Rest**; spent on declaration (miss still costs the use). No Specials.",
                "Use **Limited Melee Single Target Attack** (PL 10) with Hunter's Scourge: on hit, deal Weapon Damage + printed **+20d8** Power Damage (**×4** = **+80d8** Power). Weapon Damage ×1. **Shares the one global Limited use per Safe Haven Rest**. Replaces Scourge Strike I.",
                "Use **Limited Melee Single Target Attack** (PL 16) with Hunter's Scourge: on hit, deal Weapon Damage + printed **+32d8** Power Damage (**×4** = **+128d8** Power). Weapon Damage ×1. **Shares the one global Limited use per Safe Haven Rest**. Replaces Scourge Strike II.",
            ],
        },
        2: {
            name: 'Maximization Support',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'vitality',
                stonePowerId: 'vitality.damageMaximization',
                supportStages: [2, 5, 8],
            },
        },
        3: {
            name: 'Unmask the Prey',
            // Batch 3 Instant Single-Special (specialOnly): Expose is Tier-6 eligible.
            templateId: 'active-melee-instant-special-t6',
            special: 'expose',
            stageEffectTexts: [
                "Make a melee Attack Roll with Hunter's Scourge; on hit apply **Expose(5)**. **Special-only:** no Power Damage, no Weapon Damage, no Spell Focus, no Damage Roll, and no Maximization.",
                "Make a melee Attack Roll with Hunter's Scourge; on hit apply **Expose(8)**. **Special-only:** no Power Damage, no Weapon Damage, no Spell Focus, no Damage Roll, and no Maximization. This replaces Unmask the Prey I.",
                "Make a melee Attack Roll with Hunter's Scourge; on hit apply **Expose(10)**. **Special-only:** no Power Damage, no Weapon Damage, no Spell Focus, no Damage Roll, and no Maximization. This replaces Unmask the Prey II.",
            ],
        },
    },
    baseValues: [
        { slot: 'a', label: 'Scourge Damage', note: '4d8 to 14d8 weapon damage. Keeps Finesse.' },
        { slot: 'b', label: 'Reach', note: 'Base Whip Reach +1 m. Extra reach from Level 4: +1 / +1 / +2 / +2 / +3 / +3 / +4 m.' },
    ],
    // Authored L10 only — staged rows come from progressionPickSpecs (like Moonlight).
    // Fallback tenLevels kept in sync with Core for documentation / empty-pick paths.
    levelProgression: tenLevels([
        {
            name: 'Scourge Strike I',
            type: 'Active (Limited)',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: "Use Limited Melee Single Target Attack (PL 4) with Hunter's Scourge: Weapon Damage + 32d8 Power (×4 of printed 8d8). One global Limited use per Safe Haven Rest.",
            special: 'Limited Melee Single Target Attack (PL 4)',
        },
        {
            name: 'Scourge Strike II',
            type: 'Active (Limited)',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: "Use Limited Melee Single Target Attack (PL 10): Weapon Damage + 80d8 Power (×4 of printed 20d8). Replaces Scourge Strike I. Shared global Limited charge.",
            special: 'Limited Melee Single Target Attack (PL 10)',
        },
        {
            name: 'Scourge Strike III',
            type: 'Active (Limited)',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: "Use Limited Melee Single Target Attack (PL 16): Weapon Damage + 128d8 Power (×4 of printed 32d8). Replaces Scourge Strike II. Shared global Limited charge.",
            special: 'Limited Melee Single Target Attack (PL 16)',
        },
    ], [
        {
            name: 'Maximization Support I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 2 of Vitality: Maximization. Pay Rank 1 normally; activate once at the first Preparation Phase. Limited Scourge Strike is an eligible Damage Roll. Does not grant extra Limited uses.',
            special: 'Vitality Ability: Maximization (Stone Power Support, Rank 2)',
        },
        {
            name: 'Maximization Support II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 3 of Vitality: Maximization. Replaces Maximization Support I. Does not restore or add Limited uses.',
            special: 'Vitality Ability: Maximization (Stone Power Support, Rank 3)',
        },
        {
            name: 'Maximization Support III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 4 of Vitality: Maximization. Replaces Maximization Support II. Does not restore or add Limited uses.',
            special: 'Vitality Ability: Maximization (Stone Power Support, Rank 4)',
        },
    ], [
        {
            name: 'Unmask the Prey I',
            type: 'Active, Special',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: "Make a melee Attack Roll with Hunter's Scourge; on hit apply Expose(5). Special-only: no Power/Weapon/Focus Damage Roll or Maximization.",
            special: 'Melee Single Target Special: Expose (PL 4)',
        },
        {
            name: 'Unmask the Prey II',
            type: 'Active, Special',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: "Make a melee Attack Roll with Hunter's Scourge; on hit apply Expose(8). Special-only. Replaces Unmask the Prey I.",
            special: 'Melee Single Target Special: Expose (PL 10)',
        },
        {
            name: 'Unmask the Prey III',
            type: 'Active, Special',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: "Make a melee Attack Roll with Hunter's Scourge; on hit apply Expose(10). Special-only. Replaces Unmask the Prey II.",
            special: 'Melee Single Target Special: Expose (PL 16)',
        },
    ], artifactAwakeningStage("Hunter's Scourge")),
};
/** Beast Unbound — Primal Vestment (Body; exclusive with Predator Crown). */
const PRIMAL_VESTMENT = {
    key: 'primalVestment',
    name: 'Primal Vestment',
    echoKey: 'unbound',
    slot: 'body',
    baseProfile: 'noArmorBody',
    requiresSubChoice: 'beast',
    description: 'Beast Unbound Echo Artifact: the awakened hunting body. No Base Values. Choosing it grants the Primal Rage (2 Points) Disadvantage.',
    restriction: 'A Beast with Primal Vestment cannot use another Body Artifact or Body Armor. Explicit exception: two Stone Power Support functions and Extra Attack support from the Body Slot.',
    progressionPickSpecs: {
        2: {
            name: 'Flesh Remembers',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'resolve',
                stonePowerId: 'resolve.healing',
                supportStages: [2, 5, 8],
            },
        },
        3: {
            name: 'Rage Unbound',
            stoneFunction: {
                kind: 'stonePowerSupport',
                attribute: 'might',
                stonePowerId: 'generic.extraAttack',
                supportStages: [3, 6, 9],
            },
        },
    },
    baseValues: [],
    levelProgression: [
        {
            level: 2,
            name: 'Flesh Remembers I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 2 of Healing for yourself only. Rank 1 must still be paid normally.',
            special: 'Resolve Ability: Healing (Stone Power Support, Rank 2; Self only)',
        },
        {
            level: 3,
            name: 'Rage Unbound I',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 2 of Extra Attack. Rank 1 must still be paid normally.',
            special: 'Stone Ability: Extra Attack (Stone Power Support, Rank 2)',
        },
        {
            level: 5,
            name: 'Flesh Remembers II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 3 of Healing for yourself only. Replaces Flesh Remembers I.',
            special: 'Resolve Ability: Healing (Stone Power Support, Rank 3; Self only)',
        },
        {
            level: 6,
            name: 'Rage Unbound II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 3 of Extra Attack. Replaces Rage Unbound I.',
            special: 'Stone Ability: Extra Attack (Stone Power Support, Rank 3)',
        },
        {
            level: 8,
            name: 'Flesh Remembers III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 4 of Healing for yourself only. Replaces Flesh Remembers II.',
            special: 'Resolve Ability: Healing (Stone Power Support, Rank 4; Self only)',
        },
        {
            level: 9,
            name: 'Rage Unbound III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Rank 4 of Extra Attack. Replaces Rage Unbound II.',
            special: 'Stone Ability: Extra Attack (Stone Power Support, Rank 4)',
        },
        {
            level: 10,
            ...artifactAwakeningStage('Primal Vestment'),
        },
    ],
};
export const UNBOUND_ECHO_ARTIFACTS = {
    predatorCrownMight: PREDATOR_CROWN_MIGHT,
    predatorCrownWits: PREDATOR_CROWN_WITS,
    predatorCrownIntellect: PREDATOR_CROWN_INTELLECT,
    primalVestment: PRIMAL_VESTMENT,
    witchStaffRoot: WITCH_STAFF_ROOT,
    witchStaffRuin: WITCH_STAFF_RUIN,
    witchStaffBlight: WITCH_STAFF_BLIGHT,
    alchemistCoat: ALCHEMIST_COAT,
    greenWardenMantle: GREEN_WARDEN_MANTLE,
    huntersScourge: HUNTERS_SCOURGE,
};
export const UNBOUND_ECHO_ARTIFACT_KEYS = Object.keys(UNBOUND_ECHO_ARTIFACTS);
export const UNBOUND_PREDATOR_CROWN_KEYS = [
    'predatorCrownMight',
    'predatorCrownWits',
    'predatorCrownIntellect',
];
/** Beast Body: Predator Crown OR Primal Vestment (at most one). */
export const UNBOUND_BEAST_BODY_EXCLUSIVE_KEYS = [
    ...UNBOUND_PREDATOR_CROWN_KEYS,
    'primalVestment',
];
//# sourceMappingURL=echo-artifacts-unbound.js.map
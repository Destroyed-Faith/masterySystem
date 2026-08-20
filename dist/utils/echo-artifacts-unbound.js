/**
 * Unbound Echo Artifacts — Player's Guide technical names.
 * Each Unbound identity grants exactly one of these at creation.
 */
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
        levelProgression: tenLevels(predatorStoneTrack(opts.stoneLabel, opts.stoneTechnical), RETALIATORY_BITE, RED_HUNT, {
            name: 'True Predator Crown',
            type: 'Artifact Ultimate',
            range: 'As defined',
            duration: 'As defined',
            effect: 'Define the complete final effect with the GM. Unavailable until its full profile and Technical Reference are recorded.',
            special: 'Artifact Ultimate: GM-Defined Predator Crown Effect',
        }),
    };
}
const PREDATOR_CROWN_MIGHT = makePredatorCrown({
    key: 'predatorCrownMight',
    stoneLabel: 'Might — Melee Damage',
    stoneTechnical: 'Might Ability: Melee Damage (choose one, Tier 2+)',
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
    stoneLabel: 'Intellect — Spell Raises',
    stoneTechnical: 'Intellect Ability: Spell Raises (choose one, Tier 2+)',
    stoneFunction: {
        level: 1,
        kind: 'stonePowerSupport',
        attribute: 'intellect',
        stonePowerId: 'intellect.spellRaises',
        name: 'Predator Stone',
    },
});
function witchOverdrive(special) {
    return [
        {
            name: 'Covenant Overdrive I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: `Use Active Buff: Special Increase at PL 4 for the Staff's fixed Tradition Special (${special}). It increases only that already existing Special and does not apply it by itself.`,
            special: `Active Buff: Special Increase + ${special} (PL 4)`,
        },
        {
            name: 'Covenant Overdrive II',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: `Use Active Buff: Special Increase at PL 10 for the Staff's fixed Tradition Special (${special}). This replaces Covenant Overdrive I.`,
            special: `Active Buff: Special Increase + ${special} (PL 10)`,
        },
        {
            name: 'Covenant Overdrive III',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: `Use Active Buff: Special Increase at PL 16 for the Staff's fixed Tradition Special (${special}). This replaces Covenant Overdrive II.`,
            special: `Active Buff: Special Increase + ${special} (PL 16)`,
        },
    ];
}
function witchMainSpell(name, special) {
    return [
        {
            name: 'Main Spell I',
            type: 'Active, Spell',
            range: '20 m',
            aoe: 'None',
            duration: 'Instant',
            effect: `Use ${name} (${special}) at PL 4.`,
            special: `Ranged Attack + ${special} (PL 4)`,
        },
        {
            name: 'Main Spell II',
            type: 'Active, Spell',
            range: '44 m',
            aoe: 'None',
            duration: 'Instant',
            effect: `Use the same tradition Main Spell at PL 10. This replaces Main Spell I.`,
            special: `Ranged Attack + ${special} (PL 10)`,
        },
        {
            name: 'Main Spell III',
            type: 'Active, Spell',
            range: '68 m',
            aoe: 'None',
            duration: 'Instant',
            effect: `Use the same tradition Main Spell at PL 16. This replaces Main Spell II.`,
            special: `Ranged Attack + ${special} (PL 16)`,
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
        special: 'Intellect Ability: Spell Raises (Stone Power Support, Tier 2)',
    },
    {
        name: 'Witch Stone II',
        type: 'Stone Power Support',
        range: 'Self',
        duration: 'Instant',
        effect: 'Pre-fill Tier 3. Tiers 1 and 2 must still be paid.',
        special: 'Intellect Ability: Spell Raises (Stone Power Support, Tier 3)',
    },
    {
        name: 'Witch Stone III',
        type: 'Stone Power Support',
        range: 'Self',
        duration: 'Instant',
        effect: 'Pre-fill Tier 4. Tiers 1, 2, and 3 must still be paid.',
        special: 'Intellect Ability: Spell Raises (Stone Power Support, Tier 4)',
    },
];
function makeWitchStaff(opts) {
    const overdriveSpecs = {
        name: 'Covenant Overdrive',
        templateId: 'ab-special-overdrive',
        special: opts.specialKey,
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
            stonePowerId: 'intellect.spellRaises',
            name: 'Witch Stone',
        },
        progressionPickSpecs: {
            2: overdriveSpecs,
            3: { name: opts.mainSpell, delivery: 'ranged-single', special: opts.specialKey },
        },
        baseValues: [
            { slot: 'a', label: 'Staff Damage', note: '4d8 to 14d8 two-handed weapon damage.' },
            { slot: 'b', label: 'Spell Focus', note: 'Spell Focus from Level 1. Boosts Spells cast through the Staff.' },
            { slot: 'c', label: `Tradition Special (${opts.special})`, note: `${opts.tradition}: ${opts.special} from Level 4 (2 / 2 / 3 / 3 / 4 / 4 / 5).` },
        ],
        levelProgression: tenLevels(WITCH_STONE, witchOverdrive(opts.special), witchMainSpell(opts.mainSpell, opts.special), {
            name: 'True Witch Staff',
            type: 'Artifact Ultimate',
            range: 'As defined',
            duration: 'As defined',
            effect: 'Define the complete final effect with the GM. Unavailable until its full profile and Technical Reference are recorded.',
            special: 'Artifact Ultimate: GM-Defined Witch Staff Effect',
        }),
    };
}
const WITCH_STAFF_ROOT = makeWitchStaff({
    key: 'witchStaffRoot',
    name: 'Root Staff',
    subChoice: 'witch-root',
    tradition: 'Root Witch',
    special: 'Slow',
    specialKey: 'slow',
    mainSpell: 'Rootbinding',
    description: 'Witch Unbound Echo Artifact grown from buried wood, grave roots, thorn knots, and old circles. Tradition Special: Slow. Main Spell: Rootbinding (Ranged Attack + Slow).',
});
const WITCH_STAFF_RUIN = makeWitchStaff({
    key: 'witchStaffRuin',
    name: 'Ruin Staff',
    subChoice: 'witch-ruin',
    tradition: 'Ruin Witch',
    special: 'Hex',
    specialKey: 'hex',
    mainSpell: 'Ruinous Word',
    description: 'Witch Unbound Echo Artifact of blackened wood, cracked bone, ash, and erased names. Tradition Special: Hex. Main Spell: Ruinous Word (Ranged Attack + Hex).',
});
const WITCH_STAFF_BLIGHT = makeWitchStaff({
    key: 'witchStaffBlight',
    name: 'Blight Staff',
    subChoice: 'witch-blight',
    tradition: 'Blight Witch',
    special: 'Corrode',
    specialKey: 'corrode',
    mainSpell: 'Blightcall',
    description: 'Witch Unbound Echo Artifact swollen with fungus, rust, sour water, and living decay. Tradition Special: Corrode. Main Spell: Blightcall (Ranged Attack + Corrode).',
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
    stoneFunction: {
        level: 2,
        kind: 'stonePowerSupport',
        attribute: 'vitality',
        stonePowerId: 'vitality.extendActiveBuff',
        name: 'Alchemist Stone',
    },
    progressionPickSpecs: {
        1: { name: 'Red Potion', templateId: 'ab-damage' },
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
            effect: 'Use the normal Damage Active Buff profile at PL 4. It may be extended by Extend Active Buff if activated this turn.',
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
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 2. Tier 1 must still be paid.',
            special: 'Vitality Ability: Extend Active Buff, Stone Power Support, Tier 2',
        },
        {
            name: 'Alchemist Stone II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 3. Tiers 1 and 2 must still be paid.',
            special: 'Vitality Ability: Extend Active Buff, Stone Power Support, Tier 3',
        },
        {
            name: 'Alchemist Stone III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 4. Tiers 1, 2, and 3 must still be paid.',
            special: 'Vitality Ability: Extend Active Buff, Stone Power Support, Tier 4',
        },
    ], [
        {
            name: 'Black Potion I',
            type: 'Active Buff',
            range: 'Self',
            duration: 'Mastery Rank Rounds',
            effect: 'Use the normal Critical Active Buff profile at PL 4. It may be extended by Extend Active Buff if activated this turn.',
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
    ], {
        name: 'True Alchemist Coat',
        type: 'Artifact Ultimate',
        range: 'As defined',
        duration: 'As defined',
        effect: 'Define the complete final effect with the GM. Unavailable until its full profile and Technical Reference are recorded.',
        special: 'Artifact Ultimate: GM-Defined Alchemist Coat Effect',
    }),
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
            special: 'Resolve Ability: Special Reduction (Stone Power Support, Tier 2)',
        },
        {
            name: 'Green Warden Stone II',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 3. Tiers 1 and 2 must still be paid.',
            special: 'Resolve Ability: Special Reduction (Stone Power Support, Tier 3)',
        },
        {
            name: 'Green Warden Stone III',
            type: 'Stone Power Support',
            range: 'Self',
            duration: 'Instant',
            effect: 'Pre-fill Tier 4. Tiers 1, 2, and 3 must still be paid.',
            special: 'Resolve Ability: Special Reduction (Stone Power Support, Tier 4)',
        },
    ], {
        name: 'True Green Warden Mantle',
        type: 'Artifact Ultimate',
        range: 'As defined',
        duration: 'As defined',
        effect: 'Define the complete final effect with the GM. Unavailable until its full profile and Technical Reference are recorded.',
        special: 'Artifact Ultimate: GM-Defined Green Warden Mantle Effect',
    }),
};
const HUNTERS_SCOURGE = {
    key: 'huntersScourge',
    name: "Hunter's Scourge",
    echoKey: 'unbound',
    slot: 'bothHands',
    baseProfile: 'twoHandedWeapon',
    requiresSubChoice: 'bane-relic-hunter',
    description: "Demon Hunter / Relic Hunter Echo Artifact: a two-handed chain-whip. Keeps Finesse and Reach from the Whip base. Exorcism Lash is Melee Attack + Exorcism. Snap Chain is Artifact Reaction: Damage + Pull. Whirling Scourge is Melee AoE Attack + Exorcism.",
    restriction: "Hunter's Scourge occupies both hand Slots. A Relic Hunter cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item at the same time.",
    progressionPickSpecs: {
        1: { name: 'Exorcism Lash', templateId: 'active-melee-targeted-special', special: 'exorcism' },
        2: { name: 'Snap Chain', templateId: 'reaction-counter-damage-push' },
        3: { name: 'Whirling Scourge', templateId: 'active-melee-aoe-targeted-special', special: 'exorcism' },
    },
    baseValues: [
        { slot: 'a', label: 'Scourge Damage', note: '4d8 to 14d8 weapon damage. Keeps Finesse.' },
        { slot: 'b', label: 'Reach', note: 'Base Whip Reach +1 m. Extra reach from Level 4: +1 / +1 / +2 / +2 / +3 / +3 / +4 m.' },
    ],
    levelProgression: tenLevels([
        {
            name: 'Exorcism Lash I',
            type: 'Active',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: 'Attack with Hunter\'s Scourge. On hit, deal weapon damage; a Fiend also gains Exorcism(10).',
            special: 'Melee Attack + Exorcism (PL 4)',
        },
        {
            name: 'Exorcism Lash II',
            type: 'Active',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: 'Attack with Hunter\'s Scourge. On hit, deal weapon damage; a Fiend also gains Exorcism(16). This replaces Exorcism Lash I.',
            special: 'Melee Attack + Exorcism (PL 10)',
        },
        {
            name: 'Exorcism Lash III',
            type: 'Active',
            range: 'Melee Reach',
            aoe: 'None',
            duration: 'Instant',
            effect: 'Attack with Hunter\'s Scourge. On hit, deal weapon damage; a Fiend also gains Exorcism(21). This replaces Exorcism Lash II.',
            special: 'Melee Attack + Exorcism (PL 16)',
        },
    ], [
        {
            name: 'Snap Chain I',
            type: 'Artifact Reaction',
            range: 'Threat Zone',
            duration: 'Triggering movement only',
            effect: 'Deal 2d8 damage to the triggering creature and pull it 4 m directly toward you. It must be in your Threat Zone when the Reaction resolves.',
            special: 'Artifact Reaction: Damage + Pull (PL 4)',
        },
        {
            name: 'Snap Chain II',
            type: 'Artifact Reaction',
            range: 'Threat Zone',
            duration: 'Triggering movement only',
            effect: 'Deal 6d8 damage to the triggering creature and pull it 8 m directly toward you. This replaces Snap Chain I.',
            special: 'Artifact Reaction: Damage + Pull (PL 10)',
        },
        {
            name: 'Snap Chain III',
            type: 'Artifact Reaction',
            range: 'Threat Zone',
            duration: 'Triggering movement only',
            effect: 'Deal 12d8 damage to the triggering creature and pull it 8 m directly toward you. This replaces Snap Chain II.',
            special: 'Artifact Reaction: Damage + Pull (PL 16)',
        },
    ], [
        {
            name: 'Whirling Scourge I',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 3 m',
            duration: 'Instant',
            effect: 'Make one AoE attack with Hunter\'s Scourge. Every hit takes weapon damage; a Fiend also gains Exorcism(7).',
            special: 'Melee AoE Attack + Exorcism (PL 4)',
        },
        {
            name: 'Whirling Scourge II',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 6 m',
            duration: 'Instant',
            effect: 'Make one AoE attack with Hunter\'s Scourge. Every hit takes weapon damage; a Fiend also gains Exorcism(10). This replaces Whirling Scourge I.',
            special: 'Melee AoE Attack + Exorcism (PL 10)',
        },
        {
            name: 'Whirling Scourge III',
            type: 'Active',
            range: 'Self',
            aoe: 'Radius 8 m',
            duration: 'Instant',
            effect: 'Make one AoE attack with Hunter\'s Scourge. Every hit takes weapon damage; a Fiend also gains Exorcism(13). This replaces Whirling Scourge II.',
            special: 'Melee AoE Attack + Exorcism (PL 16)',
        },
    ], {
        name: "True Hunter's Scourge",
        type: 'Artifact Ultimate',
        range: 'As defined',
        duration: 'As defined',
        effect: 'Define the complete final effect with the GM. Unavailable until its full profile and Technical Reference are recorded.',
        special: "Artifact Ultimate: GM-Defined Hunter's Scourge Effect",
    }),
};
export const UNBOUND_ECHO_ARTIFACTS = {
    predatorCrownMight: PREDATOR_CROWN_MIGHT,
    predatorCrownWits: PREDATOR_CROWN_WITS,
    predatorCrownIntellect: PREDATOR_CROWN_INTELLECT,
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
//# sourceMappingURL=echo-artifacts-unbound.js.map
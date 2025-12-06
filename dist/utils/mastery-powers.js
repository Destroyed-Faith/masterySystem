/**
 * Mastery Powers - All powers from Mastery Trees in the Players Guide
 *
 * This file contains the complete power definitions for each Mastery Tree.
 * Powers are organized by tree and include all mechanical details.
 */
/**
 * All Mastery Powers organized by tree
 */
export const MASTERY_POWERS = {
    'Battlemage': [
        {
            name: 'Arcane Combustion',
            tree: 'Battlemage',
            powerType: 'passive',
            passiveCategory: 'roll',
            description: 'Your flames always find more fuel.',
            levels: [
                {
                    level: 1,
                    type: 'Passive',
                    effect: 'All Spells with the Ignite Special gain +2 automatic Raises.'
                },
                {
                    level: 2,
                    type: 'Passive',
                    effect: 'All Spells with the Ignite Special gain +3 automatic Raises.'
                },
                {
                    level: 3,
                    type: 'Passive',
                    effect: 'All Spells with the Ignite Special gain +4 automatic Raises.'
                },
                {
                    level: 4,
                    type: 'Passive',
                    effect: 'All Spells with the Ignite Special gain +6 automatic Raises.'
                }
            ]
        },
        {
            name: 'Flameguard',
            tree: 'Battlemage',
            powerType: 'passive',
            passiveCategory: 'armor',
            description: 'The fire clings to you like a living shield.',
            levels: [
                {
                    level: 1,
                    type: 'Passive',
                    effect: 'While you have Ignite on yourself, gain +3 Armor.'
                },
                {
                    level: 2,
                    type: 'Passive',
                    effect: 'While you have Ignite, gain +5 Armor.'
                },
                {
                    level: 3,
                    type: 'Passive',
                    effect: 'While you have Ignite, gain +7 Armor.'
                },
                {
                    level: 4,
                    type: 'Passive',
                    effect: 'While you have Ignite, gain +11 Armor.'
                }
            ]
        },
        {
            name: 'Elemental Focus',
            tree: 'Battlemage',
            powerType: 'passive',
            passiveCategory: 'roll',
            description: 'Precision over raw fury — then both.',
            levels: [
                {
                    level: 1,
                    type: 'Passive',
                    effect: 'Spells with the Ignite Special: +2 Pool to the Spell Roll.'
                },
                {
                    level: 2,
                    type: 'Passive',
                    effect: 'Spells with the Ignite Special: +4 Pool to the Spell Roll.'
                },
                {
                    level: 3,
                    type: 'Passive',
                    effect: 'Spells with the Ignite Special: +6 Pool to the Spell Roll.'
                },
                {
                    level: 4,
                    type: 'Passive',
                    effect: 'Spells with the Ignite Special: +8 Pool to the Spell Roll.'
                }
            ]
        },
        {
            name: 'Combustion Surge',
            tree: 'Battlemage',
            powerType: 'buff',
            description: 'You superheat the matrix of your next spell.',
            levels: [
                {
                    level: 1,
                    type: 'Buff',
                    range: 'Self',
                    aoe: '—',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Your next Spells with the Ignite Special deals +2d8 damage.',
                    cost: { action: true }
                },
                {
                    level: 2,
                    type: 'Buff',
                    range: 'Self',
                    aoe: '—',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Your next Spells with the Ignite Special deals +4d8 damage.',
                    cost: { action: true }
                },
                {
                    level: 3,
                    type: 'Buff',
                    range: 'Self',
                    aoe: '—',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Your next Spells with the Ignite Special deals +6d8 damage.',
                    cost: { action: true }
                },
                {
                    level: 4,
                    type: 'Buff',
                    range: 'Self',
                    aoe: '—',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Your next Spells with the Ignite Special deals +8d8 damage.',
                    cost: { action: true }
                }
            ]
        },
        {
            name: 'Inferno Core',
            tree: 'Battlemage',
            powerType: 'buff',
            description: 'Your blaze swells nearby embers into a roaring inferno.',
            levels: [
                {
                    level: 1,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 4 m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +1.',
                    cost: { action: true }
                },
                {
                    level: 2,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 6 m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +2.',
                    cost: { action: true }
                },
                {
                    level: 3,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 8 m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +3.',
                    cost: { action: true }
                },
                {
                    level: 4,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 10 m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +4.',
                    cost: { action: true }
                }
            ]
        },
        {
            name: 'Flamewave',
            tree: 'Battlemage',
            powerType: 'passive',
            passiveCategory: 'damage',
            description: 'Every flame you cast spreads to new fuel.',
            levels: [
                {
                    level: 1,
                    type: 'Passive',
                    effect: 'Once per round, when you cast a Spell, also apply Ignite(1) to all affected enemies by the spell.'
                },
                {
                    level: 2,
                    type: 'Passive',
                    effect: 'Once per round, when you cast a Spell, also apply Ignite(2) to all affected enemies by the spell.'
                },
                {
                    level: 3,
                    type: 'Passive',
                    effect: 'Once per round, when you cast a Spell, also apply Ignite(4) to all affected enemies by the spell.'
                },
                {
                    level: 4,
                    type: 'Passive',
                    effect: 'Once per round, when you cast a Spell, also apply Ignite(5) to all affected enemies by the spell.'
                }
            ]
        },
        {
            name: 'Phoenix Mantle',
            tree: 'Battlemage',
            powerType: 'passive',
            passiveCategory: 'healing',
            description: 'Burn, and be reborn between every heartbeat.',
            levels: [
                {
                    level: 1,
                    type: 'Passive',
                    effect: 'While you have Ignite ≥ 4, gain Regeneration(1) and +2 Armor.'
                },
                {
                    level: 2,
                    type: 'Passive',
                    effect: 'While you have Ignite ≥ 4, gain Regeneration(3) and +3 Armor.'
                },
                {
                    level: 3,
                    type: 'Passive',
                    effect: 'While you have Ignite ≥ 4, gain Regeneration(5) and +4 Armor.'
                },
                {
                    level: 4,
                    type: 'Passive',
                    effect: 'While you have Ignite ≥ 4, gain Regeneration(7) and +5 Armor.'
                }
            ]
        },
        {
            name: 'Immolation Strike',
            tree: 'Battlemage',
            powerType: 'active',
            description: 'You channel raw flame into your weapon, dealing fire damage.',
            levels: [
                {
                    level: 1,
                    type: 'Active',
                    range: 'Melee',
                    aoe: '—',
                    duration: 'Instant',
                    effect: 'Make a weapon attack. On hit, deal +1d8 Fire damage and apply Ignite(1).',
                    cost: { action: true },
                    roll: {
                        attribute: 'might',
                        damage: '+1d8',
                        damageType: 'fire'
                    },
                    special: 'Ignite(1)'
                },
                {
                    level: 2,
                    type: 'Active',
                    range: 'Melee',
                    aoe: '—',
                    duration: 'Instant',
                    effect: 'Make a weapon attack. On hit, deal +2d8 Fire damage and apply Ignite(1).',
                    cost: { action: true },
                    roll: {
                        attribute: 'might',
                        damage: '+2d8',
                        damageType: 'fire'
                    },
                    special: 'Ignite(1)'
                },
                {
                    level: 3,
                    type: 'Active',
                    range: 'Melee',
                    aoe: '—',
                    duration: 'Instant',
                    effect: 'Make a weapon attack. On hit, deal +3d8 Fire damage and apply Ignite(2).',
                    cost: { action: true },
                    roll: {
                        attribute: 'might',
                        damage: '+3d8',
                        damageType: 'fire'
                    },
                    special: 'Ignite(2)'
                },
                {
                    level: 4,
                    type: 'Active',
                    range: 'Melee',
                    aoe: '—',
                    duration: 'Instant',
                    effect: 'Make a weapon attack. On hit, deal +4d8 Fire damage and apply Ignite(2).',
                    cost: { action: true },
                    roll: {
                        attribute: 'might',
                        damage: '+4d8',
                        damageType: 'fire'
                    },
                    special: 'Ignite(2)'
                }
            ]
        }
    ],
    // Placeholder for other trees - will be added incrementally
    'Crusader': [
        {
            name: 'Overhead Blow',
            tree: 'Crusader',
            powerType: 'active',
            description: 'A crushing strike that shatters shields and drives foes back.',
            levels: [
                {
                    level: 1,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 2d8 damage',
                    special: 'Push(2)',
                    cost: { action: true },
                    roll: { damage: '+2d8', damageType: 'physical' }
                },
                {
                    level: 2,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 4d8 damage',
                    special: 'Push(4)',
                    cost: { action: true },
                    roll: { damage: '+4d8', damageType: 'physical' }
                },
                {
                    level: 3,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 5d8 damage',
                    special: 'Push(8)',
                    cost: { action: true },
                    roll: { damage: '+5d8', damageType: 'physical' }
                },
                {
                    level: 4,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 6d8 damage',
                    special: 'Push(16)',
                    cost: { action: true },
                    roll: { damage: '+6d8', damageType: 'physical' }
                }
            ]
        },
        {
            name: 'Smiting Arc',
            tree: 'Crusader',
            powerType: 'active',
            description: 'A radiant arc of steel that cleaves through darkness and sin alike.',
            levels: [
                {
                    level: 1,
                    type: 'Active',
                    range: '2m',
                    aoe: 'Cone 90°, 2m',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 1d8 damage',
                    special: 'Smite(1)',
                    cost: { action: true },
                    roll: { damage: '+1d8', damageType: 'radiant' }
                },
                {
                    level: 2,
                    type: 'Active',
                    range: '4m',
                    aoe: 'Cone 90°, 4m',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 2d8 damage',
                    special: 'Smite(1)',
                    cost: { action: true },
                    roll: { damage: '+2d8', damageType: 'radiant' }
                },
                {
                    level: 3,
                    type: 'Active',
                    range: '8m',
                    aoe: 'Cone 90°, 6m',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 3d8 damage',
                    special: 'Smite(2)',
                    cost: { action: true },
                    roll: { damage: '+3d8', damageType: 'radiant' }
                },
                {
                    level: 4,
                    type: 'Active',
                    range: '16m',
                    aoe: 'Cone 90°, 8m',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 4d8 damage',
                    special: 'Smite(2)',
                    cost: { action: true },
                    roll: { damage: '+4d8', damageType: 'radiant' }
                }
            ]
        },
        {
            name: 'Smashing Blow',
            tree: 'Crusader',
            powerType: 'active',
            description: 'A brutal impact meant to break stance and bone.',
            levels: [
                {
                    level: 1,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 2d8 damage',
                    cost: { action: true },
                    roll: { damage: '+2d8', damageType: 'physical' }
                },
                {
                    level: 2,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 3d8 damage',
                    special: 'Prone(1)',
                    cost: { action: true },
                    roll: { damage: '+3d8', damageType: 'physical' }
                },
                {
                    level: 3,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 4d8 damage',
                    special: 'Prone(1)',
                    cost: { action: true },
                    roll: { damage: '+4d8', damageType: 'physical' }
                },
                {
                    level: 4,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 5d8 damage',
                    special: 'Prone(2)',
                    cost: { action: true },
                    roll: { damage: '+5d8', damageType: 'physical' }
                }
            ]
        },
        {
            name: 'Shield Crush',
            tree: 'Crusader',
            powerType: 'active',
            description: 'You slam your shield forward, crushing both body and will.',
            levels: [
                {
                    level: 1,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 1d8 damage',
                    cost: { action: true },
                    roll: { damage: '+1d8', damageType: 'physical' }
                },
                {
                    level: 2,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 1d8 damage',
                    special: 'Stunned(1)',
                    cost: { action: true },
                    roll: { damage: '+1d8', damageType: 'physical' }
                },
                {
                    level: 3,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 1d8 damage; gain +2 Armor vs that enemy until your next turn',
                    special: 'Stunned(1)',
                    cost: { action: true },
                    roll: { damage: '+1d8', damageType: 'physical' }
                },
                {
                    level: 4,
                    type: 'Active',
                    range: 'Melee',
                    duration: 'Instant',
                    effect: 'Weapon DMG + 1d8 damage; gain +2 Armor vs that enemy until your next turn',
                    special: 'Stunned(2)',
                    cost: { action: true },
                    roll: { damage: '+1d8', damageType: 'physical' }
                }
            ]
        },
        {
            name: 'Inspiring Cry',
            tree: 'Crusader',
            powerType: 'utility',
            description: 'A battle cry that restores faith and drives away corruption.',
            levels: [
                {
                    level: 1,
                    type: 'Utility',
                    range: 'Self',
                    aoe: 'Radius 2m',
                    duration: 'Instant',
                    effect: 'Heal allies for 1d8 HP',
                    cost: { action: true }
                },
                {
                    level: 2,
                    type: 'Utility',
                    range: 'Self',
                    aoe: 'Radius 4m',
                    duration: 'Instant',
                    effect: 'Heal allies for 2d8 HP',
                    special: 'Cleanse(1)',
                    cost: { action: true }
                },
                {
                    level: 3,
                    type: 'Utility',
                    range: 'Self',
                    aoe: 'Radius 6m',
                    duration: 'Instant',
                    effect: 'Heal allies for 2d8 HP',
                    special: 'Cleanse(1)',
                    cost: { action: true }
                },
                {
                    level: 4,
                    type: 'Utility',
                    range: 'Self',
                    aoe: 'Radius 8m',
                    duration: 'Instant',
                    effect: 'Heal allies for 2d8 HP',
                    special: 'Cleanse(1)',
                    cost: { action: true }
                }
            ]
        },
        {
            name: 'Unbreakable Vow',
            tree: 'Crusader',
            powerType: 'buff',
            description: 'An oath of defiance that hardens flesh and faith alike.',
            levels: [
                {
                    level: 1,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 2m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Gain +4 Armor',
                    cost: { action: true }
                },
                {
                    level: 2,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 2m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Gain +6 Armor and become Immovable',
                    cost: { action: true }
                },
                {
                    level: 3,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 4m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Gain +8 Armor and become Immovable',
                    cost: { action: true }
                },
                {
                    level: 4,
                    type: 'Buff',
                    range: 'Self',
                    aoe: 'Radius 8m',
                    duration: 'Mastery Rank Rounds',
                    effect: 'Gain +10 Armor and become Immovable',
                    cost: { action: true }
                }
            ]
        },
        {
            name: 'Bolster',
            tree: 'Crusader',
            powerType: 'passive',
            passiveCategory: 'save',
            description: 'Your presence steels hearts and sharpens reflexes.',
            levels: [
                {
                    level: 1,
                    type: 'Passive',
                    effect: 'You and allies within 2m gain +1 Evade and +1 Save Die.'
                },
                {
                    level: 2,
                    type: 'Passive',
                    effect: 'You and allies within 4m gain +3 Evade and +1 Save Die.'
                },
                {
                    level: 3,
                    type: 'Passive',
                    effect: 'You and allies within 6m gain +3 Evade and +2 Save Dice.'
                },
                {
                    level: 4,
                    type: 'Passive',
                    effect: 'You and allies within 8m gain +5 Evade and +2 Save Dice.'
                }
            ]
        },
        {
            name: 'Hold the Line',
            tree: 'Crusader',
            powerType: 'passive',
            passiveCategory: 'armor',
            description: 'You anchor the line — no ally falls while you stand.',
            levels: [
                {
                    level: 1,
                    type: 'Passive',
                    effect: 'You and one ally within 2m gain +1 Armor.'
                },
                {
                    level: 2,
                    type: 'Passive',
                    effect: 'You and one ally within 4m gain +2 Armor.'
                },
                {
                    level: 3,
                    type: 'Passive',
                    effect: 'You and one ally within 6m gain +4 Armor.'
                },
                {
                    level: 4,
                    type: 'Passive',
                    effect: 'You and one ally within 8m gain +6 Armor.'
                }
            ]
        }
    ],
    'Berserker of the Blood Moon': [
        {
            name: 'Rending Strike',
            tree: 'Berserker of the Blood Moon',
            powerType: 'active',
            description: 'A vicious swing that tears flesh and armor.',
            levels: [
                { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
                { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
                { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
                { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Bleeding(5)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' } }
            ]
        },
        {
            name: 'Leaping Cleave',
            tree: 'Berserker of the Blood Moon',
            powerType: 'active',
            description: 'Leap into the fray and cut down foes in a brutal arc.',
            levels: [
                { level: 1, type: 'Active', range: 'Self', aoe: 'Radius 1m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Bleeding(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
                { level: 2, type: 'Active', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
                { level: 3, type: 'Active', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
                { level: 4, type: 'Active', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
            ]
        },
        {
            name: 'Reckless Attack',
            tree: 'Berserker of the Blood Moon',
            powerType: 'active',
            description: 'You throw caution aside and swing with brutal abandon. Enemies gain Advantage against you until your next turn.',
            levels: [
                { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
                { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', cost: { action: true }, roll: { damage: '+6d8', damageType: 'physical' } },
                { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 8d8 damage', cost: { action: true }, roll: { damage: '+8d8', damageType: 'physical' } },
                { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 10d8 damage', cost: { action: true }, roll: { damage: '+10d8', damageType: 'physical' } }
            ]
        },
        {
            name: 'Rage of the Blood Moon',
            tree: 'Berserker of the Blood Moon',
            powerType: 'buff',
            description: 'You let your own blood feed the fury.',
            levels: [
                { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +3d8 damage, suffer Bleeding(1) (self) per Attack', cost: { action: true } },
                { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +6d8 damage, suffer Bleeding(2) (self) per Attack', cost: { action: true } },
                { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +8d8 damage, suffer Bleeding(3) (self) per Attack', cost: { action: true } },
                { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +10d8 damage, suffer Bleeding(4) (self) per Attack', cost: { action: true } }
            ]
        },
        {
            name: 'Brutal Howl',
            tree: 'Berserker of the Blood Moon',
            powerType: 'utility',
            description: 'A primal scream that shakes enemy resolve.',
            levels: [
                { level: 1, type: 'Utility', range: 'Self', aoe: 'Radius 2m', duration: '1 Round', effect: 'Enemies suffer -1 Attack Die until your next turn', cost: { action: true } },
                { level: 2, type: 'Utility', range: 'Self', aoe: 'Radius 4m', duration: '1 Round', effect: 'Enemies suffer -1 Attack Die until your next turn', special: 'Frightened(1)', cost: { action: true } },
                { level: 3, type: 'Utility', range: 'Self', aoe: 'Radius 6m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)', cost: { action: true } },
                { level: 4, type: 'Utility', range: 'Self', aoe: 'Radius 8m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)', cost: { action: true } }
            ]
        },
        {
            name: 'Bloodlust',
            tree: 'Berserker of the Blood Moon',
            powerType: 'passive',
            passiveCategory: 'damage',
            description: 'The scent of blood drives you deeper into frenzy.',
            levels: [
                { level: 1, type: 'Passive', effect: 'While any enemy within 2m is Bleeding, your attacks gain +3d8 damage.' },
                { level: 2, type: 'Passive', effect: 'While any enemy within 4m is Bleeding, your attacks gain +4d8 damage.' },
                { level: 3, type: 'Passive', effect: 'While any enemy within 6m is Bleeding, your attacks gain +5d8 damage.' },
                { level: 4, type: 'Passive', effect: 'While any enemy within 8m is Bleeding, your attacks gain +6d8 damage.' }
            ]
        }
    ],
    'Sanctifier': [
        {
            name: 'Smite Evil',
            tree: 'Sanctifier',
            powerType: 'active',
            description: 'Radiant strike against unholy foes.',
            levels: [
                { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 radiant damage', special: 'Smite(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'radiant' } },
                { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 radiant damage', special: 'Smite(2)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'radiant' } },
                { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 radiant damage', special: 'Smite(2)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'radiant' } },
                { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 radiant damage', special: 'Smite(3)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'radiant' } }
            ]
        },
        {
            name: 'Radiant Burst',
            tree: 'Sanctifier',
            powerType: 'active',
            description: 'A burst of holy light that burns the unholy.',
            levels: [
                { level: 1, type: 'Active', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: '2d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '2d8', damageType: 'radiant' } },
                { level: 2, type: 'Active', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: '3d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '3d8', damageType: 'radiant' } },
                { level: 3, type: 'Active', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: '4d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '4d8', damageType: 'radiant' } },
                { level: 4, type: 'Active', range: 'Self', aoe: 'Radius 8m', duration: 'Instant', effect: '5d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '5d8', damageType: 'radiant' } }
            ]
        },
        {
            name: 'Lay on Hands',
            tree: 'Sanctifier',
            powerType: 'utility',
            description: 'Divine healing through touch.',
            levels: [
                { level: 1, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 2d8 HP', cost: { action: true } },
                { level: 2, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 3d8 HP', special: 'Cleanse(1)', cost: { action: true } },
                { level: 3, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 4d8 HP', special: 'Cleanse(2)', cost: { action: true } },
                { level: 4, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 5d8 HP', special: 'Cleanse(3)', cost: { action: true } }
            ]
        },
        {
            name: 'Divine Shield',
            tree: 'Sanctifier',
            powerType: 'buff',
            description: 'A shimmering shield of holy light protects you and allies.',
            levels: [
                { level: 1, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +3 Armor', cost: { action: true } },
                { level: 2, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +5 Armor', cost: { action: true } },
                { level: 3, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +7 Armor and Resistance to Necrotic', cost: { action: true } },
                { level: 4, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +10 Armor and Resistance to Necrotic', cost: { action: true } }
            ]
        },
        {
            name: 'Aura of Purity',
            tree: 'Sanctifier',
            powerType: 'passive',
            passiveCategory: 'healing',
            description: 'Your presence cleanses and protects allies.',
            levels: [
                { level: 1, type: 'Passive', effect: 'Allies within 2m gain Regeneration(1).' },
                { level: 2, type: 'Passive', effect: 'Allies within 4m gain Regeneration(2).' },
                { level: 3, type: 'Passive', effect: 'Allies within 6m gain Regeneration(3) and +1 to Saves.' },
                { level: 4, type: 'Passive', effect: 'Allies within 8m gain Regeneration(4) and +2 to Saves.' }
            ]
        }
    ],
    'Alchemist': [
        {
            name: 'Alchemical Bomb',
            tree: 'Alchemist',
            powerType: 'active',
            description: 'Hurl an explosive concoction.',
            levels: [
                { level: 1, type: 'Active', range: '8m', aoe: 'Radius 1m', duration: 'Instant', effect: '2d8 fire damage', cost: { action: true }, roll: { damage: '2d8', damageType: 'fire' } },
                { level: 2, type: 'Active', range: '12m', aoe: 'Radius 2m', duration: 'Instant', effect: '3d8 fire damage', cost: { action: true }, roll: { damage: '3d8', damageType: 'fire' } },
                { level: 3, type: 'Active', range: '16m', aoe: 'Radius 2m', duration: 'Instant', effect: '4d8 fire damage', special: 'Ignite(1)', cost: { action: true }, roll: { damage: '4d8', damageType: 'fire' } },
                { level: 4, type: 'Active', range: '20m', aoe: 'Radius 3m', duration: 'Instant', effect: '5d8 fire damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '5d8', damageType: 'fire' } }
            ]
        },
        {
            name: 'Acid Flask',
            tree: 'Alchemist',
            powerType: 'active',
            description: 'Throw acid that corrodes armor.',
            levels: [
                { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '2d8 acid damage', special: 'Corrode(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'acid', penetration: 1 } },
                { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: '3d8 acid damage', special: 'Corrode(2)', cost: { action: true }, roll: { damage: '3d8', damageType: 'acid', penetration: 2 } },
                { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '4d8 acid damage', special: 'Corrode(3)', cost: { action: true }, roll: { damage: '4d8', damageType: 'acid', penetration: 3 } },
                { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: '5d8 acid damage', special: 'Corrode(4)', cost: { action: true }, roll: { damage: '5d8', damageType: 'acid', penetration: 4 } }
            ]
        },
        {
            name: 'Healing Elixir',
            tree: 'Alchemist',
            powerType: 'utility',
            description: 'A potent healing brew.',
            levels: [
                { level: 1, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 2d8 HP', cost: { action: true } },
                { level: 2, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 3d8 HP and grant Regeneration(1) for 2 rounds', cost: { action: true } },
                { level: 3, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 4d8 HP and grant Regeneration(2) for 2 rounds', cost: { action: true } },
                { level: 4, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 5d8 HP and grant Regeneration(3) for 3 rounds', cost: { action: true } }
            ]
        },
        {
            name: 'Transmutation',
            tree: 'Alchemist',
            powerType: 'buff',
            description: 'Enhance physical capabilities through alchemy.',
            levels: [
                { level: 1, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +2 to one attribute', cost: { action: true } },
                { level: 2, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +3 to one attribute', cost: { action: true } },
                { level: 3, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +4 to one attribute and +2 Armor', cost: { action: true } },
                { level: 4, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +5 to one attribute and +4 Armor', cost: { action: true } }
            ]
        },
        {
            name: 'Volatile Mixture',
            tree: 'Alchemist',
            powerType: 'passive',
            passiveCategory: 'damage',
            description: 'Your bombs and acids deal extra damage.',
            levels: [
                { level: 1, type: 'Passive', effect: 'Alchemical attacks deal +1d8 damage.' },
                { level: 2, type: 'Passive', effect: 'Alchemical attacks deal +2d8 damage.' },
                { level: 3, type: 'Passive', effect: 'Alchemical attacks deal +3d8 damage and ignore 2 Armor.' },
                { level: 4, type: 'Passive', effect: 'Alchemical attacks deal +4d8 damage and ignore 4 Armor.' }
            ]
        }
    ],
    'Catalyst': [
        {
            name: 'Mutagenic Strike',
            tree: 'Catalyst',
            powerType: 'active',
            description: 'An attack empowered by chemical transformation.',
            levels: [
                { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
                { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
                { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Poison(1)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'poison' } },
                { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Poison(2)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'poison' } }
            ]
        },
        {
            name: 'Reactive Serum',
            tree: 'Catalyst',
            powerType: 'buff',
            description: 'Inject a serum that enhances combat abilities.',
            levels: [
                { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +2 to Attack rolls', cost: { action: true } },
                { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +3 to Attack rolls and +2d8 damage', cost: { action: true } },
                { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +4 to Attack rolls and +3d8 damage', cost: { action: true } },
                { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +5 to Attack rolls and +4d8 damage', cost: { action: true } }
            ]
        },
        {
            name: 'Toxin Cloud',
            tree: 'Catalyst',
            powerType: 'utility',
            description: 'Release a cloud of poisonous gas.',
            levels: [
                { level: 1, type: 'Utility', range: '8m', aoe: 'Radius 2m', duration: '2 Rounds', effect: 'Enemies in area suffer Poison(1)', cost: { action: true } },
                { level: 2, type: 'Utility', range: '12m', aoe: 'Radius 4m', duration: '2 Rounds', effect: 'Enemies in area suffer Poison(2)', cost: { action: true } },
                { level: 3, type: 'Utility', range: '16m', aoe: 'Radius 4m', duration: '3 Rounds', effect: 'Enemies in area suffer Poison(3)', cost: { action: true } },
                { level: 4, type: 'Utility', range: '20m', aoe: 'Radius 6m', duration: '3 Rounds', effect: 'Enemies in area suffer Poison(4)', cost: { action: true } }
            ]
        },
        {
            name: 'Adaptive Mutation',
            tree: 'Catalyst',
            powerType: 'passive',
            passiveCategory: 'healing',
            description: 'Your body adapts to damage through chemical reactions.',
            levels: [
                { level: 1, type: 'Passive', effect: 'Gain Regeneration(1) when you take damage.' },
                { level: 2, type: 'Passive', effect: 'Gain Regeneration(2) when you take damage.' },
                { level: 3, type: 'Passive', effect: 'Gain Regeneration(3) when you take damage and +1 Armor.' },
                { level: 4, type: 'Passive', effect: 'Gain Regeneration(4) when you take damage and +2 Armor.' }
            ]
        }
    ]
};
/**
 * Get all powers for a specific Mastery Tree
 */
export function getPowersForTree(treeName) {
    return MASTERY_POWERS[treeName] || [];
}
/**
 * Get a specific power by tree and name
 */
export function getPower(treeName, powerName) {
    const powers = MASTERY_POWERS[treeName] || [];
    return powers.find(p => p.name === powerName);
}
/**
 * Get all available tree names that have powers defined
 */
export function getTreesWithPowers() {
    return Object.keys(MASTERY_POWERS).filter(tree => MASTERY_POWERS[tree].length > 0 &&
        MASTERY_POWERS[tree][0].name !== 'Placeholder Power');
}
//# sourceMappingURL=mastery-powers.js.map
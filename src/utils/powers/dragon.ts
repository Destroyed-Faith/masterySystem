/**
 * Dragon Mastery Tree Powers (Form Tree)
 * 
 * Migrated to new structure (v0.4.18+)
 * 
 * Form Tree Rules:
 * - Requires Dragon form (bloodline, ritual, ancient spark)
 * - Cannot use weapons, armor, or shields while in form
 * - Natural Weapons: 1d8 damage per 2 Dragon powers learned (up to 4d8)
 * - Natural Armor: Based on powers learned
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const DRAGON_POWERS: NewArtifactPowerData[] = [
    // === CORE POWERS ===
    {
        name: 'Claws',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 Claw Attacks. Split your Attack Pool evenly between them. Each hit deals +1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 Claw Attacks. Split your Attack Pool evenly between them. Each hit deals +2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 Claw Attacks. Split your Attack Pool evenly between them. Each hit deals +3d8 damage', dice: '3d8' },
                specials: []
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 Claw Attacks. Split your Attack Pool evenly between them. Each hit deals +4d8 damage', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Bite',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'When you are hit by a melee attack',
        cost: {
            action: 'reaction',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing Natural DMG +1d8', dice: '1d8' },
                specials: [{ key: 'Mark', rank: 1 }],
                trigger: 'When you are hit by a melee attack'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing Natural DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 2 }],
                trigger: 'When you are hit by a melee attack'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing Natural DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 3 }],
                trigger: 'When you are hit by a melee attack'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing Natural DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Mark', rank: 4 }],
                trigger: 'When you are hit by a melee attack'
            }
        }
    },
    {
        name: 'Tail Strike',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Push', rank: 2 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'radius', m: 3 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Push', rank: 4 }, { key: 'Prone', rank: 1 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Push', rank: 8 }, { key: 'Prone', rank: 1 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'radius', m: 5 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Push', rank: 8 }, { key: 'Prone', rank: 2 }]
            }
        }
    },
    {
        name: 'Breath Attack',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'active',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 4, angleDeg: 60 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 1d8 elemental damage', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'active',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 6, angleDeg: 60 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 2d8 elemental damage', dice: '2d8' },
                specials: []
            },
            '3': {

                type: 'active',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 8, angleDeg: 60 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 3d8 elemental damage', dice: '3d8' },
                specials: []
            },
            '4': {

                type: 'active',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 10, angleDeg: 60 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 4d8 elemental damage', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Draconic Presence',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4m are Frightened(1) while they can see or hear you' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6m are Frightened(2) while they can see or hear you' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8m are Frightened(3) while they can see or hear you' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 10m are Frightened(3) while they can see or hear you' },
                specials: []
            }
        }
    },
    // === SCALES (requires 4+ Dragon powers) ===
    {
        name: 'Dragon Scales',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 Armor. At the start of your turn, gain 1 Temp HP from this passive (non-stacking; refreshes)' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Armor. At the start of your turn, gain 2 Temp HP from this passive (non-stacking; refreshes)' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Armor. At the start of your turn, gain 3 Temp HP from this passive (non-stacking; refreshes)' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Armor. At the start of your turn, gain 4 Temp HP from this passive (non-stacking; refreshes)' },
                specials: []
            }
        }
    },
    {
        name: 'Scale Ward',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'When you are hit by an attack, before damage is resolved',
        cost: {
            action: 'reaction',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 1d8 Temp HP and +1 Evade until the end of your next turn', dice: '1d8' },
                specials: [],
                trigger: 'When you are hit by an attack, before damage is resolved'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 2d8 Temp HP and +2 Evade until the end of your next turn', dice: '2d8' },
                specials: [],
                trigger: 'When you are hit by an attack, before damage is resolved'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 3d8 Temp HP and +3 Evade until the end of your next turn', dice: '3d8' },
                specials: [],
                trigger: 'When you are hit by an attack, before damage is resolved'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 4d8 Temp HP and +4 Evade until the end of your next turn', dice: '4d8' },
                specials: [],
                trigger: 'When you are hit by an attack, before damage is resolved'
            }
        }
    },
    {
        name: 'Shed Scales',
        category: 'utility',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Reduce one eligible effect on yourself by 4. Then heal 1d8 HP and gain +1 Armor until the end of your next turn', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Reduce one eligible effect on yourself by 4. Then heal 2d8 HP and gain +3 Armor until the end of your next turn', dice: '2d8' },
                specials: []
            },
            '3': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Reduce up to two eligible effects on yourself by 4 each. Then heal 2d8 HP and gain +5 Armor until the end of your next turn', dice: '2d8' },
                specials: []
            },
            '4': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Reduce up to two eligible effects on yourself by 4 each. Then heal 3d8 HP and gain +7 Armor until the end of your next turn', dice: '3d8' },
                specials: []
            }
        }
    },
    {
        name: 'Immovable',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Reduce all Push/Pull against you by 2m (min 0). Gain +1 Armor and +1 die to Body Saving Throws' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Reduce all Push/Pull against you by 4m (min 0). Gain +2 Armor and +2 dice to Body Saving Throws' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Reduce all Push/Pull against you by 6m (min 0). Gain +3 Armor and +3 dice to Body Saving Throws' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Reduce all Push/Pull against you by 8m (min 0). Gain +4 Armor and +4 dice to Body Saving Throws' },
                specials: []
            }
        }
    },
    // === BREATH (requires 4+ Dragon powers) ===
    {
        name: 'Dragonfire Line',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'ranged',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'line', lengthM: 10, widthM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 2d8 elemental damage', dice: '2d8' },
                specials: []
            },
            '2': {

                type: 'ranged',
                range: { kind: 'distance', m: 14 },
                aoe: { shape: 'line', lengthM: 14, widthM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 4d8 elemental damage', dice: '4d8' },
                specials: []
            },
            '3': {

                type: 'ranged',
                range: { kind: 'distance', m: 18 },
                aoe: { shape: 'line', lengthM: 18, widthM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 6d8 elemental damage', dice: '6d8' },
                specials: []
            },
            '4': {

                type: 'ranged',
                range: { kind: 'distance', m: 22 },
                aoe: { shape: 'line', lengthM: 22, widthM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 8d8 elemental damage', dice: '8d8' },
                specials: []
            }
        }
    },
    {
        name: 'Breath Mastery',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Breath Attack and Dragonfire Line gain +2m Range' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4m Range' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6m Range' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8m Range' },
                specials: []
            }
        }
    },
    {
        name: 'Scalding Residue',
        category: 'utility',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none', note: 'Same as your last Breath shape' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies that start their turn in the area take 1d8 elemental damage', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none', note: 'Same as your last Breath shape' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies that start their turn in the area take 2d8 elemental damage', dice: '2d8' },
                specials: []
            },
            '3': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none', note: 'Same as your last Breath shape' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies that start their turn in the area take 3d8 elemental damage', dice: '3d8' },
                specials: []
            },
            '4': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'none', note: 'Same as your last Breath shape' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies that start their turn in the area take 4d8 elemental damage', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Overcharge Breath',
        category: 'active',
        tags: ['charged'],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0,
            charges: 1
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'active',
                range: { kind: 'self', note: 'As Breath' },
                aoe: { shape: 'cone', lengthM: 4, angleDeg: 60, note: 'As Breath' },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 4d8 elemental damage', dice: '4d8' },
                specials: [{ key: 'Expose', rank: 2 }]
            },
            '2': {

                type: 'active',
                range: { kind: 'self', note: 'As Breath' },
                aoe: { shape: 'cone', lengthM: 6, angleDeg: 60, note: 'As Breath' },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 8d8 elemental damage', dice: '8d8' },
                specials: [{ key: 'Expose', rank: 3 }]
            },
            '3': {

                type: 'active',
                range: { kind: 'self', note: 'As Breath' },
                aoe: { shape: 'cone', lengthM: 8, angleDeg: 60, note: 'As Breath' },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 12d8 elemental damage', dice: '12d8' },
                specials: [{ key: 'Expose', rank: 4 }]
            },
            '4': {

                type: 'active',
                range: { kind: 'self', note: 'As Breath' },
                aoe: { shape: 'cone', lengthM: 10, angleDeg: 60, note: 'As Breath' },
                duration: { kind: 'instant' },
                effect: { text: 'Deal 16d8 elemental damage', dice: '16d8' },
                specials: [{ key: 'Expose', rank: 5 }]
            }
        }
    },
    // === WINGS (requires 4+ Dragon powers) ===
    {
        name: 'Take Flight',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 6 m. While flying, gain +2 Evade' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 10 m. While flying, gain +4 Evade' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 14 m. While flying, gain +6 Evade' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 18 m. While flying, gain +8 Evade' },
                specials: []
            }
        }
    },
    {
        name: 'Flyby',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: {
            action: 'movement',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 3 m as Flight Movement. Your next attack this round deals +1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 6 m as Flight Movement. Your next attack this round deals +2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 9 m as Flight Movement. Your next attack this round deals +3d8 damage', dice: '3d8' },
                specials: []
            },
            '4': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 12 m as Flight Movement. Your next attack this round deals +4d8 damage', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Wingbeat',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: {
            action: 'movement',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 5 m. If you are already flying, this movement may be vertical. Enemies in the area must pass a Body Save or be moved' },
                specials: [{ key: 'Push', rank: 2 }]
            },
            '2': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 6 m. If you are already flying, this movement may be vertical. Enemies in the area must pass a Body Save or be moved' },
                specials: [{ key: 'Push', rank: 4 }]
            },
            '3': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 12 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 9 m. If you are already flying, this movement may be vertical. Enemies in the area must pass a Body Save or be moved' },
                specials: [{ key: 'Push', rank: 6 }]
            },
            '4': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 16 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 12 m. If you are already flying, this movement may be vertical. Enemies in the area must pass a Body Save or be moved' },
                specials: [{ key: 'Push', rank: 8 }]
            }
        }
    },
    {
        name: 'Skyhook Snatch',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Pull', rank: 2 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Pull', rank: 4 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Pull', rank: 6 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +5d8 damage', dice: '5d8' },
                specials: [{ key: 'Pull', rank: 8 }]
            }
        }
    },
    // === DOMINION (requires 8+ Dragon powers) ===
    {
        name: 'Tyrant\'s Roar',
        category: 'utility',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Allies in AoE gain Advantage on their next Attack; enemies must pass a Mind Save or gain Frightened(1)' },
                specials: []
            },
            '2': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Allies gain Advantage; enemies: Mind Save or Frightened(2)' },
                specials: []
            },
            '3': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Allies gain Advantage; enemies: Mind Save or Frightened(3)' },
                specials: []
            },
            '4': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 12 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Allies gain Advantage; enemies: Mind Save or Frightened(3) and Mark(1)' },
                specials: [{ key: 'Mark', rank: 1 }]
            }
        }
    },
    {
        name: 'Rule by Fear',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Creatures that are Frightened by you also suffer Mark(1)' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Mark becomes Mark(2)' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Also, once per round when you hit a Frightened creature, apply Expose(2) (Body Save negates)' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Expose becomes Expose(3)' },
                specials: []
            }
        }
    },
    {
        name: 'Crushing Gaze',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'check',
            attribute: 'intellect',
            vs: 'save:mind'
        },
        levels: {
            '1': {

                type: 'ranged',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Target must make a Mind Save' },
                specials: [{ key: 'Suppress', rank: 2 }]
            },
            '2': {

                type: 'ranged',
                range: { kind: 'distance', m: 14 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Target must make a Mind Save' },
                specials: [{ key: 'Suppress', rank: 3 }]
            },
            '3': {

                type: 'ranged',
                range: { kind: 'distance', m: 18 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Target must make a Mind Save' },
                specials: [{ key: 'Suppress', rank: 4 }]
            },
            '4': {

                type: 'ranged',
                range: { kind: 'distance', m: 22 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Target must make a Mind Save' },
                specials: [{ key: 'Suppress', rank: 5 }]
            }
        }
    },
    {
        name: 'Throne Zone',
        category: 'utility',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies entering the area must pass a Mind Save or be Frightened(1) until end of their turn' },
                specials: []
            },
            '2': {

                type: 'utility',
                range: { kind: 'distance', m: 14 },
                aoe: { shape: 'radius', m: 5 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Frightened(2)' },
                specials: []
            },
            '3': {

                type: 'utility',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Frightened(3)' },
                specials: []
            },
            '4': {

                type: 'utility',
                range: { kind: 'distance', m: 18 },
                aoe: { shape: 'radius', m: 7 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Frightened(3) and they are also Push(2) away (Body Save negates)' },
                specials: [{ key: 'Push', rank: 2 }]
            }
        }
    },
    // === FANGS & TALONS (requires 8+ Dragon powers) ===
    {
        name: 'Rending Chain',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 1 Extra Attack (0.5) with half Attack Dice; on hit deal +1d8', dice: '1d8' },
                specials: [{ key: 'Bleeding', rank: 1, note: 'If target is Marked' }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Same, +2d8', dice: '2d8' },
                specials: [{ key: 'Bleeding', rank: 2, note: 'If target is Marked' }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 Extra Attacks (0.5 each); each hit +2d8', dice: '2d8' },
                specials: [{ key: 'Bleeding', rank: 2, note: 'If target is Marked' }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '2 Extra Attacks; each hit +3d8', dice: '3d8' },
                specials: [{ key: 'Bleeding', rank: 3, note: 'If target is Marked' }]
            }
        }
    },
    {
        name: 'Predator\'s Grip',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Grappled', rank: 1 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Grappled', rank: 2 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Grappled', rank: 3 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +5d8 damage', dice: '5d8' },
                specials: [{ key: 'Grappled', rank: 4 }]
            }
        }
    },
    {
        name: 'Execute',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Penetration', rank: 2, note: 'If target has Bleeding(2+) or Mark(2+)' }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Penetration', rank: 3, note: 'If Bleeding(3+) or Mark(3+)' }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack +5d8 damage', dice: '5d8' },
                specials: [{ key: 'Penetration', rank: 4, note: 'If Bleeding(4+) or Mark(3+)' }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack +6d8 damage', dice: '6d8' },
                specials: [{ key: 'Penetration', rank: 5, note: 'If Bleeding(5+) or Mark(4+)' }]
            }
        }
    },
    {
        name: 'Blood Scent',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You always know the direction of the nearest Bleeding creature within 20m (GM: blocked by sealed barriers)' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Range becomes 40m' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Also, your Opportunity Attacks vs Bleeding creatures gain +1d8 damage', dice: '1d8' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Bonus becomes +2d8 damage', dice: '2d8' },
                specials: []
            }
        }
    }
];

/**
 * Werewolf Mastery Tree Powers (Form Tree)
 * 
 * Migrated to new structure (v0.4.18+)
 * 
 * Form Tree Rules:
 * - Requires Werewolf form (curse, bloodline, ritual)
 * - Cannot use weapons, armor, or shields while in form
 * - Natural Weapons (Claws/Bite): 1d8 damage per 2 Werewolf powers learned (up to 4d8)
 * - Natural Armor: half the number of Werewolf powers learned (rounded up)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const WEREWOLF_POWERS: NewArtifactPowerData[] = [
    // === CORE POWERS ===
    {
        name: 'Lacerate',
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
                effect: { text: 'Claw DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Bleeding', rank: 1 }, { key: 'Mark', rank: 1 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Bleeding', rank: 2 }, { key: 'Mark', rank: 2 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw DMG +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Bleeding', rank: 3 }, { key: 'Mark', rank: 2 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw DMG +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Bleeding', rank: 3 }, { key: 'Mark', rank: 3 }]
            }
        }
    },
    {
        name: 'Rend',
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
                effect: { text: 'Claw Attack +1d8 damage', dice: '1d8'},
                specials: []
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +2d8 damage', dice: '2d8'},
                specials: []
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +3d8 damage', dice: '3d8'},
                specials: []
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +4d8 damage', dice: '4d8'},
                specials: []
            }
        }
    },
    {
        name: 'Bite',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'When a melee attack misses you',
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
                effect: { text: 'Make a Bite dealing +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Mark', rank: 1 }],
                trigger: 'When a melee attack misses you'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 2 }],
                trigger: 'When a melee attack misses you'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Mark', rank: 3 }],
                trigger: 'When a melee attack misses you'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Mark', rank: 4 }],
                trigger: 'When a melee attack misses you'
            }
        }
    },
    {
        name: 'Pounce',
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
                effect: { text: 'Leap, then Claw Attack +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Push', rank: 1 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Leap, then Claw Attack +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Push', rank: 2 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Leap, then Claw Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Push', rank: 3 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Leap, then Claw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Push', rank: 4 }]
            }
        }
    },
    {
        name: 'Savage Frenzy',
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
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain Extra Attack (1) and +1d8 damage to all attacks', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain Extra Attack (2) and +1d8 damage to all attacks', dice: '1d8' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain Extra Attack (3) and +1d8 damage to all attacks', dice: '1d8' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain Extra Attack (4) and +1d8 damage to all attacks', dice: '1d8' },
                specials: []
            }
        }
    },
    // === THE HUNT (requires 4+ Werewolf powers) ===
    {
        name: 'Predator\'s Claim',
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
                effect: { text: 'When a creature with your Mark attacks you, the Mark does not end. Instead, reduce it by 1 (minimum 0)' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Opportunity Attacks against a Marked creature gain +1d8 damage', dice: '1d8' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If a Marked creature attempts to Flee, it suffers Suppress(2) (Mind Save negates) until the start of your next turn' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when you hit a Marked creature, you may apply Expose(2) (Body Save negates)' },
                specials: []
            }
        }
    },
    {
        name: 'Pin the Prey',
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
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Leap, then Claw Attack +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Grappled', rank: 1 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Leap, then Claw Attack +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Grappled', rank: 2 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'distance', m: 14 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Leap, then Claw Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Grappled', rank: 3 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'distance', m: 18 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Leap, then Claw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Grappled', rank: 4 }]
            }
        }
    },
    {
        name: 'Run Them Down',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'A Marked enemy within range uses Movement to increase distance from you',
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
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 4m toward it, then make a Bite', dice: '1d8' },
                specials: [],
                trigger: 'A Marked enemy within 12m uses Movement to increase distance from you'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 6m, then Bite', dice: '2d8' },
                specials: [],
                trigger: 'A Marked enemy within 16m uses Movement to increase distance from you'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 8m, then Bite (also triggers on Disengage)', dice: '3d8' },
                specials: [],
                trigger: 'A Marked enemy within 16m uses Movement/Disengage to increase distance from you'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10m, then Bite (also triggers on Flee)', dice: '4d8' },
                specials: [],
                trigger: 'A Marked enemy within 20m uses Movement/Disengage/Flee to increase distance from you'
            }
        }
    },
    {
        name: 'Throat Rip',
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
                specials: [{ key: 'Penetration', rank: 2, note: 'If target has Bleeding(2+) or Mark(2+)' }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Penetration', rank: 3, note: 'If Bleeding(3+) or Mark(3+)' }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Penetration', rank: 4, note: 'If Bleeding(4+) or Mark(3+)' }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +5d8 damage', dice: '5d8' },
                specials: [{ key: 'Penetration', rank: 5, note: 'If Bleeding(5+) or Mark(4+)' }]
            }
        }
    },
    // === PACK INSTINCT (requires 4+ Werewolf powers) ===
    {
        name: 'Pack Howl',
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
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in aura gain +1 Attack Die vs creatures Marked by you' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Bonus becomes +2 Attack Dice' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 12 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Bonus becomes +3 Attack Dice' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 16 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Bonus becomes +4 Attack Dice' },
                specials: []
            }
        }
    },
    {
        name: 'Pack Tactics',
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
                effect: { text: 'If at least 1 ally is adjacent to your target, your melee attacks gain +1 Attack Die' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Bonus becomes +2 Attack Dice' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Also, the first time each round an ally hits a creature Marked by you, you may apply Bleeding(1) to that creature' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Bleeding becomes Bleeding(2), and you gain Advantage on Body Saves to resist being Grappled while within 4m of an ally' },
                specials: []
            }
        }
    },
    {
        name: 'Defensive Snap',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'An ally within range is hit by a melee attack',
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
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite against the attacker' },
                specials: [{ key: 'Mark', rank: 1 }],
                trigger: 'An ally within 6m is hit by a melee attack'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite against the attacker' },
                specials: [{ key: 'Mark', rank: 2 }],
                trigger: 'An ally within 8m is hit by a melee attack'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite against the attacker' },
                specials: [{ key: 'Mark', rank: 2 }, { key: 'Suppress', rank: 1 }],
                trigger: 'An ally within 10m is hit by a melee attack'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite against the attacker' },
                specials: [{ key: 'Mark', rank: 3 }, { key: 'Suppress', rank: 2 }],
                trigger: 'An ally within 12m is hit by a melee attack'
            }
        }
    },
    {
        name: 'Shared Fury',
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
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Choose 1 ally: they gain Regeneration(2)'},
                specials: []
            },
            '2': {

                type: 'utility',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain Regeneration(2)' },
                specials: []
            },
            '3': {

                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain Regeneration(3)' },
                specials: []
            },
            '4': {

                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain Regeneration(4)' },
                specials: []
            }
        }
    },
    // === MOON FRENZY (requires 8+ Werewolf powers) ===
    {
        name: 'Blood Moon Howl',
        category: 'utility',
        tags: ['charged'],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0,
            charges: 1
        },
        roll: {
            kind: 'check',
            attribute: 'intellect',
            vs: 'save:mind'
        },
        levels: {
            '1': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE are affected. All affected gain Mark(1). Each must pass a Mind Save or gain Frightened(1)' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'All affected gain Mark(1). Mind Save or Frightened(2)' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '3': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'All affected gain Mark(2). Mind Save or Frightened(3)' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '4': {

                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'instant' },
                effect: { text: 'All affected gain Mark(3). Mind Save or Frightened(4)' },
                specials: [{ key: 'Mark', rank: 3 }]
            }
        }
    },
    {
        name: 'Unchained Rush',
        category: 'movement',
        tags: ['charged'],
        rank: 1,
        cost: {
            action: 'movement',
            stones: 0,
            charges: 1
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
                effect: { text: 'Move up to 8m. This movement does not provoke Opportunity Attacks. At the end, choose 1 enemy within 2m: Mark(1)' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 12m, no OA. End: choose 1 enemy within 2m: Mark(2)' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 16m, no OA, and ignore difficult terrain during this move. End: Mark(2). If the target uses Disengage before your next turn, it suffers Suppress(2) (Mind Save negates)' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '4': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 20m, no OA, ignore difficult terrain. You may run along walls during this move (GM discretion; must end on solid ground). End: Mark(3). If the target uses Disengage/Flee before your next turn, Suppress(3) (Mind Save negates)' },
                specials: [{ key: 'Mark', rank: 3 }]
            }
        }
    },
    {
        name: 'Moonhide Reflex',
        category: 'reaction',
        tags: ['charged'],
        rank: 1,
        trigger: 'When you are hit by an attack',
        cost: {
            action: 'reaction',
            stones: 0,
            charges: 1
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
                effect: { text: 'Gain 1d8 Temp HP and +1 Evade'},
                specials: [],
                trigger: 'When you are hit by an attack'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 2d8 Temp HP and +2 Evade'},
                specials: [],
                trigger: 'When you are hit by an attack'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 3d8 Temp HP and +3 Evade'},
                specials: [],
                trigger: 'When you are hit by an attack'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 4d8 Temp HP and +4 Evade'},
                specials: [],
                trigger: 'When you are hit by an attack'
            }
        }
    },
    {
        name: 'Throat-Rip Execution',
        category: 'active',
        tags: ['charged'],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0,
            charges: 1
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
                specials: [{ key: 'Expose', rank: 2, note: 'If target has Mark(2+) or Bleeding(2+)' }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Expose', rank: 3, note: 'If target has Mark(2+) or Bleeding(3+)' }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +6d8 damage', dice: '6d8' },
                specials: [{ key: 'Expose', rank: 4, note: 'If target has Mark(3+) or Bleeding(4+)' }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack +8d8 damage', dice: '8d8' },
                specials: [{ key: 'Expose', rank: 5, note: 'If target has Mark(4+) or Bleeding(5+)' }]
            }
        }
    }
];

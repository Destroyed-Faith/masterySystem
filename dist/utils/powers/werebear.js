/**
 * Werebear Mastery Tree Powers (Form Tree)
 *
 * Migrated to new structure (v0.4.18+)
 *
 * Form Tree Rules:
 * - Requires Werebear form (curse, bloodline, ritual)
 * - Cannot use weapons, armor, or shields while in form
 * - Natural Weapons (Paws/Slam): 1d8 damage per 2 Werebear powers learned (up to 6d8)
 * - Natural Armor: equal to the number of Werebear powers learned
 */
export const WEREBEAR_POWERS = [
    // === CORE POWERS ===
    {
        name: 'Crushing Slam',
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
                effect: { text: 'Paw Attack +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Push', rank: 3 }, { key: 'Expose', rank: 1 }, { key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Push', rank: 4 }, { key: 'Expose', rank: 2 }, { key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Push', rank: 4 }, { key: 'Expose', rank: 2 }, { key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Push', rank: 5 }, { key: 'Expose', rank: 2 }, { key: 'Mark', rank: 4 }]
            }
        }
    },
    {
        name: 'Bear Hug',
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
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'On hit: target is held' },
                specials: [{ key: 'Grappled', rank: 1 }, { key: 'Expose', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'On hit: Paw DMG +1d8', dice: '1d8' },
                specials: [{ key: 'Grappled', rank: 2 }, { key: 'Expose', rank: 2 }, { key: 'Push', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'On hit: Paw DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Grappled', rank: 3 }, { key: 'Expose', rank: 2 }, { key: 'Mark', rank: 2 }, { key: 'Push', rank: 2 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'On hit: Paw DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Grappled', rank: 4 }, { key: 'Expose', rank: 3 }, { key: 'Mark', rank: 3 }]
            }
        }
    },
    {
        name: 'Territorial Roar',
        category: 'utility',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
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
                effect: { text: 'Enemies in AoE must make Mind Saves. On fail: Mark(1)' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'As above. On fail: Mark(2)' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'As above. On fail: Mark(3)' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'instant' },
                effect: { text: 'As above. On fail: Mark(3) and Suppress(1) (Mind Save negates Suppress)' },
                specials: [{ key: 'Mark', rank: 3 }, { key: 'Suppress', rank: 1 }]
            }
        }
    },
    {
        name: 'Ursine Resilience',
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
                effect: { text: 'Gain +2 Armor and +1 Body Save Die while in Werebear form' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +3 Armor and +2 Body Save Dice' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Armor, +3 Body Save Dice, and +1 Spirit Save Die' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +5 Armor, +4 Body Save Dice, and +2 Spirit Save Dice' },
                specials: []
            }
        }
    },
    {
        name: 'Protective Swipe',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'A creature within range hits an ally within range of you',
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
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Paw Attack dealing +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Mark', rank: 1 }],
                trigger: 'A creature within 2m hits an ally within 4m of you'
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 2 }],
                trigger: 'A creature within 2m hits an ally within 4m of you'
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Mark', rank: 2 }],
                trigger: 'A creature within 2m hits an ally within 4m of you'
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Mark', rank: 3 }],
                trigger: 'A creature within 2m hits an ally within 4m of you'
            }
        }
    },
    // === GUARDIAN HIDE (requires 4+ Werebear powers) ===
    {
        name: 'Ironcoat Hide',
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
                effect: { text: 'Your Armor increases by +3 while in Werebear form' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Armor increases by +5' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Armor increases by +8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Armor increases by +10' },
                specials: []
            }
        }
    },
    {
        name: 'Stand Like Stone',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'You would be Pushed / Pulled / Proned',
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
                effect: { text: 'Gain Immovable (immune to Push & Prone)' },
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain Immovable, 1d8 Temp HP, and +1 Armor' },
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain Immovable, 2d8 Temp HP, and +1 Armor' },
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain Immovable, 3d8 Temp HP, and +2 Armor' },
                specials: []
            }
        }
    },
    {
        name: 'Shelter the Small',
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
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '1 ally gains 1d8 Temp HP and +1 Armor' },
                specials: []
            },
            '2': {
                type: 'utility',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '1 ally gains 2d8 Temp HP and +2 Armor' },
                specials: []
            },
            '3': {
                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '1 ally gains 3d8 Temp HP and +2 Armor' },
                specials: []
            },
            '4': {
                type: 'utility',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '1 ally gains 4d8 Temp HP and +3 Armor' },
                specials: []
            }
        }
    },
    {
        name: 'Hold the Line',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'check',
            attribute: 'intellect',
            vs: 'save:mind'
        },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You gain Immovable and +1 Armor. Enemies that start their turn in the aura: Mind Save or gain Mark(1)' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You gain Immovable and +2 Armor. Aura applies Mark(2)' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You gain Immovable and +4 Armor. Aura applies Mark(3)' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You gain Immovable and +4 Armor. Aura applies Mark(4)' },
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },
    // === EARTHSHAKER (requires 4+ Werebear powers) ===
    {
        name: 'Seismic Clap',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'check',
            attribute: 'might',
            vs: 'save:body'
        },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 4, angleDeg: 90 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Creatures in cone: Body Save or Prone(1)' },
                specials: [{ key: 'Prone', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 6, angleDeg: 90 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Body Save or Prone(2)' },
                specials: [{ key: 'Prone', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 8, angleDeg: 90 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Body Save or Prone(2); on fail also Push(3)' },
                specials: [{ key: 'Prone', rank: 2 }, { key: 'Push', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 10, angleDeg: 90 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Creatures in cone take 1d8 damage, then Body Save or Prone(3); on fail also Expose(2)', dice: '1d8' },
                specials: [{ key: 'Prone', rank: 3 }, { key: 'Expose', rank: 2 }]
            }
        }
    },
    {
        name: 'Groundbreaker',
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
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE: Push(4) and Expose(2)' },
                specials: [{ key: 'Push', rank: 4 }, { key: 'Expose', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE take 1d8 damage, Push(5), Expose(2), Mark(1)', dice: '1d8' },
                specials: [{ key: 'Push', rank: 5 }, { key: 'Expose', rank: 2 }, { key: 'Mark', rank: 1 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE take 2d8 damage, Push(6), Expose(3)', dice: '2d8' },
                specials: [{ key: 'Push', rank: 6 }, { key: 'Expose', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE take 2d8 damage, Push(8), Expose(4), Mark(2)', dice: '2d8' },
                specials: [{ key: 'Push', rank: 8 }, { key: 'Expose', rank: 4 }, { key: 'Mark', rank: 2 }]
            }
        }
    },
    {
        name: 'Quake Punish',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'A creature enters a space within range of you',
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
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Paw Attack +1d8 damage; on hit Push(2)', dice: '1d8' },
                specials: [{ key: 'Push', rank: 2 }],
                trigger: 'A creature enters a space within 2m of you'
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +2d8 damage; on hit Push(3) and Expose(1)', dice: '2d8' },
                specials: [{ key: 'Push', rank: 3 }, { key: 'Expose', rank: 1 }],
                trigger: 'A creature enters a space within 2m of you'
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +3d8 damage; on hit Push(4) and Expose(1)', dice: '3d8' },
                specials: [{ key: 'Push', rank: 4 }, { key: 'Expose', rank: 1 }],
                trigger: 'A creature enters a space within 2m of you'
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Paw Attack +4d8 damage; on hit Push(5) and Expose(2)', dice: '4d8' },
                specials: [{ key: 'Push', rank: 5 }, { key: 'Expose', rank: 2 }],
                trigger: 'A creature enters a space within 2m of you'
            }
        }
    },
    {
        name: 'Seismic Presence',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'check',
            attribute: 'might',
            vs: 'save:body'
        },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While you are Immovable, enemies that start their turn within 2m must pass a Body Save or gain Expose(1) (1 round)' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Immovable, radius becomes 4m and Expose becomes Expose(2)' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Immovable, radius becomes 6m and enemies that fail also gain Suppress(1) (Mind Save negates Suppress)' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Immovable, radius becomes 8m and Suppress becomes Suppress(2) (Mind Save negates)' },
                specials: []
            }
        }
    },
    // === GROVE ROAR (requires 8+ Werebear powers) ===
    {
        name: 'Grove Roar',
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
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE gain Regeneration(2)' },
                specials: []
            },
            '2': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE gain Regeneration(3)' },
                specials: []
            },
            '3': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE gain Regeneration(4)' },
                specials: []
            },
            '4': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE gain Regeneration(4)' },
                specials: [{ key: 'Cleanse', rank: 4 }]
            }
        }
    },
    {
        name: 'Gentle Reprieve',
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
                duration: { kind: 'instant' },
                effect: { text: 'Heal 1d8 HP', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'utility',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal 2d8 HP', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal 3d8 HP', dice: '3d8' },
                specials: [{ key: 'Cleanse', rank: 4 }]
            },
            '4': {
                type: 'utility',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal 4d8 HP', dice: '4d8' },
                specials: [{ key: 'Cleanse', rank: 4 }]
            }
        }
    },
    {
        name: 'Heartwood Ward',
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
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in aura gain +2 Armor. On cast: they gain 1d8 Temp HP' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies gain +3 Armor. On cast: 2d8 Temp HP' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies gain +4 Armor. On cast: 3d8 Temp HP' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies gain +5 Armor. On cast: 4d8 Temp HP' },
                specials: []
            }
        }
    },
    {
        name: 'Shared Regrowth',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'An ally within range takes damage',
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
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That ally gains Regeneration(3)' },
                specials: [],
                trigger: 'An ally within 8m takes damage'
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Ally gains Regeneration(4) and 1d8 Temp HP' },
                specials: [],
                trigger: 'An ally within 10m takes damage'
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Ally gains Regeneration(5) and 1d8 Temp HP' },
                specials: [],
                trigger: 'An ally within 12m takes damage'
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Ally gains Regeneration(6) and 1d8 Temp HP' },
                specials: [],
                trigger: 'An ally within 16m takes damage'
            }
        }
    }
];
//# sourceMappingURL=werebear.js.map
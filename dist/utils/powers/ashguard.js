/**
 * Ashguard Mastery Tree Powers
 *
 * Theme: A frontline fighter who turns fire into durability. Apply Ignite through
 * heavy close-range attacks, then convert the ongoing burn into armor, sustain,
 * and punishing retaliation.
 * Role: Frontline Bruiser / Attrition Tank
 * Primary Special: Ignite • Secondary Axis: Armor
 *
 * Tree Bonus: Once per round, when you apply or increase Ignite, gain +1 Armor
 * until the start of your next turn.
 *
 * 18 Powers: 4 Actives, 4 Passives, 4 Reactions, 4 Active Buffs, 2 Movement.
 */
export const ASHGUARD_POWERS = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Cinder Cleave',
        fluff: 'Your weapon lands like a furnace door slamming shut.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Ignite', rank: 3 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Ignite', rank: 4 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Ignite', rank: 4 }]
            }
        }
    },
    {
        name: 'Ember Bash',
        fluff: 'A crashing impact sends the enemy backward already on fire.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Push', rank: 2 }, { key: 'Ignite', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Push', rank: 4 }, { key: 'Ignite', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Push', rank: 6 }, { key: 'Ignite', rank: 2 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Push', rank: 8 }, { key: 'Ignite', rank: 3 }]
            }
        }
    },
    {
        name: 'Scorch Ring',
        fluff: 'Heat rolls out from you in a widening circle of punishment.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'Ignite', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 3d8 damage.', dice: '3d8' },
                specials: [{ key: 'Ignite', rank: 3 }]
            }
        }
    },
    {
        name: 'Siege Cut',
        fluff: 'Once the target is burning, your blade starts finding the weak seams beneath.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage vs. Ignited target.', dice: '1d8' },
                specials: [{ key: 'Penetration', rank: 2, note: 'vs. Ignited target' }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage vs. Ignited target.', dice: '2d8' },
                specials: [{ key: 'Penetration', rank: 4, note: 'vs. Ignited target' }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8 damage vs. Ignited target.', dice: '3d8' },
                specials: [{ key: 'Penetration', rank: 6, note: 'vs. Ignited target' }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 damage vs. Ignited target.', dice: '4d8' },
                specials: [{ key: 'Penetration', rank: 8, note: 'vs. Ignited target' }]
            }
        }
    },
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Coal Plate',
        fluff: 'The hotter the battle gets, the more your body starts to resemble a forge wall.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy suffers from Ignite from you, gain +2 Armor.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy suffers from Ignite from you, gain +4 Armor.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy suffers from Ignite from you, gain +6 Armor.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy suffers from Ignite from you, gain +8 Armor.' },
                specials: []
            }
        }
    },
    {
        name: 'Burn Tempered',
        fluff: 'Pain has already happened. What remains is structure.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 dice to Body Saving Throws.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 dice to Body Saving Throws.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 dice to Body Saving Throws.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 dice to Body Saving Throws.' },
                specials: []
            }
        }
    },
    {
        name: 'Furnace Heart',
        fluff: 'As long as something is still burning, you refuse to cool down.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 1d8 HP.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 2d8 HP.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 3d8 HP.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 4d8 HP.', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Iron Flame',
        fluff: 'A target that is already burning stops being hard to break.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit an Ignited target, add +1d8 damage.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit an Ignited target, add +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit an Ignited target, add +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit an Ignited target, add +4d8 damage.', dice: '4d8' },
                specials: []
            }
        }
    },
    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Flare Guard',
        fluff: 'The hit lands into a sudden shell of sparks and blackened heat.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'You are hit by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +2 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +4 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +6 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +8 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: []
            }
        }
    },
    {
        name: 'Answering Heat',
        fluff: 'Touching you is how other people catch fire.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A creature hits you with a melee attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with a melee attack.',
                specials: [{ key: 'Ignite', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with a melee attack.',
                specials: [{ key: 'Ignite', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with a melee attack.',
                specials: [{ key: 'Ignite', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with a melee attack.',
                specials: [{ key: 'Ignite', rank: 4 }]
            }
        }
    },
    {
        name: 'Step Through Flame',
        fluff: 'The safest answer is often one step deeper into the heat.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'You are targeted by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 2 m and gain +2 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 4 m and gain +4 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 6 m and gain +6 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 8 m and gain +8 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: []
            }
        }
    },
    {
        name: 'Feed the Furnace',
        fluff: 'Every successful burn teaches your armor how to harden further.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'An enemy suffers damage from Ignite from you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +2 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +4 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +6 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +8 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: []
            }
        }
    },
    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Forge Shell',
        fluff: 'You stop wearing protection and start becoming it.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +3 Armor.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +5 Armor.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +7 Armor.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +9 Armor.' },
                specials: []
            }
        }
    },
    {
        name: 'Walking Furnace',
        fluff: 'Nearby embers do not stay small for long.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +1.' },
                specials: [{ key: 'Ignite', rank: 1, note: 'aura tick, already-burning only' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +2.' },
                specials: [{ key: 'Ignite', rank: 2, note: 'aura tick, already-burning only' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +3.' },
                specials: [{ key: 'Ignite', rank: 3, note: 'aura tick, already-burning only' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +4.' },
                specials: [{ key: 'Ignite', rank: 4, note: 'aura tick, already-burning only' }]
            }
        }
    },
    {
        name: 'Combustion Plate',
        fluff: 'The more the enemy burns, the more your body remembers how not to break.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'While any enemy is suffering Ignite from you, gain +4 Armor.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'While any enemy is suffering Ignite from you, gain +6 Armor.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'While any enemy is suffering Ignite from you, gain +8 Armor.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'While any enemy is suffering Ignite from you, gain +10 Armor.' },
                specials: []
            }
        }
    },
    {
        name: 'Coals of War',
        fluff: 'Once the battle is hot enough, every strike also hardens you further.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit an Ignited target, gain +2 Armor and deal +1d8 damage.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit an Ignited target, gain +3 Armor and deal +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit an Ignited target, gain +4 Armor and deal +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit an Ignited target, gain +5 Armor and deal +4d8 damage.', dice: '4d8' },
                specials: []
            }
        }
    },
    // ─── Movement Powers ────────────────────────────────────────────────────
    {
        name: 'Ember Stride',
        fluff: 'You move like a line of fire choosing its next fuel.',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 6 m. Your next hit this turn applies Ignite(1).' },
                specials: [{ key: 'Ignite', rank: 1, note: 'on next hit this turn' }]
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10 m. Your next hit this turn applies Ignite(2).' },
                specials: [{ key: 'Ignite', rank: 2, note: 'on next hit this turn' }]
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 14 m. Your next hit this turn applies Ignite(3).' },
                specials: [{ key: 'Ignite', rank: 3, note: 'on next hit this turn' }]
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 18 m. Your next hit this turn applies Ignite(4).' },
                specials: [{ key: 'Ignite', rank: 4, note: 'on next hit this turn' }]
            }
        }
    },
    {
        name: 'Smoke Step',
        fluff: 'You leave the blow behind inside the ash cloud it thought was you.',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'After you attack, move up to 6 m and gain +1 Armor until the start of your next turn.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'After you attack, move up to 10 m and gain +2 Armor until the start of your next turn.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'After you attack, move up to 14 m and gain +3 Armor until the start of your next turn.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'After you attack, move up to 18 m and gain +4 Armor until the start of your next turn.' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=ashguard.js.map
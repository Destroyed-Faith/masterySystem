/**
 * Gale Breaker Mastery Tree Powers
 *
 * Theme: A martial controller who wins by making the enemy late. Apply Shock to
 * strip attack quality from key targets, then use motion, ally-facing reactions,
 * and Evade support to make their weakened turns collapse further.
 * Role: Skirmisher / Tempo Defender / Shock Support
 * Primary Special: Shock
 * Secondary Special: Evade
 *
 * 18 Powers: 4 Actives, 4 Passives, 4 Reactions, 4 Active Buffs, 2 Movement.
 */
export const GALE_BREAKER_POWERS = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Jolt Cut',
        fluff: 'A quick impact that steals certainty from the body before it steals blood.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Shock', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Shock', rank: 3 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Shock', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Shock', rank: 4 }]
            }
        }
    },
    {
        name: 'Crosswind Hit',
        fluff: 'You hit, shift the line, and leave the enemy answering the wrong angle.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +1d8 damage. You and one ally within 2 m gain +1 Evade until the start of your next turn.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +2d8 damage. You and one ally within 2 m gain +2 Evade until the start of your next turn.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +3d8 damage. You and one ally within 2 m gain +3 Evade until the start of your next turn.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +4d8 damage. You and one ally within 2 m gain +4 Evade until the start of your next turn.', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Rattle Line',
        fluff: 'One violent impact and the whole nearby line forgets how clean action is supposed to feel.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'Shock', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'Shock', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'Shock', rank: 2 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'Shock', rank: 3 }]
            }
        }
    },
    {
        name: 'Screen Thrust',
        fluff: 'Once the enemy is rattled, even your offense starts protecting people.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +1d8 damage. If the target is Shocked, you and one ally within 2 m gain +2 Evade until the start of your next turn.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +2d8 damage. If the target is Shocked, you and one ally within 2 m gain +3 Evade until the start of your next turn.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +3d8 damage. If the target is Shocked, you and one ally within 2 m gain +4 Evade until the start of your next turn.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Weapon DMG +4d8 damage. If the target is Shocked, you and one ally within 2 m gain +5 Evade until the start of your next turn.', dice: '4d8' },
                specials: []
            }
        }
    },
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Storm Screen',
        fluff: 'Your presence makes nearby allies harder to catch cleanly.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and allies within 2 m gain +1 Evade.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and allies within 4 m gain +2 Evade.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and allies within 6 m gain +3 Evade.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and allies within 8 m gain +4 Evade.' },
                specials: []
            }
        }
    },
    {
        name: 'Late Strikes',
        fluff: 'Enemies already rattled by force rarely arrive on time.',
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
                effect: { text: 'Against attacks made by Shocked enemies, gain +2 Evade.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Against attacks made by Shocked enemies, gain +4 Evade.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Against attacks made by Shocked enemies, gain +6 Evade.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Against attacks made by Shocked enemies, gain +8 Evade.' },
                specials: []
            }
        }
    },
    {
        name: 'Screen Fighter',
        fluff: 'You fight best when covering someone else’s angle.',
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
                effect: { text: 'While within 2 m of an ally, gain +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While within 2 m of an ally, gain +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While within 2 m of an ally, gain +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While within 2 m of an ally, gain +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Sudden Gap',
        fluff: 'The cleanest defense is moving first.',
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
                effect: { text: 'Gain +4 Initiative.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Initiative.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +12 Initiative.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +16 Initiative.' },
                specials: []
            }
        }
    },
    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Intercept the Angle',
        fluff: 'You step into the only line that mattered.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'An ally within 2 m is attacked.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That ally gains +2 Evade against the attack.' },
                trigger: 'An ally within 2 m is attacked.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That ally gains +4 Evade against the attack.' },
                trigger: 'An ally within 2 m is attacked.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That ally gains +6 Evade against the attack.' },
                trigger: 'An ally within 2 m is attacked.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That ally gains +8 Evade against the attack.' },
                trigger: 'An ally within 2 m is attacked.',
                specials: []
            }
        }
    },
    {
        name: 'Punish the Lag',
        fluff: 'A stagger is all the invitation you need.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Shocked enemy within range misses an attack.',
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +1d8 damage.', dice: '1d8' },
                trigger: 'A Shocked enemy within range misses an attack.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +2d8 damage.', dice: '2d8' },
                trigger: 'A Shocked enemy within range misses an attack.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +3d8 damage.', dice: '3d8' },
                trigger: 'A Shocked enemy within range misses an attack.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +4d8 damage.', dice: '4d8' },
                trigger: 'A Shocked enemy within range misses an attack.',
                specials: []
            }
        }
    },
    {
        name: 'Carry the Wind',
        fluff: 'The answer to pressure is being elsewhere.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'You are attacked.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 2 m and gain +2 Evade against that attack.' },
                trigger: 'You are attacked.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 4 m and gain +4 Evade against that attack.' },
                trigger: 'You are attacked.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 6 m and gain +6 Evade against that attack.' },
                trigger: 'You are attacked.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 8 m and gain +8 Evade against that attack.' },
                trigger: 'You are attacked.',
                specials: []
            }
        }
    },
    {
        name: 'Steady the Line',
        fluff: 'When the line starts to fail, you make one more second of order.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'An ally within range is hit.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +2 Armor against that hit and +1 Evade until the start of your next turn.' },
                trigger: 'An ally within 4 m is hit.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +4 Armor against that hit and +2 Evade until the start of your next turn.' },
                trigger: 'An ally within 8 m is hit.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +6 Armor against that hit and +3 Evade until the start of your next turn.' },
                trigger: 'An ally within 12 m is hit.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +8 Armor against that hit and +4 Evade until the start of your next turn.' },
                trigger: 'An ally within 16 m is hit.',
                specials: []
            }
        }
    },
    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Slipstream Order',
        fluff: 'You impose a moving pattern that is simply harder to hit.',
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
                effect: { text: 'You and allies in the aura gain +2 Evade.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +3 Evade.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +4 Evade.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +5 Evade.' },
                specials: []
            }
        }
    },
    {
        name: 'Rattle Them',
        fluff: 'Once you decide someone is unstable, you keep it that way.',
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
                effect: { text: 'The first time each round you hit a target, increase its Shock by 1.' },
                specials: [{ key: 'Shock', rank: 1, note: 'first hit per round' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, increase its Shock by 2.' },
                specials: [{ key: 'Shock', rank: 2, note: 'first hit per round' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, increase its Shock by 3.' },
                specials: [{ key: 'Shock', rank: 3, note: 'first hit per round' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, increase its Shock by 4.' },
                specials: [{ key: 'Shock', rank: 4, note: 'first hit per round' }]
            }
        }
    },
    {
        name: 'Stay Ahead',
        fluff: 'Your side acts as if the enemy were always one beat late.',
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
                effect: { text: 'You and allies in the aura gain +4 Initiative.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +8 Initiative.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +12 Initiative.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +16 Initiative.' },
                specials: []
            }
        }
    },
    {
        name: 'Safe Current',
        fluff: 'At the right tempo, offense and protection become the same motion.',
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
                effect: { text: 'The first time each round you hit a Shocked target, you and one ally within 2 m gain +2 Evade.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Shocked target, you and one ally within 2 m gain +3 Evade.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Shocked target, you and one ally within 2 m gain +4 Evade.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Shocked target, you and one ally within 2 m gain +5 Evade.' },
                specials: []
            }
        }
    },
    // ─── Movement Powers ────────────────────────────────────────────────────
    {
        name: 'Wind Cut',
        fluff: 'You move through the fight like a gap opening.',
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
                effect: { text: 'Move up to 6 m. If you end adjacent to an enemy, you and one ally within 2 m gain +1 Evade until the start of your next turn.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10 m. If you end adjacent to an enemy, you and one ally within 2 m gain +2 Evade until the start of your next turn.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 14 m. If you end adjacent to an enemy, you and one ally within 2 m gain +3 Evade until the start of your next turn.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 18 m. If you end adjacent to an enemy, you and one ally within 2 m gain +4 Evade until the start of your next turn.' },
                specials: []
            }
        }
    },
    {
        name: 'Wash Out',
        fluff: 'You are gone before the enemy finishes committing to the angle.',
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
                effect: { text: 'After you make an attack, move up to 6 m.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'After you make an attack, move up to 10 m.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'After you make an attack, move up to 14 m.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'After you make an attack, move up to 18 m.' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=gale-breaker.js.map
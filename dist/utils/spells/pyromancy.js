/**
 * Pyromancy — School of Flame Spells
 */
export const PYROMANCY_SPELLS = [
    {
        name: 'Firebolt',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'A bolt of fire that ignites targets and explodes in a small radius.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: '1d8 Fire damage',
                special: 'Ignite(1)',
                raises: 'Ignite +1 for two Raises, Range +4 m, Radius +1 m',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: '2d8 Fire damage',
                special: 'Ignite(1)',
                raises: 'Ignite +1 for two Raises, Range +4 m, Radius +1 m',
                cost: { action: true },
                roll: { damage: '2d8', damageType: 'fire' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: '3d8 Fire damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1 for two Raises, Range +4 m, Radius +1 m',
                cost: { action: true },
                roll: { damage: '3d8', damageType: 'fire' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: '4d8 Fire damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1 for two Raises, Range +4 m, Radius +1 m',
                cost: { action: true },
                roll: { damage: '4d8', damageType: 'fire' }
            }
        ]
    },
    {
        name: 'Flame Weapon',
        school: 'Pyromancy',
        spellType: 'buff',
        description: 'Your weapon erupts in disciplined flame, its edge shimmering with heat.',
        levels: [
            {
                level: 1,
                type: 'Buff',
                range: 'Touch',
                duration: 'Mastery Rank Rounds',
                effect: 'Weapon deals +1d8 damage',
                special: 'Ignite(1)',
                raises: 'Ignite +1 for two Raises, Rounds +1 for two Raises',
                cost: { action: true },
                roll: { damage: '+1d8', damageType: 'fire' }
            },
            {
                level: 2,
                type: 'Buff',
                range: 'Touch',
                duration: 'Mastery Rank Rounds',
                effect: 'Weapon deals +2d8 damage',
                special: 'Ignite(1)',
                raises: 'Ignite +1 for two Raises, Rounds +1 for two Raises',
                cost: { action: true },
                roll: { damage: '+2d8', damageType: 'fire' }
            },
            {
                level: 3,
                type: 'Buff',
                range: 'Touch',
                duration: 'Mastery Rank Rounds',
                effect: 'Weapon deals +3d8 damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1 for two Raises, Rounds +1 for two Raises',
                cost: { action: true },
                roll: { damage: '+3d8', damageType: 'fire' }
            },
            {
                level: 4,
                type: 'Buff',
                range: 'Touch',
                duration: 'Mastery Rank Rounds',
                effect: 'Weapon deals +4d8 damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1 for two Raises, Rounds +1 for two Raises',
                cost: { action: true },
                roll: { damage: '+4d8', damageType: 'fire' }
            }
        ]
    },
    {
        name: 'Firewall',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'A wall of flame that damages those who cross it.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '2×2×2 m (Wall)',
                duration: '1 round',
                effect: 'Crossing takes 1d8 damage',
                special: 'Ignite(1)',
                raises: 'Ignite +1 for two Raises, Length +2 m, Width +1 m, Rounds +1',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '8 m',
                aoe: '4×2×2 m (Wall)',
                duration: '1 round',
                effect: 'Crossing takes 1d8 damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1 for two Raises, Length +2 m, Width +1 m, Rounds +1',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '6×2×4 m (Wall)',
                duration: '1 round',
                effect: 'Crossing takes 2d8 damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1 for two Raises, Length +2 m, Width +1 m, Rounds +1',
                cost: { action: true },
                roll: { damage: '2d8', damageType: 'fire' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '16 m',
                aoe: '8×2×3 m (Wall)',
                duration: '1 round',
                effect: 'Crossing takes 3d8 damage',
                special: 'Ignite(3)',
                raises: 'Ignite +1 for two Raises, Length +2 m, Width +1 m, Rounds +1',
                cost: { action: true },
                roll: { damage: '3d8', damageType: 'fire' }
            }
        ]
    },
    {
        name: 'Blazing Burst',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'A cone of blinding flame that sears enemies.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: 'Cone 90°, length 2 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Blinded(1)',
                raises: 'Blinded +1 for two raises, Ignite +1, Cone length +2 m, Range +4 m',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: 'Cone 90°, length 4 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Blinded(1)',
                raises: 'Blinded +1 for two raises, Ignite +1, Cone length +2 m, Range +4 m',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: 'Cone 90°, length 6 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Blinded(1), Ignite(2)',
                raises: 'Blinded +1 for two raises, Ignite +1, Cone length +2 m, Range +4 m',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: 'Cone 90°, length 8 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Blinded(1), Ignite(3)',
                raises: 'Blinded +1 for two raises, Ignite +1, Cone length +2 m, Range +4 m',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            }
        ]
    },
    {
        name: 'Scorching Ray',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'A chain of pact lightning leaps from mark to mark.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                duration: 'Instant',
                effect: 'One ray (Autofire 0) with 1d8 Damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1, Range +4 m',
                cost: { action: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '20 m',
                duration: 'Instant',
                effect: 'Two rays (Autofire 1) with 1d8 Damage',
                special: 'Ignite(2)',
                raises: 'Ignite +1, Range +4 m',
                cost: { action: true, charged: true },
                roll: { damage: '1d8', damageType: 'fire' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '12 m',
                duration: 'Instant',
                effect: 'Two rays (Autofire 1) with 2d8 Damage',
                special: 'Ignite(4)',
                raises: 'Ignite +1, Range +4 m',
                cost: { action: true, charged: true },
                roll: { damage: '2d8', damageType: 'fire' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '12 m',
                duration: 'Instant',
                effect: 'Three rays (Autofire 2) with 2d8 Damage',
                special: 'Ignite(4)',
                raises: 'Ignite +1, Range +4 m',
                cost: { action: true, charged: true },
                roll: { damage: '2d8', damageType: 'fire' }
            }
        ]
    },
    {
        name: 'Blazing Speed',
        school: 'Pyromancy',
        spellType: 'buff',
        description: 'Flames surge through your body, pushing you to impossible speed.',
        levels: [
            {
                level: 1,
                type: 'Buff',
                range: 'Self',
                duration: 'Mastery Rank rounds',
                effect: '+4m Movement, +1 Attack Die',
                raises: 'Damage (+1d8), Ignite(+1), Movement (+2m)',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Buff',
                range: 'Self',
                duration: 'Mastery Rank rounds',
                effect: '+6m Movement, +2 Attack Dice',
                raises: 'Damage (+1d8), Ignite(+1), Movement (+2m)',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Buff',
                range: 'Self',
                duration: 'Mastery Rank rounds',
                effect: '+8m Movement, +2 Attack Dice, +1 Keep',
                raises: 'Damage (+1d8), Ignite(+1), Movement (+2m)',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Buff',
                range: 'Self',
                duration: 'Mastery Rank rounds',
                effect: '+10m Movement, +3 Attack Dice, +1 Keep',
                raises: 'Damage (+1d8), Ignite(+1), Movement (+2m)',
                cost: { action: true }
            }
        ]
    }
];
//# sourceMappingURL=pyromancy.js.map
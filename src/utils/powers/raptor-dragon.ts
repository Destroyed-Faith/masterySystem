/**
 * Raptor Dragon Mastery Tree Powers
 *
 * Theme: A relentless draconic hunter that isolates targets, strips their defenses
 * with corrosive pressure, and tears them apart through speed, angle, and repeated strikes.
 * Role: Skirmisher / Dive Hunter / Pick Pressure
 * Primary Attribute: Agility
 * Primary Specials: Mark, Corrode • Secondary: Pull, Penetration
 *
 * Tree Bonus (Natural Weapons): Your natural attacks (Claws / Bite / Tail) count as melee
 * weapons. They deal 1d8 damage for every 2 Raptor Dragon powers learned, up to 4d8.
 *
 * Requirement: You must be in Dragon form to use these powers. While in form you
 * cannot use weapons, armor, or shields; you rely on natural weapons, wings, momentum,
 * and predatory instinct from this tree. Gated to actors with the "dragonborn" Echo.
 *
 * 9 Powers: 3 Actives, 2 Reactions, 2 Active Buffs, 2 Movement.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const RAPTOR_DRAGON_POWERS: NewArtifactPowerData[] = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Skyhook Snatch',
        fluff: 'Distance stops mattering when your claws decide otherwise.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'pull', rank: 2 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 3d8 damage.', dice: '3d8' },
                specials: [{ key: 'pull', rank: 4 }],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 5d8 damage.', dice: '5d8' },
                specials: [{ key: 'pull', rank: 6 }],
                mechanics: { damageRider: { flat: '+5d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 6d8 damage.', dice: '6d8' },
                specials: [{ key: 'pull', rank: 8 }],
                mechanics: { damageRider: { flat: '+6d8' }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Rending Chain',
        fluff: 'One opening is never enough. The next strike is already looking for the seam behind it.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'corrode', rank: 1 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'corrode', rank: 2 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 3d8 damage.', dice: '3d8' },
                specials: [{ key: 'corrode', rank: 3 }],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 4d8 damage.', dice: '4d8' },
                specials: [{ key: 'corrode', rank: 4 }],
                mechanics: { damageRider: { flat: '+4d8' }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Execute',
        fluff: 'The kill strike is never wasted on something that still deserves a fair fight.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 2d8 damage against a target with Mark or Corrode.', dice: '2d8' },
                specials: [{ key: 'penetration', rank: 1 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 4d8 damage against a target with Mark or Corrode.', dice: '4d8' },
                specials: [{ key: 'penetration', rank: 2 }],
                mechanics: { damageRider: { flat: '+4d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 6d8 damage against a target with Mark or Corrode.', dice: '6d8' },
                specials: [{ key: 'penetration', rank: 3 }],
                mechanics: { damageRider: { flat: '+6d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 8d8 damage against a target with Mark or Corrode.', dice: '8d8' },
                specials: [{ key: 'penetration', rank: 4 }],
                mechanics: { damageRider: { flat: '+8d8' }, applyWhen: 'attack-rider' }
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Bite',
        fluff: 'Too close is not safety. It is selection.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When you are hit by a melee attack.',
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 1d8.', dice: '1d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'mark', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 2d8.', dice: '2d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'mark', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 2d8.', dice: '2d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'mark', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 3d8.', dice: '3d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'mark', rank: 4 }]
            }
        }
    },
    {
        name: 'Wing Slip',
        fluff: 'A flick of wing and angle is the difference between reprisal and absence.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When you are targeted by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 2 m and gain +2 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: [],
                mechanics: { evade: 2, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 4 m and gain +4 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: [],
                mechanics: { evade: 4, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 6 m and gain +6 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: [],
                mechanics: { evade: 6, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 8 m and gain +8 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: [],
                mechanics: { evade: 8, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Take Flight',
        fluff: 'The ground stops being part of the problem.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 6 m. While flying, gain +2 Evade.' },
                specials: [],
                mechanics: { evade: 2, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 10 m. While flying, gain +4 Evade.' },
                specials: [],
                mechanics: { evade: 4, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 14 m. While flying, gain +6 Evade.' },
                specials: [],
                mechanics: { evade: 6, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 18 m. While flying, gain +8 Evade.' },
                specials: [],
                mechanics: { evade: 8, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    },
    {
        name: 'Acid Bloodlust',
        fluff: 'The prey stops bleeding first. Then it starts dissolving.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Your attacks gain Corrode(2) and deal +1d8 damage.', dice: '1d8' },
                specials: [{ key: 'corrode', rank: 2 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Your attacks gain Corrode(3) and deal +2d8 damage.', dice: '2d8' },
                specials: [{ key: 'corrode', rank: 3 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Your attacks gain Corrode(4) and deal +2d8 damage.', dice: '2d8' },
                specials: [{ key: 'corrode', rank: 4 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Your attacks gain Corrode(5) and deal +3d8 damage.', dice: '3d8' },
                specials: [{ key: 'corrode', rank: 5 }],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    },

    // ─── Movement ───────────────────────────────────────────────────────────
    {
        name: 'Flyby',
        fluff: 'A pass that leaves only wind, pain, and a bad decision behind.',
        category: 'movement',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 3 m as Flight Movement. Your next attack this round deals +1d8 damage.', dice: '1d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 6 m as Flight Movement. Your next attack this round deals +2d8 damage.', dice: '2d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 9 m as Flight Movement. Your next attack this round deals +3d8 damage.', dice: '3d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 12 m as Flight Movement. Your next attack this round deals +4d8 damage.', dice: '4d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+4d8' }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Dive Drop',
        fluff: 'You vanish from the line for one heartbeat and return as a falling verdict.',
        category: 'movement',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 4 m toward a creature below or beside you, then your next attack this turn deals +1d8 damage.', dice: '1d8' },
                specials: [{ key: 'mark', rank: 1 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 8 m toward a creature below or beside you, then your next attack this turn deals +2d8 damage.', dice: '2d8' },
                specials: [{ key: 'mark', rank: 2 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 12 m toward a creature below or beside you, then your next attack this turn deals +3d8 damage.', dice: '3d8' },
                specials: [{ key: 'mark', rank: 3 }],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 16 m toward a creature below or beside you, then your next attack this turn deals +4d8 damage.', dice: '4d8' },
                specials: [{ key: 'mark', rank: 4 }],
                mechanics: { damageRider: { flat: '+4d8' }, applyWhen: 'attack-rider' }
            }
        }
    }
];

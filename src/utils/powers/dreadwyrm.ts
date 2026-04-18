/**
 * Dreadwyrm Mastery Tree Powers
 *
 * Theme: A tyrannical dragon-lord who bends the battlefield through fear, command,
 * and oppressive presence, marking prey for the pack while turning whole zones into
 * psychological killspaces.
 * Role: AoE Controller / Supporter / Buffer via Roar
 * Primary Attribute: Influence
 * Primary Specials: Mark, Push • Fear/Control via Mind Save penalties (effect text)
 *
 * Tree Bonus (Natural Weapons): Your natural attacks (Claws / Bite / Tail) count as melee
 * weapons. They deal 1d8 damage for every 2 Dreadwyrm powers learned, up to 4d8.
 *
 * Requirement: You must be in Dragon form to use these powers. While in form you
 * cannot use weapons, armor, or shields; you rely on voice, presence, breath, claws,
 * and dominion from this tree. Gated to actors with the "dragonborn" Echo.
 *
 * 18 Powers: 4 Actives, 4 Passives, 4 Reactions, 4 Active Buffs, 2 Movement.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const DREADWYRM_POWERS: NewArtifactPowerData[] = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Crushing Gaze',
        fluff: 'One look from an ancient tyrant can collapse courage faster than steel can cut it.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'influence' },
        levels: {
            '1': {
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target must pass a Mind Save or suffer −2 dice on attacks and checks while it can perceive you.' },
                specials: []
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target must pass a Mind Save or suffer −4 dice on attacks and checks while it can perceive you.' },
                specials: []
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target must pass a Mind Save or suffer −6 dice on attacks and checks while it can perceive you.' },
                specials: []
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target must pass a Mind Save or suffer −8 dice on attacks and checks while it can perceive you.' },
                specials: []
            }
        }
    },
    {
        name: 'Dread Breath',
        fluff: 'What leaves your mouth is not fire or frost first. It is surrender, weaponized.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'influence' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 2, angleDeg: 60 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −1 die on attacks until the end of their next turn.' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 4, angleDeg: 60 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −2 dice on attacks until the end of their next turn.' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 6, angleDeg: 60 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −3 dice on attacks until the end of their next turn.' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'cone', lengthM: 8, angleDeg: 60 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −4 dice on attacks until the end of their next turn.' },
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },
    {
        name: 'Terrifying Sweep',
        fluff: 'Your sweep does not merely break formation. It reminds everyone who owns the room.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'influence' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −1 die on attacks until the end of their next turn.' },
                specials: [{ key: 'Push', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −2 dice on attacks until the end of their next turn.' },
                specials: [{ key: 'Push', rank: 4 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −3 dice on attacks until the end of their next turn.' },
                specials: [{ key: 'Push', rank: 6 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 5 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area must pass a Mind Save or suffer −4 dice on attacks until the end of their next turn.' },
                specials: [{ key: 'Push', rank: 8 }]
            }
        }
    },
    {
        name: 'Commanding Strike',
        fluff: 'A single brutal strike becomes a command: now, all of you, on this one.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'influence' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 1d8 damage. The next ally to attack that target before your next turn gains +2 Attack Dice.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 2d8 damage. The next ally to attack that target before your next turn gains +4 Attack Dice.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 3d8 damage. The next ally to attack that target before your next turn gains +6 Attack Dice.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 4d8 damage. The next ally to attack that target before your next turn gains +8 Attack Dice.', dice: '4d8' },
                specials: []
            }
        }
    },

    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Draconic Presence',
        fluff: 'Courage leaks out of the room as soon as you arrive in it.',
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 2 m of you suffer −1 die on attacks while they can perceive you.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4 m of you suffer −2 dice on attacks while they can perceive you.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6 m of you suffer −3 dice on attacks while they can perceive you.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8 m of you suffer −4 dice on attacks while they can perceive you.' },
                specials: []
            }
        }
    },
    {
        name: 'Rule by Fear',
        fluff: 'Fear is not the outcome. Fear is the method of governance.',
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when a creature fails a Mind Save against one of your Dreadwyrm powers, it also gains Mark(1).' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when a creature fails a Mind Save against one of your Dreadwyrm powers, it also gains Mark(2).' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when a creature fails a Mind Save against one of your Dreadwyrm powers, it also gains Mark(3).' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when a creature fails a Mind Save against one of your Dreadwyrm powers, it also gains Mark(4).' },
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },
    {
        name: "Overking's Voice",
        fluff: 'Your commands do not carry farther because they are louder. They carry farther because resistance already doubts itself.',
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 Pool on Dreadwyrm powers that use your voice, roar, or gaze.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Pool on Dreadwyrm powers that use your voice, roar, or gaze.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Pool on Dreadwyrm powers that use your voice, roar, or gaze.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Pool on Dreadwyrm powers that use your voice, roar, or gaze.' },
                specials: []
            }
        }
    },
    {
        name: 'Aura of Submission',
        fluff: 'The enemy does not merely fear you. It hesitates around everyone who stands under your shadow.',
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 2 m of you suffer −1 die on attacks that target your allies.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4 m of you suffer −2 dice on attacks that target your allies.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6 m of you suffer −3 dice on attacks that target your allies.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8 m of you suffer −4 dice on attacks that target your allies.' },
                specials: []
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: "Tyrant's Rebuke",
        fluff: 'Defiance sounds much smaller once answered.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When an enemy within range declares an attack against you or an ally.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −2 dice on the triggering attack.' },
                trigger: 'When an enemy within 8 m declares an attack against you or an ally.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −4 dice on the triggering attack.' },
                trigger: 'When an enemy within 8 m declares an attack against you or an ally.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −6 dice on the triggering attack.' },
                trigger: 'When an enemy within 12 m declares an attack against you or an ally.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −8 dice on the triggering attack.' },
                trigger: 'When an enemy within 12 m declares an attack against you or an ally.',
                specials: []
            }
        }
    },
    {
        name: 'Command Denial',
        fluff: "You answer the enemy's intent before their body can finish carrying it out.",
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When an enemy within range begins a movement or utility action.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −2 dice on the triggering roll or check.' },
                trigger: 'When an enemy within 8 m begins a movement or utility action.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −4 dice on the triggering roll or check.' },
                trigger: 'When an enemy within 8 m begins a movement or utility action.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −6 dice on the triggering roll or check.' },
                trigger: 'When an enemy within 12 m begins a movement or utility action.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'That enemy must pass a Mind Save or suffer −8 dice on the triggering roll or check.' },
                trigger: 'When an enemy within 12 m begins a movement or utility action.',
                specials: []
            }
        }
    },
    {
        name: 'Roar of Defiance',
        fluff: 'Your roar can be a threat to the enemy and a spine for your own in the same breath.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When an ally within range misses an attack or fails a check.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +2 Attack Dice or +2 dice on its next relevant roll before the end of its next turn.' },
                trigger: 'When an ally within 6 m misses an attack or fails a check.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +4 Attack Dice or +4 dice on its next relevant roll before the end of its next turn.' },
                trigger: 'When an ally within 6 m misses an attack or fails a check.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +6 Attack Dice or +6 dice on its next relevant roll before the end of its next turn.' },
                trigger: 'When an ally within 8 m misses an attack or fails a check.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'That ally gains +8 Attack Dice or +8 dice on its next relevant roll before the end of its next turn.' },
                trigger: 'When an ally within 8 m misses an attack or fails a check.',
                specials: []
            }
        }
    },
    {
        name: "Herald's Mark",
        fluff: 'You do not merely identify the target. You announce it to the war.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When a creature within range fails a Mind Save against one of your Dreadwyrm powers.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Allies gain +2 Attack Dice against that creature until the end of your next turn.' },
                trigger: 'When a creature within 12 m fails a Mind Save against one of your Dreadwyrm powers.',
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Allies gain +4 Attack Dice against that creature until the end of your next turn.' },
                trigger: 'When a creature within 16 m fails a Mind Save against one of your Dreadwyrm powers.',
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Allies gain +6 Attack Dice against that creature until the end of your next turn.' },
                trigger: 'When a creature within 20 m fails a Mind Save against one of your Dreadwyrm powers.',
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 24 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Allies gain +8 Attack Dice against that creature until the end of your next turn.' },
                trigger: 'When a creature within 24 m fails a Mind Save against one of your Dreadwyrm powers.',
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: "Tyrant's Roar",
        fluff: 'It is impossible to hear the roar and still believe this fight belongs to anyone else.',
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
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +2 Attack Dice. Enemies in the area suffer −1 die on attacks.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +4 Attack Dice. Enemies in the area suffer −2 dice on attacks.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +6 Attack Dice. Enemies in the area suffer −3 dice on attacks.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 10 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +8 Attack Dice. Enemies in the area suffer −4 dice on attacks.' },
                specials: []
            }
        }
    },
    {
        name: 'Aura of Command',
        fluff: 'Under your command, hesitation becomes obedience and obedience becomes momentum.',
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
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +2 dice on checks or saves against fear, charm, or hesitation effects.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +4 dice on checks or saves against fear, charm, or hesitation effects.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +6 dice on checks or saves against fear, charm, or hesitation effects.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 10 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +8 dice on checks or saves against fear, charm, or hesitation effects.' },
                specials: []
            }
        }
    },
    {
        name: 'Nightmare Presence',
        fluff: 'You stop feeling like a combatant and start feeling like the nightmare that owns one.',
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
                effect: { text: 'Enemies take −2 dice on Mind Saves against your Dreadwyrm powers.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Enemies take −4 dice on Mind Saves against your Dreadwyrm powers.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Enemies take −6 dice on Mind Saves against your Dreadwyrm powers.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Enemies take −8 dice on Mind Saves against your Dreadwyrm powers.' },
                specials: []
            }
        }
    },
    {
        name: 'Hunt Decree',
        fluff: 'Once you name the prey, everyone under your command understands the assignment.',
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
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +2 Attack Dice against creatures with Mark from you.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +4 Attack Dice against creatures with Mark from you.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +6 Attack Dice against creatures with Mark from you.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 10 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Allies in the area gain +8 Attack Dice against creatures with Mark from you.' },
                specials: []
            }
        }
    },

    // ─── Movement ───────────────────────────────────────────────────────────
    {
        name: 'Wingbeat of Terror',
        fluff: 'A single wingbeat is enough to change both the geometry and the courage of a room.',
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
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 4 m. Enemies adjacent to you must pass a Mind Save or suffer −1 die on attacks until the end of their next turn.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 8 m. Enemies adjacent to you must pass a Mind Save or suffer −2 dice on attacks until the end of their next turn.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 12 m. Enemies adjacent to you must pass a Mind Save or suffer −3 dice on attacks until the end of their next turn.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 16 m. Enemies adjacent to you must pass a Mind Save or suffer −4 dice on attacks until the end of their next turn.' },
                specials: []
            }
        }
    },
    {
        name: 'Imperious Advance',
        fluff: 'You do not rush. You advance as though the battlefield should already have made room.',
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
                effect: { text: 'Move up to 5 m. Until the end of the round, enemies adjacent to you suffer −1 die on attacks against your allies.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10 m. Until the end of the round, enemies adjacent to you suffer −2 dice on attacks against your allies.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 15 m. Until the end of the round, enemies adjacent to you suffer −3 dice on attacks against your allies.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 20 m. Until the end of the round, enemies adjacent to you suffer −4 dice on attacks against your allies.' },
                specials: []
            }
        }
    }
];

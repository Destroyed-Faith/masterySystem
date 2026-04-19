/**
 * Warden Dragon Mastery Tree Powers
 *
 * Theme: A colossal draconic bulwark that holds critical space through natural armor,
 * structural durability, and punishing close-range control.
 * Role: Tank / Control / Space Holder
 * Primary Attribute: Might
 * Primary Specials: Push, Prone • Secondary Axis: Armor / Body Saves
 *
 * Tree Bonus (Natural Weapons): Your natural attacks (Claws / Bite / Tail) count as melee
 * weapons. They deal 1d8 damage for every 2 Warden Dragon powers learned, up to 4d8.
 *
 * Requirement: You must be in Dragon form to use these powers. While in form you
 * cannot use weapons, armor, or shields; you rely on natural weapons, scales, wings,
 * and mass from this tree. Gated to actors with the "dragonborn" Echo.
 *
 * 18 Powers: 4 Actives, 4 Passives, 4 Reactions, 4 Active Buffs, 2 Movement.
 */
export const WARDEN_DRAGON_POWERS = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Tail Sweep',
        fluff: 'A sweeping impact that turns a frontline into open ground.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack + 1d8 damage', dice: '1d8' },
                specials: [{ key: 'push', rank: 2 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack + 1d8 damage', dice: '1d8' },
                specials: [{ key: 'push', rank: 4 }, { key: 'prone', rank: 1 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack + 2d8 damage', dice: '2d8' },
                specials: [{ key: 'push', rank: 8 }, { key: 'prone', rank: 1 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 5 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack + 3d8 damage', dice: '3d8' },
                specials: [{ key: 'push', rank: 8 }, { key: 'prone', rank: 1 }],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Earthshaker Stomp',
        fluff: 'Your full weight hits the earth like a warning no one can ignore.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'push', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'push', rank: 4 }, { key: 'prone', rank: 1 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'push', rank: 6 }, { key: 'prone', rank: 1 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in the area take 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'push', rank: 8 }, { key: 'prone', rank: 1 }]
            }
        }
    },
    {
        name: 'Bulwark Bite',
        fluff: 'Once your jaws close, momentum stops belonging to the enemy.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Bite Attack + 1d8 damage', dice: '1d8' },
                specials: [{ key: 'freeze', rank: 2 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Bite Attack + 2d8 damage', dice: '2d8' },
                specials: [{ key: 'freeze', rank: 3 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Bite Attack + 3d8 damage', dice: '3d8' },
                specials: [{ key: 'freeze', rank: 4 }],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Bite Attack + 4d8 damage', dice: '4d8' },
                specials: [{ key: 'freeze', rank: 4 }],
                mechanics: { damageRider: { flat: '+4d8' }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Bodywall Crash',
        fluff: 'You do not enter contested ground carefully. You enter it as a collapsing wall.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 4 m in a straight line, then make a body slam attack dealing 1d8 damage. Gain +1 Armor until the end of the round.', dice: '1d8' },
                specials: [{ key: 'push', rank: 2 }],
                mechanics: { armor: 1, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 6 m in a straight line, then make a body slam attack dealing 2d8 damage. Gain +1 Armor until the end of the round.', dice: '2d8' },
                specials: [{ key: 'push', rank: 4 }],
                mechanics: { armor: 1, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 8 m in a straight line, then make a body slam attack dealing 3d8 damage. Gain +2 Armor until the end of the round.', dice: '3d8' },
                specials: [{ key: 'push', rank: 6 }],
                mechanics: { armor: 2, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10 m in a straight line, then make a body slam attack dealing 4d8 damage. Gain +3 Armor until the end of the round.', dice: '4d8' },
                specials: [{ key: 'push', rank: 8 }],
                mechanics: { armor: 3, applyWhen: 'attack-rider' }
            }
        }
    },
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Dragon Scales',
        fluff: 'Every strike finds a harder angle.',
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
                effect: { text: 'Gain +2 Armor. At the start of your turn, gain 1 Temp HP from this passive (non-stacking; refreshes).' },
                specials: [],
                mechanics: { armor: 2, tempHP: '1', applyWhen: 'passive-slotted-active' }
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Armor. At the start of your turn, gain 2 Temp HP from this passive (non-stacking; refreshes).' },
                specials: [],
                mechanics: { armor: 4, tempHP: '2', applyWhen: 'passive-slotted-active' }
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Armor. At the start of your turn, gain 3 Temp HP from this passive (non-stacking; refreshes).' },
                specials: [],
                mechanics: { armor: 6, tempHP: '3', applyWhen: 'passive-slotted-active' }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Armor. At the start of your turn, gain 4 Temp HP from this passive (non-stacking; refreshes).' },
                specials: [],
                mechanics: { armor: 8, tempHP: '4', applyWhen: 'passive-slotted-active' }
            }
        }
    },
    {
        name: 'Ancient Bulk',
        fluff: 'There is simply more dragon to get through.',
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
                effect: { text: 'Gain +1 Wounded Health Bar.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +1 Injured Health Bar.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +1 Bruised Health Bar.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +1 Healthy Health Bar.' },
                specials: []
            }
        }
    },
    {
        name: 'Immovable',
        fluff: "If they want you to move, they'll need a myth.",
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
                effect: { text: 'Reduce all Push/Pull against you by 2 m (min 0). Gain +1 Armor and +1 die to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 1, saveDice: { body: 1 }, applyWhen: 'passive-slotted-active' }
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Reduce all Push/Pull against you by 4 m (min 0). Gain +2 Armor and +2 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 2, saveDice: { body: 2 }, applyWhen: 'passive-slotted-active' }
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Reduce all Push/Pull against you by 6 m (min 0). Gain +3 Armor and +3 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 3, saveDice: { body: 3 }, applyWhen: 'passive-slotted-active' }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Reduce all Push/Pull against you by 8 m (min 0). Gain +4 Armor and +4 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 4, saveDice: { body: 4 }, applyWhen: 'passive-slotted-active' }
            }
        }
    },
    {
        name: 'Territorial Presence',
        fluff: 'Ignoring you in close quarters is the first tactical mistake. Usually also the last.',
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
                effect: { text: 'Enemies within 2 m of you suffer −1 die on attacks that do not target you.' },
                specials: [],
                mechanics: { rollDice: { attack: -1 }, applyWhen: 'passive-slotted-active' }
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4 m of you suffer −2 dice on attacks that do not target you.' },
                specials: [],
                mechanics: { rollDice: { attack: -2 }, applyWhen: 'passive-slotted-active' }
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6 m of you suffer −3 dice on attacks that do not target you.' },
                specials: [],
                mechanics: { rollDice: { attack: -3 }, applyWhen: 'passive-slotted-active' }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8 m of you suffer −4 dice on attacks that do not target you.' },
                specials: [],
                mechanics: { rollDice: { attack: -4 }, applyWhen: 'passive-slotted-active' }
            }
        }
    },
    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Scale Ward',
        fluff: 'A sudden thickening, like plates sliding into place.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When you are hit by an attack, before damage is resolved.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 1d8 Temp HP and +1 Evade until the end of your next turn.', dice: '1d8' },
                trigger: 'When you are hit by an attack, before damage is resolved.',
                specials: [],
                mechanics: { evade: 1, tempHP: '1d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 2d8 Temp HP and +2 Evade until the end of your next turn.', dice: '2d8' },
                trigger: 'When you are hit by an attack, before damage is resolved.',
                specials: [],
                mechanics: { evade: 2, tempHP: '2d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 3d8 Temp HP and +3 Evade until the end of your next turn.', dice: '3d8' },
                trigger: 'When you are hit by an attack, before damage is resolved.',
                specials: [],
                mechanics: { evade: 3, tempHP: '3d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Gain 4d8 Temp HP and +4 Evade until the end of your next turn.', dice: '4d8' },
                trigger: 'When you are hit by an attack, before damage is resolved.',
                specials: [],
                mechanics: { evade: 4, tempHP: '4d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            }
        }
    },
    {
        name: 'Guarding Tail',
        fluff: 'A reflexive tail-sweep reminds the enemy there is no cheap angle around a dragon.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When an enemy enters melee with you or moves through your threatened space.',
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Tail Attack dealing damage + 1d8.', dice: '1d8' },
                trigger: 'When an enemy enters melee with you or moves through your threatened space.',
                specials: [{ key: 'push', rank: 2 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Tail Attack dealing damage + 2d8.', dice: '2d8' },
                trigger: 'When an enemy enters melee with you or moves through your threatened space.',
                specials: [{ key: 'push', rank: 4 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Tail Attack dealing damage + 3d8.', dice: '3d8' },
                trigger: 'When an enemy enters melee with you or moves through your threatened space.',
                specials: [{ key: 'push', rank: 6 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Tail Attack dealing damage + 4d8.', dice: '4d8' },
                trigger: 'When an enemy enters melee with you or moves through your threatened space.',
                specials: [{ key: 'push', rank: 8 }]
            }
        }
    },
    {
        name: 'Stand Fast',
        fluff: 'In the perfect moment, all your weight becomes refusal.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When an effect would Push, Pull, knock you Prone, or force a Body Save to move or hinder you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +2 dice to that Body Save or resistance check.' },
                trigger: 'When an effect would Push, Pull, knock you Prone, or force a Body Save to move or hinder you.',
                specials: [],
                mechanics: { saveDice: { body: 2 }, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +4 dice to that Body Save or resistance check.' },
                trigger: 'When an effect would Push, Pull, knock you Prone, or force a Body Save to move or hinder you.',
                specials: [],
                mechanics: { saveDice: { body: 4 }, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +6 dice to that Body Save or resistance check.' },
                trigger: 'When an effect would Push, Pull, knock you Prone, or force a Body Save to move or hinder you.',
                specials: [],
                mechanics: { saveDice: { body: 6 }, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +8 dice to that Body Save or resistance check.' },
                trigger: 'When an effect would Push, Pull, knock you Prone, or force a Body Save to move or hinder you.',
                specials: [],
                mechanics: { saveDice: { body: 8 }, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            }
        }
    },
    {
        name: 'Interposing Frame',
        fluff: "A dragon's frame is not subtle protection. It is total obstruction.",
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When an ally within range of you is hit by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may shift into adjacency to that ally. That ally gains 1d8 Temp HP against the triggering hit.', dice: '1d8' },
                trigger: 'When an ally within 2 m of you is hit by an attack.',
                specials: [],
                mechanics: { tempHP: '1d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may shift into adjacency to that ally. That ally gains 2d8 Temp HP against the triggering hit.', dice: '2d8' },
                trigger: 'When an ally within 4 m of you is hit by an attack.',
                specials: [],
                mechanics: { tempHP: '2d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may shift into adjacency to that ally. That ally gains 3d8 Temp HP against the triggering hit.', dice: '3d8' },
                trigger: 'When an ally within 4 m of you is hit by an attack.',
                specials: [],
                mechanics: { tempHP: '3d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may shift into adjacency to that ally. That ally gains 4d8 Temp HP against the triggering hit.', dice: '4d8' },
                trigger: 'When an ally within 6 m of you is hit by an attack.',
                specials: [],
                mechanics: { tempHP: '4d8', applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            }
        }
    },
    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Fortress Form',
        fluff: 'Plates lock. Breath slows. The dragon becomes a fortress with a heartbeat.',
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
                effect: { text: 'Gain +3 Armor and +2 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 3, saveDice: { body: 2 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +5 Armor and +4 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 5, saveDice: { body: 4 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +7 Armor and +6 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 7, saveDice: { body: 6 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +9 Armor and +8 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 9, saveDice: { body: 8 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    },
    {
        name: 'Rooted Majesty',
        fluff: "As long as your will is fixed, your body refuses the world's momentum.",
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
                effect: { text: 'Reduce all Push/Pull against you by 4 m. Gain +2 Armor and +2 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 2, saveDice: { body: 2 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Reduce all Push/Pull against you by 8 m. Gain +3 Armor and +4 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 3, saveDice: { body: 4 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Reduce all Push/Pull against you by 12 m. Gain +4 Armor and +6 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 4, saveDice: { body: 6 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Reduce all Push/Pull against you by 16 m. Gain +5 Armor and +8 dice to Body Saving Throws.' },
                specials: [],
                mechanics: { armor: 5, saveDice: { body: 8 }, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    },
    {
        name: 'Siegeblood',
        fluff: 'Your blood remembers every siege your kind ever endured.',
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
                effect: { text: 'Gain Regeneration(3) and +3 dice to Body Saving Throws.' },
                specials: [{ key: 'regeneration', rank: 3 }],
                mechanics: { saveDice: { body: 3 }, regen: 3, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Regeneration(4) and +5 dice to Body Saving Throws.' },
                specials: [{ key: 'regeneration', rank: 4 }],
                mechanics: { saveDice: { body: 5 }, regen: 4, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Regeneration(5) and +7 dice to Body Saving Throws.' },
                specials: [{ key: 'regeneration', rank: 5 }],
                mechanics: { saveDice: { body: 7 }, regen: 5, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Regeneration(6) and +9 dice to Body Saving Throws.' },
                specials: [{ key: 'regeneration', rank: 6 }],
                mechanics: { saveDice: { body: 9 }, regen: 6, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    },
    {
        name: 'Throne Ground',
        fluff: 'This ground is not difficult. It is claimed.',
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
                aoe: { shape: 'aura', radiusM: 2 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'The first time each round an enemy enters the area, it must pass a Body Save or its movement immediately ends.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'The first time each round an enemy enters the area, it must pass a Body Save or its movement immediately ends. On a success, its Speed is reduced by 2 m until the end of the turn.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'The first time each round an enemy enters the area, it must pass a Body Save or its movement immediately ends. On a success, its Speed is reduced by 4 m until the end of the turn.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'The first time each round an enemy enters the area, it must pass a Body Save or its movement immediately ends. On a success, its Speed is reduced by 6 m until the end of the turn.' },
                specials: []
            }
        }
    },
    // ─── Movement ───────────────────────────────────────────────────────────
    {
        name: 'Wing Brace',
        fluff: 'A short shift, a hard brace, and the line is yours again.',
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
                effect: { text: 'Reposition up to 4 m. Gain +3 dice to the next Body Save you make before the end of the round.' },
                specials: [],
                mechanics: { saveDice: { body: 3 }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 8 m. Gain +6 dice to the next Body Save you make before the end of the round.' },
                specials: [],
                mechanics: { saveDice: { body: 6 }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 12 m. Gain +9 dice to the next Body Save you make before the end of the round.' },
                specials: [],
                mechanics: { saveDice: { body: 9 }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Reposition up to 16 m. Gain +12 dice to the next Body Save you make before the end of the round.' },
                specials: [],
                mechanics: { saveDice: { body: 12 }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Stonewing Advance',
        fluff: 'You advance like a gatehouse being dragged into place.',
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
                effect: { text: 'Move up to 5 m. The first enemy you contact during this movement must pass a Body Save or be moved aside.' },
                specials: [{ key: 'push', rank: 4 }]
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10 m. The first enemy you contact during this movement must pass a Body Save or be moved aside.' },
                specials: [{ key: 'push', rank: 8 }]
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 15 m. The first enemy you contact during this movement must pass a Body Save or be moved aside.' },
                specials: [{ key: 'push', rank: 12 }]
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 20 m. The first enemy you contact during this movement must pass a Body Save or be moved aside.' },
                specials: [{ key: 'push', rank: 16 }]
            }
        }
    }
];
//# sourceMappingURL=warden-dragon.js.map
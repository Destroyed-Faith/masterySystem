/**
 * Grim Hunter Mastery Tree Powers
 */
export const GRIM_HUNTER_POWERS = [
    {
        name: 'Hunter\'s Slash',
        tree: 'Grim Hunter',
        powerType: 'active',
        description: 'A quick blade strike aimed at an exposed mark.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Crit(1) if target is Marked', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Crit(1) if target is Marked', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Crit(1) if target is Marked', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Crit(1) if target is Marked', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Mark the Prey',
        tree: 'Grim Hunter',
        powerType: 'active',
        description: 'You brand a foe for death — everything after gets easier.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Mark(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Mark(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Mark(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Mark(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Flash Bomb',
        tree: 'Grim Hunter',
        powerType: 'active',
        description: 'A searing burst of light that overwhelms the senses.',
        levels: [
            { level: 1, type: 'Active', range: '6m (thrown)', aoe: 'Radius 2m', duration: 'MR Rounds + 1', effect: '—', special: 'Blinded(1)', cost: { action: true } },
            { level: 2, type: 'Active', range: '6m (thrown)', aoe: 'Radius 6m', duration: 'MR Rounds + 2', effect: '—', special: 'Blinded(2)', cost: { action: true } },
            { level: 3, type: 'Active', range: '6m (thrown)', aoe: 'Radius 6m', duration: 'MR Rounds + 4', effect: '—', special: 'Blinded(4)', cost: { action: true } },
            { level: 4, type: 'Active', range: '6m (thrown)', aoe: 'Radius 8m', duration: 'MR Rounds + 5', effect: '—', special: 'Blinded(5)', cost: { action: true } }
        ]
    },
    {
        name: 'Relentless Weapons',
        tree: 'Grim Hunter',
        powerType: 'active',
        description: 'At breath distance, your shots and blades become executions.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '1d8 damage (+1d8 if target < 5 m)', special: 'Penetration(1)', cost: { action: true }, roll: { damage: '1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: '8m', duration: 'Instant', effect: '2d8 damage (+1d8 if target < 5 m)', special: 'Penetration(2)', cost: { action: true }, roll: { damage: '2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: '8m', duration: 'Instant', effect: '3d8 damage (+2d8 if target < 5 m)', special: 'Penetration(3)', cost: { action: true }, roll: { damage: '3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: '8m', duration: 'Instant', effect: '4d8 damage (+2d8 if target < 5 m)', special: 'Penetration(4)', cost: { action: true }, roll: { damage: '4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Predictable Movement',
        tree: 'Grim Hunter',
        powerType: 'buff',
        description: 'You read your quarry\'s tells and are simply not where they swing.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', aoe: '4m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +2 Armor and +4 Evade.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', aoe: '8m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +4 Armor and +6 Evade.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', aoe: '12m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +6 Armor and +8 Evade.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', aoe: '16m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +8 Armor and +12 Evade.', cost: { action: true } }
        ]
    },
    {
        name: 'Quickdraw',
        tree: 'Grim Hunter',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Your hand moves twice before anyone else moves once.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +4 Initiative. If you act first in a round, your first attack this turn gains Extra Attack(1, 0.25) — one extra strike at ¼ Attack Pool.' },
            { level: 2, type: 'Passive', effect: 'Gain +8 Initiative. If you act first, your first attack this turn gains Extra Attack(2, 0.5) — one extra strike at ½ Attack Pool.' },
            { level: 3, type: 'Passive', effect: 'Gain +12 Initiative. If you act first, your first attack this turn gains Extra Attack(2, 0.5) — one extra strike at ½ Attack Pool.' },
            { level: 4, type: 'Passive', effect: 'Gain +16 Initiative. If you act first, your first attack this turn gains Extra Attack(3, 0.75) — one extra strike at ¾ Attack Pool.' }
        ]
    },
    {
        name: 'Sneak Attack',
        tree: 'Grim Hunter',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'A moment of ruthless precision before the killing blow.',
        levels: [
            { level: 1, type: 'Passive', effect: 'If the target is Distracted (Flanked, Blinded, Marked, or Disoriented), your attacks this round gain +1d8 damage and Crit(1).' },
            { level: 2, type: 'Passive', effect: 'As above, but +2d8 damage and Crit(1).' },
            { level: 3, type: 'Passive', effect: 'As above, but +3d8 damage and Crit(2).' },
            { level: 4, type: 'Passive', effect: 'As above, but +3d8 damage and Crit(2).' }
        ]
    },
    {
        name: 'Bloodhound',
        tree: 'Grim Hunter',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'You track your marked prey with unerring precision.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You gain +1 Attack Die against Marked targets.' },
            { level: 2, type: 'Passive', effect: 'You gain +2 Attack Dice against Marked targets.' },
            { level: 3, type: 'Passive', effect: 'You gain +4 Attack Dice against Marked targets.' },
            { level: 4, type: 'Passive', effect: 'You gain +5 Attack Dice against Marked targets.' }
        ]
    }
];
//# sourceMappingURL=grim-hunter.js.map
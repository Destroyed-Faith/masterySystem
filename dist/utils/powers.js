/**
 * Powers configuration for Mastery System
 * All powers organized by Mastery Tree
 */
export const POWERS = {
    'Crusader': [
        {
            name: 'Overhead Blow',
            tree: 'Crusader',
            description: 'A crushing strike that shatters shields and drives foes back, best used to peel enemies off allies or push them from key positions.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Push(2)' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Push(4)' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Push(8)' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', special: 'Push(16)' }
            ]
        },
        {
            name: 'Smiting Arc',
            tree: 'Crusader',
            description: 'A radiant arc of steel that cleaves through darkness and sin alike, best used when several foes stand before you in a tight line or choke point.',
            levels: [
                { level: 1, type: 'Melee', range: '2 m', aoe: 'Cone 90°, 2 m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Smite(1)' },
                { level: 2, type: 'Melee', range: '4 m', aoe: 'Cone 90°, 4 m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Smite(1)' },
                { level: 3, type: 'Melee', range: '8 m', aoe: 'Cone 90°, 6 m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Smite(2)' },
                { level: 4, type: 'Melee', range: '16 m', aoe: 'Cone 90°, 8 m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Smite(2)' }
            ]
        },
        {
            name: 'Smashing Blow',
            tree: 'Crusader',
            description: 'A brutal impact meant to break stance and bone, best used to stop a single threat from advancing or to set up focused attacks from your allies.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: '—' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Prone(1)' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Prone(1)' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Prone(2)' }
            ]
        },
        {
            name: 'Shield Crush',
            tree: 'Crusader',
            description: 'You slam your shield forward, crushing both body and will, best used to stun priority targets right before they can unleash their most dangerous actions.',
            levels: [
                { level: 1, type: 'Melee', range: '—', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: '—' },
                { level: 2, type: 'Melee', range: '—', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Stunned(1)' },
                { level: 3, type: 'Melee', range: '—', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage; gain +2 Armor vs that enemy until your next turn', special: 'Stunned(1)' },
                { level: 4, type: 'Melee', range: '—', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage; gain +2 Armor vs that enemy until your next turn', special: 'Stunned(2)' }
            ]
        },
        {
            name: 'Inspiring Cry',
            tree: 'Crusader',
            description: 'A battle cry that restores faith and drives away corruption, best used to stabilize your group after heavy damage or when debilitating effects start to stack.',
            levels: [
                { level: 1, type: 'Utility', range: 'Self', aoe: 'Radius 2 m', duration: 'Instant', effect: 'Heal allies for 1d8 HP', special: '—' },
                { level: 2, type: 'Utility', range: 'Self', aoe: 'Radius 4 m', duration: 'Instant', effect: 'Heal allies for 2d8 HP', special: 'Cleanse(1)' },
                { level: 3, type: 'Utility', range: 'Self', aoe: 'Radius 6 m', duration: 'Instant', effect: 'Heal allies for 2d8 HP', special: 'Cleanse(1)' },
                { level: 4, type: 'Utility', range: 'Self', aoe: 'Radius 8 m', duration: 'Instant', effect: 'Heal allies for 2d8 HP', special: 'Cleanse(1)' }
            ]
        },
        {
            name: 'Unbreakable Vow',
            tree: 'Crusader',
            description: 'An oath of defiance that hardens flesh and faith alike, best used at the start of major clashes or whenever you must hold a line against superior numbers.',
            levels: [
                { level: 1, type: 'Buff', range: 'Self', aoe: 'Radius 2 m', duration: 'Mastery Rank Rounds', effect: 'Gain +4 Armor', special: '—' },
                { level: 2, type: 'Buff', range: 'Self', aoe: 'Radius 2 m', duration: 'Mastery Rank Rounds', effect: 'Gain +6 Armor and become Immovable', special: '—' },
                { level: 3, type: 'Buff', range: 'Self', aoe: 'Radius 4 m', duration: 'Mastery Rank Rounds', effect: 'Gain +8 Armor and become Immovable', special: '—' },
                { level: 4, type: 'Buff', range: 'Self', aoe: 'Radius 8 m', duration: 'Mastery Rank Rounds', effect: 'Gain +10 Armor and become Immovable', special: '—' }
            ]
        },
        {
            name: 'Bolster',
            tree: 'Crusader',
            description: 'Your presence steels hearts and sharpens reflexes, best used when you stay close to as many allies as possible to maximize their Evade and Saves.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and allies within 2 m gain +1 Evade and +1 Save Die.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and allies within 4 m gain +3 Evade and +1 Save Die.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and allies within 6 m gain +3 Evade and +2 Save Dice.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and allies within 8 m gain +5 Evade and +2 Save Dice.', special: '—' }
            ]
        },
        {
            name: 'Hold the Line',
            tree: 'Crusader',
            description: 'You anchor the line no ally falls while you stand, best used to protect the most exposed frontline partner or a critical fragile ally fighting beside you.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and one ally within 2 m gain +1 Armor.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and one ally within 4 m gain +2 Armor.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and one ally within 6 m gain +4 Armor.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You and one ally within 8 m gain +6 Armor.', special: '—' }
            ]
        }
    ],
    'Juggernaut': [
        {
            name: 'Iron Slam',
            tree: 'Juggernaut',
            description: 'A piledriver smash that sends bodies flying, best used to punt foes off objectives or drive them back through their own ranks.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Push(2)' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Push(8)' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Push(8), Prone(1)' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Push(12), Prone(1)' }
            ]
        },
        {
            name: 'Earthshaker Stomp',
            tree: 'Juggernaut',
            description: 'You quake the ground so nearby foes buckle and fall, best used when you are surrounded or want to stop a charge in place.',
            levels: [
                { level: 1, type: 'Melee', range: 'Self', aoe: 'Radius 2 m', duration: 'Instant', effect: 'Weapon DMG (no bonus dice)', special: 'Prone(1)' },
                { level: 2, type: 'Melee', range: 'Self', aoe: 'Radius 4 m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Prone(1)' },
                { level: 3, type: 'Melee', range: 'Self', aoe: 'Radius 6 m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Prone(1)' },
                { level: 4, type: 'Melee', range: 'Self', aoe: 'Radius 8 m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Prone(1)' }
            ]
        },
        {
            name: 'Trample',
            tree: 'Juggernaut',
            description: 'You surge forward as living siege anything in your path is crushed, best used to cross the battlefield, clip multiple enemies and trigger your movement-based passives. Replaces your Movement this round; does not provoke Reactions.',
            levels: [
                { level: 1, type: 'Movement', range: '—', aoe: 'Line 4 m', duration: 'Instant', effect: 'Creatures you pass through take 1d8 damage (once per creature)', special: '—' },
                { level: 2, type: 'Movement', range: '—', aoe: 'Line 8 m', duration: 'Instant', effect: 'Creatures you pass through take 1d8 damage (once per creature)', special: '—' },
                { level: 3, type: 'Movement', range: '—', aoe: 'Line 12 m', duration: 'Instant', effect: 'Creatures you pass through take 2d8 damage (once per creature)', special: '—' },
                { level: 4, type: 'Movement', range: '—', aoe: 'Line 16 m', duration: 'Instant', effect: 'Creatures you pass through take 2d8 damage (once per creature)', special: '—' }
            ]
        },
        {
            name: 'Juggernaut Shockline',
            tree: 'Juggernaut',
            description: 'A rending shockwave tears a straight path through the battle line, best used to soften clustered enemies or carve a corridor for your allies.',
            levels: [
                { level: 1, type: 'Ranged', range: 'Self', aoe: 'Line 6 m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: '—' },
                { level: 2, type: 'Ranged', range: 'Self', aoe: 'Line 10 m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: '—' },
                { level: 3, type: 'Ranged', range: 'Self', aoe: 'Line 12 m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: '—' },
                { level: 4, type: 'Ranged', range: 'Self', aoe: 'Line 14 m', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', special: '—' }
            ]
        },
        {
            name: 'Momentum',
            tree: 'Juggernaut',
            description: 'Your strikes hit harder once you\'ve built speed, best used when you chain long advances into heavy attacks every round.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'If you move ≥ 6 m in a straight line and end in an attack this turn, your attacks gain +1d8 damage this turn.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but +2d8 damage.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but +3d8 damage.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but +4d8 damage.', special: '—' }
            ]
        },
        {
            name: 'Immovable Object',
            tree: 'Juggernaut',
            description: 'Once you commit, nothing throws you off balance, best used when you expect heavy control effects as you crash through enemy lines.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'If you move ≥ 6 m in a straight line and end in an attack, you are immune to Prone until your next turn and heal 1d8 at the start of your next turn.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but also immune to Push until your next turn (still heal 1d8).', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but also immune to Entangled; heal 2d8 at the start of your next turn.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but also immune to Stunned; heal 2d8 at the start of your next turn.', special: '—' }
            ]
        }
    ],
    'Grim Hunter': [
        {
            name: 'Hunter\'s Slash',
            tree: 'Grim Hunter',
            description: 'A quick blade strike aimed at an exposed mark.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Crit(1) if target is Marked' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Crit(1) if target is Marked' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Crit(1) if target is Marked' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Crit(1) if target is Marked' }
            ]
        },
        {
            name: 'Mark the Prey',
            tree: 'Grim Hunter',
            description: 'You brand a foe for death — everything after gets easier.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Mark(1)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Mark(2)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Mark(3)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Mark(4)' }
            ]
        },
        {
            name: 'Flash Bomb',
            tree: 'Grim Hunter',
            description: 'A searing burst of light that overwhelms the senses.',
            levels: [
                { level: 1, type: 'Ranged', range: '6 m (thrown)', aoe: 'Radius 2 m', duration: 'MR Rounds + 1', effect: '—', special: 'Blinded(1)' },
                { level: 2, type: 'Ranged', range: '6 m (thrown)', aoe: 'Radius 6 m', duration: 'MR Rounds + 2', effect: '—', special: 'Blinded(2)' },
                { level: 3, type: 'Ranged', range: '6 m (thrown)', aoe: 'Radius 6 m', duration: 'MR Rounds + 4', effect: '—', special: 'Blinded(4)' },
                { level: 4, type: 'Ranged', range: '6 m (thrown)', aoe: 'Radius 8 m', duration: 'MR Rounds + 5', effect: '—', special: 'Blinded(5)' }
            ]
        },
        {
            name: 'Relentless Weapons',
            tree: 'Grim Hunter',
            description: 'At breath distance, your shots and blades become executions.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: '—', duration: 'Instant', effect: '1d8 damage (+1d8 if target < 5 m)', special: 'Penetration(1)' },
                { level: 2, type: 'Ranged', range: '8 m', aoe: '—', duration: 'Instant', effect: '2d8 damage (+1d8 if target < 5 m)', special: 'Penetration(2)' },
                { level: 3, type: 'Ranged', range: '8 m', aoe: '—', duration: 'Instant', effect: '3d8 damage (+2d8 if target < 5 m)', special: 'Penetration(3)' },
                { level: 4, type: 'Ranged', range: '8 m', aoe: '—', duration: 'Instant', effect: '4d8 damage (+2d8 if target < 5 m)', special: 'Penetration(4)' }
            ]
        },
        {
            name: 'Predictable Movement',
            tree: 'Grim Hunter',
            description: 'You read your quarry\'s tells and are simply not where they swing.',
            levels: [
                { level: 1, type: 'Buff', range: 'Self', aoe: '4 m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +2 Armor and +4 Evade.', special: '—' },
                { level: 2, type: 'Buff', range: 'Self', aoe: '8 m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +4 Armor and +6 Evade.', special: '—' },
                { level: 3, type: 'Buff', range: 'Self', aoe: '12 m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +6 Armor and +8 Evade.', special: '—' },
                { level: 4, type: 'Buff', range: 'Self', aoe: '16 m', duration: 'MR Rounds', effect: 'Against Marked enemies\' attacks: gain +8 Armor and +12 Evade.', special: '—' }
            ]
        },
        {
            name: 'Quickdraw',
            tree: 'Grim Hunter',
            description: 'Your hand moves twice before anyone else moves once.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +4 Initiative. If you act first in a round, your first attack this turn gains Extra Attack(1, 0.25) — one extra strike at ¼ Attack Pool.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +8 Initiative. If you act first, your first attack this turn gains Extra Attack(2, 0.5) — one extra strike at ½ Attack Pool.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +12 Initiative. If you act first, your first attack this turn gains Extra Attack(2, 0.5) — one extra strike at ½ Attack Pool.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +16 Initiative. If you act first, your first attack this turn gains Extra Attack(3, 0.75) — one extra strike at ¾ Attack Pool.', special: '—' }
            ]
        },
        {
            name: 'Sneak Attack',
            tree: 'Grim Hunter',
            description: 'A moment of ruthless precision before the killing blow.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'If the target is Distracted (Flanked, Blinded, Marked, or Disoriented), your attacks this round gain +1d8 damage and Crit(1).', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but +2d8 damage and Crit(1).', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but +3d8 damage and Crit(2).', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but +3d8 damage and Crit(2).', special: '—' }
            ]
        },
        {
            name: 'Bloodhound',
            tree: 'Grim Hunter',
            description: 'You gain enhanced attack dice against marked targets.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You gain +1 Attack Die against Marked targets', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You gain +2 Attack Die against Marked targets', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You gain +4 Attack Die against Marked targets', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'You gain +5 Attack Die against Marked targets', special: '—' }
            ]
        }
    ],
    'Berserker of the Blood Moon': [
        {
            name: 'Rending Strike',
            tree: 'Berserker of the Blood Moon',
            description: 'A vicious swing that tears flesh and armor, best used to stack high Bleeding on a single priority target and fuel your blood-based passives.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(1)' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Bleeding(5)' }
            ]
        },
        {
            name: 'Leaping Cleave',
            tree: 'Berserker of the Blood Moon',
            description: 'Leap into the fray and cut down foes in a brutal arc, best used to dive into clustered enemies and spread Bleeding across multiple targets at once.',
            levels: [
                { level: 1, type: 'Melee', range: 'Self', aoe: 'Radius 1 m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Bleeding(1)' },
                { level: 2, type: 'Melee', range: 'Self', aoe: 'Radius 2 m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(2)' },
                { level: 3, type: 'Melee', range: 'Self', aoe: 'Radius 4 m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)' },
                { level: 4, type: 'Melee', range: 'Self', aoe: 'Radius 6 m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)' }
            ]
        },
        {
            name: 'Reckless Attack',
            tree: 'Berserker of the Blood Moon',
            description: 'You throw caution aside and swing with brutal abandon, best used when a massive damage spike can finish a key foe or turn the fight in your favor. After resolving this attack, until the start of your next turn, attacks against you have Advantage.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: '—' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', special: '—' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 8d8 damage', special: '—' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 10d8 damage', special: '—' }
            ]
        },
        {
            name: 'Rage of the Blood Moon',
            tree: 'Berserker of the Blood Moon',
            description: 'You let your own blood feed the fury, best used at the start of drawn-out melees where you can afford to trade your own HP for overwhelming damage every round.',
            levels: [
                { level: 1, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Gain +3d8 damage, suffer Bleeding(1) (self) per Attack', special: '—' },
                { level: 2, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Gain +6d8 damage, suffer Bleeding(2) (self) per Attack', special: '—' },
                { level: 3, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Gain +8d8 damage, suffer Bleeding(3) (self) per Attack', special: '—' },
                { level: 4, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Gain +10d8 damage, suffer Bleeding(4) (self) per Attack', special: '—' }
            ]
        },
        {
            name: 'Brutal Howl',
            tree: 'Berserker of the Blood Moon',
            description: 'A primal scream that shakes enemy resolve, best used to blunt incoming damage from groups or to break the will of weaker foes before you close in.',
            levels: [
                { level: 1, type: 'Utility', range: 'Self', aoe: 'Radius 2 m', duration: '1 Round', effect: 'Enemies in radius suffer -1 Attack Die until your next turn', special: '—' },
                { level: 2, type: 'Utility', range: 'Self', aoe: 'Radius 4 m', duration: '1 Round', effect: 'Enemies suffer -1 Attack Die until your next turn', special: 'Frightened(1)' },
                { level: 3, type: 'Utility', range: 'Self', aoe: 'Radius 6 m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)' },
                { level: 4, type: 'Utility', range: 'Self', aoe: 'Radius 8 m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)' }
            ]
        },
        {
            name: 'Bloodlust',
            tree: 'Berserker of the Blood Moon',
            description: 'The scent of blood drives you deeper into frenzy, best used when you stay close to already Bleeding enemies so every swing benefits from the extra damage.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy within 2 m is Bleeding, your attacks gain +3d8 damage.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy within 4 m is Bleeding, your attacks gain +4d8 damage.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy within 6 m is Bleeding, your attacks gain +5d8 damage.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy within 8 m is Bleeding, your attacks gain +6d8 damage.', special: '—' }
            ]
        },
        {
            name: 'Blood Feast',
            tree: 'Berserker of the Blood Moon',
            description: 'Your wounds knit as enemy blood spatters the ground, best used when you remain in the thick of bleeding foes so your regeneration can keep pace with the punishment you take.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy or you within 2 m is Bleeding, gain Regeneration(5).', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy or you within 4 m is Bleeding, gain Regeneration(6).', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy or you within 6 m is Bleeding, gain Regeneration(7).', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any enemy or you within 8 m is Bleeding, gain Regeneration(8).', special: '—' }
            ]
        }
    ],
    'Wild Stalker': [
        {
            name: 'Shackles',
            tree: 'Wild Stalker',
            description: 'A binding attack that roots enemies in place.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Entangled(2)' },
                { level: 2, type: 'Ranged', range: '16 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Entangled(3)' },
                { level: 3, type: 'Ranged', range: '24 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Entangled(4)' },
                { level: 4, type: 'Ranged', range: '32 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Entangled(5), Prone(1)' }
            ]
        },
        {
            name: 'Verdant Shackles',
            tree: 'Wild Stalker',
            description: 'An area effect that roots multiple enemies.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: 'R 2 m', duration: '1 R', effect: 'Weapon DMG', special: 'Entangled(1)' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: 'R 3 m', duration: '1 R', effect: 'Weapon DMG + 1d8 damage', special: 'Entangled(2)' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: 'R 4 m', duration: '1 R', effect: 'Weapon DMG + 2d8 damage', special: 'Entangled(3)' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: 'R 4 m', duration: '1 R', effect: 'Weapon DMG + 3d8 damage', special: 'Entangled(4)' }
            ]
        },
        {
            name: 'Panic in Their Eyes',
            tree: 'Wild Stalker',
            description: 'A strike that terrifies entangled enemies.',
            levels: [
                { level: 1, type: 'Ranged', range: '8 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Frightened(2) if target is Entangled' },
                { level: 2, type: 'Ranged', range: '12 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Frightened(3) if Entangled' },
                { level: 3, type: 'Ranged', range: '16 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Frightened(4) if Entangled' },
                { level: 4, type: 'Ranged', range: '20 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Frightened(5) if Entangled' }
            ]
        },
        {
            name: 'Predator\'s Gaze',
            tree: 'Wild Stalker',
            description: 'A buff that enhances attacks against frightened enemies.',
            levels: [
                { level: 1, type: 'Active Buff', range: 'Self', aoe: '—', duration: 'Mastery Rounds', effect: 'vs Frightened: -4 Evade + +1d8 damage.', special: '—' },
                { level: 2, type: 'Active Buff', range: 'Self', aoe: '—', duration: 'Mastery Rounds', effect: 'vs Frightened: -6 Ev + 2d8 damage.', special: '—' },
                { level: 3, type: 'Active Buff', range: 'Self', aoe: '—', duration: 'Mastery Rounds', effect: 'vs Frightened: -8 Ev + 3d8 damage + Crit(1).', special: '—' },
                { level: 4, type: 'Active Buff', range: 'Self', aoe: '—', duration: 'Mastery Rounds', effect: 'vs Frightened: -10 Ev + 4d8 damage + Crit(2).', special: '—' }
            ]
        },
        {
            name: 'Bullseye',
            tree: 'Wild Stalker',
            description: 'A precision finisher for controlled targets.',
            levels: [
                { level: 1, type: 'Ranged', range: 'Weapon', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Penetration(1) + Crit(1) if target is Entangled or Frightened' },
                { level: 2, type: 'Ranged', range: 'Weapon', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Penetration(2) + Crit(1) if Ent/Fri' },
                { level: 3, type: 'Ranged', range: 'Weapon', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Penetration(3) + Crit(1) if Ent/Fri' },
                { level: 4, type: 'Ranged', range: 'Weapon', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Penetration(4) + Crit(1) if Ent/Fri' }
            ]
        },
        {
            name: 'Green Hell',
            tree: 'Wild Stalker',
            description: 'A passive that spreads fear when hidden.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'End of your turn: if you were Hidden and you dealt damage or applied Entangle, one affected enemy becomes Frightened(2).', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, plus Expose(1).', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but Frightened(4) and Expose(4).', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, but Frightened(5) and Expose(6).', special: '—' }
            ]
        },
        {
            name: 'Camouflage',
            tree: 'Wild Stalker',
            description: 'Enhanced evade while hidden.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While Hidden, gain +4 Evade.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While Hidden, gain +8 Evade.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While Hidden, gain +13 Evade.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While Hidden, gain +17 Evade.', special: '—' }
            ]
        },
        {
            name: 'Not Here!',
            tree: 'Wild Stalker',
            description: 'Enhanced concealment and initiative.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +3 Concealment and +4 Initiative.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +6 Concealment and +8 Initiative.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +9 Concealment and +12 Initiative.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +12 Concealment and +16 Initiative.', special: '—' }
            ]
        }
    ],
    'Elemental Scholar': [
        {
            name: 'Way of the Fire',
            tree: 'Elemental Scholar',
            description: 'You ignite your strikes with disciplined flame.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Ignite(1)' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Ignite(2)' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Ignite(3)' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Ignite(4)' }
            ]
        },
        {
            name: 'Way of the Air',
            tree: 'Elemental Scholar',
            description: 'Your strike carries the will of the storm.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Push(1), Shock(1)' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Push(2), Shock(1)' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Push(2), Shock(2)' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Push(3), Shock(2)' }
            ]
        },
        {
            name: 'Way of the Earth',
            tree: 'Elemental Scholar',
            description: 'You strike with the patience and weight of stone.',
            levels: [
                { level: 1, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Corrode(1)' },
                { level: 2, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Corrode(2)' },
                { level: 3, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Corrode(3)' },
                { level: 4, type: 'Melee', range: '0 m', aoe: '—', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Corrode(4)' }
            ]
        },
        {
            name: 'Elemental Stone Armor',
            tree: 'Elemental Scholar',
            description: 'An unbreakable vow to endure.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +2 Armor for each unique elemental Special active on an opponent.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +4 Armor for each unique elemental Special active on an opponent.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +6 Armor for each unique elemental Special active on an opponent.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'Gain +8 Armor for each unique elemental Special active on an opponent.', special: '—' }
            ]
        },
        {
            name: 'Elemental Balance',
            tree: 'Elemental Scholar',
            description: 'The scholar strikes when the elements align.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'If any opponent has 3+ unique elemental Specials, gain Extra Attack(1) for a Level 1 Power or Spell', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'If any opponent has 4+ unique elemental Specials, gain Extra Attack(1) for a Level 2 Power or Spell', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'If any opponent has 4+ unique elemental Specials, gain Extra Attack(1) for a Level 3 Power or Spell', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'If any opponent has 4+ unique elemental Specials, gain Extra Attack(1) for a Level 4 Power or Spell', special: '—' }
            ]
        },
        {
            name: 'Elemental Flow',
            tree: 'Elemental Scholar',
            description: 'Balance restores what fury destroys.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'End of your round: if any opponent suffers from 2+ unique elemental Specials, heal 1d8 HP.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, heal 2d8 HP.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, heal 3d8 HP.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'As above, heal 4d8 HP.', special: '—' }
            ]
        },
        {
            name: 'Elemental Reflexes',
            tree: 'Elemental Scholar',
            description: 'Harmony sharpens instinct.',
            levels: [
                { level: 1, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any opponent suffers from 2+ unique elemental Specials, gain +4 Evade.', special: '—' },
                { level: 2, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any opponent suffers from 2+ unique elemental Specials, gain +8 Evade.', special: '—' },
                { level: 3, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any opponent suffers from 2+ unique elemental Specials, gain +12 Evade.', special: '—' },
                { level: 4, type: 'Passive', range: '—', aoe: '—', duration: '—', effect: 'While any opponent suffers from 2+ unique elemental Specials, gain +16 Evade.', special: '—' }
            ]
        }
    ]
};
/**
 * Get all powers for a specific Mastery Tree
 */
export function getPowersByTree(treeName) {
    return POWERS[treeName] || [];
}
/**
 * Get a specific power by name and tree
 */
export function getPower(treeName, powerName) {
    const treePowers = POWERS[treeName];
    if (!treePowers)
        return undefined;
    return treePowers.find(p => p.name === powerName);
}
/**
 * Get all available Mastery Trees that have powers
 */
export function getTreesWithPowers() {
    return Object.keys(POWERS);
}
//# sourceMappingURL=powers.js.map
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
    ]
    // TODO: Add more trees (Wild Stalker, Berserker of the Blood Moon, etc.)
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
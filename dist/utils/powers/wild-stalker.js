/**
 * Wild Stalker Mastery Tree Powers
 */
export const WILD_STALKER_POWERS = [
    {
        name: 'Shackles',
        tree: 'Wild Stalker',
        powerType: 'active',
        description: 'Roots and vines bind your target, restricting movement.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Entangled(2)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: '16m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Entangled(3)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: '24m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Entangled(4)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: '32m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Entangled(5), Prone(1)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Verdant Shackles',
        tree: 'Wild Stalker',
        powerType: 'utility',
        description: 'A pulse of entangling growth roots multiple enemies in place.',
        levels: [
            { level: 1, type: 'Utility', range: '8m', aoe: 'Radius 2m', duration: '1 Round', effect: 'Weapon DMG', special: 'Entangled(1)', cost: { action: true } },
            { level: 2, type: 'Utility', range: '12m', aoe: 'Radius 3m', duration: '1 Round', effect: 'Weapon DMG + 1d8 damage', special: 'Entangled(2)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 3, type: 'Utility', range: '16m', aoe: 'Radius 4m', duration: '1 Round', effect: 'Weapon DMG + 2d8 damage', special: 'Entangled(3)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 4, type: 'Utility', range: '20m', aoe: 'Radius 4m', duration: '1 Round', effect: 'Weapon DMG + 3d8 damage', special: 'Entangled(4)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Panic in Their Eyes',
        tree: 'Wild Stalker',
        powerType: 'active',
        description: 'Fear takes root in those already bound by nature.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Frightened(2) if target is Entangled', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Frightened(3) if Entangled', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Frightened(4) if Entangled', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Frightened(5) if Entangled', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Predator\'s Gaze',
        tree: 'Wild Stalker',
        powerType: 'buff',
        description: 'Your eyes lock onto terrified prey, making every strike count.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rounds', effect: 'vs Frightened: −4 Evade + +1d8 damage.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rounds', effect: 'vs Frightened: −6 Evade + +2d8 damage.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rounds', effect: 'vs Frightened: −8 Evade + +3d8 damage + Crit(1).', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rounds', effect: 'vs Frightened: −10 Evade + +4d8 damage + Crit(2).', cost: { action: true } }
        ]
    },
    {
        name: 'Bullseye',
        tree: 'Wild Stalker',
        powerType: 'active',
        description: 'A precision strike that pierces through defenses of controlled targets.',
        levels: [
            { level: 1, type: 'Active', range: 'Weapon', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Penetration(1) + Crit(1) if target is Entangled or Frightened', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Weapon', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Penetration(2) + Crit(1) if Ent/Fri', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Weapon', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Penetration(3) + Crit(1) if Ent/Fri', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Weapon', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Penetration(4) + Crit(1) if Ent/Fri', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Green Hell',
        tree: 'Wild Stalker',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'The forest itself turns against those who trespass.',
        levels: [
            { level: 1, type: 'Passive', effect: 'End of your turn: if you were Hidden and you dealt damage or applied Entangle, one affected enemy becomes Frightened(2).' },
            { level: 2, type: 'Passive', effect: 'As above, plus Expose(1).' },
            { level: 3, type: 'Passive', effect: 'As above, but Frightened(4) and Expose(4).' },
            { level: 4, type: 'Passive', effect: 'As above, but Frightened(5) and Expose(6).' }
        ]
    },
    {
        name: 'Camouflage',
        tree: 'Wild Stalker',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'You blend into natural terrain, becoming nearly impossible to target.',
        levels: [
            { level: 1, type: 'Passive', effect: 'While Hidden, gain +4 Evade.' },
            { level: 2, type: 'Passive', effect: 'While Hidden, gain +8 Evade.' },
            { level: 3, type: 'Passive', effect: 'While Hidden, gain +13 Evade.' },
            { level: 4, type: 'Passive', effect: 'While Hidden, gain +17 Evade.' }
        ]
    },
    {
        name: 'Not Here!',
        tree: 'Wild Stalker',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'You move like a ghost through the wilderness.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +3 Concealment and +4 Initiative.' },
            { level: 2, type: 'Passive', effect: 'Gain +6 Concealment and +8 Initiative.' },
            { level: 3, type: 'Passive', effect: 'Gain +9 Concealment and +12 Initiative.' },
            { level: 4, type: 'Passive', effect: 'Gain +12 Concealment and +16 Initiative.' }
        ]
    }
];
//# sourceMappingURL=wild-stalker.js.map
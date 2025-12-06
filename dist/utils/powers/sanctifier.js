export const SANCTIFIER_POWERS = [
    {
        name: 'Smite Evil',
        tree: 'Sanctifier',
        powerType: 'active',
        description: 'Radiant strike against unholy foes.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 radiant damage', special: 'Smite(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'radiant' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 radiant damage', special: 'Smite(2)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'radiant' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 radiant damage', special: 'Smite(2)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'radiant' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 radiant damage', special: 'Smite(3)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'radiant' } }
        ]
    },
    {
        name: 'Radiant Burst',
        tree: 'Sanctifier',
        powerType: 'active',
        description: 'A burst of holy light that burns the unholy.',
        levels: [
            { level: 1, type: 'Active', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: '2d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '2d8', damageType: 'radiant' } },
            { level: 2, type: 'Active', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: '3d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '3d8', damageType: 'radiant' } },
            { level: 3, type: 'Active', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: '4d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '4d8', damageType: 'radiant' } },
            { level: 4, type: 'Active', range: 'Self', aoe: 'Radius 8m', duration: 'Instant', effect: '5d8 radiant damage to enemies', cost: { action: true }, roll: { damage: '5d8', damageType: 'radiant' } }
        ]
    },
    {
        name: 'Lay on Hands',
        tree: 'Sanctifier',
        powerType: 'utility',
        description: 'Divine healing through touch.',
        levels: [
            { level: 1, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 2d8 HP', cost: { action: true } },
            { level: 2, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 3d8 HP', special: 'Cleanse(1)', cost: { action: true } },
            { level: 3, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 4d8 HP', special: 'Cleanse(2)', cost: { action: true } },
            { level: 4, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 5d8 HP', special: 'Cleanse(3)', cost: { action: true } }
        ]
    },
    {
        name: 'Divine Shield',
        tree: 'Sanctifier',
        powerType: 'buff',
        description: 'A shimmering shield of holy light protects you and allies.',
        levels: [
            { level: 1, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +3 Armor', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +5 Armor', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +7 Armor and Resistance to Necrotic', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +10 Armor and Resistance to Necrotic', cost: { action: true } }
        ]
    },
    {
        name: 'Aura of Purity',
        tree: 'Sanctifier',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'Your presence cleanses and protects allies.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Allies within 2m gain Regeneration(1).' },
            { level: 2, type: 'Passive', effect: 'Allies within 4m gain Regeneration(2).' },
            { level: 3, type: 'Passive', effect: 'Allies within 6m gain Regeneration(3) and +1 to Saves.' },
            { level: 4, type: 'Passive', effect: 'Allies within 8m gain Regeneration(4) and +2 to Saves.' }
        ]
    }
];
//# sourceMappingURL=sanctifier.js.map
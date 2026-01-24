/**
 * Breach & Break — School of Force and Impact Spells
 */
export const BREACH_BREAK_SPELLS = [
    {
        name: 'Arcane Pierce',
        school: 'Breach & Break',
        spellType: 'active',
        description: 'An arcane bolt drills through armor like a spear of pure force.',
        levels: [
            { level: 1, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '2d8 damage', special: 'Penetration (1)', raises: 'Range +4 m, Penetration (+1) for two raises', cost: { action: true }, roll: { damage: '2d8', damageType: 'force' } },
            { level: 2, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '3d8 damage', special: 'Penetration (2)', raises: 'Range +4 m, Penetration (+1) for two raises', cost: { action: true }, roll: { damage: '3d8', damageType: 'force' } },
            { level: 3, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '4d8 damage', special: 'Penetration (2)', raises: 'Range +4 m, Penetration (+1) for two raises', cost: { action: true }, roll: { damage: '4d8', damageType: 'force' } },
            { level: 4, type: 'Ranged', range: '28 m', duration: 'Instant', effect: '5d8 damage', special: 'Penetration (3)', raises: 'Range +4 m, Penetration (+1) for two raises', cost: { action: true }, roll: { damage: '5d8', damageType: 'force' } }
        ]
    },
    {
        name: 'Fang of Daggers',
        school: 'Breach & Break',
        spellType: 'active',
        description: 'A whirl of spectral blades erupts around you, stripping armor from those too close to escape.',
        levels: [
            { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '1d8 damage', special: 'Corrode(1)', raises: 'Range +4 m, Radius +1 m, Corrode(+1) for two raises', cost: { action: true }, roll: { damage: '1d8', damageType: 'force' } },
            { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 4 m', duration: 'Instant', effect: '2d8 damage', special: 'Corrode(2)', raises: 'Range +4 m, Radius +1 m, Corrode(+1) for two raises', cost: { action: true }, roll: { damage: '2d8', damageType: 'force' } },
            { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 6 m', duration: 'Instant', effect: '2d8 damage', special: 'Corrode(2)', raises: 'Range +4 m, Radius +1 m, Corrode(+1) for two raises', cost: { action: true }, roll: { damage: '2d8', damageType: 'force' } },
            { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 8 m', duration: 'Instant', effect: '3d8 damage', special: 'Corrode(2)', raises: 'Range +4 m, Radius +1 m, Corrode(+1) for two raises', cost: { action: true }, roll: { damage: '3d8', damageType: 'force' } }
        ]
    },
    {
        name: 'Call of Force',
        school: 'Breach & Break',
        spellType: 'active',
        description: 'A burst of telekinetic daggers explodes outward, flinging foes aside in a whirling storm of force.',
        levels: [
            { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '1d8 damage', special: 'Push(2)', raises: 'Range +4 m, Radius +1 m, Push(+2) for two raises', cost: { action: true }, roll: { damage: '1d8', damageType: 'force' } },
            { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 4 m', duration: 'Instant', effect: '2d8 damage', special: 'Push(3)', raises: 'Range +4 m, Radius +1 m, Push(+2) for two raises', cost: { action: true }, roll: { damage: '2d8', damageType: 'force' } },
            { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 6 m', duration: 'Instant', effect: '2d8 damage', special: 'Push(4)', raises: 'Range +4 m, Radius +1 m, Push(+2) for two raises', cost: { action: true }, roll: { damage: '2d8', damageType: 'force' } },
            { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 8 m', duration: 'Instant', effect: '3d8 damage', special: 'Push(6)', raises: 'Range +4 m, Radius +1 m, Push(+2) for two raises', cost: { action: true }, roll: { damage: '3d8', damageType: 'force' } }
        ]
    },
    {
        name: 'Force Hammer',
        school: 'Breach & Break',
        spellType: 'active',
        description: 'A massive hammer of force smashes armor and knocks enemies flat.',
        levels: [
            { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '2d8 damage', special: 'Penetration(1), Prone(1)', raises: 'Range +4 m, Penetration(+1), Prone(+1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'force' } },
            { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '3d8 damage', special: 'Penetration(2), Prone(1)', raises: 'Range +4 m, Penetration(+1), Prone(+1)', cost: { action: true }, roll: { damage: '3d8', damageType: 'force' } },
            { level: 3, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '4d8 damage', special: 'Penetration(2), Prone(2)', raises: 'Range +4 m, Penetration(+1), Prone(+1)', cost: { action: true }, roll: { damage: '4d8', damageType: 'force' } },
            { level: 4, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '5d8 damage', special: 'Penetration(3), Prone(2)', raises: 'Range +4 m, Penetration(+1), Prone(+1)', cost: { action: true }, roll: { damage: '5d8', damageType: 'force' } }
        ]
    }
];
//# sourceMappingURL=breach-break.js.map
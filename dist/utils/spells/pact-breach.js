/**
 * Pact Breach — Single-Target Wardbreaker Magic
 *
 * A surgical pressure list: apply Hex, keep the pact active, then drive damage
 * through protection via breach magic instead of pure area damage.
 *
 * 8 Spells: 6 Active Spells + 2 Movement Spells.
 * Main Special: Hex • Secondary Special: Penetration
 */
export const PACT_BREACH_SPELLS = [
    // ─── Active Spells ──────────────────────────────────────────────────────
    {
        name: 'Pact Spike',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'A needle of pact-light drives the contract deep into the soul.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Hex(2)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Hex(3)',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Hex(4)',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Hex(5)',
                cost: { action: true },
                roll: { damage: '2d8' }
            }
        ]
    },
    {
        name: 'Ward Rend',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'The pact opens the door. This spell kicks it off the hinges.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage vs. Hexed target',
                special: 'Penetration(2)',
                cost: { action: true },
                roll: { damage: '1d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+1d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage vs. Hexed target',
                special: 'Penetration(4)',
                cost: { action: true },
                roll: { damage: '2d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+2d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage vs. Hexed target',
                special: 'Penetration(6)',
                cost: { action: true },
                roll: { damage: '3d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+3d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage vs. Hexed target',
                special: 'Penetration(8)',
                cost: { action: true },
                roll: { damage: '4d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+4d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            }
        ]
    },
    {
        name: 'Soul Tithe',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'What the pact takes from them, it lets you keep for a while.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 1d8 damage and heal 1d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '1d8', healing: '1d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 2d8 damage and heal 2d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '2d8', healing: '2d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 3d8 damage and heal 3d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '3d8', healing: '3d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 4d8 damage and heal 4d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '4d8', healing: '4d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            }
        ]
    },
    {
        name: 'Black Audit',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'Once the pact is in, you decide which defense the target can no longer afford.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Choose Body, Mind, or Spirit.',
                special: 'Weaken(3)',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Choose Body, Mind, or Spirit.',
                special: 'Weaken(4)',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Choose Body, Mind, or Spirit.',
                special: 'Weaken(5)',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Choose Body, Mind, or Spirit.',
                special: 'Weaken(6)',
                cost: { action: true }
            }
        ]
    },
    {
        name: 'Void Collection',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'Once the account is open, the abyss starts collecting.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage vs. Hexed target',
                cost: { action: true },
                roll: { damage: '2d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+2d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage vs. Hexed target',
                cost: { action: true },
                roll: { damage: '4d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+4d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '6d8 damage vs. Hexed target',
                cost: { action: true },
                roll: { damage: '6d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+6d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: '8d8 damage vs. Hexed target',
                cost: { action: true },
                roll: { damage: '8d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+8d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            }
        ]
    },
    {
        name: 'Final Breach',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'This is the spell you cast once the pact has already told you where to break the target.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage vs. Hexed target',
                special: 'Penetration(2)',
                cost: { action: true },
                roll: { damage: '1d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+1d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage vs. Hexed target',
                special: 'Penetration(4)',
                cost: { action: true },
                roll: { damage: '2d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+2d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage vs. Hexed target',
                special: 'Penetration(6)',
                cost: { action: true },
                roll: { damage: '3d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+3d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage vs. Hexed target',
                special: 'Penetration(8)',
                cost: { action: true },
                roll: { damage: '4d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+4d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            }
        ]
    },
    // ─── Movement Spells ────────────────────────────────────────────────────
    {
        name: 'Rift Skive',
        school: 'Pact Breach',
        spellType: 'movement',
        description: "You cut a short line through the pact's backside and step out somewhere better.",
        levels: [
            {
                level: 1,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 4 m.',
                cost: { movement: true }
            },
            {
                level: 2,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 8 m.',
                cost: { movement: true }
            },
            {
                level: 3,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 12 m.',
                cost: { movement: true }
            },
            {
                level: 4,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 15 m.',
                cost: { movement: true }
            }
        ]
    },
    {
        name: 'Oath Slip',
        school: 'Pact Breach',
        spellType: 'movement',
        description: 'You leave the spoken line of the contract and slide into the margin before retaliation catches up.',
        levels: [
            {
                level: 1,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 4 m.',
                cost: { movement: true }
            },
            {
                level: 2,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 8 m.',
                cost: { movement: true }
            },
            {
                level: 3,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 12 m.',
                cost: { movement: true }
            },
            {
                level: 4,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 15 m.',
                cost: { movement: true }
            }
        ]
    }
];
//# sourceMappingURL=pact-breach.js.map
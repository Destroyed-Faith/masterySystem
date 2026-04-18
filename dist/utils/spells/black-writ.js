/**
 * Black Writ — School of Ink & Execution
 *
 * A single-target execution Spell List. Mark prey, apply concentrated pressure,
 * cash in with Crit-supported burst.
 *
 * 8 Spells: 6 Active Spells + 2 Movement Spells.
 */
export const BLACK_WRIT_SPELLS = [
    // ─── Active Spells ──────────────────────────────────────────────────────
    {
        name: 'Brand of Ending',
        school: 'Black Writ',
        spellType: 'active',
        description: 'A thin sigil of black light sinks into the prey and makes the rest of the fight easier.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Mark(2)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Mark(3)',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage',
                special: 'Mark(4)',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage',
                special: 'Mark(4)',
                cost: { action: true },
                roll: { damage: '4d8' }
            }
        ]
    },
    {
        name: 'Cut the Thread',
        school: 'Black Writ',
        spellType: 'active',
        description: 'You pull on the marked line and the prey briefly loses structural coherence.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Expose(1) if target is Marked',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Expose(1) if target is Marked',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage',
                special: 'Expose(2) if target is Marked',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage',
                special: 'Expose(2) if target is Marked',
                cost: { action: true },
                roll: { damage: '4d8' }
            }
        ]
    },
    {
        name: 'Grave Equation',
        school: 'Black Writ',
        spellType: 'active',
        description: 'You reduce the target to numbers and the result is always pain.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage vs. Marked target',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage vs. Marked target',
                cost: { action: true },
                roll: { damage: '4d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '6d8 damage vs. Marked target',
                cost: { action: true },
                roll: { damage: '6d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '8d8 damage vs. Marked target',
                cost: { action: true },
                roll: { damage: '8d8' }
            }
        ]
    },
    {
        name: 'Closed Circle',
        school: 'Black Writ',
        spellType: 'active',
        description: 'A narrow ring of judgment forces the prey to act inside your terms.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Mastery Rank Rounds',
                effect: 'Bind target within your terms.',
                special: 'Frightened(1)',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Mastery Rank Rounds',
                effect: 'Bind target within your terms.',
                special: 'Frightened(2)',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Mastery Rank Rounds',
                effect: 'Bind target within your terms.',
                special: 'Frightened(3)',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Mastery Rank Rounds',
                effect: 'Bind target within your terms.',
                special: 'Frightened(4)',
                cost: { action: true }
            }
        ]
    },
    {
        name: 'Write the Wound',
        school: 'Black Writ',
        spellType: 'active',
        description: 'You do not strike the flesh. You write the injury into what comes next.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage vs. Marked target',
                special: 'Crit(1)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage vs. Marked target',
                special: 'Crit(1)',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage vs. Marked target',
                special: 'Crit(2)',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage vs. Marked target',
                special: 'Crit(3)',
                cost: { action: true },
                roll: { damage: '4d8' }
            }
        ]
    },
    {
        name: 'Last Sentence',
        school: 'Black Writ',
        spellType: 'active',
        description: 'Once the mark has done its work, the rest is only enforcement.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage vs. Marked target',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage vs. Marked target',
                special: 'Crit(1)',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage vs. Marked target',
                special: 'Crit(2)',
                cost: { action: true },
                roll: { damage: '4d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '5d8 damage vs. Marked target',
                special: 'Crit(3)',
                cost: { action: true },
                roll: { damage: '5d8' }
            }
        ]
    },
    // ─── Movement Spells ────────────────────────────────────────────────────
    {
        name: 'Inkstep',
        school: 'Black Writ',
        spellType: 'movement',
        description: 'You spill into moving script and reappear where the sentence reads cleanest.',
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
        name: 'Margin Slip',
        school: 'Black Writ',
        spellType: 'movement',
        description: 'You slip out of the main line of reality and into its thin dark margin.',
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
//# sourceMappingURL=black-writ.js.map
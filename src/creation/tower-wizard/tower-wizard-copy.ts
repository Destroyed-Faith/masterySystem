/**
 * Tower Wizard — player-facing copy (English).
 */

export const TOWER_WIZARD_COPY = {
    title: 'Combat Package Wizard',
    progress: (step: number, total: number) => `Step ${step} of ${total}`,

    defense: {
        question: 'How do you want to survive combat?',
    },

    passive2: {
        heading: 'Choose your second Passive',
        body: `Your first Passive is part of your defense package.
Choose a second Passive that supports your character — extra durability, recovery, or damage.`,
        recommended: 'Recommended for your defense',
        allOptions: 'All supported options',
    },

    offense: {
        question: 'How do you want to pressure enemies?',
        recommended: 'Recommended for your defense',
        thematicMatch: 'Strong thematic match',
    },

    weakenSave: {
        question: 'Which kind of Save do you want to pressure?',
        options: {
            body: 'Body',
            mind: 'Mind',
            spirit: 'Spirit',
            unsure: 'Not sure — pick for me',
        },
    },

    delivery: {
        question: 'Melee or Ranged?',
        melee: 'Melee — close combat',
        ranged: 'Ranged — at a distance',
    },

    review: {
        heading: 'Your Combat Package',
        defense: 'Defense',
        offense: 'Offense',
        configureActives: 'Configure your Actives',
        apply: 'Apply this package',
        back: 'Go back and choose another style',
        castAsSpell: 'Cast as Spell',
        castingAttribute: 'Casting attribute',
        resolution: 'Resolution',
        variant: 'Power type',
    },

    buttons: {
        next: 'Continue',
        back: 'Back',
    },
} as const;

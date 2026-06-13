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
        body: `Your first Passive comes from your defense package.
Pick any other Passive from the catalog below.`,
    },

    activeBuffChoice: {
        heading: 'How should your Active Buff work?',
        body: `Your defense package includes a matched defensive Active Buff (shown below at Rank 4).
You can keep that safety, or replace it with an offensive buff on the next step.`,
        defaultHeading: 'Your default defensive Active Buff',
        rankNote: 'At Rank 4',
        defensiveTitle: 'Keep my defensive Active Buff',
        defensiveBody: 'Stay with the buff that matches your defense package. Best if you want to survive first.',
        offensiveTitle: 'Switch to an offensive Active Buff',
        offensiveBody: 'Trade defensive safety for damage, armor break, crits, or stronger Specials. You pick the replacement next.',
    },

    offensiveBuff: {
        heading: 'Choose your offensive Active Buff',
        body: 'This replaces your defensive Active Buff for the whole package. You only run one Active Buff at a time.',
        replacing: 'Replacing',
        rankPreview: 'At Rank 4',
        durationNote: 'Duration',
    },

    offense: {
        heading: 'Choose your two Actives',
        body: 'Expand a Special to see its attack shapes, then pick Melee or Ranged for each Active. Hover a Special name for rules. Click again to deselect.',
        pickCount: (selected: number) => `${selected} of 2 selected`,
        pickHint: 'Select two Actives (each with Melee or Ranged), then click Continue.',
        emptyCatalog: 'No Rank 2 Actives are available in the catalog for this character.',
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
        manualIntro: 'Choose each Power below from the catalog. You need all six before you can apply.',
        powers: 'Package Powers',
        defense: 'Defense',
        offense: 'Offense',
        configureActives: 'Configure your Actives',
        changePower: 'Change power',
        resetPower: 'Reset to default',
        customPower: 'Custom',
        apply: 'Apply this package',
        back: 'Go back and choose another style',
        manualBack: 'Back to character sheet',
        manualRestart: 'Start over',
        castAsSpell: 'Cast as Spell',
        castingAttribute: 'Casting attribute',
        resolution: 'Resolution',
        variant: 'Power type',
    },

    roleMatrix: {
        heading: 'Build Profile',
    },

    buttons: {
        next: 'Continue',
        back: 'Back',
    },
} as const;

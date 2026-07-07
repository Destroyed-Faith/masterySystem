/**
 * Tower Wizard — player-facing copy (English).
 */

export const TOWER_WIZARD_COPY = {
    title: 'Combat Package Wizard',
    progress: (step: number, total: number) => `Step ${step} of ${total}`,

    defense: {
        question: 'How do you want to survive combat?',
    },

    defensePassiveVariant: {
        heading: 'Which version of your main defense do you want?',
        body: 'Your Main Defense automatically suggests a Passive, Active Buff, and Reaction. Here you choose which Passive should define your core defense. The wizard has preselected the recommended option.',
        previewHeading: 'Your current Defense Package',
        recommended: 'Recommended / Default',
        locked: 'Recommended / Locked',
        mechanics: 'Mechanical preview',
    },

    passive2: {
        heading: 'Choose your second Passive',
        body: 'Your first Passive is already selected from your Main Defense. Now choose an additional Passive.',
        subtitleForCategory: (categoryLabel: string) =>
            `Your first Passive already uses the ${categoryLabel} category. Your second Passive must use a different category.`,
        alreadySelected: 'Already selected',
        nowChoose: 'Now choose Passive 2 from a different category.',
    },

    activeBuffChoice: {
        heading: 'What should your Active Buff slot do?',
        body: 'Your Main Defense Package suggests a defensive Active Buff. You can keep it or replace only this slot.',
        defaultHeading: 'Your package Active Buff',
        rankNote: 'At Rank 4',
        defensiveTitle: 'Keep my package Active Buff',
        defensiveBody: 'Recommended. Your Active Buff stays aligned with your Main Defense.',
        offensiveTitle: 'Replace with an offensive Active Buff',
        offensiveBody: 'Your Passive 1 and Reaction stay defensive, but your Active Buff becomes offensive.',
        supportTitle: 'Replace with a support or utility Active Buff',
        supportBody: 'Your Passive 1 and Reaction stay defensive, but your Active Buff becomes support or utility.',
    },

    offensiveBuff: {
        heading: 'Choose your offensive Active Buff',
        supportHeading: 'Choose your support Active Buff',
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
        mainDefensePackage: 'Main Defense Package',
        secondPassive: 'Second Passive',
        defense: 'Defense',
        offense: 'Offense',
        configureActives: 'Configure your Actives',
        changePower: 'Change power',
        resetPower: 'Reset to recommended default',
        customPower: 'Custom',
        passive1VariantChanged: 'Passive 1 variant changed',
        activeBuffReplaced: 'Package Active Buff replaced',
        recommendedLabel: 'Recommended',
        currentLabel: 'Current',
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

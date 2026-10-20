/**
 * Tower Wizard — player-facing copy (English).
 */

export const TOWER_WIZARD_COPY = {
    title: 'Combat Package Wizard',
    progress: (step: number, total: number) => `Step ${step} of ${total}`,

    defense: {
        question: 'How do you want to survive combat?',
    },

    passive1: {
        heading: 'CHOOSE YOUR FIRST PASSIVE',
        body: 'Choose the first Passive that defines your character. Defensive Powers are recommended for survivability, but any legal Passive is available.',
        recommendNote:
            'Recommended for survivability: Armor, Evade, or another defensive Passive. You may choose any Passive.',
        nowChoose: 'Pick one:',
    },

    defensePassiveVariant: {
        heading: 'Which version of your main defense do you want?',
        body: 'Your Main Defense automatically suggests a Passive, Active Buff, and Reaction. Here you choose which Passive should define your core defense. The wizard has preselected the recommended option.',
        previewHeading: 'Your current Defense Package',
        recommended: 'Recommended',
        locked: 'Recommended / Locked',
        mechanics: 'Mechanical preview',
    },

    passive2: {
        heading: 'CHOOSE YOUR SECOND PASSIVE',
        body: 'Choose a second Passive. It must follow the normal Passive Category and slot restrictions.',
        subtitleForCategory: () =>
            'Choose a second Passive. It must follow the normal Passive Category and slot restrictions.',
        alreadySelected: 'First Passive',
        nowChoose: 'Pick one:',
        whenToUse: 'When to use it',
        powerLabel: 'Power',
        revalidateNote: 'Your previous second Passive is no longer legal with this first Passive. Choose again.',
    },

    activeBuffChoice: {
        heading: 'What should your Active Buff do?',
        body: 'You can maintain only one Active Buff at a time. This is the power you activate to change how you fight for several rounds.',
        defaultHeading: 'Recommended package Active Buff',
        rankNote: 'At PL 4',
        defensiveTitle: 'Keep the recommended defensive Buff',
        defensiveBody: 'Keep the Buff recommended for your package (based on your first Passive when it is defensive).',
        offensiveTitle: 'Replace it with an offensive Buff',
        offensiveBody: 'Use your Buff slot to make your attacks stronger instead of improving your defense. Examples: Active Buff: Damage, Active Buff: Critical, Active Buff: Damage Aura, or Active Buff: Thorns.',
        supportTitle: 'Replace it with a support Buff',
        supportBody: 'Use your Buff slot for Temporary HP, auras, Invisibility, Self Cleanse, Spell Resistance, or Summon support from the final catalogue.',
    },

    offensiveBuff: {
        heading: 'Choose your offensive Active Buff',
        supportHeading: 'Choose your support Active Buff',
        body: 'This replaces your defensive Active Buff for the whole package. You only run one Active Buff at a time.',
        replacing: 'Replacing',
        rankPreview: 'At PL 4',
        durationNote: 'In combat: activate during Preparation (commits base Attack Action)',
    },

    offenseDelivery: {
        heading: 'Attack style',
        body: 'Choose Melee, Ranged, or Spell for your Core Weapon Attack. Then pick your Special Focus below.',
        coreNote: 'Your Core Attack is a Weapon Attack matching this style.',
    },

    offenseSpecial: {
        heading: 'How do you fight?',
        body: 'Choose your Core Attack style, then the Special that defines your second Active Power.',
        whenToUse: 'When to use it',
        powerLabel: 'Power',
        emptyCatalog: 'No Special Attacks are available for this attack style in the catalog.',
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

    echo: {
        missingBanner:
            'Select your Echo in the Echo dialog first. Your Echo Artifacts (shown on your character) determine which Active Buffs you already have — you only maintain one at a time.',
        summaryHeading: 'Your Echo',
        artifactBuffsHeading: 'Active Buffs from Echo Artifacts',
        artifactBuffNote:
            'These use your single maintained Active Buff slot when activated. Do not pick the same defensive Active Buff again in this package.',
        defenseConflict: 'Already covered by your Echo',
        defenseRecommended: 'Complements your Echo',
        activeBuffPickerNote:
            'Options that duplicate your Echo Artifact Active Buff are hidden. Consider an offensive or support Active Buff, or a different defensive path (Phasing, Damage Reduction, Conditional Passives).',
    },

    review: {
        heading: 'Your Combat Package',
        whatYouBuilt: 'What you built',
        simpleRotation: 'Simple rotation',
        manualIntro: 'Choose each Power below from the catalog. You need all six before you can apply.',
        mainDefensePackage: 'Passive Package',
        secondPassive: 'Second Passive',
        defense: 'Defense',
        offense: 'Offense',
        configureActives: 'Configure your Actives',
        changePower: 'Change power',
        resetPower: 'Reset to recommended default',
        customPower: 'Custom',
        passive1VariantChanged: 'First Passive changed',
        activeBuffReplaced: 'Package Active Buff replaced',
        recommendedLabel: 'Recommended',
        currentLabel: 'Current',
        apply: 'Apply this package',
        back: 'Go back and choose another Passive',
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

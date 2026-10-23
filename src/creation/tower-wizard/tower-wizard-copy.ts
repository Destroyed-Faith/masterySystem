/**
 * Tower Wizard — player-facing copy (English fallbacks when i18n is unavailable).
 */

import { masteryLocalize } from '../../utils/mastery-localize.js';

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
        body: 'Choose Martial or Spell for your Core Attack. Then pick your Special Focus below.',
        coreNote: 'Martial gives you a Weapon Attack. Spell gives you a Spell Attack.',
    },

    offenseSpecial: {
        heading: 'How do you fight?',
        body: 'Choose Martial or Spell, then the Special that defines your second Active Power.',
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

    identity: {
        echo: {
            heading: 'CHOOSE YOUR ECHO',
            body: 'Your Echo is who you were before the Fall. Open the Echo dialog to choose it (and any sub-choice or Veiled Form).',
            current: 'Current Echo',
            none: 'No Echo chosen yet.',
            choose: 'Choose / change Echo',
        },
        attributesStones: {
            heading: 'ATTRIBUTES & STONES',
            body: 'Assign the starting Attributes 4, 4, 3, 3, 2, 2, 2 (one per Attribute), then place your 2 starting Attribute Stones. Stones are independent of Attribute scores and may stack on one Attribute up to Mastery Rank × 2.',
            stonesLabel: 'Stones placed',
        },
        echoImprints: {
            heading: 'ECHO IMPRINTS',
            body: 'Choose up to your Mastery Rank in Echo Imprints (two at the usual start). Each needs its Attribute at 4+. Choosing costs no Stones, XP, Rerolls or charges.',
            pickedLabel: 'Imprints chosen',
        },
        specializations: {
            heading: 'SPECIALIZATIONS',
            body: 'Name exactly five Specializations — each is Rank 2 (20 Creation Points). Free name, Field, and one-sentence scope. There is no Rank picker.',
            nameLabel: 'Name',
            fieldLabel: 'Field',
            scopeLabel: 'Scope (one sentence)',
            rankLabel: 'Rank',
        },
        reconcileHeading: 'Powers already chosen — re-check later steps',
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

/** Identity-step headings/labels resolved through `MASTERY.df2026` when Foundry i18n is ready. */
export function localizedTowerWizardCopy(): typeof TOWER_WIZARD_COPY {
    const base = TOWER_WIZARD_COPY;
    return {
        ...base,
        identity: {
            ...base.identity,
            echoImprints: {
                ...base.identity.echoImprints,
                heading: masteryLocalize(
                    'MASTERY.df2026.imprints.title',
                    base.identity.echoImprints.heading,
                ) as typeof base.identity.echoImprints.heading,
            },
            specializations: {
                ...base.identity.specializations,
                heading: masteryLocalize(
                    'MASTERY.df2026.creation.specsHeaderTitle',
                    base.identity.specializations.heading,
                ) as typeof base.identity.specializations.heading,
                fieldLabel: masteryLocalize(
                    'MASTERY.df2026.specializations.field',
                    base.identity.specializations.fieldLabel,
                ) as typeof base.identity.specializations.fieldLabel,
                scopeLabel: (masteryLocalize('MASTERY.df2026.specializations.scope', 'Scope') +
                    ' (one sentence)') as typeof base.identity.specializations.scopeLabel,
                rankLabel: masteryLocalize(
                    'MASTERY.df2026.specializations.rank',
                    base.identity.specializations.rankLabel,
                ) as typeof base.identity.specializations.rankLabel,
            },
        },
    };
}

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
Do you want to stay safer, or support your attacks? Pick one option below.`,
        strengthenDefense: 'Strengthen your defense',
        supportAttacks: 'Support your attacks',
    },

    activeBuffChoice: {
        heading: 'How should your Active Buff work?',
        body: `Your defense package includes a defensive Active Buff by default.
Do you want to keep that safety, or trade it for a more aggressive buff?`,
        defensive: 'Keep my defensive Active Buff — I want to stay safe',
        offensive: 'Switch to an offensive Active Buff — I want to hit harder',
    },

    offensiveBuff: {
        heading: 'Choose your offensive Active Buff',
        body: 'This replaces your defensive Active Buff. You only maintain one Active Buff at a time.',
    },

    offense: {
        question: 'How do you want to pressure enemies?',
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

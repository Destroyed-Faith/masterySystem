/**
 * Tower Wizard — player-facing copy (English).
 */

export const TOWER_WIZARD_COPY = {
    title: 'Combat Package Wizard',
    progress: (step: number, total: number) => `Step ${step} of ${total}`,

    intro: {
        heading: 'How your character fights',
        body: `Your character is built from several Power types.

Passives are always on or trigger automatically.
Active Buffs are temporary combat states.
Reactions are your emergency answers.
Actives are the attacks or effects you use on your turn.

This wizard first gives you a defensive foundation, then lets you choose your offensive style.

For beginner characters, your Active Buff is defensive by default.
Offensive Active Buffs are advanced choices and are not part of this beginner flow.

Movement Powers are not included here — they add complexity and come later.`,
        mrNote: `Applying a beginner package sets your character to Mastery Rank 4 so defensive Powers work at Rank 4 while your Actives stay at Rank 2.`,
    },

    defense: {
        question: 'How do you want to survive combat?',
    },

    passive2: {
        heading: 'Choose your second Passive',
        body: `Your first Passive is part of your defense package.
Now choose a second Passive that supports your character.

This should make your character safer, more reliable, or slightly better at their role.
It should not start a second complicated defensive subsystem.`,
        recommended: 'Recommended for your defense',
        allOptions: 'All supported options',
    },

    defenseSummary: {
        heading: 'Your defensive foundation',
        body: `You now have your defensive foundation.

Your Passive gives you reliable protection.
Your Active Buff is your main defensive combat state.
Your Reaction is your emergency answer once per round.

This is the safety package that keeps your character alive while you learn the system.`,
        buffNote: 'Your Active Buff is already chosen. Beginner offense choices use Actives, not a second Active Buff.',
    },

    buffLimitation: {
        heading: 'One Active Buff at a time',
        body: `You normally maintain only one Active Buff at a time.

This wizard gives you a defensive Active Buff by default. That is intentional.

Some offensive builds later use Active Buffs such as Critical, Damage, Penetration, or Special Overdrive.
Those builds can be strong, but they replace your defensive buff and are not recommended for beginner character creation.

This beginner wizard keeps your Active Buff defensive and builds offense through Actives.`,
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

    spellcaster: {
        question: 'Are you primarily a spellcaster?',
        yes: 'Yes — prefer magical offense packages',
        no: 'No — prefer martial packages',
    },

    combatLoop: {
        heading: 'How your character plays in combat',
        intro: 'Here is how your character plays in combat.',
        buff: 'Use your defensive Active Buff when you expect danger.',
        turn: 'Use one of your Actives to damage, debuff, control, or set up enemies.',
        reaction: 'Use your Reaction once per round when its trigger happens.',
        passives: 'Your Passives are already working. You usually do not need to press anything for them.',
    },

    review: {
        heading: 'Your Beginner Combat Package',
        defense: 'Defense',
        offense: 'Offense',
        combatPlan: 'Combat plan',
        apply: 'Apply this package',
        back: 'Go back and choose another style',
    },

    warnings: {
        'damage-reduction': 'Damage Reduction is a committed defensive package. Do not mix it with other defensive subsystems.',
        phasing: 'Phasing has limited uses per combat. It is powerful, but not constant protection.',
        corrode: 'Corrode needs high damage after it. Do not take it without a damage follow-up.',
        hex: 'Hex needs Spell follow-up. Do not take it if you are not using Spell attacks.',
        weaken: 'Weaken needs follow-up Powers that target the weakened Save.',
        advancedBuff: 'Offensive Active Buffs replace your defensive Active Buff. This is not part of beginner creation.',
        bleedingPush: 'This package works best when you understand positioning.',
    },

    buttons: {
        next: 'Continue',
        back: 'Back',
    },
} as const;

export function combatLoopExample(defenseId: string, offenseId: string): string {
    const key = `${defenseId}::${offenseId}`;
    const map: Record<string, string> = {
        'armor::corrode-damage': 'You protect yourself with Armor, then use Corrode to weaken enemy Armor and follow up with heavy damage.',
        'evade::expose': 'You are hard to hit, and you make enemies easier for your group to hit.',
        'evade::mark': 'You dodge attacks while marking priority targets for your group.',
        'damage-reduction::direct-damage': 'You reduce incoming damage and keep your turns simple with reliable attacks.',
        'phasing::freeze': 'You ignore a few key hits and slow enemies so they struggle to control the fight.',
        'armor::bleeding-push': 'You absorb hits with Armor while bleeding enemies and pushing them into bad positions.',
        'evade::freeze': 'You stay elusive and slow enemies so they struggle to reach you.',
    };
    return map[key] ?? 'Use your defensive buff early, press your Actives on your turn, and save your Reaction for a real emergency.';
}

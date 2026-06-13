/**
 * Tower Wizard — player-facing copy (English).
 */
export declare const TOWER_WIZARD_COPY: {
    readonly title: "Combat Package Wizard";
    readonly progress: (step: number, total: number) => string;
    readonly intro: {
        readonly heading: "How your character fights";
        readonly body: "Your character is built from several Power types.\n\nPassives are always on or trigger automatically.\nActive Buffs are temporary combat states.\nReactions are your emergency answers.\nActives are the attacks or effects you use on your turn.\n\nThis wizard first gives you a defensive foundation, then lets you choose your offensive style.\n\nFor beginner characters, your Active Buff is defensive by default.\nOffensive Active Buffs are advanced choices and are not part of this beginner flow.\n\nMovement Powers are not included here — they add complexity and come later.";
        readonly mrNote: "Applying a beginner package sets your character to Mastery Rank 4 so defensive Powers work at Rank 4 while your Actives stay at Rank 2.";
    };
    readonly defense: {
        readonly question: "How do you want to survive combat?";
    };
    readonly passive2: {
        readonly heading: "Choose your second Passive";
        readonly body: "Your first Passive is part of your defense package.\nNow choose a second Passive that supports your character.\n\nThis should make your character safer, more reliable, or slightly better at their role.\nIt should not start a second complicated defensive subsystem.";
        readonly recommended: "Recommended for your defense";
        readonly allOptions: "All supported options";
    };
    readonly defenseSummary: {
        readonly heading: "Your defensive foundation";
        readonly body: "You now have your defensive foundation.\n\nYour Passive gives you reliable protection.\nYour Active Buff is your main defensive combat state.\nYour Reaction is your emergency answer once per round.\n\nThis is the safety package that keeps your character alive while you learn the system.";
        readonly buffNote: "Your Active Buff is already chosen. Beginner offense choices use Actives, not a second Active Buff.";
    };
    readonly buffLimitation: {
        readonly heading: "One Active Buff at a time";
        readonly body: "You normally maintain only one Active Buff at a time.\n\nThis wizard gives you a defensive Active Buff by default. That is intentional.\n\nSome offensive builds later use Active Buffs such as Critical, Damage, Penetration, or Special Overdrive.\nThose builds can be strong, but they replace your defensive buff and are not recommended for beginner character creation.\n\nThis beginner wizard keeps your Active Buff defensive and builds offense through Actives.";
    };
    readonly offense: {
        readonly question: "How do you want to pressure enemies?";
        readonly recommended: "Recommended for your defense";
        readonly thematicMatch: "Strong thematic match";
    };
    readonly weakenSave: {
        readonly question: "Which kind of Save do you want to pressure?";
        readonly options: {
            readonly body: "Body";
            readonly mind: "Mind";
            readonly spirit: "Spirit";
            readonly unsure: "Not sure — pick for me";
        };
    };
    readonly delivery: {
        readonly question: "Melee or Ranged?";
        readonly melee: "Melee — close combat";
        readonly ranged: "Ranged — at a distance";
    };
    readonly spellcaster: {
        readonly question: "Are you primarily a spellcaster?";
        readonly yes: "Yes — prefer magical offense packages";
        readonly no: "No — prefer martial packages";
    };
    readonly combatLoop: {
        readonly heading: "How your character plays in combat";
        readonly intro: "Here is how your character plays in combat.";
        readonly buff: "Use your defensive Active Buff when you expect danger.";
        readonly turn: "Use one of your Actives to damage, debuff, control, or set up enemies.";
        readonly reaction: "Use your Reaction once per round when its trigger happens.";
        readonly passives: "Your Passives are already working. You usually do not need to press anything for them.";
    };
    readonly review: {
        readonly heading: "Your Beginner Combat Package";
        readonly defense: "Defense";
        readonly offense: "Offense";
        readonly combatPlan: "Combat plan";
        readonly apply: "Apply this package";
        readonly back: "Go back and choose another style";
    };
    readonly warnings: {
        readonly 'damage-reduction': "Damage Reduction is a committed defensive package. Do not mix it with other defensive subsystems.";
        readonly phasing: "Phasing has limited uses per combat. It is powerful, but not constant protection.";
        readonly corrode: "Corrode needs high damage after it. Do not take it without a damage follow-up.";
        readonly hex: "Hex needs Spell follow-up. Do not take it if you are not using Spell attacks.";
        readonly weaken: "Weaken needs follow-up Powers that target the weakened Save.";
        readonly advancedBuff: "Offensive Active Buffs replace your defensive Active Buff. This is not part of beginner creation.";
        readonly bleedingPush: "This package works best when you understand positioning.";
    };
    readonly buttons: {
        readonly next: "Continue";
        readonly back: "Back";
    };
};
export declare function combatLoopExample(defenseId: string, offenseId: string): string;
//# sourceMappingURL=tower-wizard-copy.d.ts.map
/**
 * Tower Wizard — player-facing copy (English).
 */
export declare const TOWER_WIZARD_COPY: {
    readonly title: "Combat Package Wizard";
    readonly progress: (step: number, total: number) => string;
    readonly defense: {
        readonly question: "How do you want to survive combat?";
    };
    readonly passive2: {
        readonly heading: "Choose your second Passive";
        readonly body: "Your first Passive comes from your defense package.\nDo you want to stay safer, or support your attacks? Pick one option below.";
        readonly strengthenDefense: "Strengthen your defense";
        readonly supportAttacks: "Support your attacks";
    };
    readonly activeBuffChoice: {
        readonly heading: "How should your Active Buff work?";
        readonly body: "Your defense package includes a defensive Active Buff by default.\nDo you want to keep that safety, or trade it for a more aggressive buff?";
        readonly defensive: "Keep my defensive Active Buff — I want to stay safe";
        readonly offensive: "Switch to an offensive Active Buff — I want to hit harder";
    };
    readonly offensiveBuff: {
        readonly heading: "Choose your offensive Active Buff";
        readonly body: "This replaces your defensive Active Buff. You only maintain one Active Buff at a time.";
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
    readonly review: {
        readonly heading: "Your Combat Package";
        readonly defense: "Defense";
        readonly offense: "Offense";
        readonly configureActives: "Configure your Actives";
        readonly apply: "Apply this package";
        readonly back: "Go back and choose another style";
        readonly castAsSpell: "Cast as Spell";
        readonly castingAttribute: "Casting attribute";
        readonly resolution: "Resolution";
        readonly variant: "Power type";
    };
    readonly buttons: {
        readonly next: "Continue";
        readonly back: "Back";
    };
};
//# sourceMappingURL=tower-wizard-copy.d.ts.map
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
        readonly body: "Your first Passive comes from your defense package.\nPick any other Passive from the catalog below.";
    };
    readonly activeBuffChoice: {
        readonly heading: "How should your Active Buff work?";
        readonly body: "Your defense package includes a matched defensive Active Buff (shown below at Rank 4).\nYou can keep that safety, or replace it with an offensive buff on the next step.";
        readonly defaultHeading: "Your default defensive Active Buff";
        readonly rankNote: "At Rank 4";
        readonly defensiveTitle: "Keep my defensive Active Buff";
        readonly defensiveBody: "Stay with the buff that matches your defense package. Best if you want to survive first.";
        readonly offensiveTitle: "Switch to an offensive Active Buff";
        readonly offensiveBody: "Trade defensive safety for damage, armor break, crits, or stronger Specials. You pick the replacement next.";
    };
    readonly offensiveBuff: {
        readonly heading: "Choose your offensive Active Buff";
        readonly body: "This replaces your defensive Active Buff for the whole package. You only run one Active Buff at a time.";
        readonly replacing: "Replacing";
        readonly rankPreview: "At Rank 4";
        readonly durationNote: "Duration";
    };
    readonly offense: {
        readonly question: "How do you want to pressure enemies?";
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
        readonly powers: "Package Powers";
        readonly defense: "Defense";
        readonly offense: "Offense";
        readonly configureActives: "Configure your Actives";
        readonly changePower: "Change power";
        readonly resetPower: "Reset to default";
        readonly customPower: "Custom";
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
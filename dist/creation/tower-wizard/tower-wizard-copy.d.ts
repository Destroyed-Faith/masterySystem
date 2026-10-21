/**
 * Tower Wizard — player-facing copy (English).
 */
export declare const TOWER_WIZARD_COPY: {
    readonly title: "Combat Package Wizard";
    readonly progress: (step: number, total: number) => string;
    readonly defense: {
        readonly question: "How do you want to survive combat?";
    };
    readonly passive1: {
        readonly heading: "CHOOSE YOUR FIRST PASSIVE";
        readonly body: "Choose the first Passive that defines your character. Defensive Powers are recommended for survivability, but any legal Passive is available.";
        readonly recommendNote: "Recommended for survivability: Armor, Evade, or another defensive Passive. You may choose any Passive.";
        readonly nowChoose: "Pick one:";
    };
    readonly defensePassiveVariant: {
        readonly heading: "Which version of your main defense do you want?";
        readonly body: "Your Main Defense automatically suggests a Passive, Active Buff, and Reaction. Here you choose which Passive should define your core defense. The wizard has preselected the recommended option.";
        readonly previewHeading: "Your current Defense Package";
        readonly recommended: "Recommended";
        readonly locked: "Recommended / Locked";
        readonly mechanics: "Mechanical preview";
    };
    readonly passive2: {
        readonly heading: "CHOOSE YOUR SECOND PASSIVE";
        readonly body: "Choose a second Passive. It must follow the normal Passive Category and slot restrictions.";
        readonly subtitleForCategory: () => string;
        readonly alreadySelected: "First Passive";
        readonly nowChoose: "Pick one:";
        readonly whenToUse: "When to use it";
        readonly powerLabel: "Power";
        readonly revalidateNote: "Your previous second Passive is no longer legal with this first Passive. Choose again.";
    };
    readonly activeBuffChoice: {
        readonly heading: "What should your Active Buff do?";
        readonly body: "You can maintain only one Active Buff at a time. This is the power you activate to change how you fight for several rounds.";
        readonly defaultHeading: "Recommended package Active Buff";
        readonly rankNote: "At PL 4";
        readonly defensiveTitle: "Keep the recommended defensive Buff";
        readonly defensiveBody: "Keep the Buff recommended for your package (based on your first Passive when it is defensive).";
        readonly offensiveTitle: "Replace it with an offensive Buff";
        readonly offensiveBody: "Use your Buff slot to make your attacks stronger instead of improving your defense. Examples: Active Buff: Damage, Active Buff: Critical, Active Buff: Damage Aura, or Active Buff: Thorns.";
        readonly supportTitle: "Replace it with a support Buff";
        readonly supportBody: "Use your Buff slot for Temporary HP, auras, Invisibility, Self Cleanse, Spell Resistance, or Summon support from the final catalogue.";
    };
    readonly offensiveBuff: {
        readonly heading: "Choose your offensive Active Buff";
        readonly supportHeading: "Choose your support Active Buff";
        readonly body: "This replaces your defensive Active Buff for the whole package. You only run one Active Buff at a time.";
        readonly replacing: "Replacing";
        readonly rankPreview: "At PL 4";
        readonly durationNote: "In combat: activate during Preparation (commits base Attack Action)";
    };
    readonly offenseDelivery: {
        readonly heading: "Attack style";
        readonly body: "Choose Martial or Spell for your Core Attack. Then pick your Special Focus below.";
        readonly coreNote: "Martial gives you a Weapon Attack. Spell gives you a Spell Attack.";
    };
    readonly offenseSpecial: {
        readonly heading: "How do you fight?";
        readonly body: "Choose Martial or Spell, then the Special that defines your second Active Power.";
        readonly whenToUse: "When to use it";
        readonly powerLabel: "Power";
        readonly emptyCatalog: "No Special Attacks are available for this attack style in the catalog.";
    };
    readonly offense: {
        readonly heading: "Choose your two Actives";
        readonly body: "Expand a Special to see its attack shapes, then pick Melee or Ranged for each Active. Hover a Special name for rules. Click again to deselect.";
        readonly pickCount: (selected: number) => string;
        readonly pickHint: "Select two Actives (each with Melee or Ranged), then click Continue.";
        readonly emptyCatalog: "No Rank 2 Actives are available in the catalog for this character.";
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
    readonly echo: {
        readonly missingBanner: "Select your Echo in the Echo dialog first. Your Echo Artifacts (shown on your character) determine which Active Buffs you already have — you only maintain one at a time.";
        readonly summaryHeading: "Your Echo";
        readonly artifactBuffsHeading: "Active Buffs from Echo Artifacts";
        readonly artifactBuffNote: "These use your single maintained Active Buff slot when activated. Do not pick the same defensive Active Buff again in this package.";
        readonly defenseConflict: "Already covered by your Echo";
        readonly defenseRecommended: "Complements your Echo";
        readonly activeBuffPickerNote: "Options that duplicate your Echo Artifact Active Buff are hidden. Consider an offensive or support Active Buff, or a different defensive path (Phasing, Damage Reduction, Conditional Passives).";
    };
    readonly review: {
        readonly heading: "Your Combat Package";
        readonly whatYouBuilt: "What you built";
        readonly simpleRotation: "Simple rotation";
        readonly manualIntro: "Choose each Power below from the catalog. You need all six before you can apply.";
        readonly mainDefensePackage: "Passive Package";
        readonly secondPassive: "Second Passive";
        readonly defense: "Defense";
        readonly offense: "Offense";
        readonly configureActives: "Configure your Actives";
        readonly changePower: "Change power";
        readonly resetPower: "Reset to recommended default";
        readonly customPower: "Custom";
        readonly passive1VariantChanged: "First Passive changed";
        readonly activeBuffReplaced: "Package Active Buff replaced";
        readonly recommendedLabel: "Recommended";
        readonly currentLabel: "Current";
        readonly apply: "Apply this package";
        readonly back: "Go back and choose another Passive";
        readonly manualBack: "Back to character sheet";
        readonly manualRestart: "Start over";
        readonly castAsSpell: "Cast as Spell";
        readonly castingAttribute: "Casting attribute";
        readonly resolution: "Resolution";
        readonly variant: "Power type";
    };
    readonly roleMatrix: {
        readonly heading: "Build Profile";
    };
    readonly buttons: {
        readonly next: "Continue";
        readonly back: "Back";
    };
};
//# sourceMappingURL=tower-wizard-copy.d.ts.map
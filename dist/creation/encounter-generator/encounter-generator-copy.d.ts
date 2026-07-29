/**
 * Encounter Generator — player-facing copy (German).
 */
export declare const ENCOUNTER_GENERATOR_COPY: {
    readonly title: "Encounter-Generator";
    readonly progress: (step: number, total: number) => string;
    readonly party: {
        readonly heading: "Wer nimmt am Encounter teil?";
        readonly body: "Waehle die Charaktere, die als Gruppe gegen den Encounter antreten. Aus ihren Werten (HP, Ausweichen, Ruestung, Angriffspool, Schaden) wird der Gegner berechnet.";
        readonly empty: "Keine Charaktere gefunden. Lege zuerst Charakter-Actors an.";
        readonly selected: (n: number) => string;
        readonly metricsHeading: "Gruppen-Kennwerte";
    };
    readonly difficulty: {
        readonly heading: "Wie hart soll der Encounter sein?";
        readonly body: "Steuert Kampfdauer (Boss-HP), Trefferchancen und wie hart Boss-Treffer einschlagen.";
        readonly moderate: {
            readonly title: "Moderat";
            readonly body: "Kuerzerer Kampf (~4 Runden Boss). Gruppe trifft oft, Boss-Treffer tun ~20% der HP weh.";
        };
        readonly hard: {
            readonly title: "Hart (Souls-like)";
            readonly body: "Langer Kampf (~6 Runden Boss). Gruppe trifft ~65%, Boss-Treffer ~32% der HP. Fehler sind teuer.";
        };
        readonly brutal: {
            readonly title: "Brutal";
            readonly body: "Sehr langer Kampf (~8 Runden Boss). Gruppe trifft ~58%, Boss-Treffer ~45% der HP. Unverzeihlich.";
        };
    };
    readonly composition: {
        readonly heading: "Zusammensetzung des Encounters";
        readonly body: "Lege fest, aus wie vielen Bossen und Minions der Encounter besteht.";
        readonly bossCount: "Anzahl Bosse";
        readonly phasesPerBoss: "Phasen pro Boss";
        readonly minionCount: "Minions pro Welle";
        readonly respawnCadence: "Minion-Respawn";
        readonly cadenceNone: "Kein Respawn";
        readonly cadenceEvery: (n: number) => string;
        readonly respawnNote: "Bosse bleiben bis zum Sieg. Minions tauchen im gewaehlten Takt wieder auf (Empfehlung im naechsten Schritt).";
    };
    readonly review: {
        readonly heading: "Vorschlag pruefen & anpassen";
        readonly body: "Alle Werte sind editierbar. Aenderungen wirken sich beim Erzeugen aus.";
        readonly bossesHeading: "Bosse";
        readonly minionsHeading: "Minions";
        readonly respawnHeading: "Respawn-Empfehlung";
        readonly recommend: (perWave: number, cadence: number) => string;
        readonly col: {
            readonly name: "Name";
            readonly phase: "Phase";
            readonly hp: "HP";
            readonly evade: "Ausweichen";
            readonly armor: "Ruestung";
            readonly attackDice: "Angriffs-W8";
            readonly damageDice: "Schadens-W8";
            readonly slots: "Angriffe/Runde";
            readonly mr: "MR";
        };
        readonly note: "Hinweis: Ausweichen wird in-engine aus MR und Beweglichkeit erzeugt; Ruestung entspricht der MR. Phasen-Wechsel steuerst du im NSC-Bogen (aktive Phase).";
    };
    readonly name: {
        readonly heading: "Encounter-Projekt benennen & erzeugen";
        readonly body: "Es entsteht ein Encounter-Projekt: ein Ordner mit Unterordnern (Boss, ggf. Adds und Encounter Mechanics), die fertigen NSC-Actors sowie ein Journal mit Encounter Summary, Threat Report und druckbarem NPC-Sheet.";
        readonly label: "Encounter-Name";
        readonly placeholder: "z.B. The Red Priest";
    };
    readonly concept: {
        readonly heading: "Kampfidee definieren";
        readonly body: "Du legst fest, was der Gegner tun soll — der Generator entscheidet, welche Werte dafür nötig sind. Adds und Umgebungsmechanik teilen sich das Encounter-Budget mit dem Boss.";
        readonly preset: "Archetyp-Vorlage";
        readonly presetNone: "Eigenes Konzept";
        readonly rank: "Enemy Rank / Importance";
        readonly style: "Primary Combat Style";
        readonly primarySpecial: "Primary Special";
        readonly secondaryStyle: "Secondary Style (optional)";
        readonly actions: "Aktionen pro Runde";
        readonly targeting: "Zielmuster";
        readonly phases: "Anzahl Phasen";
        readonly cycleLength: "Power-Cycle Länge";
        readonly cycleStyle: "Cycle-Stil";
        readonly envActions: "Umgebungs-Aktionen pro Runde";
    };
    readonly adds: {
        readonly heading: "Adds (Verstärkung)";
        readonly body: "Adds sind keine „bisschen Health“ — jeder Add erzeugt jede weitere Runde neue Aktionen. Der Generator rechnet: Add Threat = erwartete Aktionen bis zum Tod × Bedrohung pro Aktion.";
        readonly enabled: "Adds verwenden";
        readonly durability: "Add Durability";
        readonly durabilityOptions: {
            readonly minion: "Minion — stirbt an einem erfolgreichen Angriff";
            readonly light: "Light — überlebt einen schwachen Treffer";
            readonly standard: "Standard — überlebt ca. zwei Angriffe";
            readonly elite: "Elite — braucht gezielten Fokus";
        };
        readonly pressure: "Add Pressure";
        readonly pressureOptions: {
            readonly harassment: "Harassment — einzeln nahezu irrelevant";
            readonly noticeable: "Noticeable — ~½ Health Level pro Runde";
            readonly dangerous: "Dangerous in Groups — ~1 Health Level pro Runde";
            readonly lethal: "Lethal if Ignored — volle Population schaltet einen Charakter in 2 Runden aus";
        };
        readonly targetActive: "Ziel-Population (gleichzeitig aktiv)";
        readonly maxActive: "Maximum aktiv (0 = automatisch)";
        readonly spawnPerRound: "Spawn-Rate (pro Runde)";
        readonly spawnPattern: "Spawn-Muster";
        readonly spawnPatternOptions: {
            readonly continuous: "Continuous — jede Runde";
            readonly burst: "Burst — alle zu Beginn";
            readonly 'phase-start': "Phase Start — bei Phasenwechsel";
            readonly triggered: "Triggered — durch Ereignis";
        };
        readonly summonCost: "Beschwören kostet den Boss eine Aktion";
        readonly disabledNote: "Ohne Adds bekommt der Boss das volle Encounter-Budget.";
    };
    readonly threat: {
        readonly heading: "Threat Report";
        readonly hitChances: "Trefferchance (niedrig / Ø / hoch Ausweichen)";
        readonly aoeHitChance: "AoE-Trefferchance (fixe Area TN, ignoriert Ausweichen)";
        readonly rawDamage: "Erwarteter Schaden pro Treffer (vor Rüstung)";
        readonly afterArmor: "Nach Ø Rüstung/DR";
        readonly persistent: "Persistenter Schaden pro Runde (ignoriert Rüstung)";
        readonly burst: "Max. Runde-1-Burst auf ein Ziel";
        readonly groupDamage: "Erwarteter Gruppenschaden pro Runde";
        readonly envDamage: "Umgebungs-/Zonenschaden pro Runde";
        readonly actions: "Gegnerische Aktionen R1→R5 (inkl. Adds)";
        readonly duration: "Erwartete Kampfdauer";
        readonly healthLevels: (n: number) => string;
        readonly hlSize: "Ø Health-Level-Größe der Gruppe";
        readonly round1Lowest: "Runde-1-Verlust des zerbrechlichsten Charakters";
        readonly warningsHeading: "Balancing-Warnungen";
        readonly noWarnings: "Keine Warnungen — das Konzept sieht spielbar aus.";
        readonly cycleHeading: "Power Cycle";
        readonly addsHeading: "Adds";
        readonly envHeading: "Umgebungsmechanik";
        readonly phaseChangesLabel: "Änderungen";
    };
    readonly nav: {
        readonly back: "Zurueck";
        readonly next: "Weiter";
        readonly generate: "Erzeugen";
    };
    readonly notify: {
        readonly noParty: "Bitte waehle mindestens einen Charakter aus.";
        readonly noName: "Bitte gib einen Namen fuer den Encounter ein.";
        readonly gmOnly: "Nur der Spielleiter kann Encounter erzeugen.";
        readonly done: (folder: string, count: number) => string;
        readonly failed: "Encounter konnte nicht erzeugt werden - siehe Konsole.";
    };
};
//# sourceMappingURL=encounter-generator-copy.d.ts.map
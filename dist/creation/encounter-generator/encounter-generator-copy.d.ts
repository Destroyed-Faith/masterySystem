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
        readonly presetHint: "Fertige Boss-Ideen zum Starten. „Eigenes Konzept“ lässt alle Felder frei.";
        readonly presetNone: "Eigenes Konzept";
        readonly rank: "Enemy Rank / Importance";
        readonly rankHint: "Wie wichtig/schwer der Encounter ist — steuert Budget, Dauer und Druck auf die Gruppe.";
        readonly style: "Primary Combat Style";
        readonly styleHint: "Hauptart, wie der Boss kämpft (Zauber, Martial, Hybrid, Summoner oder Umgebung).";
        readonly primarySpecial: "Primary Special";
        readonly primarySpecialHint: "Das zentrale Diminishing Special, das der Boss im Kampf aufbaut und drückt.";
        readonly secondaryStyle: "Secondary Style (optional)";
        readonly secondaryStyleHint: "Optionaler Zweitstil für Abwechslung im Power-Cycle.";
        readonly actions: "Aktionen pro Runde";
        readonly actionsHint: "Wie viele Angriffs-/Power-Aktionen der Boss pro Runde bekommt.";
        readonly targeting: "Zielmuster";
        readonly targetingHint: "Ob der Boss Einzelziele, Flächen oder beides bevorzugt.";
        readonly phases: "Anzahl Phasen";
        readonly phasesHint: "Boss-Phasen (HP-Bars / Verhaltenswechsel). Mehr Phasen = längerer, gestufter Kampf.";
        readonly cycleLength: "Power-Cycle Länge";
        readonly cycleLengthHint: "Wie viele verschiedene Powers im rotierenden Cycle liegen.";
        readonly cycleStyle: "Cycle-Stil";
        readonly cycleStyleHint: "Wie der Generator die Reihenfolge der Boss-Powers bestimmt.";
        readonly envActions: "Umgebungs-Aktionen pro Runde";
        readonly envActionsHint: "Nur bei Environmental: wie oft die Umgebung pro Runde zuschlägt.";
    };
    readonly adds: {
        readonly heading: "Adds (Verstärkung)";
        readonly body: "Adds sind keine „bisschen Health“ — jeder Add erzeugt jede weitere Runde neue Aktionen. Der Generator rechnet: Add Threat = erwartete Aktionen bis zum Tod × Bedrohung pro Aktion.";
        readonly enabled: "Adds verwenden";
        readonly enabledHint: "Schaltet Verstärkung hinzu. Adds teilen sich das Encounter-Budget mit dem Boss.";
        readonly durability: "Add Durability";
        readonly durabilityHint: "Wie lange ein einzelner Add überlebt — steuert HP/Zähigkeit der Adds.";
        readonly durabilityOptions: {
            readonly minion: "Minion — stirbt an einem erfolgreichen Angriff";
            readonly light: "Light — überlebt einen schwachen Treffer";
            readonly standard: "Standard — überlebt ca. zwei Angriffe";
            readonly elite: "Elite — braucht gezielten Fokus";
        };
        readonly durabilityHints: {
            readonly minion: "Sehr fragil: ein sauberer Treffer reicht. Gut für Mengendruck.";
            readonly light: "Übersteht einen schwachen Hit — kurze Lebensdauer, aber nicht sofort weg.";
            readonly standard: "Braucht etwa zwei Angriffe — spürbarer Fokus-Trade.";
            readonly elite: "Muss bewusst fokussiert werden — teure Adds, hoher Einzeldruck.";
        };
        readonly pressure: "Add Pressure";
        readonly pressureHint: "Wie gefährlich die Adds sind, wenn sie leben und handeln dürfen.";
        readonly pressureOptions: {
            readonly harassment: "Harassment — einzeln nahezu irrelevant";
            readonly noticeable: "Noticeable — ~½ Health Level pro Runde";
            readonly dangerous: "Dangerous in Groups — ~1 Health Level pro Runde";
            readonly lethal: "Lethal if Ignored — volle Population schaltet einen Charakter in 2 Runden aus";
        };
        readonly pressureHints: {
            readonly harassment: "Einzeln kaum relevant — Druck entsteht erst durch Menge und Zeit.";
            readonly noticeable: "Spürbarer Chip-Schaden (~½ Health Level pro Runde bei Zielpopulation).";
            readonly dangerous: "Gruppen von Adds kosten ~1 Health Level pro Runde — Ignorieren tut weh.";
            readonly lethal: "Volle Population killt/ausschaltet einen Charakter in ca. 2 Runden.";
        };
        readonly targetActive: "Ziel-Population (gleichzeitig aktiv)";
        readonly targetActiveHint: "Wie viele Adds idealerweise gleichzeitig auf dem Feld sein sollen.";
        readonly maxActive: "Maximum aktiv (0 = automatisch)";
        readonly maxActiveHint: "Harte Obergrenze gleichzeitiger Adds. 0 = Generator wählt automatisch.";
        readonly spawnPerRound: "Spawn-Rate (pro Runde)";
        readonly spawnPerRoundHint: "Wie viele neue Adds pro Spawn-Tick erscheinen (je nach Muster).";
        readonly spawnPattern: "Spawn-Muster";
        readonly spawnPatternHint: "Wann Adds erscheinen — kontinuierlich, Burst, Phasenstart oder Trigger.";
        readonly spawnPatternOptions: {
            readonly continuous: "Continuous — jede Runde";
            readonly burst: "Burst — alle zu Beginn";
            readonly 'phase-start': "Phase Start — bei Phasenwechsel";
            readonly triggered: "Triggered — durch Ereignis";
        };
        readonly spawnPatternHints: {
            readonly continuous: "Gleichmäßiger Nachschub jede Runde.";
            readonly burst: "Viele Adds sofort — dann weniger oder kein Nachzug.";
            readonly 'phase-start': "Neue Welle, wenn der Boss die Phase wechselt.";
            readonly triggered: "Spawn an ein Ereignis gekoppelt (z. B. Boss-Aktion / Threshold).";
        };
        readonly summonCost: "Beschwören kostet den Boss eine Aktion";
        readonly summonCostHint: "Wenn aktiv, muss der Boss eine Aktion fürs Spawnen opfern — weniger eigene Offensive.";
        readonly disabledNote: "Ohne Adds bekommt der Boss das volle Encounter-Budget.";
    };
    readonly threat: {
        readonly heading: "Threat Report";
        readonly hitChances: "Trefferchance (niedrig / Ø / hoch Ausweichen)";
        readonly aoeHitChance: "AoE-Trefferchance (pro Kreatur vs Ø Ausweichen)";
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
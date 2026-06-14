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
        readonly heading: "Encounter benennen & erzeugen";
        readonly body: "Es wird ein neuer Actor-Ordner mit diesem Namen angelegt. Die erzeugten NSC-Actors landen darin und koennen aufs Feld gezogen werden (nur noch Bilder ergaenzen).";
        readonly label: "Ordner-/Bossname";
        readonly placeholder: "z.B. Der Aschekoenig";
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
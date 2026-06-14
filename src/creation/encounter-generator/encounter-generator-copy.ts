/**
 * Encounter Generator — player-facing copy (German).
 */

export const ENCOUNTER_GENERATOR_COPY = {
  title: 'Encounter-Generator',
  progress: (step: number, total: number) => `Schritt ${step} von ${total}`,

  party: {
    heading: 'Wer nimmt am Encounter teil?',
    body: 'Waehle die Charaktere, die als Gruppe gegen den Encounter antreten. Aus ihren Werten (HP, Ausweichen, Ruestung, Angriffspool, Schaden) wird der Gegner berechnet.',
    empty: 'Keine Charaktere gefunden. Lege zuerst Charakter-Actors an.',
    selected: (n: number) => `${n} ausgewaehlt`,
    metricsHeading: 'Gruppen-Kennwerte',
  },

  difficulty: {
    heading: 'Wie hart soll der Encounter sein?',
    body: 'Steuert Kampfdauer (Boss-HP), Trefferchancen und wie hart Boss-Treffer einschlagen.',
    moderate: {
      title: 'Moderat',
      body: 'Kuerzerer Kampf (~4 Runden Boss). Gruppe trifft oft, Boss-Treffer tun ~20% der HP weh.',
    },
    hard: {
      title: 'Hart (Souls-like)',
      body: 'Langer Kampf (~6 Runden Boss). Gruppe trifft ~65%, Boss-Treffer ~32% der HP. Fehler sind teuer.',
    },
    brutal: {
      title: 'Brutal',
      body: 'Sehr langer Kampf (~8 Runden Boss). Gruppe trifft ~58%, Boss-Treffer ~45% der HP. Unverzeihlich.',
    },
  },

  composition: {
    heading: 'Zusammensetzung des Encounters',
    body: 'Lege fest, aus wie vielen Bossen und Minions der Encounter besteht.',
    bossCount: 'Anzahl Bosse',
    phasesPerBoss: 'Phasen pro Boss',
    minionCount: 'Minions pro Welle',
    respawnCadence: 'Minion-Respawn',
    cadenceNone: 'Kein Respawn',
    cadenceEvery: (n: number) => (n === 1 ? 'Jede Runde' : `Alle ${n} Runden`),
    respawnNote: 'Bosse bleiben bis zum Sieg. Minions tauchen im gewaehlten Takt wieder auf (Empfehlung im naechsten Schritt).',
  },

  review: {
    heading: 'Vorschlag pruefen & anpassen',
    body: 'Alle Werte sind editierbar. Aenderungen wirken sich beim Erzeugen aus.',
    bossesHeading: 'Bosse',
    minionsHeading: 'Minions',
    respawnHeading: 'Respawn-Empfehlung',
    recommend: (perWave: number, cadence: number) =>
      cadence > 0
        ? `Empfehlung: ${perWave} Minions ${cadence === 1 ? 'jede Runde' : `alle ${cadence} Runden`}.`
        : 'Empfehlung: kein Respawn noetig.',
    col: {
      name: 'Name',
      phase: 'Phase',
      hp: 'HP',
      evade: 'Ausweichen',
      armor: 'Ruestung',
      attackDice: 'Angriffs-W8',
      damageDice: 'Schadens-W8',
      slots: 'Angriffe/Runde',
      mr: 'MR',
    },
    note: 'Hinweis: Ausweichen wird in-engine aus MR und Beweglichkeit erzeugt; Ruestung entspricht der MR. Phasen-Wechsel steuerst du im NSC-Bogen (aktive Phase).',
  },

  name: {
    heading: 'Encounter benennen & erzeugen',
    body: 'Es wird ein neuer Actor-Ordner mit diesem Namen angelegt. Die erzeugten NSC-Actors landen darin und koennen aufs Feld gezogen werden (nur noch Bilder ergaenzen).',
    label: 'Ordner-/Bossname',
    placeholder: 'z.B. Der Aschekoenig',
  },

  nav: {
    back: 'Zurueck',
    next: 'Weiter',
    generate: 'Erzeugen',
  },

  notify: {
    noParty: 'Bitte waehle mindestens einen Charakter aus.',
    noName: 'Bitte gib einen Namen fuer den Encounter ein.',
    gmOnly: 'Nur der Spielleiter kann Encounter erzeugen.',
    done: (folder: string, count: number) => `Encounter "${folder}" erzeugt (${count} Actors).`,
    failed: 'Encounter konnte nicht erzeugt werden - siehe Konsole.',
  },
} as const;

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
    heading: 'Encounter-Projekt benennen & erzeugen',
    body: 'Es entsteht ein Encounter-Projekt: ein Ordner mit Unterordnern (Boss, ggf. Adds und Encounter Mechanics), die fertigen NSC-Actors sowie ein Journal mit Encounter Summary, Threat Report und druckbarem NPC-Sheet.',
    label: 'Encounter-Name',
    placeholder: 'z.B. The Red Priest',
  },

  concept: {
    heading: 'Kampfidee definieren',
    body: 'Du legst fest, was der Gegner tun soll — der Generator entscheidet, welche Werte dafür nötig sind. Adds und Umgebungsmechanik teilen sich das Encounter-Budget mit dem Boss.',
    preset: 'Archetyp-Vorlage',
    presetNone: 'Eigenes Konzept',
    rank: 'Enemy Rank / Importance',
    style: 'Primary Combat Style',
    primarySpecial: 'Primary Special',
    secondaryStyle: 'Secondary Style (optional)',
    actions: 'Aktionen pro Runde',
    targeting: 'Zielmuster',
    phases: 'Anzahl Phasen',
    cycleLength: 'Power-Cycle Länge',
    cycleStyle: 'Cycle-Stil',
    envActions: 'Umgebungs-Aktionen pro Runde',
  },

  adds: {
    heading: 'Adds (Verstärkung)',
    body: 'Adds sind keine „bisschen Health“ — jeder Add erzeugt jede weitere Runde neue Aktionen. Der Generator rechnet: Add Threat = erwartete Aktionen bis zum Tod × Bedrohung pro Aktion.',
    enabled: 'Adds verwenden',
    durability: 'Add Durability',
    durabilityOptions: {
      minion: 'Minion — stirbt an einem erfolgreichen Angriff',
      light: 'Light — überlebt einen schwachen Treffer',
      standard: 'Standard — überlebt ca. zwei Angriffe',
      elite: 'Elite — braucht gezielten Fokus',
    },
    pressure: 'Add Pressure',
    pressureOptions: {
      harassment: 'Harassment — einzeln nahezu irrelevant',
      noticeable: 'Noticeable — ~½ Health Level pro Runde',
      dangerous: 'Dangerous in Groups — ~1 Health Level pro Runde',
      lethal: 'Lethal if Ignored — volle Population schaltet einen Charakter in 2 Runden aus',
    },
    targetActive: 'Ziel-Population (gleichzeitig aktiv)',
    maxActive: 'Maximum aktiv (0 = automatisch)',
    spawnPerRound: 'Spawn-Rate (pro Runde)',
    spawnPattern: 'Spawn-Muster',
    spawnPatternOptions: {
      continuous: 'Continuous — jede Runde',
      burst: 'Burst — alle zu Beginn',
      'phase-start': 'Phase Start — bei Phasenwechsel',
      triggered: 'Triggered — durch Ereignis',
    },
    summonCost: 'Beschwören kostet den Boss eine Aktion',
    disabledNote: 'Ohne Adds bekommt der Boss das volle Encounter-Budget.',
  },

  threat: {
    heading: 'Threat Report',
    hitChances: 'Trefferchance (niedrig / Ø / hoch Ausweichen)',
    aoeHitChance: 'AoE-Trefferchance (fixe Area TN, ignoriert Ausweichen)',
    rawDamage: 'Erwarteter Schaden pro Treffer (vor Rüstung)',
    afterArmor: 'Nach Ø Rüstung/DR',
    persistent: 'Persistenter Schaden pro Runde (ignoriert Rüstung)',
    burst: 'Max. Runde-1-Burst auf ein Ziel',
    groupDamage: 'Erwarteter Gruppenschaden pro Runde',
    envDamage: 'Umgebungs-/Zonenschaden pro Runde',
    actions: 'Gegnerische Aktionen R1→R5 (inkl. Adds)',
    duration: 'Erwartete Kampfdauer',
    healthLevels: (n: number) => `≈ ${n} Health Levels`,
    hlSize: 'Ø Health-Level-Größe der Gruppe',
    round1Lowest: 'Runde-1-Verlust des zerbrechlichsten Charakters',
    warningsHeading: 'Balancing-Warnungen',
    noWarnings: 'Keine Warnungen — das Konzept sieht spielbar aus.',
    cycleHeading: 'Power Cycle',
    addsHeading: 'Adds',
    envHeading: 'Umgebungsmechanik',
    phaseChangesLabel: 'Änderungen',
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

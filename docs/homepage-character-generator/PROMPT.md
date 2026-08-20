# Prompt: „Mastery System / Destroyed Faith" — Character Generator für die Homepage

> **So benutzt du dieses Dokument:** Kopiere den kompletten Ordner
> `docs/homepage-character-generator/` (dieses Dokument + `data/*.json`) zusammen mit den
> unter **Abschnitt 1** gelisteten CSS-/Referenzdateien in das Homepage-Projekt und gib
> dieses Dokument als Prompt an den umsetzenden Entwickler / die KI. Alles Nötige steht
> hier drin; die JSON-Dateien sind 1:1 aus dem Foundry-System exportiert und sind die
> **einzige Wahrheit** für Inhalte (keine Texte erfinden, nichts umformulieren).

---

## 0. Auftrag

Baue einen **Web-Charakter-Generator** (statisch, ohne Foundry VTT), der das Look and Feel
des Foundry-Charakterbogens des Systems „Mastery System / Destroyed Faith" exakt nachbildet.
Der Generator führt durch fünf Schritte:

1. **Attributes** — Attribute verteilen
2. **Echo** — Echo wählen (inkl. Sub-Choices, Unbound-Identitäten, Start-Karte, Echo-Artefakten) + **Pick Languages**
3. **Skills** — Skills verteilen
4. **Powers** — nur der **Combat Package Wizard** (kompletter Durchlauf)
5. **Disadvantages** — Nachteile wählen und konfigurieren

**Nicht nachbauen:** Porträt/Token-Bereich, XP/Reroll-Boxen, Equipment-Tab, Summons,
Rituals, Minor Magic, Kampfwerte-Chips, Health/Stress-Bars. Im Header steht **nur ein
Namensfeld**. Es gibt keine Würfel-Funktionalität — Roll-Buttons entfallen oder sind rein
dekorativ.

**Endprodukt:** Nach dem Durchlauf exportiert der Generator ein JSON (Schema in
Abschnitt 10), das der Spieler herunterladen oder kopieren kann.

Framework ist frei (React/Vue/Svelte/Vanilla), aber das CSS soll auf den mitgelieferten
Stylesheets basieren — Klassen übernehmen statt neu erfinden, damit der Look identisch ist.

---

## 1. Transfer-Paket

### 1.1 Daten (in diesem Ordner, `data/`) — 1:1 aus dem System exportiert

> Regenerieren nach Regeländerungen im System: `npm run build`, dann
> `node scripts/export-homepage-generator-data.mjs` (im Systemprojekt).

| Datei | Inhalt |
|---|---|
| `creation-rules.json` | Verteilungsregeln: Attribut-Verteilung `[8,8,6,6,4,4,2]`, erlaubte Werte `[2,4,6,8]`, 40 Skill-Punkte, max. Skill 4, Disadvantages 0–8 Punkte |
| `skills.json` | Alle Skill-Kategorien und **alle Skills** mit Name, zugeordneten Attributen und Beschreibung (Tooltip-Text) |
| `echoes.json` | **Alle 7 Echoes** in Anzeige-Reihenfolge (`order`): Humans, Dwarfs, Elorians, Sentinels, Titanborn, Dragonborn, Unbound — mit Summary, Typ, Größe, Speed, Core Traits, Sub-Choices, Echo-Karten-Deck (`cards` mit Optionen), Sprachen-Lock etc. |
| `unbound-identities.json` | Die Unbound-Responses (Beast / 3 Witches / 3 Banes) mit Artefaktname, Slot, Summary, Technical-Text; plus Predator Shapes & Predator Stones |
| `echo-artifacts.json` | Echo-Artefakte (Name, Slot, Beschreibung) + `rules` pro Echo: wie viele Artefakte bei der Erstellung Pflicht/Maximum sind, welche Keys wählbar sind, Exklusiv-Gruppen (z. B. Wyrm Scales Heavy vs. Light) |
| `languages.json` | Alle Sprachen, `commonLanguageKey` (immer gesetzt & gesperrt), `startingPickedLanguages` (min. 1 zusätzlich), `echoLockedLanguages` (Echo ⇒ fest zugeordnete Sprache) |
| `disadvantages.json` | **Alle Disadvantages** mit Punkten, Beschreibung, Mechanik-Text, Formularfeldern (`fields`), Info-Sektionen (`infoSections`), Beispiel-Presets (`examplePresets`) |
| `tower-wizard-copy.json` | **Alle Texte** des Combat Package Wizards (Titel, Fließtexte, Button-Labels, Hinweise) — wörtlich verwenden |
| `tower-wizard-packages.json` | Wizard-Struktur: `stepOrder`, Defense-Pakete, Offense-Pakete, Active-Buff-Optionen — mit Labels, Erklärtexten, Mechanik-Labels |

### 1.2 Styles (aus dem Systemordner `styles/` mitkopieren)

| Datei | Zweck |
|---|---|
| `styles/df-rulebook-ui.css` | **Basis-Palette** (`--df-*` Variablen), Dialog-Chrome, Buttons, Google-Fonts-Import |
| `styles/mastery-themes.css` | `--ms-*` Variablen (Panel-Farben, Fonts, Radius) |
| `styles/character-sheet.css` | **Der Kern**: Tab-Bookmarks, Attribut-Karten, Skill-Zeilen, Echo-Dialog (`echo-*`, `unbound-*` Klassen), Disadvantage-Dialoge (`disadvantage-*`), Gold-Glow (`creation-tab-hint`) — Klassen 1:1 wiederverwenden |
| `styles/tower-wizard.css` | Combat Package Wizard (`tower-wizard-*` Klassen) |

Nicht benötigte Selektoren (`.window-app`, `#chat-log`, NPC, Combat …) dürfen entfernt
werden, aber **Werte nicht ändern**.

### 1.3 Referenz-Markup (nur zum Nachschlagen, nicht direkt lauffähig)

| Datei | Was dort steht |
|---|---|
| `templates/actor/character-sheet.hbs` | Markup des gesamten Bogens: Tab-Nav (~Z. 275), Attributes-Tab (~Z. 467), Skills-Tab (~Z. 1268), Disadvantages-Tab (~Z. 2108) |
| `src/sheets/character-sheet-echo-dialog.ts` | Komplettes Markup des Echo-Dialogs (Formular, Preview, Sub-Choice-Radios, Unbound-Board, Artefakt-Picker, Karten-Picker) |
| `src/sheets/languages-dialog.ts` | Markup des Sprachen-Pickers |
| `templates/dialogs/disadvantage-config.hbs` | Markup des Disadvantage-Konfigurations-Dialogs |
| `templates/creation/tower-wizard/wizard-shell.hbs` | Komplettes Markup des Combat Package Wizards |

### 1.4 Fonts

Google Fonts (Import steht schon in `df-rulebook-ui.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
```

- Überschriften: `'Cormorant Garamond', serif` (im System teils `Laviossa`/`Cinzel Decorative` als Head-Font — Cinzel Decorative als Web-Fallback verwenden)
- Fließtext/Buttons: `'Cormorant Garamond', serif`
- Icons: **Font Awesome 6** (free), Klassen wie `fas fa-fist-raised`, `fa-mask`, `fa-cogs`, `fa-magic`, `fa-exclamation-triangle`, `fa-paw`, `fa-hat-wizard`, `fa-crosshairs`, `fa-plus`, `fa-minus`

---

## 2. Design-System (Pflichtwerte)

Dunkles „Rulebook"-Theme. Diese Token exakt übernehmen:

```css
:root {
  --df-bg-primary: #20272B;     /* Seiten-/Fensterhintergrund */
  --df-bg-panel: #2a3136;       /* Karten & Panels */
  --df-bg-header: #1b2124;      /* Kopfzeilen, Hover-Zustand */
  --df-text-primary: #d0d0d0;
  --df-text-secondary: #a0a0a0;
  --df-text-muted: #707070;
  --df-border-primary: #3a3f44;
  --df-border-subtle: rgba(255, 255, 255, 0.1);
  --df-border-highlight: rgba(255, 255, 255, 0.2);
  --df-accent-subtle: rgba(255, 255, 255, 0.15);
  --df-shadow: rgba(0, 0, 0, 0.5);
  --ms-danger: #7b3a3a;
  --ms-success: #3f6b54;
  --ms-radius: 10px;
}
```

- Akzent-Rot (Primär-Buttons wie „General Items"): `linear-gradient(135deg, #8b0000 0%, #a00000 100%)`, Border `#8b0000`
- **Gold-Glow** (offene Creation-Schritte): `#ffd700`, Text `#ffe9a8`, pulsierende `box-shadow` (Keyframes siehe 3.3)
- Panels: `border: 1px/2px solid var(--df-border-primary)`, `border-radius: 6–8px`, `box-shadow: 0 2px 8px var(--df-shadow)`
- Hover: Hintergrund → `--df-bg-header`, Border → `--df-border-highlight`; **kein** `transform: translateY` auf Buttons (führte im Original zu Klick-Problemen)

---

## 3. Globales Layout

### 3.1 Rahmen

- Content-Fläche ca. **1054 × 809 px** (Desktop), dunkles Fenster auf `--df-bg-primary`, Rand `--df-border-primary`. Auf der Homepage darf es responsive sein, Desktop-Layout hat Priorität.
- **Header:** nur ein Textfeld **„Name"** (breit, dunkel, `--df-bg-panel`, 1px Border) — sonst nichts.
- Unter dem Header eine **Status-/Restanzeige** (siehe 3.4) und der **Finalize-Button**.

### 3.2 Tab-Navigation — Bookmarks an der rechten Seite

Vertikale Lesezeichen-Reiter an der **rechten Außenkante**, Schrift um 90° gedreht
(`writing-mode: vertical-rl`), abgerundet links (`border-radius: 8px 0 0 8px`), Border
rechts offen. Reiter in dieser Reihenfolge:

1. Attributes (`fa-fist-raised`)
2. Echo (`fa-mask`)
3. Skills (`fa-cogs`)
4. Powers (`fa-magic`)
5. Disadvantages (`fa-exclamation-triangle`)

Zustände (Klassen aus `character-sheet.css` → `.sheet-tabs .item`):

- normal: `--df-bg-panel`, Text `--df-text-secondary`, Schatten `-2px 0 4px var(--df-shadow)`
- hover: Hintergrund `--df-bg-header`, `transform: translateX(-5px)`
- aktiv (`.active`): `translateX(-8px)`, fett, hellere Border

### 3.3 Gold-Glow: offene Schritte

**Jeder noch nicht erledigte Schritt glüht gleichzeitig** (Klasse `creation-tab-hint`):

```css
.sheet-tabs .item.creation-tab-hint {
  border-color: #ffd700;
  color: #ffe9a8;
  box-shadow: -2px 0 10px rgba(255, 215, 0, 0.4), 0 0 10px rgba(255, 215, 0, 0.28);
  animation: creation-tab-pulse 1.8s ease-in-out infinite;
}
@keyframes creation-tab-pulse {
  0%, 100% { box-shadow: -2px 0 8px rgba(255,215,0,0.32), 0 0 8px rgba(255,215,0,0.2); }
  50%      { box-shadow: -4px 0 16px rgba(255,215,0,0.62), 0 0 16px rgba(255,215,0,0.42); }
}
@media (prefers-reduced-motion: reduce) {
  .sheet-tabs .item.creation-tab-hint { animation: none; }
}
```

„Erledigt" heißt:

| Schritt | fertig wenn … |
|---|---|
| Attributes | Verteilung exakt 2×8, 2×6, 2×4, 1×2 (Rest 2) |
| Echo | Echo gewählt + Pflicht-Sub-Choice + ggf. Veiled Form + Pflicht-Artefakte + Start-Karte + Sprachen gültig |
| Skills | alle 40 Punkte verteilt (10 Skills à 4) |
| Powers | Combat Package Wizard abgeschlossen (6 Powers) |
| Disadvantages | Punkte innerhalb 0–8 (praktisch: sobald der Nutzer den Schritt bestätigt) |

### 3.4 Statuszeile & Finalize

Solange nicht alles fertig ist, zeigt eine Zeile den Reststand (Textmuster aus dem Original):

> `Remaining: Attributes (…/2×8, …/2×6, …/2×4, …/1×2), Skills (N remaining), Powers (n/6), Disadvantages (p/0–8 pts), Echo (not chosen), Languages (need 1+ besides Common).`

Sind alle Bedingungen erfüllt, erscheint stattdessen der Button
**„✓ Finalize Character Creation"** (Klasse `finalize-creation`) — er löst den JSON-Export aus.

---

## 4. Step 1 — Attributes

Datenquelle: `creation-rules.json`.

### 4.1 Attribute (7 Stück, mit Icon)

| Attribut | Icon |
|---|---|
| Might | `fa-dumbbell` |
| Agility | `fa-running` |
| Vitality | `fa-heartbeat` |
| Wits | `fa-bolt` |
| Intellect | `fa-brain` |
| Resolve | `fa-shield-alt` |
| Influence | `fa-comments` |

### 4.2 Layout

- Grid aus **Attribut-Karten** (`.attribute-card`): Panel `--df-bg-panel`, 2px Border, Radius 8px. Karten-Kopf: Name links (mit Icon), **rundes Wertefeld** rechts.
- Hinweistext über dem Grid (wörtlich übernehmen):
  > 👆 Tipp: Klick auf das **runde Feld**, um **8 / 6 / 4 / 2** zu wählen. **Grün** passt, **Rot** muss noch verteilt werden.

### 4.3 Verhalten (Creation-Modus)

- Jedes Attribut startet bei **2**.
- Das runde Wertefeld (`.attribute-value--creation`) ist ein **verstecktes `<select>`** über einem Kreis: Klick öffnet Optionen **2 / 4 / 6 / 8**; kleiner `fa-caret-down` als Griff.
- Verteilungsbudget: **2× 8, 2× 6, 2× 4, 1× 2** — der Rest bleibt auf 2. Optionen, deren Kontingent verbraucht ist, werden **ausgeblendet** (nicht disabled).
- Farb-Feedback pro Kreis: Klasse `is-ok` (grüner Rand, `--ms-success`) wenn der aktuelle Wert im Budget aufgeht, sonst `is-open` (roter Rand, `--ms-danger`).
- Zähler im Kopfbereich (wie `points-box creation-points-attr`): „Attribute Distribution: 2×8, 2×6, 2×4, 1×2" mit Live-Anzeige, wie viele 8er/6er/4er/2er noch offen sind.
- „Minor Expressions"-Platzhalter unter jeder Karte, ausgegraut, Text: *„Minor Expressions nach Abschluss der Erstellung"* (nur Optik, keine Funktion).

---

## 5. Step 2 — Echo

Datenquellen: `echoes.json`, `unbound-identities.json`, `echo-artifacts.json`, `languages.json`.
Referenz-Markup: `src/sheets/character-sheet-echo-dialog.ts`.

### 5.1 Aufbau

Statt Foundry-Dialog: eine Seite/Panel im gleichen Stil (`echo-creation-form`).

1. **Echo-Auswahl** — die 7 Echoes in `echoes.json → order` (das sind die JSON-Keys):
   `humans, dwarfs, elorians, sentinels, titanborn, dragonborn, unbound`
   (Anzeigename = `name`-Feld der Daten).
   Umsetzung als Auswahl-Grid oder Dropdown — beim Öffnen/Auswählen erscheint sofort die **Preview**.

2. **Preview** (`.echo-traits-preview`): pro Echo
   - Meta-Zeile: **Type:** `creatureType` · **Size:** `size` · **Speed:** `speed` m
   - `summary` (Fließtext), dazu `tagline`/`theme` als Untertitel
   - **Core Traits** als Liste (Name fett, Usage, Effekt) — nur wenn `coreTraits` nicht leer ist (aktuell nur Unbound).

3. **Sub-Choice** (nur wenn `subChoices` vorhanden): **Sentinels** („Order Protocol", 3 Optionen) und **Titanborn** („Titan Stone Affinity", 7 Optionen).
   Radio-Liste im Stil `.echo-pick-row`: Radio links, rechts Name fett + Flavor kursiv + Effekt-Text.
   Label über der Liste = `subChoiceLabel` aus den Daten. Humans, Dwarfs, Elorians und Dragonborn haben keine Sub-Choice.

4. **Unbound-Response-Board** (nur `unbound`; ersetzt die normale Sub-Choice-Liste):
   Drei Gruppen-Sektionen **Beasts / Witches / Banes** (`unbound-identity-group`), darin
   Karten-Grid (`unbound-identity-grid`). Jede Karte (`unbound-identity-card`):
   Icon-Feld links (Beasts `fa-paw`, Witches `fa-hat-wizard`, Banes `fa-crosshairs`),
   rechts Name fett, Zeile „Artefaktname · Slot", Summary, Technical-Text.
   Auswahl = Radio; gewählte Karte bekommt `is-selected` (goldene Border).
   **Beast-Extra** (`unbound-predator-extras`): Predator-Shape-Select + Predator-Stone-Radios
   (aus `unbound-identities.json`). Der Stone bestimmt das Artefakt (Might/Wits/Intellect-Crown).

5. **Veiled Form** (nur Dragonborn, Pflicht): Select mit allen anderen Echoes.
   Hinweistext: *„(appearance only — no mechanical benefit)"*.

6. **Echo Artifacts** (`echo-artifacts.json`): pro Echo geben `rules[echoKey]`
   `requiredAtCreation` / `maxAtCreation` / `availableKeys` / `exclusiveGroups` vor.
   Checkbox-Liste im `.echo-pick-row`-Stil mit Name — Slot — Beschreibung.
   Bei Unbound **keine** Auswahl zeigen: das Artefakt folgt automatisch aus der Response
   (bzw. dem Predator Stone).

7. **Start Card** (Pflicht, 1 aus dem Deck): Radio-Liste aus `echoes.json → echoes[key].deck`
   (jedes Echo hat 4 Karten; Karte = `{ id, name, trigger, options }`). Anzeige: Name + Trigger,
   darunter Karten-Preview mit den nummerierten `options` (`label`, *Skill: …*, `description`).

### 5.2 Pick Languages

Eigener Dialog/Abschnitt (Referenz `src/sheets/languages-dialog.ts`), Daten `languages.json`:

- Button **„🌐 Pick Languages"** (Klasse `open-languages-btn`; solange ungültig zusätzlich Klasse `needs-pick` = goldener Glow).
- Liste aller Sprachen als Checkboxen mit Beschreibung.
- **Common Tongue** ist immer gewählt und **gesperrt**.
- Hat das gewählte Echo einen Eintrag in `echoLockedLanguages`, ist diese Sprache ebenfalls fest gesetzt und gesperrt.
- Gültig ab **mindestens 1 zusätzlich** gewählter Sprache (`startingPickedLanguages`).
- Anzeige neben dem Button: gewählte Sprachen als kommaseparierte Liste.

---

## 6. Step 3 — Skills

Datenquelle: `skills.json`. Referenz: `character-sheet.hbs` ab Z. 1268.

### 6.1 Layout

- Kategorien in fester Reihenfolge mit Icon-Überschrift (`.category-header-compact`):
  Perception 👁 (`fa-eye`), Physical (`fa-running`), Knowledge & Craft (`fa-book`),
  Social (`fa-comments`), Survival (`fa-tree`), Martial (`fa-sword` bzw. `fa-hand-fist` als FA-Free-Fallback).
- **Alle Skills** aus `skills.json` anzeigen — komplette Liste, nichts weglassen.
- Jede Skill-Zeile (`.skill-row-compact`), von links nach rechts:
  1. *(optional, rein dekorativ)* Pool-Chip(s) wie im Original (`.skill-roll-compact`): Label `Nd8 keep 2`. Formel: Skill 4 ⇒ voller Pool = Attributwert; Skill 0 ⇒ halber Pool = `round(Attribut/2)`. Halbe Pools dunkler (`half-pool`), volle heller (`full-pool`).
  2. **Skill-Name** mit gepunkteter Unterstreichung; Hover/Focus zeigt Tooltip mit der `description` aus den Daten (dunkles Panel, `.skill-name-tooltip`).
  3. **Attribut-Badges** (`.attr-badge`): kleine Pills mit den zugeordneten Attributen.
  4. **Wert** (0 oder 4) + **+/− Buttons** (`.skill-increase` / `.skill-decrease`, runde 22px-Buttons).

### 6.2 Regeln

- Budget: **40 Punkte**. `+` setzt den Skill von 0 auf **4** (kostet 4 Punkte), `−` setzt zurück auf **0** (erstattet 4). **Keine Zwischenwerte** (kein 1/2/3).
- `+` ist disabled, wenn der Skill schon 4 hat oder weniger als 4 Punkte übrig sind; `−` ist disabled bei 0.
- Kopfzeile: „Skill Points Remaining: **N**" (Hinweis wie im Original: *„+ sets a skill to 4; only 0 or 4 allowed"*).
- Fertig bei exakt 0 Restpunkten (= 10 Skills auf 4).

---

## 7. Step 4 — Powers: Combat Package Wizard

Datenquellen: `tower-wizard-copy.json` (alle Texte, wörtlich!) und
`tower-wizard-packages.json` (Struktur). Referenz-Markup:
`templates/creation/tower-wizard/wizard-shell.hbs`, Styles `styles/tower-wizard.css`.

### 7.1 Einstieg

Auf dem Powers-Tab nur ein Intro-Panel (Text wörtlich):

> Choose your defensive foundation and offensive style. Every character gets **2 Passive (R4)**, **1 Active Buff (R4)**, **1 Reaction (R4)**, and **2 Active (R2)** — no Movement Power.

Darunter der Button **„✨ Combat Package Wizard"** (`.open-tower-wizard-btn`).
(Den „Manual Combat Package"-Button weglassen — auf der Homepage gibt es nur den Wizard.)

### 7.2 Wizard-Ablauf

Vollbild-Overlay/Modal im Stil `tower-wizard-dialog`: Kopf mit Fortschritt
(„Step X of Y — Titel"), Body mit Karten, Fuß mit **Back / Next / Finish**.

Schritt-Reihenfolge aus `tower-wizard-packages.json → stepOrder`; sichtbare Schritte
hängen von der Auswahl ab (z. B. erscheint der Delivery-Schritt nur bei Offense-Paketen
mit Melee/Ranged-Wahl; ein Replacement-Buff-Schritt nur, wenn Defense- und Offense-Paket
denselben Active Buff ergäben). Grundgerüst:

1. **Defense-Paket wählen** — Karten-Grid (`tower-wizard-card`): Titel, Erklärtext, Mechanik-Label; gewählte Karte `is-selected`. Daten: `defensePackages` (id, label, explanation, mechanicLabel, …).
2. **Passive-1-Variante** — Vorschau des Pakets + Varianten-Karten (empfohlene Variante mit Chip „Recommended").
3. **Zweites Passive** — Intent-Gruppen mit Titel/Hinweis, darin Passive-Karten mit Mechanik-Preview.
4. **Active Buff** — abhängig vom Defense-Paket (Default-Preview + Alternativen aus `offensiveActiveBuffs`).
5. **Offense-Paket wählen** — Karten wie bei Defense. Pakete mit ids aus `offensePackages`; die in `hiddenOffenseIds` gelisteten (`ruin`, `weaken-save`) **nicht anzeigen**.
6. **Delivery / Specials** (paketabhängig) — Melee vs. Ranged bzw. Special-Fokus; Texte aus `tower-wizard-copy.json → delivery/specials`.
7. **Review** — Tabelle aller 6 Powers: Name, Kategorie, Rank (2 Passive R4, 1 Active Buff R4, 1 Reaction R4, 2 Active R2). **Finish** speichert die Auswahl in den Generator-State.

Alle Überschriften, Fließtexte, Warnungen und Button-Beschriftungen kommen **wörtlich**
aus `tower-wizard-copy.json`. Detail-Mechaniktexte einzelner Powers, die dort nicht
enthalten sind, stehen in `tower-wizard-packages.json` (`explanation`, `mechanicLabel`,
`description`-Felder der Karten) — nur diese anzeigen, nichts dazu erfinden.

Nach Abschluss zeigt der Powers-Tab die 6 gewählten Powers als einfache Karten-Liste
(Name + Kategorie + Rank) und einen Button „Wizard erneut ausführen" (setzt die Auswahl zurück).

---

## 8. Step 5 — Disadvantages

Datenquelle: `disadvantages.json`. Referenz: `character-sheet.hbs` ab Z. 2108,
`templates/dialogs/disadvantage-config.hbs`, Dialog-Styles in `character-sheet.css`
(`disadvantage-selection-dialog`, `disadvantage-config-dialog-styled`).

### 8.1 Übersicht (Tab-Inhalt)

- Kopf: „⚠ Disadvantages" + Zähler **„Total Disadvantage Points: X / 8 (min. 0)"**.
- Button **„➕ Add Disadvantage"** (`.add-disadvantage-btn`).
- Gewählte Disadvantages als Karten-Liste: Name, Punkte-Badge, vom Nutzer eingegebener Titel/Notiz, Edit-✏️- und Remove-🗑-Buttons.
- Info-Box unten (wörtlich, Werte aus `creation-rules.json`):
  > ℹ️ You must take at least **0** and at most **8** points of disadvantages to finalize creation. Total points set your starting Reroll Points.

### 8.2 Auswahl-Dialog („Add Disadvantage")

Dunkles Modal im Rulebook-Stil (Klassen `disadvantage-selection-dialog`):
Liste aller 7 Einträge aus `disadvantages.json` — pro Zeile Name, Punkte und Kurzbeschreibung.
Punkte stehen in `basePoints`: entweder eine feste Zahl (z. B. Addiction = 2, Vulnerability = 3)
oder ein Array wie `[1, 2, 3]` (variabel — der tatsächliche Wert folgt dem Select-Feld
`rank`/`tier`/`severity` im Konfigurations-Dialog; Anzeige in der Liste dann „1–3").
Klick wählt aus und öffnet den Konfigurations-Dialog.
Bereits gewählte, nicht wiederholbare Einträge sind disabled.

### 8.3 Konfigurations-Dialog

Struktur exakt wie `disadvantage-config.hbs`:

- Kopf: Name des Disadvantage.
- Bei Einträgen mit `collapsibleRulesBelow`: kompakter Intro-Einzeiler, Felder oben, darunter `<details>` „Rules, structure & full description" mit `infoSections` (je eigenes `<details>` mit Titel + Liste), `description` und **Mechanics:** `effect`.
- Sonst: Info-Block oben (infoSections/description/effect), darunter ggf. **Examples**-Select (`examplePresets`; Auswahl füllt das Ziel-Textfeld — kann bei Einträgen leer sein), dann die Felder.
- Felder aus `fields`: `text` / `number` (min/max) / `select` (options) / `textarea` (rows) — Pflichtfelder mit rotem `*`.
- Buttons: **Save** (rot-Gradient) / **Cancel**.
- Punkte-Logik: festes `basePoints` direkt übernehmen; ist `basePoints` ein Array, bestimmt das Select-Feld (`rank`/`tier`/`severity`) den Wert. Gesamtsumme hart auf **max. 8** begrenzen.

---

## 9. Validierung (Finalize)

Der Finalize-Button wird aktiv, wenn **alle** Bedingungen erfüllt sind:

1. Name nicht leer.
2. Attribute exakt 2×8, 2×6, 2×4, 1×2 (Rest 2).
3. Echo gewählt; Pflicht-Sub-Choice/Unbound-Response gesetzt (Beast zusätzlich: Predator Stone); Dragonborn: Veiled Form; Pflicht-Artefakte gemäß `echo-artifacts.json → rules`; Start-Karte gewählt.
4. Sprachen: Common + mindestens 1 weitere.
5. Skills: alle 40 Punkte verteilt.
6. Combat Package Wizard abgeschlossen (6 Powers).
7. Disadvantage-Punkte zwischen 0 und 8.

---

## 10. Output-Schema (Export-JSON)

```json
{
  "name": "…",
  "attributes": { "might": 8, "agility": 6, "vitality": 8, "wits": 4, "intellect": 4, "resolve": 6, "influence": 2 },
  "echo": {
    "key": "unbound",
    "subChoiceKey": "witchRoot",
    "veiledFormKey": "",
    "unboundShape": "Wolf",
    "predatorStone": "might",
    "artifactKeys": ["witchStaffRoot"],
    "startCardId": "…"
  },
  "languages": ["common", "…"],
  "skills": { "athletics": 4, "…": 4 },
  "combatPackage": {
    "defenseId": "…", "passive1TemplateId": "…", "secondPassiveTemplateId": "…",
    "activeBuffTemplateId": "…", "offenseId": "…", "delivery": "melee",
    "powers": [ { "name": "…", "category": "passive", "rank": 4 } ]
  },
  "disadvantages": [ { "id": "…", "points": 2, "details": { "…": "…" } } ]
}
```

(Feld-Keys der Details entsprechen den `fields[].name` aus `disadvantages.json`.)

---

## 11. Akzeptanzkriterien

1. Nebeneinander-Vergleich mit dem Foundry-Bogen: Farben, Fonts, Radien, Tab-Bookmarks, Karten-Layouts und der Gold-Glow sind nicht unterscheidbar.
2. Alle Texte (Echo-Summaries, Trait-Effekte, Skill-Beschreibungen, Wizard-Texte, Disadvantage-Regeln) stammen wörtlich aus den `data/*.json` — keine Paraphrasen.
3. Alle 7 Echoes inkl. Unbound-Board mit Beast/Witches/Banes funktionieren; Beast verlangt den Predator Stone.
4. Attribut-Budget, Skill-Budget (0-oder-4-Regel) und Disadvantage-Limit (0–8) sind hart erzwungen.
5. Der Wizard erzeugt immer genau 6 Powers (2 Passive R4, 1 Active Buff R4, 1 Reaction R4, 2 Active R2).
6. Offene Schritte pulsieren gold in der Tab-Leiste; erledigte hören auf.
7. Export-JSON entspricht dem Schema aus Abschnitt 10.

# Auftrag: Homepage Character Sheet → DF 2026 / Mastery Table Print angleichen

> **So benutzt du dieses Dokument:** In einem Cursor-Chat im Homepage-Projekt dieses File (oder seinen Inhalt) als Prompt geben. Ziel ist der **druckbare / exportierbare Charakterbogen** der Homepage — nicht der Character-Builder-Flow aus `docs/homepage-character-generator/PROMPT.md`.

## Ziel

Biege den **aktuellen Homepage-Blankbogen** so um, dass er die **neuen DF-2026-Werte und das Layout** des Foundry-Table-Prints aufnimmt (Mastery System **v0.9.781+**).

- **Ist-Zustand Homepage (Beispiel):** `c:\Users\navar\Downloads\Character Sheet.pdf` (3 Seiten, hell)
- **Soll-Zustand Foundry-Print (Beispiel):** `c:\Users\navar\Downloads\Alaris.pdf` (v0.9.781)

Visuell darf die Homepage hell bleiben; **Struktur, Felder und Stone-Placeholder-Logik** müssen dem Foundry-Table-Sheet entsprechen.

## Referenzquellen (Wahrheit)

1. Homepage-PDF: aktueller Blank-/Exportbogen
2. Foundry-Print: Alaris / Table Character Sheet nach **v0.9.781**
3. Code im Mastery-Repo (wenn verfügbar):
   - `templates/actor/character-print.hbs`
   - `styles/character-print.css`
   - `src/sheets/character-print.ts`
   - `CHANGELOG.md` Einträge `0.9.775`–`0.9.781`

Nicht am alten Skill-Leiter-Bogen festhalten. Keine Effect-Texte bei Stone Powers wieder einführen.

---

## Seite 1 — Character Sheet (Portrait)

### Behalten / leicht anpassen

- Header: **Name, Player, Echo, Mastery Rank, Reroll Points** (+ leere Tick-Boxen = Disadvantage-Punkte)
- **Core Combat**-Streifen: Attack, Weapon Damage, Evade, Armor, Movement, Damage Negation, Damage Reduction, Parry, Invisibility-Checkbox

### Neu / ersetzen

1. **Lifetime XP**-Track oben (eine Zeile, Steine bis **400**, Marken wie 20/40/… — wie Alaris/Mastery).
2. **Attributes:** Wertbox + Pools **0% / 10% / 20% / 40% / 50%**.  
   **Weg:** alte Leiter `4…40` unter den Attributen.
3. **Health** rechts: pro Stufe Total + großes **Lost Health Points**-Feld.  
   **Weg: kompletter Stress-Block.**
4. **Disadvantages** unter Attributes (Punkte + Einträge).
5. **Echo Imprints** volle Breite (Name + Effekttext, ohne Attribute-Spalte).
6. **Perception** elevated, **wie Specializations**:  
   `Perception` + Scope · **`R{rank} · {n} paid`** (+ ggf. free) · Rank-Pips.  
   Standard gratis **Rank 2 → „R2 · 2 paid“**. Nicht mehr als Skill mit Pool-Chips.
7. **Specializations** statt „Learned Skills“: nach **Fields** gruppiert; Zeile = Name, Scope, `R·paid`, Pips.  
   Perception **nicht** nochmal in den Spec-Gruppen.
8. Reminder unten auf Spec/Raises umstellen (Pool = Attribute, Keep = MR, TN = Task×4, Paid Raise +4 TN, Untrained = Disadvantage / keine Raises).

### Nicht wieder einbauen

- Skill-Leiter / alle Skills der alten Liste
- Stress / Breakdown
- Minor Expressions als Hauptblock (Foundry-Table nutzt Echo Imprints)

---

## Seite 2 — Stone Dashboard (Landscape)

### Header (eine Zeile)

- **Initiative** Roll · **Exchange** (`MR×4` Init = 1 Colorless) · **Init Left** (Write-in) · **Colorless** (Cubes)
- Trenner, dann rechtsbündig: **`Regeneration N Stones per Round`**
- **Weg:** eigener „Regenerating / Exhausted“-Streifen unter den Pools

### Attribute Stone Pools

- 7 Pools (Might→Wits), Cubes **~6 mm**, Anzahl = Floor(Attr/8) bzw. Pool-Max

### Stone Powers (Hauptfläche)

1. **Keine** Überschrift „STONE POWERS“.
2. **Keine** Effect-/Cost-Fließtexte in den Karten — nur Name + Tags (ACTION/PASSIVE/REACTION, Premium, Support, Once).
3. **8 Zeilen:** General + 7 Attributes, je **4 Powers** (Premium links, Once-per-Combat rechts).
4. **Wits:** **Phasing zuerst**, andere Once-per-Combat hinten.
5. Labels **T1 / T2 / T3 / (T4)** — nicht R1/R2/R3.
6. Write-in-Boxen **6 mm** (wie Pool-Cubes), vollständig sichtbar (kein Abschneiden).

#### Tier-Layout (kritisch)

| | Normal (1/2/4/8) | Premium (2/4/6) |
|---|---|---|
| **T1** | 1 Box, **vertikal mittig** neben T2 | 2 Boxen **gestapelt** (1×2) |
| **T2** | 2 Boxen **übereinander** (1×2) | 2×2 |
| **T3** | 2×2 (4) | 3×2 (6) |
| **T4** | **ja**, 4×2 (8) | **nein** — weglassen |

Platzrechnung (Karte ~66 mm): Normal T1–T4 inkl. 4×2 passt; Premium + T4 nicht — deshalb Premium nur T1–T3.

7. Power-Namen / Katalog an **aktuelles** Mastery-System anpassen (Alaris/Mastery-Print ist maßgeblich; keine veralteten Labels).
8. Seite voll ausnutzen (wenig Leerraum unten); Wits-Zeile darf nicht abgeschnitten werden.

---

## Seite 3 — Powers & Combat (Landscape)

### Struktur (wie Alaris)

1. Optional **Weapon Sets** oben
2. Zeile: **Movement** | **Active / Attack** + **Active Buffs** | **Reactions**
3. Unten: **Specials Affecting You** (Token-Tray + Start-of-Turn / Tick / Natural Recovery MR / Decay 1) + **Passives**
4. Reminder: Same Special this Round max = **4 × MR**

### Layout

- Seite bis zum unteren Rand füllen (kein großer weißer Streifen).
- Active Buffs: Name + Effekt kurz + **Rounds**-Ticks.
- Reactions: Basics (Guard / Evade / Dive for Cover) + Charakter-Reactions.
- Tick-Boxen zum Abhaken pro Nutzung.

---

## Akzeptanzkriterien (Checkliste)

- [ ] Seite 1: kein Stress, keine Skill-Leiter; Specs + Perception Spec-Style; Lifetime XP bis 400; Attr-Pools 0–50%
- [ ] Seite 2: Regeneration in Initiative-Zeile rechts; kein Exhausted-Streifen; keine Stone-Powers-Überschrift; keine Effect-Texte
- [ ] Seite 2: T2 gestapelt, T1 mittig; Normal T4 vorhanden; Premium ohne T4; Boxen ~6 mm und vollständig sichtbar
- [ ] Seite 3: Weapon Sets + Rotation + Specials/Passives; Seite unten gefüllt
- [ ] Blank-Bogen und befüllter Export teilen dieselbe Struktur
- [ ] Visueller Abgleich mit `Alaris.pdf` (Struktur); Homepage darf hell bleiben

## Vorgehen

1. Homepage-PDF und Alaris.pdf Seite für Seite vergleichen.
2. Homepage-Template/CSS/Generator des Charakterbogens anpassen (nicht den Builder-Flow, außer Felder überschneiden sich).
3. Blank + Beispielcharakter neu exportieren und gegen die Checkliste prüfen.

## Explizit nicht tun

- Effect-Texte bei Stone Powers zurückbringen
- R1/R2/R3-Labels statt T1/T2/T3
- Premium mit T4 vollstopfen
- Stress oder Skill-Leiter wieder einführen
- Foundry VTT-Code ändern (außer bewusst im Mastery-Repo gearbeitet wird)

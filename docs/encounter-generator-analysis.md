# Encounter-Generator — Analyse (Ist-Zustand)

Stand: 2026-08-30. Quellcode unter `src/creation/encounter-generator/`.
Zweck dieses Dokuments: objektive Bestandsaufnahme für ein Overhaul. Keine Vorschläge als fertiges Design — am Ende stehen **Befunde**, auf die Änderungen geschrieben werden können.

**Leitidee im Code (v2):** *„Du legst fest, was der Gegner tun soll. Der Generator entscheidet, welche Werte dafür nötig sind.“*

---

## 1. Wo man es öffnet und was erzeugt wird

- Einstieg: Button **Encounter-Generator** im Foundry Actor-Directory (nur GM).
- Dialog: `EncounterGeneratorDialog`, 920×760, Template `templates/creation/encounter-generator/wizard-shell.hbs`.
- Ausgabe (`applyEncounterProject`):
  - Actor-Ordner `{Name}`
    - `Boss/` — 1–6 NSC-Hauptgegner
    - `Adds/` — ein Add-Prototyp (zum Duplizieren), wenn Adds an
    - `Encounter Mechanics/` — Zonen-NSC, nur Style `environmental`
  - Journal `{Name} — Encounter` mit zwei Seiten: **Encounter Summary** (Threat Report) und **NPC Sheet** (HTML, nicht der echte NPC-Print-Bogen)

Keine Tokens, kein Combat, keine Initiative-Werte (`combat.initiative` wird immer `0` geschrieben).

---

## 2. Zwei Engines — nur eine ist der Wizard

| Engine | Funktion | Wizard nutzt sie? |
|---|---|---|
| **v1 Balance** | `deriveEncounterPlan()` in `encounter-generator-balance.ts` | **Nein.** Difficulty-Karten (Moderat/Hart/Brutal), Boss-Anzahl, Phasen, Minion-Wellen, Respawn. |
| **v2 Concept** | `deriveConceptPlan()` in `encounter-generator-concept.ts` | **Ja.** Das ist der aktuelle 5-Schritt-Flow. |

v1 bleibt importierbar und getestet. v2 **leiht** aus v1 nur:

- `DIFFICULTY_PARAMS` (über Rank → Difficulty)
- `solveAttackDiceForHitRate` (Monte-Carlo)
- `splitHpAcrossPhases`
- `evadeToMrAgility` (Adds; beim Boss fast nicht)

`validateEncounterSelection` / `normalizeComposition` gehören zu v1 und werden vom Wizard **nicht** aufgerufen.

---

## 3. Die fünf Wizard-Schritte

Reihenfolge fest: `party → concept → adds → review → name`.

Weiter ist immer erlaubt außer Schritt 1 (mindestens ein Character). Plan + Threat Report werden neu gerechnet:

- auf dem Concept-Schritt bei jedem Render, wenn eine Gruppe gewählt ist
- beim Eintritt in **Prüfen**
- nach Edits auf **Prüfen** (nur Report)

`Math.random` sitzt in der Würfel-Simulation. Derselbe Concept-Stand kann deshalb andere Angriffs-W8 liefern.

### Schritt 1 — Party (`party`)

**UI**

- Kacheln aller World-Actors vom Typ `character`
- Anzeige pro Kachel: Name, MR, Summe Health-Bar-Max, Evade (`evadeTotal`)
- Gruppen-Kennwerte der Auswahl: Median MR, Ø HP, Ø Ausweichen, **Ø Rüstung**

**Falle in der Vorschau:** `quickMetrics.avgArmor` ist `avg(MR)`, nicht `avg(armorTotal)`. Die echte Analyse (Schritt 2+) nutzt Sheet-Rüstung.

**Was wirklich gemessen wird** (`analyzeParty` / `extractPartyMember`, 3000 Samples):

| Feld | Formel / Quelle |
|---|---|
| `mr` | `clamp(floor(mastery.rank), 1, 8)`, Default 2 |
| `effectiveHP` | Summe `health.bars[].max`, min 1 |
| `barCount` | Anzahl Health-Bars, min 1 |
| `evade` | `combat.evadeTotal` sonst `evade` sonst `MR×4` |
| `armor` | `combat.armorTotal` sonst `armor` sonst `MR` |
| `drPct` | `combat.damageReductionPct`, 0–100 |
| `attackPool` | `max(MR, floor(max(Might, Agility)))` |
| `keep` | MR |
| `attackTotals` | 3000× „Pool explodierende W8, behalte Keep Höchste“, aufsteigend sortiert |
| `weaponDamageMean` | `max(beste Waffe + bestes nicht-Spell-Power-W8, bestes Spell-W8)` |
| `mightMeleeBonus` | `2 × floor(Might / 8)` |
| `attacksPerRound` | **immer 1** (Extra Attack / Stone Powers ignoriert) |
| `canCleanse` | Power mit Special/Subfamily/Name Cleanse |

**Waffe:** erstes equipped Weapon, sonst irgendein Weapon; Artifact-Waffen via `artifactToVirtualWeapon`, wenn equipped. Default ohne Waffe: `2 × 36/7` (≈ 10,29).

**Party-Aggregation**

- `medianMR` = Median der Mitglieder-MR, gerundet, Fallback 2
- `avgEvade`, `avgArmor`, `avgDrPct`, `avgHP` = arithmetisches Mittel, gerundet
- `pooledAttackTotals` = alle Mitglieder-Samples zusammen, sortiert (für Quantile / Evade-Ziel)

### Schritt 2 — Kampfidee (`concept`)

Drei Blöcke: **Hauptgegner**, **Angriffe & Waffen**, **Werte überschreiben**, plus **Reaktionen**.

#### 3.1 Archetyp-Vorlagen

| id | Label | Rank | Style | Special | Aktionen | Targeting | Phasen | Cycle | Cycle-Stil | Adds |
|---|---|---|---|---|---|---|---|---|---|---|
| *(leer)* | Eigenes Konzept | standard | spell | ruin | 3 | mixed | 2 | 3 | fixed | aus |
| `ruin-spellcaster` | Ruin Spellcaster | major | spell | ruin | 4 | mixed | 2 | 4 | fixed | aus |
| `burning-portal` | Das brennende Zaubertor | major | environmental | ruin | 2 | aoe | 3 | 3 | phase-based | light / noticeable / 2 / phase-start |
| `red-priest` | Der rote Priester | standard | summoner | ruin | 3 | single | 2 | 3 | conditional | minion / dangerous / 6 / continuous + Summon kostet Aktion |
| `kerkermeister` | Der Kerkermeister | major | martial | lacerate | 3 | single | 2 | 3 | fixed | aus |
| `samael` | Samael (Mythic) | mythic | hybrid | ruin | 4 | mixed | 3 | 4 | phase-based | standard / noticeable / 2 / phase-start |

Vorlage setzt das ganze Concept (Deep Copy). Danach jede manuelle Änderung leert `presetId`.

#### 3.2 Felder — Hauptgegner

| Feld | Typ | Range / Werte | Wirkung |
|---|---|---|---|
| `bossCount` | int | 1–6 | Anzahl erzeugter Hauptgegner |
| `kitMode` | enum | `identical` / `distinct` | Kopie vs. eigene Kits auf Prüfen |
| `rank` | enum | minor / standard / major / mythic | Difficulty-Params, Budget, Caps, Special-X, MR-Offset |
| `style` | enum | spell / martial / hybrid / summoner / environmental | Budget-Anteil, Spell-Flag, Phasen-Themen, Cycle-Layout |
| `primarySpecial` | id oder `none` | alle diminishing außer Regeneration | Cycle-Special + Persistenz-Anteil |
| `secondaryStyle` | enum | none / martial / direct-spells / aoe-spells / **control** / mobility / defense / summoning | **Nur `control` ändert den Cycle** (letzter Slot = Root). Rest ist tot. |
| `actionsPerRound` | int | 1–6 | Boss-Aktionen; wird auf Cycle-`attacksPerRound` verteilt |
| `targeting` | enum | single / aoe / mixed | welche Cycle-Slots AoE sind |
| `phaseCount` | int | 1–5 | Phasen (v1 erzwang min. 2; v2 erlaubt 1) |
| `cycleLength` | int | 2–6 | Anzahl Powers im Cycle |
| `cycleStyle` | enum | fixed / weighted / conditional / phase-based | UI-Texte + Gewichte/Bedingungen. `phase-based` erzeugt **keinen** anderen Cycle-Inhalt — Phasen kommen immer aus `phaseThemes`. |
| `environmentActionsPerRound` | int | 1–4 | nur sichtbar bei Style environmental |

Shortcut `attackShape = single-and-aoe` setzt hart: `targeting=mixed`, `actionsPerRound=2`, `cycleLength=2`.

#### 3.3 Felder — Loadout

| Feld | Werte | Wirkung |
|---|---|---|
| `weaponProfile` | one-hand / two-hand / ranged | Reichweite 1 m / 2 m / ≥12 m; Zweihand martial ×1,15 Schaden |
| `attackShape` | free / single-and-aoe | siehe Shortcut oben |
| `baseDamageDice` | 0–80 | 0 = Formel; sonst jeder Nicht-Summon-Slot genau diese W8 |

#### 3.4 Felder — Overrides (0 = automatisch)

| Feld | Max | Bedeutung |
|---|---|---|
| `hpOverride` | 9999 | Gesamt-HP **pro** Hauptgegner, danach auf Phasen verteilt |
| `armorOverride` | 40 | Sheet-Rüstung (nicht MR) |
| `evadeOverride` | 40 | intendiertes Ausweichen |

#### 3.5 Reaktionen (2 Slots)

`none` / `guard` / `evade` / `counterattack` / `dive-for-cover` / `interpose` / `custom` (+ Name).
Werden 1:1 auf den NSC geschrieben (`npcReactions`, `npcReactionSlots`). **Kein Einfluss auf Budget, Threat oder Treffer.**

Concept-Schritt zeigt eine Live-Vorschau: HP-Summe, MR, Rüstung, Evade, Angriffsnamen + W8, Reaktionen.

### Schritt 3 — Adds (`adds`)

| Feld | Default | Range | Bedeutung |
|---|---|---|---|
| `enabled` | false | bool | ohne Adds: volles Boss-Budget |
| `durability` | minion | minion / light / standard / elite | Spieler-Aktionen bis Kill: 1 / 1,4 / 2 / 3,5 |
| `pressure` | noticeable | harassment / noticeable / dangerous / lethal | Ziel-Gruppenschaden in Health Levels / Runde |
| `targetActive` | 4 | 1–12 (clamp) | Wunsch-Population |
| `maxActive` | 0 | 0 = `targetActive`, sonst 1–16 | Cap |
| `spawnPerRound` | 1 | 1–6 | Spawn-Tick |
| `spawnPattern` | continuous | continuous / burst / phase-start / triggered | Projektion R1–R5; `triggered` = wie continuous |
| `summonCostsBossAction` | false | bool | Threat: −1 Damage-Aktion; Journal-Text. **Cycle bekommt den Summon-Slot nur bei Style summoner.** |

### Schritt 4 — Prüfen (`review`)

Editierbar:

- Kit-Name und Kit-Tabs (nur `distinct`)
- pro Phase: HP, Evade, Armor
- pro Cycle-Zeile: Name, Attack-W8, Damage-W8, Special-X, Spell-Haken, Angriffe/Runde (1–5)
- Reaktionen erneut

Nicht editierbar: Rank, Style, Phasenanzahl, Adds-Zahlen, Environment. Zurück zu Concept/Adds nötig.

Threat Report wird nach jedem Edit neu gebaut (wieder Monte-Carlo).

### Schritt 5 — Name (`name`)

Freitext → Ordner + Actor-Namen. Generate braucht Gruppe + nichtleeren Namen.

---

## 4. Konstante: explodierende W8

\[
\mathbb{E}[\text{explodierende W8}] = \frac{36}{7} \approx 5{,}1429
\]

Code: `EXPLODING_D8_MEAN`. Bis 64 Explosionen. Roll & Keep: `n` Würfel, behalte die `keep` höchsten Einzelsummen.

Treffer: Sample ≥ TN. Raise: `floor((total − TN) / 4)` — in der **Party-DPS für Boss-HP** (v2) **nicht** verwendet; in v1 `memberExpectedHit` schon.

---

## 5. Rank → Difficulty → Parameter

```
minor    → moderate
standard → hard
major    → hard      (gleicher Params-Satz wie standard!)
mythic   → brutal
```

`DIFFICULTY_PARAMS` (v1-Namen, von v2 mitgenutzt):

| | moderate | hard | brutal |
|---|---|---|---|
| `bossTTKRounds` | 8 | 12 | 16 |
| `partyHitRateVsBoss` | 0,70 | 0,65 | 0,58 |
| `bossHitRateVsParty` | 0,50 | 0,60 | 0,70 |
| `bossHitDamageFrac` | 0,20 | 0,32 | 0,45 |
| `bossSlotFactor` | 0,50 | 0,66 | 0,85 |
| `bossMrOffset` (nur v1) | 0 | 0 | +1 |
| Minion-HP-Perzentil / Minion-Dmg-Frac / Respawn | 0,40 / 0,10 / 3 | 0,55 / 0,12 / 2 | 0,70 / 0,15 / 1 |

**Copy vs. Code:** UI-Texte unter `ENCOUNTER_GENERATOR_COPY.difficulty` sprechen von ~4 / ~6 / ~8 Runden. Die Tabelle sagt 8 / 12 / 16. Diese Copy ist im Wizard **nicht sichtbar** (Difficulty-Schritt entfernt).

Zusätzliche Rank-Faktoren (nur v2):

| Rank | `RANK_BUDGET_FACTOR` | `RANK_ARMOR_BONUS` | `RANK_SPECIAL_VALUE` | `RANK_DAMAGE_DICE_CAP` | `RANK_MR_OFFSET` | Catalog-Tier |
|---|---|---|---|---|---|---|
| minor | 0,75 | +0 | 2 | 6 | −1 | 3 |
| standard | 1,00 | +2 | 3 | 8 | 0 | 4 |
| major | 1,20 | +4 | 4 | 10 | +1 | 5 |
| mythic | 1,45 | +6 | 4 | 12 | +1 | 6 |

MR-Hartcap: `min(8, medianPartyMR + 1)`. Major/Mythic können den Offset wollen, werden aber gekappt. Budget steigt trotzdem.

---

## 6. Kernpipeline v2 — `deriveConceptPlan`

Reihenfolge im Code:

### 6.1 MR, Evade, Armor

```
desiredMr = clamp(medianMR + RANK_MR_OFFSET[rank], 1, 8)
mr        = min(desiredMr, medianMR + 1)

realizedEvade = quantile(pooledAttackTotals, 1 − partyHitRateVsBoss)
              // Override wenn evadeOverride > 0

armor = max(0, round(avgArmor + RANK_ARMOR_BONUS[rank]))
      // Override wenn armorOverride > 0

agility = clamp((realizedEvade − mr×4) × 8, 2, 80)
```

Evade-Ziel = das Quantil der **Spieler-Angriffswürfe**, bei dem die Trefferquote der Gruppe gegen den Boss ≈ `partyHitRateVsBoss` sein soll.

`evadeToMrAgility` (v1) setzt `realizedEvade = mr×4` und `agility = 2`. v2-Boss nutzt das **nicht**. Adds schon für MR, schreiben Evade aber als `round(desiredEvade)` (Quantil), nicht als `mr×4`.

### 6.2 Runden-Budget (Schaden nach Mitigation, ganze Gruppe)

```
baselineActions = clamp(round(partySize × bossSlotFactor), 1, 6)

roundBudget = bossHitDamageFrac × avgHP × baselineActions × RANK_BUDGET_FACTOR
```

Beispiel 4 PCs, Ø-HP 80, Rank standard (hard):

```
baselineActions = clamp(round(4 × 0,66), 1, 6) = 3
roundBudget     = 0,32 × 80 × 3 × 1,0 = 76,8
```

Das ist **kein** Schaden eines einzelnen Hits, sondern das Soll für **alle** Boss-Aktionen (+ anteilig Adds/Zonen) **pro Runde nach Rüstung**.

### 6.3 Budget-Teilung Boss / Adds / Environment

```
STYLE_BOSS_SHARE:
  spell, martial, hybrid = 1,00
  summoner               = 0,45
  environmental          = 0,55

addsSteadyDamage = min(groupDamageAtFullPop, roundBudget × 0,6)   // 0 ohne Adds

bossBudget = roundBudget × STYLE_BOSS_SHARE[style]
wenn Adds und style ≠ summoner:
  bossBudget = max(roundBudget × 0,3, bossBudget − addsSteadyDamage × 0,5)
```

Environmental: Zonen bekommen `roundBudget × (1 − 0,55) = 45 %`.

### 6.4 Multi-Boss-Packing

```
n = bossCount
hpEach  = (0,70 + 0,30×n) / n     // 1 → 1,00; 2 → 0,65; 3 → 0,533; 4 → 0,475
dmgEach = (0,65 + 0,35×n) / n     // 1 → 1,00; 2 → 0,675; 3 → 0,567
```

```
perActionBudget = (bossBudget × dmgEach) / actionsPerRound
```

Jeder Hauptgegner bekommt `perActionBudget` **pro Aktion**. Drei identische Bosse mit je 3 Aktionen = 9 Aktionen × (Budget × 0,567 / 3).

### 6.5 HP pro Hauptgegner

```
für jedes Mitglied:
  hr     = hitRate(attackTotals, realizedEvade)
  rawHit = (weaponDamageMean + mightMeleeBonus) × 1,35    // Raise-Pad
  dmg    = max(0, rawHit − armor)
  partyDps += hr × dmg × attacksPerRound                 // attacksPerRound = 1

hpFromDps      = partyDps × bossTTKRounds × rankFactor × 1,7
minHitsPerPhase = max(6, round(partySize × 2))
hpFromHitFloor  = avgHitAfterArmor × minHitsPerPhase × phaseCount
totalHp         = max(phaseCount, hpFromDps, hpFromHitFloor)

wenn hpOverride > 0: totalHp = max(phaseCount, hpOverride)
sonst wenn bossCount > 1: totalHp *= hpEach

Phasen-HP: floor(total/n) überall, Rest auf die letzte Phase.
```

`BOSS_HP_REALISM_FACTOR = 1,7`, weil „Sheet-Mean Party-DPS echte Tischtreffer unterschätzt“.

### 6.6 Phasen-Themen (nicht nur größere Würfel)

Anzahl = `phaseCount`. Überzählige Phasen: `damageFactor = 1 + 0,15 × index`.

**martial** (2+): Measured Violence (0,9) → Frenzy (1,2, special+2, armor×0,75) → Rage (1,35, special+3, armor×0,6).

**summoner:** Pack Building (0,75) → Cornered (1,25, Adds aus) → Escalation.

**environmental:** Environmental Control (0,7) → Escalating AoE (1,0, Adds aus) → Collapse (1,35, armor×0,6).

**spell / hybrid:** Control & Position (0,8) → Direct Assault (1,1) → Demonic Escalation (1,35, armor×0,7).

1 Phase: nur „Sustained Pressure“, Factor 1,0.

Pro Phase: neuer `buildPowerCycle(..., damageFactor, specialBonus)`, Armor `round(armor × armorFactor)` (min 1), Evade unverändert, `actionsPerRound + actionsDelta` (Delta ist überall 0).

**Cycle-Stil `phase-based`:** die Phasen sind sowieso unterschiedlich. Der Enum ändert die Slot-Namen/Gewichte nicht extra.

---

## 7. Power-Cycle — `buildPowerCycle`

### 7.1 Slot-Layout

```
melee = (weapon ≠ ranged UND style ∈ {martial, hybrid}) ODER style === martial

aoeSlots(i):
  targeting aoe   → alle
  targeting mixed → i ungerade (0-basiert: Slot 2, 4, 6)
  targeting single → keine

Slot 0: wenn style === summoner → Beschwörung (kein Angriff)
letzter Slot: wenn secondaryStyle === control → Control-Power + Root(X)

sonst: Catalog Active, Subfamily
  melee: weapon-attack (Special-Filter, sonst ohne Special)
  ranged/spell: damage-single / damage-aoe
Sortierung: |tier − RANK_TIER| aufsteigend, dann Rotation über Treffer.
```

Catalog-Miss → Fallback-Namen: Zweihandschlag / Schwerer Hieb / Zerstörerischer Strahl / Rundumschlag / Flächenschlag / Niederhalten.

**Tot im Layout:** secondary `martial`, `direct-spells`, `aoe-spells`, `mobility`, `defense`, `summoning` (Summon-Slot kommt nur von `style === summoner`).

### 7.2 Angriffs-W8

Zwei unabhängige Monte-Carlo-Suchen (1500 Samples, Pool 2–24):

```
attackDice    = argmin |hitRate(n k MR, avgEvade) − bossHitRateVsParty|
attackDiceAoe = dasselbe nochmal (andere Zufallszahlen)
```

Nicht deterministisch. Spell-TN (8×MR) wird **nicht** als TN benutzt, auch wenn `isSpell = true` (style ≠ martial).

### 7.3 Schadens-W8 eines Slots

```
budget     = perActionBudget × damageFactor × (control ? 0,4 : 1)
aoeFactor  = AoE ? 0,6 : 1
specialCut = control ? 0 : persistentShare(special, style)
directTarget = budget × (1 − specialCut) × aoeFactor
rawPerHit    = directTarget / (1 − drFraction) + avgArmor
damageDice   = clamp(round(rawPerHit / (36/7)), 1, RANK_DAMAGE_DICE_CAP)

persistentShare:
  kein / nicht-diminishing → 0
  lacerate oder ruin → martial 0,40 sonst 0,35
  sonst diminishing → 0,30
```

Dann: `baseDamageDice > 0` überschreibt alle Nicht-Summon-Slots. Zweihand + martial: ×1,15, wieder gegen Cap.

Special-X: `clamp(RANK_SPECIAL_VALUE + specialBonus + (AoE ? −1 : 0), 1, 5)`. Control: immer `root`.

Jeder Nicht-Summon: `stressD8 = 1`. `isSpell = (style !== 'martial')`.

### 7.4 Verteilung `attacksPerRound`

Jeder Nicht-Summon-Slot startet bei 1. Rest = `actionsPerRound − slotCount` (wenn Aktionen < Slots: alle 1, Budget wird nicht nach unten korrigiert).

- **weighted:** Hamilton / largest remainder, Gewichte `[40, 30, 20, 10, 10, 10]`, Cap 5.
- **sonst:** Extra-Kopien reihum, bevorzugt erste Zeile mit Stress (also die erste).

Summe der Kopien → Actor `attackSlots` (ATK).

### 7.5 Reichweite

- martial/melee: 1 m, Zweihand 2 m, melee-AoE Radius 3 m (range 0)
- ranged profile: min 12 m
- Catalog-AoE: cone/line aus Level-4-Row, sonst radius, min 2 m, Default 4 m

---

## 8. Adds — `deriveAddsPlan`

```
desiredEvade = quantile(pooledAttackTotals, 1 − 0,85)     // Gruppe trifft Adds ≈ 85 %
mr           = cap(medianMR − 1)
armor        = mr                                          // nicht party.avgArmor + Bonus
evade        = round(desiredEvade)                         // nicht mr×4

perActionPlayerDamage = Mittel(hitRate × max(0, weaponMean + mightBonus − armor))
                        // Raises = 0
hp = round(perActionPlayerDamage × DURABILITY_ATTACKS)

pressureHL:
  harassment  0,2
  noticeable  0,5
  dangerous   1,0
  lethal      max(1,5, avgBarCount / 2)

hlSize = avgHP / avgBarCount
groupTarget = pressureHL × hlSize
perAddAfterArmor = groupTarget / (maxActive × 0,45)
damageDice = clamp(round((perAddAfterArmor + avgArmor) / (36/7)), 1, 10)
attackDice = solveHitRate(avgEvade, mr, 0,45, 2..12)

Projektion R1–R5 (Partei ignoriert Adds):
  continuous / triggered: active = min(max, active + spawnPerRound) ab 0
  burst: R1 = min(max, targetActive), dann konstant
  phase-start: R1 = min(max, spawnPerRound × 2), dann konstant

clearActionsPerRound = partySize / 2
killsPerRound        = clear / attacksToKill
expectedLifetime     = clamp(targetActive / killsPerRound, 1, maxActive)

threatPerAction = 0,45 × max(0, damageDice×36/7 − avgArmor)
addThreat       = lifetime × threatPerAction
```

Ein Add-Prototyp, Agility fest 2 (Sheet-Evade wird geschrieben, Engine-Evade kann abweichen).

---

## 9. Environment

Nur `style === environmental`.

```
envBudget = roundBudget × 0,45
perZone   = envBudget / environmentActionsPerRound
dice      = clamp(round((perZone + avgArmor×0,5) / (36/7)), 1, 10)
specialX  = special ? clamp(round(dice / 2), 1, 6) : 0
```

Zonen: Auto-Hit (kein Evade), Rüstung halb. Radius 4 m, Name immer „Flammenzone“. Actor: 1 HP, Speed 0, Spell-AoE, APR = env actions.

---

## 10. Threat Report — `buildThreatReport`

Alles Phase 1, alle Hauptgegner-Körper (`bodies` = bossCount bzw. Anzahl distinct kits).

| Kennzahl | Konstruktion |
|---|---|
| Hit low/avg/high | 2500 Samples, Pool = erste Direct-Row (sonst erste Cycle-Row), Keep = Boss-MR, TN = min/avg/max PC-Evade |
| AoE-Hit | eigenes Sample der ersten AoE-Row vs Ø-Evade |
| Raw / after armor | Mittel der Cycle-Damage-W8 × 36/7; dann `(raw − avgArmor) × (1 − DR)` |
| Persistent / Runde | Mittel(hit × specialX × targets) × damageActions × bodies; AoE-targets = 2; + Env `specialX × 1,5` |
| R1-Burst ein Ziel | `p90Hits × ((burstDice×36/7×1,3 − armor)×(1−DR) + avgSpecial)` × bodies; p90Hits = alle Aktionen wenn p90-Wurf ≥ Ø-Evade, sonst `round(actions × hit)` |
| Gruppen-DPR | Cycle-Mittel von `hit × ((dice×36/7 − armor)×(1−DR) + spec) × targets` × Aktionen × bodies + Adds-Angriffe[R3] × threatPerAction + Env `1,5 × max(0, zoneRaw − avgArmor×0,5)` |
| Aktionen R1–R5 | `actions × bodies + projectedAddAttacks[r] + envActions` |
| Dauer | `totalBossHp / (partyDps × focusShare)`; focusShare 0,6 mit Adds / 0,85 mit Env / 1; partyDps **ohne** 1,35-Pad und **ohne** Raises |
| R1 squishiest PC | `actions × hitLowest × afterArmor + special` × bodies / dessen Health-Level-Größe |

**Warnungen (Schwellen):** kein Cleanse bei Persistent; Burst ≥ 2 HL; R1-Squish > 1,3 HL; Adds laufen ins Cap; Hit > 80 % oder < 30 %; Dauer > 9 oder < 2,5 Runden; mehrere Hauptgegner; MR am Cap / über Cap.

Dauer-Formel und HP-Formel benutzen **verschiedene** Party-DPS (Pad 1,35 nur bei HP). Deshalb kann der Report „3 Runden“ sagen, während HP auf 8–16 TTK ausgelegt wurde.

---

## 11. Was auf den NSC geschrieben wird

Hauptgegner (`buildProjectBossSystem`):

- Attribute: alles 2 außer Agility aus Plan
- MR, Speed (environmental 0, sonst 6), Movement-Slots (0 / 1)
- Phase 1 Health = Phase-1-HP (eine Bar „Healthy“)
- `combat.evade` / `armor` / `initiative=0`
- Cycle → `npcBaseAttack` + `attackValues` (Spell, AoE, Stress 1d8, APR, Specials)
- `attackSlots` = Summe APR der Nicht-Summon-Zeilen
- Phasen 2+ analog in `system.phases`
- Reaktionen auf Actor und jede Phase
- `bio.description` = Taktik-HTML

Adds: eine Attacke „Biss/Hieb“, 1 Slot, Speed 8, Agility 2.

Journal-NPC-Sheet ist eine verdichtete HTML-Tabelle, nicht `npc-print.hbs`. Initiative fehlt dort ebenfalls.

---

## 12. Taktik-Texte (automatisch)

- AoE nur bei 3+ gruppierten Zielen (wenn targeting ≠ single)
- Fokus auf niedrigstes aktuelles Primary-Special
- Special-Stack R1 ≤ `0,8 × hlSize`
- martial: ein Ziel; Schwäche Distanz/Mobilität/Defense-Reactions
- Zweihand-Hinweis
- Spawn-Satz
- Reaktions-Namen

---

## 13. Dateikarte

| Datei | Rolle |
|---|---|
| `encounter-generator-types.ts` | Schritte, Concept, Plan, Threat, Limits |
| `encounter-generator-dialog.ts` | Wizard, State, Edits |
| `wizard-shell.hbs` | UI |
| `encounter-generator-copy.ts` | Deutsche Labels / Tooltips |
| `encounter-generator-analysis.ts` | Party + Simulator |
| `encounter-generator-balance.ts` | v1-Plan + geteilte Solver |
| `encounter-generator-concept.ts` | v2-Plan, Presets, Cycle, Adds, Phasen |
| `encounter-generator-threat.ts` | Report |
| `encounter-generator-apply.ts` | Ordner, Actors, Journal |
| `encounter-generator-validation.ts` | v1-Selection, vom Wizard ungenutzt |

Tests: `tests/encounter-generator-analysis.test.ts`, `…-balance.test.ts`, `…-concept.test.ts`.

---

## 14. Warum es „random“ und „kompliziert“ wirkt

**Zufall (echt)**

1. 3000 Party-Samples bei jeder Analyse (`Math.random`).
2. Pro Cycle zwei × 1500-Suchen für Attack-W8 (Direct + AoE).
3. Adds: weitere Hit-Rate-Suche.
4. Threat Report: nochmals 2500 (+ AoE 2500).
5. Review-Edit löst 4. erneut aus — Zahlen springen, obwohl der Plan gleich bleibt.

**Komplexität (Feldzahl)**

Concept allein: 15+ Selects/Numbers, 2 Reaktionen, 3 Overrides, Preset, dazu Adds-Seite mit 8 Feldern. Mehrere Felder tun nichts (`secondaryStyle` außer control, `cycleStyle` phase-based/conditional nur Text, `triggered` = continuous).

**Zwei Wahrheiten**

- Kommentare in `balance.ts`: NPC-Rüstung = MR, Evade = MR×4 + floor(Agi/8).
- v2 + `types.ts`: Sheet-Felder sind die Combat-Werte; MR ist Keep.
- Apply schreibt beides (Sheet evade/armor **und** Agility aus Evade-Delta). Pipeline kann je nach `prepareDerivedData` das eine oder andere gewinnen.
- Party-Schritt zeigt Ø-Rüstung = Ø-MR.

**Budget vs. Gefühl**

- HP zielt auf 8/12/16 Runden × 1,7, plus Hit-Floor (`max(6, 2×partySize)` Hits **pro Phase**).
- Report-Dauer nutzt schwächere DPS und Fokus-Share — oft viel kürzer.
- `attacksPerRound` der PCs ist 1 → Extra Attacks fehlen → Boss-HP zu niedrig **oder** der 1,7-Pad überkompensiert unvorhersehbar.
- Spell-Bosse werden gegen Evade simuliert, im Spiel gegen Casting TN `8×MR` gewürfelt.

**v1-Leiche**

Difficulty-Copy, `deriveEncounterPlan`, Composition-Limits (`minPhases: 2`), `applyEncounter` (alte flache Ordner) existieren weiter und widersprechen dem Wizard.

---

## 15. Befunde zum Annotieren (keine Lösungen)

Schreib Änderungen gern als `→` unter den Punkt.

1. **Ein Flow, zwei Mathe-Welten.** v1 tot im UI, lebendig in Params und Tests.
2. **Standard und Major teilen `hard`.** Unterschied nur Rank-Faktoren, nicht TTK/Hit-Ziele.
3. **Copy 4/6/8 Runden vs. Params 8/12/16 vs. HP×1,7 vs. Report-Dauer.** Vier Zeitskalen.
4. **Nicht-deterministische Attack-W8** bei jedem Öffnen/Prüfen.
5. **PC Extra Attacks / Stone-Offensive fehlen** (`attacksPerRound = 1`).
6. **Raises** in v2-HP nur pauschal ×1,35, in Adds und Report-Dauer 0.
7. **Spell-TN wird nicht modelliert.**
8. **Party-Vorschau-Rüstung = MR.**
9. **secondaryStyle** fast tot; **cycleStyle** teilweise nur Labels.
10. **Adds `triggered`** = continuous.
11. **Initiative immer 0.**
12. **Journal-Sheet ≠ NPC-Print** (Ini, Reactions-Anzahl, Movement-Slots unvollständig).
13. **Engine-Kommentare widersprechen** Sheet-Evade/Armor.
14. **AoE-Threat** nimmt fest ~2 Ziele.
15. **Mehrere Bosse** multiplizieren Aktionen voll, HP/Dmg nur mit Packing — Action Economy explodiert, Threat warnt nur textlich.
16. **Kein Seed, kein „nochmal würfeln“, kein Diff** zwischen zwei Läufen.

---

## 16. Mini-Rechenblatt (zum Gegenprüfen)

Gruppe: 4 PCs, Median-MR 3, Ø-HP 80, 4 Bars, Ø-Evade 16, Ø-Rüstung 6, DR 0. Rank **standard**, 1 Boss, 3 Aktionen, keine Adds, keine Overrides.

```
difficulty      = hard
TTK             = 12
hitFrac party   = 0,65  → Evade ≈ P35 der gepoolten PC-Angriffe
bossHitFrac     = 0,60  → Attack-W8 per Suche
bossHitDmgFrac  = 0,32
slotFactor      = 0,66
rankFactor      = 1,0
MR              = cap(3+0, 4) = 3
armor           = 6+2 = 8
baselineActions = 3
roundBudget     = 0,32 × 80 × 3 × 1 = 76,8
bossBudget      = 76,8
perAction       = 76,8 / 3 = 25,6   // nach Rüstung, pro Aktion
```

Schadens-W8 (kein Special-Cut, DR 0): `round((25,6 + 6) / 5,143) = 6` W8, Cap 8.

HP hängt an den 3000 Samples und dem 1,35-Pad — hier nicht ohne die konkreten Actors festzunageln.

---

*Ende der Bestandsaufnahme. Nächster Schritt: Änderungswünsche an 15. / einzelnen Formeln, dann Overhaul planen.*

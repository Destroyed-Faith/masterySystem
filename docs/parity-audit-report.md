# Destroyed Faith — Foundry Parity Audit Report

Datum: 2026-08-30. Quelle der Wahrheit: `docs/Rules/players-guide.md` (PG, Zeilenangaben), `actives.md`, `passives.md`, `active-buffs.md`, `reactions.md`, `movement.md`, `artefacts.md`.
Scope-Ausnahmen: `src/creation/encounter-forge/` (unangetastet), Deathless (Work in Progress, ausgeklammert).

Format je Befund: **Regel → Foundry-Verhalten → Abweichung → Korrektur**. Bereiche ohne Befund sind als KORREKT markiert.

---

## 1. Würfel, Raises, Verteidigungssequenz

### Korrekt bestätigt

- Exploding d8 auf 8 (Angriff/Checks), Schadenswürfel explodieren nicht (`roll-handler.ts`, `damage-dialog.ts`).
- Pool & Keep (XkY), Keep = MR, Minimum Pool = MR (`pool-finalize.ts`).
- Raise: +4 Raise-TN je Slot, all-or-nothing, martial MRd8 / spell MR-Wert, Optionen und Partial-Outcomes (`raise-resolution.ts`).
- Base Evade = MR×4; Armor Total = Armor + Schild + MR; Armor/Schild-Tabellen (`equipment.ts`).
- Spell Resistance erhöht nur Final Spell TN; AoE-Regeln (martial ein Wurf vs. jede Evade, Spell vs. jede Final TN).
- DR% nach Armor (ceil, verteidigerfreundlich), Mindestschaden aus natürlichen 8ern, Temp HP vor Bars.
- Advantage (1er einmal neu würfeln), Disadvantage (nur ein 8er explodiert).
- Attributs-Checks: benanntes Attribut, Keep MR, Default-TN 8×Quell-MR, keine Skill-Punkte.

### Abweichungen

| Regel (PG) | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| Sequenz Schritt 7 (9126–9128): Phasing vor Schaden/Specials | Schaden + Specials werden vor dem Phasing-Prompt ausgewertet (`attack-roll-handler.ts`) | Specials landen trotz Phasing | Phasing direkt nach Trefferbestätigung, vor Schadenswurf und Specials |
| Schritt 11 (9152–9154): Damage Negation (Halb-Cap) | Nicht implementiert | Negation-Reserve wirkungslos | Vor Schadenswurf Negation-Würfel abziehen, Cap floor(halber Pool) |
| Schritt 13 (9160–9162): Penetration reduziert Armor | `armorPenetration`/`meleeIgnoreArmor` werden nie gelesen | Armor nie reduziert | `effectiveArmor = max(0, armor − penetration)` in Mitigation |
| Ward (9056, 9145–9147): reduziert jedes eingehende Special | Passive Ward `mechanics: {}`; nur Stone-Ward wirkt | Passive Ward wirkungslos | Ward aggregieren und beim Special-Apply abziehen |
| Absorption (9181–9182): HP-Verlust → Temp Colorless Stones | Nicht implementiert | Kein Auto-Harvest | Nach Bar-Schaden Colorless Stones gewähren |
| Parry (9117): „may spend“, eligible direkte Attacke | Auto-Spend min(pool, dice), auch gegen Casting-TN; AoE nur Primärziel | Kein Wahlrecht, falsche Ziele | Prompt 0..n, Gate auf direkte martial Attacken, AoE pro Ziel |
| Adv+Disadv (9296–9327): keine Cancel-Regel | Beide Flags → beide aus | Erfundene Cancel-Regel | Beide anwenden (Phase 7: Cancel entfernen) |
| Disadvantage: „choose one 8“ | Erster 8er-Index, keine Wahl | Keine Spielerwahl | Wahl ermöglichen; Crit-7/8 im Disadvantage-Pfad honorieren |

---

## 2. Aktionsökonomie, Rundenstruktur, Initiative

### Korrekt bestätigt

- 1 Attack / 1 Movement / 1 Reaction Grundausstattung; Dash/Disengage sperren Basis-Attacke; Stand Up = Attack Action; Quick Load ≤ MR.
- Initiative: MRd8 explodierend + Combat Reflexes (Cap MR×4) + Wits floor(W/8); einmal pro Kampf, Round-2+-Reorder aus Restwert.
- Initiative Exchange: 4×MR → Temp Colorless Stone (`colorless-stones.ts`); Basic Attack Weapon + MR×2d8; Dive for Cover; Flee-Lock (4× Speed, sperrt Attacks/Reactions/Stones).
- Tick → Natural Recovery → Decay Reihenfolge am Zugbeginn (`status-tick.ts`).

### Abweichungen

| Regel (PG) | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| 1 Reaktion pro **Runde** (8873–8877) | `resetTurnState` nullt `reactionActions.used` bei jedem Zugwechsel | Bis zu 2 Reaktionen/Runde möglich | Reaktionsbudget nur beim Rundenwechsel zurücksetzen |
| Exchange kauft nur Colorless Stones (8986–9011) | Legacy `applyInitiativeShopBonuses` (extraAttack/Move/Reaction/…) | Alt-Shop widerspricht Exchange | Entfernen (Phase 7) |
| Threatened Ranged (9719–9725): Reaktion nach **Deklaration** | Fenster öffnet nach Auflösung; bietet Counterattack an | Falscher Zeitpunkt, illegale Reaktion | Fenster bei Deklaration, ohne Hit-Trigger-Reaktionen |
| Disengage (9778–9784): ohne bewegungsgetriggerte Reaktionen | `safeMovementThisTurn` wird gesetzt, aber nie gelesen | Wirkungslos | Reaction-Eligibility muss Flag honorieren |
| Aid (Basic Reaction): +4, Full Pool ≥ 2×MR | Nicht als Reaktion implementiert; Katalogtext „+2, 8 m“ falsch | Fehlt/falsch | Nach Buch implementieren |
| Grapple (9841–9857): Opposed Hand-to-Hand; Pressure MR Damage ignoriert Armor | „Might/Agility + optional HtH“; Pressure „MR weapon damage dice“ | Falscher Contest + Schaden | An Buch angleichen |
| Kein universeller Opportunity Attack (reactions.md 115) | `opportunity-attack` noch im Manöverkatalog | Konflikt | Entfernen (Phase 7) |
| Initiative nie < 0 (8972–8976) | Legacy-Helper erlaubt negatives Leftover | Widerspruch | Clampen/Helper entfernen |
| Pursuit (9975–9993) | Nicht implementiert | — | Optional/GM (nicht Teil dieses Passes) |

---

## 3. Health, Stress, Tod, Erholung

### Korrekt bestätigt

- 5 Health Bars + Incapacitated-Box; Bar-Max = Vitality×2; Stress: 4 Bars, Max = Resolve+Intellect.
- Penalty-Prozente [0,10,20,40,50,100] und floor-Abzug; Reihenfolge flat → % → Minimum Pool.
- Stress Breakdown: Wits, TN 8×MR, Erfolg +1 Keep, Fehlschlag Option A/B; Stress-Armor floor(Resolve/8); Fizzle 1d8 Stress.
- Kampfschaden mit Bar-Overflow; normale Heilung nur aktive Bar.

### Abweichungen

| Regel (PG) | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| Penalty der **aktiven** Bar (9357–9372) | `getCurrentPenalty` nimmt erste Bar mit `current < max` — leere vernarbte Bar gewinnt (0 %) | Wundabzüge fallen nach Scarring aus | Erste Bar mit `0 < current` verwenden |
| Incapacitated = Zustand (Prone, keine Aktionen, Death Checks) (9348–9354, 9473–9479) | Nur 6. HP-Box, kein Zustand | Keine Mechanik | Zustandsmaschine implementieren |
| Death Check (9489–9512): Zugende, max(Vit,Res), TN 8×MR, 4 Erfolge/4 Marks | Nicht implementiert | Fehlt | Implementieren |
| Stabilized + Medicine-Assist TN 12×Patient-MR (9514–9527) | Nicht implementiert | Fehlt | Implementieren |
| Heilung weckt, Broken öffnet (9520–9522) | `Actor.heal` füllt nur `bars[currentBar]` | Downed-Heilung wirkungslos | Wake-Logik |
| Scarring (9358–9360): volle Bar wird vernarbt | `scarred` wird nie inkrementiert; Remove Scar füllt keine Bar | Scar-Tracking entkoppelt | `current===0` als Scar; Remove Scar stellt Bar wieder her |
| Stress-Heilung nur aktive Bar (9594–9601) | `healStressFromBars` füllt rückwärts auch frühere Bars | Un-scarring von Stress | Nur aktive Bar heilen |
| First Aid (10012–10018) | Nicht implementiert | Fehlt | Medicine-Check, entfernt Kampf-Specials, 1×/Kreatur |
| Fallschaden (9538–9552): 1d8 je volle 4 m, ignoriert Armor | Nicht implementiert | Fehlt | Implementieren |
| Night Rest / Day of Rest (10043–10059) | Nicht implementiert | Fehlt | Implementieren |
| Safe Haven (10069–10112): 1 vernarbte Bar + aktive Bar; Refresh-Liste | Voll-Reset aller HP/Stress-Bars; `mastery.charges` greift oft nicht | Über-Heilung; Charges-Schema gespalten | Buchumfang; Refresh-Liste erhalten: Skill Points, Reroll Points, Mastery Charges, Daily-Ressourcen, Sealed/Burned Stones; 24-h-Gate |
| Sheet-Schaden (`Actor.applyDamage`) ohne Overflow | Nur aktive Bar | Desync möglich | Über `calculations.applyDamage` routen |
| Meltdown-Schritt vor Breakdown Check | Extra-Schritt nicht im Buch | Obsolet | Entfernen (Phase 7) |

---

## 4. Specials, Cleanse, Natural Recovery, Root

### Korrekt bestätigt

- Application-Limit 4×MR pro Runde/Special; Root von Natural Recovery/Decay ausgenommen, Start −MR; Regeneration verfällt; Ruin/Exorcism/Requiem-Tick ignoriert Armor; Stone-Ward-Reduktion.
- Corrode (−Armor), Expose (−Evade), Hex/Sundered (+⌈X/2⌉d8), Disoriented/Weaken/Soulburn/Challenge (Pools, min MR), Slow (Speed + Standstill-Schaden), Lacerate (Bewegungsstufen), Mark (Damage-Floor), Blight-Stress-Tick.

### Abweichungen

| Regel (PG) | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| Cleanse(X): frei über mehrere Specials verteilbar (10532–10534, 15225) | Katalog/Runtime/Maintenance: genau ein Special | Verteilung verboten | Frei verteilbar in Katalog + `applyCleanseToList` + UI + Maintenance |
| Natural Recovery: MR frei verteilen, nach Ticks (10525–10527) | HUD wirft vollen MR auf ein Special, oft nach Decay | Falscher Default + Timing | HUD-Multiallokation; Decay wartet auf Recovery |
| Root: min Root(2), Speed 0, Break-Check (14856–14868) | Kein Speed 0, kein Min-2, kein Break-Check | Root kaum wirksam | Implementieren; Katalogtext angleichen |
| Blight: Heilung −X (14661) | Keine Heilungsreduktion | Fehlt | In Heilpfade einbauen |
| Penetration/Brutal Impact/Precision (Instants) | Katalogtexte ok, keine Laufzeitwirkung; Instants landen als Status | Wirkungslos | In Schadenspipeline; Instants nicht persistieren |
| Brace/Bulwark/Immovable (15017, 15077, 15092) | Nur Katalogtexte | Keine Automation | Speed 0 + Schilddopplung + Decay; 50 %-Reaktion; Forced-Move-Block |
| Stunned/Prone (15037, 15057) | Erkennung liest Foundry-Status, Specials landen in `system.statusEffects`; Reaktionsverbot fehlt | Apply/Detect getrennt | Aus `statusEffects` lesen; Stunned blockt Reaktionen |
| Challenge `stacking: 'Yes'` | Runtime korrekt (same source/replace higher) | Katalogfeld falsch | Feld korrigieren |
| Crit als generelles Special | Nicht im Buch | Katalog-Extra | Entfernen (Phase 7) |
| Disarm-Wortlaut | „Movement oder Action“ | Buch: 1 Movement oder 1 Attack Action | Text angleichen |

---

## 5. Powers, Power Levels, Magie

### Korrekt bestätigt

- Power Level Cap nach MR (4/8/12/16); Startpowers-Paket MR2; Active-Buff-Milestones (Crit, DR-Caps, Phasing-Caps); geschlossene Passive-Kurven (Ward SR/Incoming, Parry 5×L + min(attr), DR %, Phasing, Armor); Raise-TN/Kosten/Optionen für Spells; AoE-Tabellen; Minor-Expressions-Grundgerüst.

### Abweichungen

| Regel | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| Spell Base TN = 8×**MR des Casters** (PG 11011–11032) | `calculateBaseTN` = 8×ceil(PL/2) für PCs | TN skaliert falsch (massiv) | 8×MR + SR + Raises; Legacy `getMaxSpellLevel` entfernen |
| Mental Base TN = Spell TN + 4 (11095–11113) | Kein +4 | Fehlt | +4 für Mental-Powers |
| Mental Attack: voller Schaden, ignoriert Armor, kein Save (11131–11137) | Katalog erfindet „Mind Save, halber Schaden“ | Erfundene Mechanik | Entfernen |
| Power-XP = 2×neues Level (10285–10307) | `powerLevelCost` = Level | Halbe Kosten | ×2 |
| Use Limit per Technical Reference (11256–11262) | Tracking per Item-Id | Duplikate nutzbar | `powerIdentityKey` verwenden |
| Neuer Active Buff beendet alten (11447–11449) | Aktivierung blockiert | Kein Swap | Alten beenden, neuen aktivieren |
| Spell-Konvertierung: ranged + ≥1 Special (10954–10970) | Kein Special-Gate; AoE pauschal `spell`-Tag | Heal-only-Spells möglich | Gate einbauen; Tag nur bei Konvertierung |
| Single-Target-Special-Ränge (actives.md-Tabellen) | PP-Budget-Solver weicht ab (z. B. Blight 4 statt 3) | Falsche Ränge | Gedruckte Tabellen backen |
| Absorption/Damage Negation Runtime | `mechanics: {}`, nur Anzeige | Wirkungslos | HP je Bar, Stone-Harvest, Negation-Spend |
| AB-DR L1–3 | `damageReductionPct: 10` trotz „—“ | Effekt zu früh | Mechanik bei Cap 0 weglassen |
| MR1-Erschaffung: 1 Passive (3405) | Hardcoded 2 | Falsch bei MR1 | Aus MR ableiten |
| Minor Expressions: 1 Reroll Point Kosten (11667–11675) | Kein RP-Abzug | Fehlt | RP-Debit einbauen |
| Blood Raises (4 HP → +4) | Im Code | Kein Regelbeleg | Entfernen (Phase 7) |
| Mind Probe / Mental Control | Nicht implementiert | Fehlt | Templates ergänzen |

---

## 6. Stones, Skills, XP

### Korrekt bestätigt

- Pool = floor(attr/8), Milestones; Kostenleiter 2^n; T1–T4-Werte aller 32 Stone Powers; Colorless 4×MR; Regen = MR verteilt; Round-1/EoC-Refill; Temp-Defensive verfallen nächsten Zug; Skill-Spending (0 / ≥MR in MR-Schritten / all-in); Full Pool ab Skill ≥ 2×MR; TN-Presets; Attribut-/Skill-XP-Bänder; Attribut-Cap 80; Upgrade-Steps.

### Abweichungen

| Regel (PG) | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| Halber Pool **abgerundet** (2207) | `Math.round(attr/2)` | Aufrundung bei ungeraden | `Math.floor` |
| Erschaffung: 40 Punkte frei, Cap 4 (2135–2139) | Nur 0-oder-4-Chunks | Freie Verteilung verboten | 0–4 frei, Summe 40 |
| Remove Scar: Burn 1 Vitality Stone (8042) | Wave-Exhaust 1/2/4/8, regeneriert | Falsche Ökonomie | Fix 1 Stone verbrannt bis Safe Haven |
| Last Breath: Burn 1 Stone (8113–8124) | `current − 1`, regenerierbar | Burn fehlt | Burn-Status bis Safe Haven |
| Sealed Stones regenerieren nicht (7981–7983, 10035) | Sealed-Menge nicht von Regen/EoC-Refill reserviert | Siegel wirkungslos | Sealed aus Kapazität ausnehmen |
| Ramp-Blank-T1 = 1 Stone ohne Effekt (7964–7972) | Erste Aktivierung springt zu T2/Kosten 2 | Leerstufe entfällt | T1 mit Kosten 1 ohne Effekt |
| Re-Aktivierung **addiert** (8005–8007) | Armor/Parry/DN/DR/Ward/TempHP = SET | Ersetzen statt stapeln | ADD |
| SR wirkt auch auf Spell-AoE (8053) | Tooltip verneint AoE (Runtime ok) | Falscher Text | Text korrigieren |
| Opposed Skill Rolls (2322–2386) | Nicht implementiert | Fehlt | Setup/Opposing-TN (+2/Raise) |
| Power-XP ×2 | Siehe Abschnitt 5 | — | — |

---

## 7. Echoes & Echo-Artefakte

### Korrekt bestätigt

- Kapazitätstabelle implementierter Echoes; Echo-Deck-Slots (1, +MR4, +MR6); Human-/Dwarf-/Elorian-/Titanborn-/Dragonborn-/Unbound-Decks; Elorian Stride Basewerte; Serpent Scales; Oracle Frame (bis auf +15/+14); Predator Crown weitgehend; Alchemist Coat; diverse Progressionstexte.

### Abweichungen

| Bereich | Abweichung | Korrektur |
|---|---|---|
| Echo-Speeds | Human 10, Dwarf 9, Elorian 12, Sentinel 10, Titanborn 12 — Buch: alle 8 m | Alle auf 8 |
| Halflinge | Komplett fehlend (Echo, Ringchain of Kept Names, Deck) | Implementieren |
| Deathless | Fehlt — **explizit WIP, ausgenommen** | Keine Aktion |
| Sentinel Frames | Key-Mismatch `judicators` vs `judicator` → Frames nie wählbar; Sentinel-Frame L2–L10 komplett anders (Battery statt Pool, Special Reduction fehlt); Oracle Field V +15 statt +14; Judicator Regen als Influence statt Wits; erfundene Order-Traits | Nach Buchtabellen neu bauen; Traits entfernen |
| Titan Scars | Mitteltrack falsch (Stone-Pool-Wahl statt Titan Might/Titan Healing); Ultimate falsch | Nach Buch |
| Dragon Head | Base B = Scent of Blood statt Head Armor | Head Armor als Base B |
| Dragon Claws | Schadenstabelle 5–14d8 statt 4–16d8; Penetration/Brutal/Lacerate-Ränge falsch | Klauen-Tabellen backen |
| Wyrm Scales | Drawbacks −4/−8 statt eskalierend −2/−4/−6; Armor-Buff +13/31/49 statt +6/12/18; Stone Might statt Vitality | Nach Buch |
| Elorian Focus | Pre-Fill Tier 3/4/5 statt 2/3/4 | Korrigieren |
| Stonebound Soles | Base A/B vertauscht, Tunneling fehlt, Tremor Sense als Base statt Sense Option | Nach Buch |
| Thornhide | Nicht auf Green Warden begrenzt (Buch: exklusiv) | `requiresEcho`-Gate |
| Snap Chain | Push statt Pull | Pull |
| Witch Staff | Spell Focus verdrängt Tradition Special als Base B | Slot-Layout angleichen |

---

## 8. Rituale, Summons, Minor Magic, Artefakte

### Korrekt bestätigt

- Ritual-TN 8×Ritual-MR, +4/Raise, Stone-Kosten 1/1/2/2/3, Seal-on-attempt, alle 11 Rituale; Summon-Basis (HP 10/Armor 0/Evade 4/2d8/1d8), Token-Kosten, Caps, PL nach MR, once-per-round; Bond Ritual; Artifact-Kapazität 4, 8 XP/Level, BV-Unlocks A/B/C, Stone Functions; Minor-Magic-Limit MR, Snapshot, Formen.

### Abweichungen

| Regel | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| Flying-Basis 8 m (PG 12939) | 4 m | Owl-Beispiel unmöglich | 8 m |
| Climbing-Mode (12956–12959) | Fehlt (→ Walking) | Nicht wählbar | Ergänzen |
| Summon-Skill: Dice ≤ Owner-Rating (13118–13120) | Floor Rating ≥ MR×2 | Erlaubtes verboten | Floor streichen |
| Movement Powers kaufbar (13196–13200) | Kategorie gesperrt | Verboten | Erlauben |
| Kanonische Kataloge kaufbar (13182–13188) | Enge Allowlist inkl. verbotener `ab-damage`/`ab-armor` | Zu eng + falsch | Öffnen; ab-damage/ab-armor raus |
| Ritual-MR-Default | Actor-MR vorbelegt (Buch: eigener MR setzt TN nicht) | Falscher Default | Leer/GM-Eingabe |
| Word of Recall Siegel (12795–12815) | Normales Seal, Safe Haven löst | Mark ignoriert | Mark-Tracking |
| Minor Magic: nur Instant-Actives, keine Artefakt-Funktionen (13455–13458) | Kein Instant-Check; Artefakt-Actives zugelassen | Zu weit | Gates einbauen |
| Minor Magic Nutzung (13489–13497) | Nur Chat-Stub | Keine Auflösung | Snapshot-Attacke auflösen |
| Ring/Amulett BV 3, kombiniert 4 (artefacts.md 288–318) | Je 1, kein Kombi-Check | Zu restriktiv | 3 + Kombi-4 |
| Artefakt-Level-Gate `(MR−1)×2`; 1-Stone-Link | Nicht im Regelwerk | Extra-Hürden | Entfernen |

---

## 9. Ausrüstung, Waffen, NPCs

### Korrekt bestätigt

- Inventar 24×9, drei Zonen, höchste belegte Zone zählt, Platzierung; Armor-/Schild-Tabellenwerte; Waffen-Schaden/Hände/Specials (außer unten); Finesse, Reach, Heavy/Balanced-Initiative; NPC-Statblock (Phasen, autorisierte Defenses, Attack-Slots, Specials, Reactions), Default-Movement 8 m.

### Abweichungen

| Regel (PG) | Foundry | Abweichung | Korrektur |
|---|---|---|---|
| Load: nur Movement −4/−6 m (10670–10674) | Zusätzlich −20 %/−50 % Würfelpool; Movement-Malus wird nirgends angewendet | Extra-Regel + fehlende Regel | Dice-Malus entfernen (Phase 7); Movement-Malus anwenden |
| Thrown (16 m) / Ranged (32 m) flach (10877–10914) | 4/8/16- bzw. 8/16/32-Bands + 100/75/50 %-Pool | Bands obsolet | Flache Reichweiten; Bands entfernen (Phase 7) |
| Flail: Prone (10891) | `Prone(1), Challenge(2)` | Extra-Special | Nur Prone |
| Versatile: 2H +2d8 (10906) | Nur Text | Fehlt | Automatisieren |
| Set: +1d8 ohne Bewegung (10909) | Nur Text | Fehlt | Automatisieren |
| Defensive: 2H +MR Evade (max +6) (10915) | Nur Text | Fehlt | In Evade-Ableitung |
| Load-Property: Unloaded + Attack-Action-Reload (10911) | Kein Unloaded-Zustand | Fehlt | Implementieren |
| Light: Offhand erlaubt (10905) | Offhand blockt Nahkampfwaffen | Verboten | Erlauben |
| Spell Focus mundan (Wand/Runestaff) | Nur Artefakt-`spellFocus` zählt | Fehlt | Waffen-Innate parsen |
| Item-Rotation (10698–10704) | Fehlt | — | Implementieren |
| Drop Load / Surprise (10826–10863) | Fehlt | — | Aktionen implementieren |
| Zone „Overloaded“ (10666) | Label „Heavy Load“ | Benennung | Umbenennen |
| NPC-Attacken „6d8, Keep 1“ (13977–13995) | Kein Keep-Feld; Keep = Actor-MR | Schema-Lücke | `keepDice` je Attacke |
| NPC-Reaktionen Default | Default 0 Slots | **Nicht ändern** (explizite Nutzerentscheidung) | Keine Aktion in diesem Pass |
| NPC-Stress-on-Hit (Nd8) | Im Code | Kein Regelbeleg | Entfernen (Phase 7) |

---

## 10. Entfernungen (obsolet / ohne Regelbeleg) — Phase 7

Range Bands (100/75/50 %), Encumbrance-Würfelabzüge, Stress-Meltdown-Schritt, Blood Raises, Interpose als Basis-Reaktion, NPC-Stress-on-Hit, Adv/Disadv-Cancel, Legacy-Initiative-Shop, Opportunity Attack, Weapon Swap als Movement, Crit als generelles Special, erfundene Sentinel-Order-Traits, Mind Save.

## 11. d6-Audit — Phase 8

Repo-weit werden alle mechanischen d6-Referenzen zu d8 korrigiert (ohne PP-/Balance-Anpassung). Fundliste wird nach Durchführung hier ergänzt.

## 12. Encounter-Forge-Abhängigkeiten

Der Forge importiert geteilte Module (`constants.ts`, `special-effects.ts`, `calculations.ts`, `probability`-nahe Werte). Änderungen an diesen Modulen können Forge-Ergebnisse indirekt beeinflussen (z. B. Penalty-Index, Power-XP). Forge-Code selbst bleibt unverändert; relevante Abhängigkeiten werden bei Umsetzung je Phase hier vermerkt.

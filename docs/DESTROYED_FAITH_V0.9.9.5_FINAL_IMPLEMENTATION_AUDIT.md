# Destroyed Faith v0.9.9.5 – Abschluss-Audit

Stand: 2026-10-16. Dieses Dokument prüft. Es ändert keinen Regeltext und keine Spiellogik.

Es wurde kein Foundry-Fenster geöffnet. Alles unter „Canvas“ ist nicht getestet.

## Voraussetzung

Die Fortschrittsdatei und `docs/DESTROYED_FAITH_V0.9.9.5_P1_BATCH_RESULT.md` melden P1.7, P1.9, P1.8 und P1.6 als vollständig. P1.4 Fear und P1.5 Fallschaden stehen dort ausdrücklich als nicht begonnen. Das Audit ist damit freigegeben. „Vollständig“ in jenen Berichten ist keine Abnahme.

| Paket | Im Bericht | In diesem Audit |
|---|---|---|
| P0, P1.1 | abgenommen, Canvas offen | nicht neu am Tisch geprüft; die Suite ist grün |
| P1.2 Movement Reduction | umgesetzt | Kappung im Token-Update vorhanden; siehe Drag-Lücke |
| P1.3 Colorless Recovery | umgesetzt | nicht Zeile für Zeile neu gelesen |
| P1.4 Fear | nicht begonnen | im Code keine Fear-Prüfung |
| P1.5 Fallschaden | nicht begonnen | keine Fallhöhen-Funktion |
| P1.6, P1.7, P1.8, P1.9 | vollständig gemeldet | Resolver vorhanden, Canvas nicht belegt, konkrete Lücken unten |

## Quellen

| Datei | Gelesene Version |
|---|---|
| `docs/Rules/players-guide.md` | v0.9.9.5 (2026-10-15), Zeile 210 |
| `docs/Rules/actives.md` | v0.9.9.5 (2026-10-15), Zeile 63 |
| `docs/Rules/active-buffs.md` | v0.9.9.5 (2026-10-15), Zeile 63 |
| `docs/Rules/passives.md` | v0.9.9.5 (2026-10-15), Zeile 62 |
| `docs/Rules/reactions.md` | v0.9.9.5 (2026-10-15), Zeile 61 |
| `docs/Rules/artefacts.md` | v0.9.9.5 (2026-10-16), Zeile 60 |
| `docs/Rules/movement.md` | v0.9.9.5 (2026-10-16), Zeile 61 |

Das erste Audit las Movement noch als v0.9.8. Diese Datei ist inzwischen v0.9.9.5. `docs/Rules/agent.md` listet Artifacts noch mit Datum 2026-10-15. Die Artefakt-Datei selbst sagt 2026-10-16. Das ist ein Datumsunterschied im Index, kein zweites Regelwerk.

Ein Namensabgleich im Katalog ist kein Wirkungsnachweis.

## A. Gesamtbewertung

Das System kann einen Kampf führen: Pool, Keep, TN, Schaden, Rüstung, einen Teil der Specials, Stones, Aktionsleiste, Heilung auf der aktuellen Bar, Perception. Die vier zuletzt beauftragten Pakete haben echte Resolver, keine reinen Katalogzeilen. Sie sind nicht am lebenden Tisch belegt.

Was nachweislich an einem Laufzeitpfad hängt und von Tests aufgerufen wird:

- Damage Transfer heilt den realen HP-Verlust dieser Instanz, nach Mitigation, nur auf der aktuellen Bar, einmal pro Instanz-Id. Ein Fehlschlag heilt 0.
- Special Aura addiert +1 in `getActiveSpecialValue` und schreibt den gespeicherten Stack nicht um. Zwei Auren bleiben bei +1.
- Summon Damage Aura würfelt im Schadensdialog mit, nicht im Zugende-Puls. Summon Armor Aura addiert in `applyDamageToTarget` und schreibt `armorTotal` nicht hoch.
- Die zehn Movement Powers laufen über `executeMovementPower` mit eigener Art. PL 1 von Teleport with Ally und Phase Passage wird dort abgelehnt.
- Flee über `commitFlee` verbraucht Movement und Attack Action und sperrt Attack, Reaction und Colorless-Stones bis `resetTurnState`. Pursuit ist ein GM-Start, Track 0, Ende bei +2 und −2.

Was fehlt oder der Regel widerspricht:

- Fear und Fallschaden sind nicht implementiert.
- Defensive Stones werden gelöscht, wenn das eigene Spotlight endet, nicht erst am Beginn des nächsten eigenen Zuges.
- Ein Token-Drag kann Flee und andere Bewegungen an `commitFlee` beziehungsweise `executeMovementPower` vorbeiziehen.
- Der größte Teil der Power- und Artefakt-Kataloge ist in diesem Audit nicht Power für Power vom Knopf bis zum Zustand verfolgt. Dafür gibt es keinen Ehrentitel „vollständig“.

Grün heißt hier: `npx tsc --noEmit` Exit 0, danach `npx vitest run` mit 245 Dateien, 2720 bestanden, 0 fehlgeschlagen, 0 übersprungen. Das beweist, dass die vorhandenen Tests zu ihrem Code passen. Es beweist nicht jede gedruckte Tabelle.

## B. Implementierungsmatrix

Statuswerte: Vollständig implementiert und getestet / Implementiert, aber nicht ausreichend getestet / Teilweise implementiert / Nur Daten / Nicht implementiert / Regelwidrig implementiert / Nicht verifizierbar.

„Getestet“ heißt hier: ein Test ruft den Resolver auf. Kein Eintrag ist am Foundry-Canvas getestet.

### B1. Core

| Regel | Quelle | Status | Code | Test | Abweichung |
|---|---|---|---|---|---|
| Kein Minimum-Pool auf MR | Core, Pool; Skill-Punkte „at least MR“ sind etwas anderes | Implementiert, aber nicht ausreichend getestet | `finalizeRolledPool` in `src/dice/pool-finalize.ts` hebt nicht mehr auf MR an; 0 Würfel schlägt fehl | Suite enthält Pool-Tests; diese Prüfung hat die Erwartung nicht Satz für Satz mit dem Buch verglichen | Keep bleibt an den tatsächlich vorhandenen Würfeln |
| Heilung nur aktuelle Bar | Core Healing | Implementiert, aber nicht ausreichend getestet | `applyHealHpAcrossOpenBars` füllt nur `currentBar`; Incapacitated sucht Broken | `tests/heal-resolution.test.ts` | Kein Canvas |
| Damage Transfer | Core, Vampyr ist die Fiktion, nicht eine dritte Power | Implementiert, aber nicht ausreichend getestet | `settleDamageTransfer`; Aufruf aus `applyDamageToTarget` nur wenn der Angriff nicht fehlgeschlagen ist | `tests/damage-transfer.test.ts` | In-Memory-Set der Instanz-Ids überlebt keinen Reload. Kein Canvas |
| Special Aura | Passives | Implementiert, aber nicht ausreichend getestet | `specialAuraEffectiveStep`; `getActiveSpecialValue` | `tests/special-summon-auras.test.ts` | Nur die zwölf Beispielnamen. Distanz ist Mittelpunkt zu Mittelpunkt |
| Summon Damage / Armor Aura | Active Buffs | Implementiert, aber nicht ausreichend getestet | `summonDamageAuraBonusDice` im Schadensdialog; `summonArmorAuraBonus` in der Mitigation | derselbe Test | Besitz über `summonBond`, nicht über Team. Kein Puls |
| Damage / Healing Aura | Active Buffs | Implementiert, aber nicht ausreichend getestet | `pulseActiveBuffAuras` nur `kind` damage und healing | derselbe Test prüft einen Puls und die zweite Auslösung in derselben Runde | Kein Canvas |
| Flee | Core Escape Rule | Teilweise implementiert | `commitFlee`; geführte Bewegung ruft es beim ersten Klickziel auf | `tests/flee-pursuit.test.ts` | Drag umgeht den Commit. Siehe C1 |
| Pursuit | Core Pursuit | Implementiert, aber nicht ausreichend getestet | `startPursuit`, `resolvePursuitExchange` | derselbe Test | Genau zwei Teilnehmer. Kein Dialogklick |
| Zehn Movement Powers | Movement v0.9.9.5 | Implementiert, aber nicht ausreichend getestet | `executeMovementPower` | `tests/movement-powers.test.ts` | Höhe, Wand, Material nur als Bestätigung. Drag siehe C1 |
| Movement Reduction | Core / P1.2 | Implementiert, aber nicht ausreichend getestet | `applyMovementCapToTokenChange` | `tests/movement-reduction.test.ts` | Gewöhnlicher Move ohne Flag bleibt absichtlich unkappbar |
| Threat Zones | Core, Movement-Triggered Reactions | Implementiert, aber nicht ausreichend getestet | `planThreatZoneWindows`; Flee-Art ist `path` | Threat- und Movement-Tests | Ob jeder Token-Hook das Fenster wirklich öffnet, ist in diesem Audit nicht klickweise belegt |
| Initiative-Gleichstand | Core: MR, dann Agility, dann 1d8 | Implementiert, aber nicht ausreichend getestet | `compareInitiativeCombatants` | `tests/initiative-order.test.ts` liegt in der grünen Suite; die Assertions wurden hier nicht neu gegen den Absatz gelesen | Das erste Audit ist hier überholt |
| Surprise Priority | Core, ändert die Initiative-Zahl nicht | Implementiert, aber nicht ausreichend getestet | `applySurprisePriorityForAttack` aus `createAttackCard` | Surprise-Tests in der Suite | Nur wenn diese Angriffskarte entsteht |
| Invisibility bleibt bei Angriff und Incapacitated | Hausregel zum Core | Implementiert, aber nicht ausreichend getestet | `isInvisibilitySuppressedByHealth` gibt `false` zurück | Perception-Tests | Kein Canvas |
| Defensive Stones bis zum nächsten eigenen Zug | Core Stone Abilities | Regelwidrig implementiert | `stone-hooks.ts` löscht die Boni des vorherigen Spotlights | keiner für die Dauer über fremde Züge | Siehe C2 |
| Crit vor dem Wurf | Core | Implementiert, aber nicht ausreichend getestet | Attack-Card-Button `data-use-crit` vor `masteryRoll` | Stone-Tests prüfen den Zähler, nicht jeden Dialog | Nicht jeder Wurfdialog wurde geöffnet |
| Raises, AoE halbiert aufgerundet | Core | Implementiert, aber nicht ausreichend getestet | `damageRaiseDice` in `raise-resolution.ts`: `Math.ceil(mr / 2)` bei AoE | Raise-Tests | Ob jede AoE-Karte `hasAoe` setzt, ist nicht für jede Vorlage belegt |
| Split Attack, zweites Ziel | Core | Implementiert, aber nicht ausreichend getestet | `openSplitPair` fragt ein zweites Token | nicht in diesem Audit isoliert nachgelesen | Fällt der Dialog aus, bleibt das erste Ziel |
| Fear | Core | Nicht implementiert | keine Fear-Prüfung | keiner | P1.4 nicht begonnen |
| Fallschaden | Core, 1d8 je volle 4 m, ignoriert Armor | Nicht implementiert | keine Fallfunktion | keiner | P1.5 nicht begonnen |
| 32 Stone Abilities | Core | Nicht verifizierbar als Gesamtpaket | Bezahlung liegt in `spendStoneAbility` | Stone-Power-Tests existieren | Dauer der defensiven Stones ist die bekannte Abweichung. Nicht jede Ability wurde neu gespielt |
| Death Check, Last Breath | Core | Nicht verifizierbar in diesem Durchgang | `maybeRollDeathCheck`, `last-breath.ts` | nicht isoliert neu ausgeführt | Pfad war im ersten Audit vorhanden |
| Rest und Recovery | Core | Nicht verifizierbar | nicht neu gelesen | — | |

### B2. Movement Powers

Quelle: `docs/Rules/movement.md` v0.9.9.5. Code: `src/combat/movement-powers.ts`. Test: `tests/movement-powers.test.ts`. Kein Canvas.

| Power | Status | Nachweis | Restrisiko |
|---|---|---|---|
| Ground Dash | Implementiert, aber nicht ausreichend getestet | Modus Pfad, Distanz, Wände nur wenn Segmente existieren | Drag |
| Safe Movement | Implementiert, aber nicht ausreichend getestet | Traversal `safe`, Threat unterdrückt, Lacerate bleibt | Drag |
| Teleport | Implementiert, aber nicht ausreichend getestet | Nur Endpunkte, Sicht oder Bestätigung | Drag |
| Teleport with Ally | Implementiert, aber nicht ausreichend getestet | PL 1 `movementUnavailable`, `executeMovementPower` lehnt das ab | Drag eines höheren Levels |
| Flight | Implementiert, aber nicht ausreichend getestet | 3D-Budget, Landung nur per Bestätigung | keine Höhenkollision |
| Leap | Implementiert, aber nicht ausreichend getestet | horizontal und vertikal getrennt | Auslegung, kein Canvas |
| Wall Walk | Implementiert, aber nicht ausreichend getestet | Pfad plus Bestätigung | keine Oberflächenprüfung |
| Burrow | Implementiert, aber nicht ausreichend getestet | Pfad plus Bestätigung | kein Materialscan |
| Phase Passage | Implementiert, aber nicht ausreichend getestet | Reise = Speed plus Enhancement, dann eine Halbierung; Dicke bleibt der PL-Wert; PL 1 abgelehnt | keine automatische Dicke |
| Trample | Implementiert, aber nicht ausreichend getestet | `applyDamageToTarget` auf Kreaturen des Segments | nur wenn `executeMovementPower` läuft |

### B3. Kataloge Actives, Active Buffs, Passives, Reactions, Artifacts

Dieser Durchgang hat nicht jede Vorlage von Stufe 1 bis 16 gegen die gedruckte Tabelle und gegen einen Klickpfad geprüft. Ein Eintrag in `src/utils/powers/templates/` ist Daten. Wirkung ist nur dort belegt, wo ein Resolver oben genannt ist.

| Bereich | Status | Nachweis |
|---|---|---|
| Benannte Vorlagen im Katalog | Nur Daten, bis ein Resolver sie liest | `catalog-rules-audit` prüft Namen, nicht Wirkung |
| Damage Aura, Healing Aura, Special Aura, beide Summon-Auren | siehe B1 | Tests rufen Puls, Special-Wert und Schadensdialog auf |
| Übrige Actives, Buffs, Passives, Reactions | Nicht verifizierbar | nicht Power für Power neu ausgeführt |
| Artefakt-Profile und Level-10-Awakening | Nicht verifizierbar | Bäume und Life Taken sind angefasst; der Rest nicht neu gespielt |
| Summon-Besitz | Implementiert, aber nicht ausreichend getestet | `resolveSummonBondContext` und die Aura-Prüfung | fremde Summons bekommen den Bonus im Test nicht |

## C. Kritische Abweichungen

### C1. Token-Drag umgeht Flee und den Movement-Power-Commit

- Quelle: Core, Escape Rule. Flee verbraucht 1 Movement und 1 Attack Action und sperrt danach. Movement Powers verbrauchen eine Movement nur bei erfolgreicher Nutzung.
- Erwartet: Ohne beide Ressourcen keine Flee-Bewegung. Ohne Commit keine Sperre und kein Verbrauch. Unavailable-Stufen bewegen nicht.
- Tatsächlich: `handleChosenCombatOption` startet die geführte Bewegung, ohne schon zu verbrauchen. `commitFlee` läuft in `attemptCommitMovement`, also beim Klick auf ein Ziel im Führungsmodus. `preUpdateToken` in `src/token-action-selector.ts` lässt die Bewegung durch, wenn `activeMovementState` auf diesem Token steht, ohne Kappung und ohne `commitFlee`. Liegt nur `currentAction.optionId === 'flee'` an, wird gekappt, aber wieder nicht `commitFlee` aufgerufen. `updateToken` löscht danach nur das Flag. Movement Powers geben ihre Kosten in `executeMovementPower` aus, nicht in diesem Drag-Hook.
- Beispiel: Flee im Radial wählen, dann den Token mit der Maus ziehen statt ins Führungsziel zu klicken. Die Figur bewegt sich. Movement und Attack Action bleiben, `fleeLock` bleibt aus. Eine Pursuit entsteht dabei ebenfalls nicht, das ist korrekt.
- Priorität: hoch.
- Korrektur: Im `preUpdateToken` Flee und Movement Powers durch `commitFlee` beziehungsweise `executeMovementPower` schicken oder den Drag ablehnen, solange der geführte Modus offen ist.

### C2. Defensive Stones enden mit dem eigenen Spotlight

- Quelle: Core, Stone Abilities, Wirkung bis zum Beginn des nächsten eigenen Zuges.
- Erwartet: Parry, Armor, Evade und die übrigen defensiven Ausgaben bleiben über die Züge der anderen bestehen.
- Tatsächlich: `src/stones/stone-hooks.ts` ruft bei Spotlight-Wechsel `clearCombatStoneTurnBonusesForActor` für den vorherigen Akteur auf.
- Beispiel: Kreatur kauft zu Beginn ihres Zuges Armor, Zug endet, der nächste Gegner schlägt zu. Die Armor aus diesem Stein ist schon weg.
- Priorität: hoch.
- Korrektur: Löschen erst in `resetTurnState` des eigenen nächsten Zuges, analog zu `fleeLock`.

### C3. Fear fehlt

- Quelle: Core, Fear.
- Erwartet: Fear-Check, Zähler, TN, Abbau erst bei Safe Haven.
- Tatsächlich: keine Funktion. P1.4 ist nicht begonnen.
- Priorität: hoch, sobald Fear im Spiel vorkommt.
- Korrektur: eigenes Paket, nicht an Flee anhängen.

### C4. Fallschaden fehlt

- Quelle: Core, 1d8 je volle 4 m, Armor ignorieren.
- Tatsächlich: keine Funktion.
- Priorität: mittel.
- Korrektur: eigenes Paket P1.5.

### C5. Damage-Reduction-Rundung

- Quelle: die gedruckte DR-Formel ist in diesem Audit nicht Zeile für Zeile neu zitiert. Der Code zieht `Math.ceil(Schaden * Prozent / 100)` als Reduktion ab (`src/combat/damage-mitigation.ts`).
- Beispiel: 10 Schaden, 25 % ergibt Reduktion 3, Rest 7. Ein `ceil` auf den verbleibenden Schaden ergäbe 8.
- Priorität: mittel, bis die Formelstelle festliegt.
- Korrektur: nur ändern, wenn der Satz im Core die andere Richtung vorschreibt.

### C6. Special Aura nur für zwölf Namen

- Quelle: Passives, „common eligible examples“.
- Erwartet, wenn die Liste offen ist: jedes passende numerische Diminishing Special.
- Tatsächlich: `SPECIAL_AURA_ELIGIBLE` enthält nur Challenge, Corrode, Disoriented, Expose, Hex, Lacerate, Mark, Ruin, Slow, Soulburn, Sundered, Weaken. Der gespeicherte Stack wird nicht erhöht. Das ist belegt.
- Priorität: niedrig, bis die Liste geschlossen oder offen entschieden ist.
- Korrektur: keine Erweiterung ohne Satz im Buch.

### C7. Pursuit nur als Paar

- Quelle: Core beschreibt einen Flüchtenden und einen Verfolger. Keine Mehrparteien-Formel.
- Tatsächlich: eine aktive Pursuit, zwei Actor-Ids. Das ist eine Grenze, kein stiller Hausbonus.
- Priorität: niedrig.
- Korrektur: keine automatische dritte Partei.

### C8. Instanz-Speicher von Damage Transfer

- Quelle: eine Schadensinstanz heilt einmal.
- Tatsächlich: `processedDamageTransferIds` ist ein Set im Modul. Ein Reload vergisst es. Ein zweiter Apply mit derselben Id im selben Prozess heilt nicht noch einmal. Der Test belegt den zweiten Fall.
- Priorität: niedrig.

## D. Testabdeckung

Ausgeführt in diesem Audit:

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 245 Dateien, 2720 bestanden, 0 fehlgeschlagen, 0 übersprungen.

Die vier Paket-Tests rufen Resolver auf, keine Foundry-Events und kein Canvas:

| Paket | Testdatei | Was bewiesen ist | Was nicht |
|---|---|---|---|
| P1.7 | `tests/damage-transfer.test.ts` | `applyDamageToTarget` | Chat-Klick, zweite Health Bar im Fenster |
| P1.9 | `tests/special-summon-auras.test.ts` | Special-Wert, Schadensdialog, Mitigation, Puls | Token auf der Karte |
| P1.8 | `tests/movement-powers.test.ts` | `executeMovementPower` | Radial, Dialog, Wände einer echten Szene |
| P1.6 | `tests/flee-pursuit.test.ts` | `commitFlee`, Kappung, Threat-Plan, Pursuit-Track, `masteryRoll` | Drag, Dialog, Tracker-Button |

Veraltet gegenüber dem ersten Audit, aber im Code inzwischen anders: Minimum-Pool, Heilung über mehrere Bars, Initiative ohne MR, fehlende Threat-Zone, fehlender Transfer, fehlende Pursuit, Movement nur als Radius. Diese Sätze des ersten Audits nicht wiederverwenden.

Ungetestet bleiben Fear, Fallschaden, die Dauer defensiver Stones, der Drag-Bypass, und jede Katalog-Power ohne eigenen Resolver-Test.

## E. Offene Altprobleme

| Erstes Audit | Jetzt |
|---|---|
| Movement-Datei v0.9.8 | Datei ist v0.9.9.5 (2026-10-16) |
| Threat Zone nicht implementiert | Planer und Tests vorhanden; Hook-Klick nicht belegt |
| Movement Powers nur Text | `executeMovementPower` mit zehn Arten |
| Pursuit fehlt | GM-Pursuit mit Track |
| Damage Transfer fehlt | Resolver im Schadensdialog |
| Special- und Summon-Auren nur Katalog | Laufzeitabfrage, kein Puls für Summon-Auren |
| Heilung über mehrere Bars | nur aktuelle Bar |
| Minimum-Pool MR | entfernt |
| Initiative ohne MR und 1d8 | MR, Agility, 1d8 im Vergleich |
| Surprise Priority ohne Aufrufer | Aufruf aus der Angriffskarte |
| Invisibility bei Incapacitated weg | Funktion gibt `false` zurück |
| Defensive Stones enden zu früh | unverändert |
| Fear fehlt | unverändert |
| Fallschaden fehlt | unverändert |
| 14 rote Tests | diese Suite: 0 fehlgeschlagen |

## F. Priorisierte Restarbeiten

1. Drag-Sperre. Abnahme: Flee-Drag ohne Führungsziel verbraucht nichts und bewegt nicht, oder er ruft `commitFlee` auf und scheitert ohne Ressourcen. Movement-Power-Drag ohne `executeMovementPower` bewegt nicht. Unavailable-Stufe bewegt nicht.
2. Defensive Stones. Abnahme: Bonus übersteht den Zug des nächsten Gegners und fällt in `resetTurnState` des Käufers.
3. Fear. Abnahme: Check, Zähler, TN und Safe-Haven-Abbau wie der Core-Absatz, mit Test durch den echten Check.
4. Fallschaden. Abnahme: 1d8 je volle 4 m, Armor bleibt außen vor, Test durch den Schadensresolver.
5. DR-Rundung. Abnahme: ein Satz aus dem Core, ein Zahlenbeispiel, ein Test. Keine Änderung vor dem Satz.
6. Canvas-Abnahme der vier Pakete nach Abschnitt G. Erst danach den Status von „Resolver grün“ auf „am Tisch belegt“ heben.
7. Kein neues Vollaudit und kein P2, bevor 1 bis 4 entschieden sind.

## G. Manueller Foundry-Abnahmeplan

Ausgang, sofern nichts anderes steht: eine Kampfrunde hat begonnen, der Handelnde hat 1 Movement, 1 Attack Action, 1 Reaction, Speed 8, eine offene Health Bar.

1. Flee mit beiden Ressourcen. Radial, ins Führungsziel klicken, 20 m. Erwartet: Movement 0, Attack Action 0, keine Attacke, keine Reaction, kein Stein. Der nächste Gegner ist noch dran, die Sperre bleibt. Am eigenen nächsten Zug ist sie weg.
2. Flee-Drag. Dieselbe Wahl, dann den Token ziehen statt zu klicken. Erwartet nach einer Korrektur: keine Bewegung ohne Commit. Heute ist das der Fehler C1.
3. Flee ohne Attack Action. Erwartet: keine Bewegung, keine Sperre, Movement unverbraucht.
4. Flee ohne Movement. Erwartet: dasselbe für die Attack Action.
5. Flee durch eine gegnerische Threat Zone. Erwartet: Reaction-Fenster, kein Safe-Movement-Schutz.
6. Flee, dann keine Pursuit. Erwartet: kein Track, bis der GM den Button drückt.
7. Pursuit starten, Track 0, zwei Siege des Flüchtenden mit Agility. Erwartet: +1, dann Escape, kein weiterer Exchange.
8. Neue Pursuit, zwei Siege des Verfolgers. Erwartet: −1, dann Caught.
9. Gleichstand. Erwartet: Track bleibt. Ein zweiter Klick auf denselben Exchange ändert ihn nicht.
10. GM lässt nur Might zu. Agility wird abgelehnt.
11. Damage Transfer, Nahkampf, Ziel verliert nach Rüstung 7 HP auf der aktuellen Bar. Angreifer fehlen 4. Erwartet: Heilung 4, nicht 7 und nicht der Rohschaden.
12. Derselbe Treffer ein zweites Mal aus dem Chat. Erwartet: keine zweite Heilung.
13. Transfer bei Fehlschlag und bei vollem Prevent. Erwartet: Heilung 0.
14. Special Aura Weaken, Ziel hat Weaken(2) im Radius. Erwartet: Pool −3, der Bogen am Token zeigt weiter 2. Ziel verlässt den Radius: Pool −2.
15. Ziel ohne Weaken in derselben Aura. Erwartet: kein Weaken.
16. Zwei Weaken-Auren. Erwartet: immer noch nur +1.
17. Summon Damage Aura, eigener Summon im Radius, zwei Bond-Angriffe. Erwartet: beide Male die gedruckten Zusatzwürfel. Ein fremder Summon daneben bekommt sie nicht.
18. Summon Armor Aura, Schaden auf den Summon im Radius und danach außerhalb. Erwartet: nur innen die höhere Mitigation. Der Basiswert am Bogen bleibt.
19. Damage Aura am eigenen Zugende auf einen Gegner, dann den Token in der fremden Runde verschieben. Erwartet: genau ein Puls, kein zweiter durch die Bewegung.
20. Ground Dash und Teleport je einmal. Erwartet: Dash öffnet die Zone auf dem Weg, Teleport nur an den Enden. PL-1-Teleport-with-Ally lässt sich nicht ausführen.
21. Leap mit Movement Reduction. Erwartet: horizontal einmal halbiert, vertikal der halbe Druckwert noch einmal halbiert, nicht eine Summe.
22. Trample über eine Figur. Erwartet: ein Schadenseintrag, Rüstung des Ziels zählt, kein Angriffswurf.
23. Movement Reduction auf einen Gegner, Zug 8 m. Erwartet: Token bei 4 m. Ein zweiter Move in derselben Runde wieder von 8 auf 4, nicht von 4 auf 2.
24. Defensiver Stein Armor, Zug beenden, Gegner schlägt zu. Erwartet nach Korrektur: Bonus noch da. Heute voraussichtlich C2.
25. Invisibility, dann angreifen und auf 0 HP der letzten Bar gehen. Erwartet: Invisibility bleibt, gewöhnliches Stealth endet beim Angriff.

## Antworten

1. P1.7, P1.9, P1.8 und P1.6 sind als Resolver implementiert und von Unit-Tests aufgerufen. Sie sind nicht als Canvas-Abnahme belegt. P1.6 ist teilweise, solange der Drag den Flee-Commit umgeht. Die anderen drei sind auf ihrem Resolver-Pfad regelnah, mit den genannten Grenzen zu Distanz, Bestätigung und der Special-Liste.
2. Konkrete Fehler: C1 Drag, C2 Stone-Dauer, C3 Fear, C4 Fallschaden, C5 DR-Rundung ungeklärt, C6 Aura-Liste, C8 Transfer-Set nur im Prozess. Unbelegt: jeder Katalogeintrag ohne eigenen Wirkpfad, und jeder UI-Klick.
3. Die grüne Suite spricht nicht für eine Regression von P0, P1.1, P1.2 oder P1.3. P1.4 war nie da. Die Stone-Dauer ist ein älterer Fehler und weiter offen. Invisibility bei Incapacitated bleibt aus, wie die Hausregel verlangt.
4. Weiter fehlend: Fear, Fallschaden, eine geschlossene Laufzeit für den übrigen Power- und Artefakt-Katalog, und die sichere Token-Bewegung gegen Drag.
5. Die 25 Szenen in Abschnitt G, mindestens 1 bis 20.
6. Als Nächstes C1, dann C2. Fear und Fallschaden danach als eigene Pakete. Kein neues Vollaudit vorher.

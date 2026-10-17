# Destroyed Faith v0.9.9.5 — Implementierungs-Audit (Phase 1)

Stand: 2026-10-16. Dieses Dokument ist ein Abgleich, keine Umsetzung.
Es wurden keine Regeltexte geändert und keine Spiellogik nachgezogen.

Statuswerte sind genau die sieben aus dem Auftrag.
„Vollständig implementiert und getestet“ wird nur vergeben, wenn der konkrete Ablauf im Code liegt und ein Test genau diesen Ablauf prüft. Das ist in diesem Audit für keine Kampfregel der Fall. Allgemeine Vitest-Läufe belegen das nicht.

## Quellenstand

| Dokument im Auftrag | Datei im Projekt | Im Dokument gelesene Version | Bewertung |
|---|---|---|---|
| Core v0.9.9.5 | `docs/Rules/players-guide.md` | v0.9.9.5 (2026-10-15), Zeile 210 | vorhanden |
| Actives v0.9.9.5 | `docs/Rules/actives.md` | v0.9.9.5 (2026-10-15), Zeile 63 | vorhanden |
| Active Buffs v0.9.9.5 | `docs/Rules/active-buffs.md` | v0.9.9.5 (2026-10-15), Zeile 63 | vorhanden |
| Passives v0.9.9.5 | `docs/Rules/passives.md` | v0.9.9.5 (2026-10-15), Zeile 62 | vorhanden |
| Reactions v0.9.9.5 | `docs/Rules/reactions.md` | v0.9.9.5 (2026-10-15), Zeile 61 | vorhanden |
| Artifacts v0.9.9.5 | `docs/Rules/artefacts.md` | v0.9.9.5 (2026-10-16), Zeile 60 | vorhanden, ein Tag neuer als die anderen Kataloge |
| Movement v0.9.9.5 | `docs/Rules/movement.md` | **v0.9.8 (2026-08-01), Zeile 61** | **keine v0.9.9.5-Fassung im Projekt** |

`docs/Rules/agent.md` ist ein Balance-Framework, keine der sieben Regelquellen. Es nennt Movement selbst als v0.9.8 (2026-08-01). Movement-Regeln in diesem Audit gelten nur für die vorhandene v0.9.8-Datei. Wo Core v0.9.9.5 Movement anders beschreibt, hat Core Vorrang; diese Differenz ist nicht Satz für Satz geprüft.

Der Namensabgleich `docs/catalog-audit.json` (Versionstempel 0.9.673, erzeugt 2026-10-16) meldet 188 correct, 3 corrected, 0 missing. Das prüft nur, ob ein Name im Katalog steht. Es ist kein Nachweis, dass die Wirkung im Spiel passiert.

## A. Management Summary

Das System kann einen Kampf mit Angriffskarte, Pool-Wurf, Schaden, Rüstung, einem Teil der Specials, Stone-Kosten und einer Runden-Aktionsleiste ausführen. Es setzt die sieben Regelwerke nicht vollständig um.

Nachweislich an einen Laufzeitpfad gehängt, aber nicht durch einen isolierten Regeltest abgedeckt, sind unter anderem: Angriffskarte und Schaden-Dialog, Stone-Bezahlung der 32 Abilities, farbliche Stone-Regeneration bis Mastery Rank, farblose Steine nur über ein Colorless-Recovery-Budget, Absorption-Steine erst in der nächsten Preparation Phase, Fortitude als Vitality-Multiplikator, Perception gegen Invisibility, Last Breath im Schadenspfad, Death Check am Zugende.

Wesentlich unvollständig sind Movement Powers als echte Bewegung, Threat-Zone-Reactions, Fear, Fallschaden, Pursuit, Damage Transfer, Special- und Summon-Auren als Flächenwirkung, Heilung über die aktuelle Health Bar hinaus beziehungsweise das Wiederöffnen von Broken bei Incapacitated, und die automatische Vergabe von Surprise Priority.

Regelwidrig gegenüber Core v0.9.9.5, mit gelesener Fundstelle, sind mindestens: Defensive Stones enden am Ende des eigenen Spotlights statt zum Beginn des nächsten eigenen Zuges. Crit wird nicht vor dem Wurf gewählt. Initiative-Gleichstand folgt nicht Mastery Rank, dann Agility-Pool, dann 1d8. Der Würfelpool wird weiterhin auf Mastery Rank angehoben, obwohl Core diese Minimum-Pool-Regel im geprüften Text nicht mehr enthält. Heilung füllt mehrere offene Health Bars. AoE-Raise-Schaden wird nicht halbiert und aufgerundet. Split Attack reiht einen zweiten Schlag auf dasselbe Token, nicht zwei gewählte Ziele. Incapacitated unterdrückt Invisibility; das entspricht Core-Zeile 8296 und widerspricht der Prüfliste in diesem Auftrag. Diese letzte Stelle ist als offene Frage markiert, nicht als still korrigiert.

Am Spieltisch blockieren vor allem: keine automatische Surprise Priority, keine Threat-Zone, Movement Powers ohne die gedruckte Bewegungsart, Fear/Fall/Pursuit/Transfer fehlen, defensive Stones fallen zu früh weg, und 14 vorhandene Tests sind rot, darunter Stone-Regeneration und ein veralteter Surprise-Initiative-Test.

## B. Implementierungsmatrix

### B1. Core-Kampf und Ressourcen

| Regel / Power | Quelldokument + Abschnitt | Status | Implementierungsdatei / Funktion | Passender Test | Fehlende Funktion / Abweichung |
|---|---|---|---|---|---|
| Angriff beendet Invisibility nicht | Core, Invisibility; Prüfliste | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `src/combat/perception-gate.ts` `endOrdinaryStealthOnAttack` | kein Test, der einen Angriff unter Invisibility und die danach unveränderte Invisibility-TN belegt | Gewöhnliches Stealth endet. Invisibility-Bonus bleibt. |
| Incapacitated unterdrückt Invisibility | Core Zeile 8296 unterdrückt; Prüfliste verlangt das Gegenteil | NICHT VERIFIZIERBAR | `src/combat/invisibility-profile.ts` `isInvisibilitySuppressedByHealth` setzt den Bonus auf 0 | kein Test gegen Zeile 8296 | Code folgt dem gelesenen Core-Satz, nicht der Prüfliste. Siehe offene Frage Q1. |
| Defensive Stones bis Beginn des nächsten eigenen Zuges | Core Stone Abilities, „until the start of your next turn“ (Parry, Armor, Evade, Damage Negation, Damage Reduction, Spell Resistance, Special Negation) | REGELWIDRIG IMPLEMENTIERT | `src/stones/stone-hooks.ts` ruft bei Spotlight-Wechsel `clearCombatStoneTurnBonusesForActor` in `src/combat/action-economy.ts` | keiner für die Dauer | Die Werte enden, wenn der eigene Spotlight endet, also bevor später in der Runde handelnde Gegner drankommen und bevor der nächste eigene Zug beginnt. |
| Crit vor dem Wurf wählen | Core Agility Crit: declare before Attack Roll or Casting Roll | REGELWIDRIG IMPLEMENTIERT | `agility.crit` setzt `critRaises`; `src/chat/attack-roll-handler.ts` verbraucht eine Ladung und setzt Explode-on-7–8 | `tests/stone-powers.test.ts` prüft nur den gespeicherten Zähler | Keine Ansprache vor dem Wurf. Ein nicht schadensrelevanter Wurf kann die Ladung ziehen. |
| Initiative-Gleichstand | Core Zeile 8581: höherer MR, dann Agility-Pool, dann 1d8 | REGELWIDRIG IMPLEMENTIERT | `compareInitiativeCombatants` in `src/combat/initiative-roll.ts` | `tests/initiative-order.test.ts` erwartet noch, dass ein surprised NPC nicht neu würfelt, und ist rot | Code: besiegt zuletzt, Surprise-Flag, höhere Initiative, Spieler vor NSC, dann Agility, Wits, Intellect, Resolve, dann id. Kein MR, kein 1d8. |
| Surprise Priority automatisch | Core Zeile 8363–8366 | TEILWEISE IMPLEMENTIERT | Sortierung liest `surprisePriority`. `grantSurprisePriority` in `src/combat/surprise.ts` hat keinen Aufrufer | `tests/surprise.test.ts` prüft nicht die automatische Vergabe | Flag muss von Hand gesetzt werden. Unaware-Contests setzen Advantage/Disadvantage separat. |
| Threat-Zone beim Betreten und Verlassen | Core Movement-Triggered Reactions; Movement v0.9.8 Abschnitt Movement-Triggered Reactions | NICHT IMPLEMENTIERT | `opportunityEnemyTokenIds` wird an Karten gehängt; kein Hook auf Tokenbewegung öffnet das Fenster | keiner | Safe Movement, Disengage und Slip schreiben nur einen Chat-Hinweis in `src/combat/movement-tracker.ts`. |
| Safe Movement verhindert diese Reactions | Movement v0.9.8, Movement: Safe Movement | TEILWEISE IMPLEMENTIERT | Stone `agility.safeMovement` setzt ein Pending-Flag; Katalog-Power ist Distanztext | keiner | Die Katalog-Power bewegt nicht und unterdrückt kein Reaction-Fenster, weil das Fenster nicht existiert. |
| Heilung nur in der aktuellen Health Bar; Incapacitated öffnet Broken | Core Healing / Incapacitation, um Zeile 9202 und 9270 | REGELWIDRIG IMPLEMENTIERT | `applyHealHpAcrossOpenBars` in `src/combat/heal-resolution.ts` füllt jede offene Bar mit current > 0, schwerste zuerst. Leere Bars werden übersprungen | keiner für Bar-Grenzen | Überlauf über die aktuelle Bar. Incapacitated mit 0 HP auf Broken wird nicht wieder geöffnet. |
| Raises: ein Effekt Damage oder existentes Special; AoE-Schaden-Raise halbiert, aufgerundet | Core Zeile 8674 | REGELWIDRIG IMPLEMENTIERT | `applyOneRaiseEffect` in `src/combat/raise-resolution.ts` addiert bei `damage` volle Würfel (`mr` bzw. 1 bei Spells). Kein AoE-Halbierungspfad | Raise-Tests prüfen TN und Kosten, nicht die AoE-Hälfte | AoE-Ziel erhält dieselben Raise-Damage-Dice wie ein Einzelziel. |
| Minimum Pool = Mastery Rank abgeschafft | Core: im geprüften Text keine Pool-Untergrenze. Einziger Treffer „at least your Mastery Rank“ ist Skill-Punkte-Ausgabe, Zeile 2132 | REGELWIDRIG IMPLEMENTIERT | `src/dice/pool-finalize.ts` hebt den Pool zuletzt auf MR an. Aufrufer: `roll-handler`, Angriff, Spell, Bogen | Tests erwarten den Floor teilweise noch | Solange Core die alte Regel nicht mehr druckt, ist der Floor regelwidrig. Siehe Q2, falls die Regel in einem nicht geprüften Absatz weiter steht. |
| Split Attack, zwei Ziele, geteilter Pool, voller Schaden, eine Raise-Wahl | Core Zeile 8141 | REGELWIDRIG IMPLEMENTIERT | `createAttackCard` in `src/combat/attack-executor.ts` legt Strike 2 auf dieselbe `targetTokenId` | keiner für zwei Ziele | Keine zweite Zielwahl. Pool-Teilung ist kommentiert, nicht in diesem Audit als zwei unabhängige Würfe gegen zwei Ziele belegt. |
| Free Raises nicht automatisch der ganze Pool | Core Raises, Zeile 7910 und 8674 | TEILWEISE IMPLEMENTIERT | Angriffskarte: Checkbox und `paidRaiseSlots`. Bogen: Feld „Free Raises“ und `consumeFreeRaises` | keiner, der Ansage, TN und Verbrauch gemeinsam prüft | Epic-Roll setzt den Bonus auf 0. Ein Wurf ohne das Feld bekommt keine Free Raises. Nicht jeder Wurfdialog im System wurde einzeln geöffnet. |
| Movement Reduction bei echter Tokenbewegung | Core Wits Movement Reduction | TEILWEISE IMPLEMENTIERT | `movementMetersAfterStoneEffects` in Radial und `getDefaultMovementRange` | keiner | `src/combat/movement-tracker.ts` halbiert gemessene Tokenpfade nicht. |
| Colorless Recovery, konkrete Stones | Core Influence Colorless Recovery, um Zeile 7950 | TEILWEISE IMPLEMENTIERT | Budget-Flag und `applyStoneRegenAllocation` | `tests/stone-regen-allocation.test.ts` ist vierfach rot | Keine Auswahl einzelner Steine. Ungenutzte Kapazität für später erhaltene Steine ist nicht belegt. Die roten Tests erwarten Regeneration, die der Code aktuell nicht wie der Test liefert. |
| Special Aura / Summon Damage Aura / Summon Armor Aura | Active Buffs; Core Echo-Tabellen | NUR DATEN / KATALOG | `auraPayload` nur für Damage Aura und Healing Aura in `src/combat/aura-pulse.ts`. Summon-Auren haben in `activeBuffs.ts` nur Duration | keiner | Verbündete in einer Armor Aura bekommen die Rüstung nicht. Summons bekommen keinen Schadens- oder Rüstungsbonus. „Einmal pro Runde“ der Hearth-Circle-Heilung ist im Puls nicht belegt. |
| Fear | Core um Zeile 9312, Resolve k1, TN 8 oder 12, +1 Fear bis Safe Haven | NICHT IMPLEMENTIERT | kein Fear-Konto, kein Fear-Check | keiner | |
| Falling Damage | Core Zeile 9286, 1d8 je volle 4 m, ignoriert Armor | NICHT IMPLEMENTIERT | keine Fallhöhen-Funktion | keiner | |
| Pursuit | Core Zeile 9658, Spur +1/−1, Ende bei −2 | NICHT IMPLEMENTIERT | kein Pursuit-Zähler | keiner | Opposed Contests existieren allgemein, ohne diese Spur. |
| Damage Transfer (Vampyr) | Core Zeile 8767 | NICHT IMPLEMENTIERT | keine Transfer-Funktion im Schaden | keiner | |
| Fortitude | Core / Passives | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `src/documents/actor.ts` liest `passive-fortitude` | kein Stufentest 4/8/12/16 in diesem Lauf isoliert geprüft | Multiplikator liegt im Template-Modul. |
| Absorption Stones nächste Preparation | Core Absorption | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `queueAbsorptionStones`, `releaseAbsorptionStonesForPreparation` | keiner für „nicht ausgebbar bis zur nächsten Prep“ | Reaction- und Active-Buff-Zusatzsteine aus dem Angriffsablauf sind nicht addiert. |
| Last Breath | Core Zeile 7987 | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `src/stones/last-breath.ts`, aufgerufen aus `damage-dialog.ts` | keiner in der Fehlschlagliste, kein gezielter Ablauftest hier nachgewiesen | |
| Death Check | Core Incapacitation | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `maybeRollDeathCheck` aus `src/module.ts` am Zugende | keiner isoliert nachgewiesen | |
| Perception gegen Invisibility | Core Invisibility TN | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `src/combat/perception-gate.ts` | Perception-Tests existieren; dieser Lauf hat sie nicht als grün für die volle TN-Formel ausgewiesen | Formel nicht in diesem Audit neu durchgerechnet. |

### B2. Stone Abilities (32)

Quelle aller Zeilen: Core, Abschnitt Stone Abilities, etwa Zeile 7693–7981.

| Regel / Power | Status | Implementierungsdatei / Funktion | Passender Test | Fehlende Funktion / Abweichung |
|---|---|---|---|---|
| Extra Attack | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `generic.extraAttack`; `highestExtraAttackGrant` | Stone-Power-Apply-Test speichert den Wert | Höchster Grant statt Summe ist im Code. Kein Spieltest. |
| Extra Movement | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `generic.extraMovement` | Apply-Test | |
| Extra Reaction | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `generic.extraReaction`; `spendReactionAction` | keiner für die zusätzliche Reaction im Fenster | |
| Movement Enhancement | TEILWEISE IMPLEMENTIERT | `getMovementRangeBonusMeters`; Radial Move/Dash/Disengage und Movement-Slot | keiner | Movement Powers addieren den Bonus auf die gedruckte Distanz. Sie führen die Bewegungsart nicht aus. Quick Load ist ausgenommen, wie das Buch sagt. |
| Parry | REGELWIDRIG IMPLEMENTIERT | `might.parry` → `tempParryPool` | keiner für die Dauer | Dauer endet mit dem Spotlight, nicht zum nächsten eigenen Zug. |
| Damage | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `might.meleeDamage`; Schaden-Dialog, nur Nicht-Spell, einmal | keiner | |
| Armor | REGELWIDRIG IMPLEMENTIERT | `might.armor` → `tempArmor` | keiner für die Dauer | Spotlight-Ende. |
| Armor Reduction | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `might.armorReduction`; Schaden-Dialog, alle Schadensarten | keiner für Stapel mit Corrode und Penetration und Untergrenze 0 | Werte 4/8/16/32 stehen im Apply. |
| Crit | REGELWIDRIG IMPLEMENTIERT | `agility.crit`; `attack-roll-handler.ts` | Zähler-Test | Keine Wahl vor dem Wurf. |
| Evade | REGELWIDRIG IMPLEMENTIERT | `agility.evade` | keiner für die Dauer | Spotlight-Ende. |
| Safe Movement (Stone) | TEILWEISE IMPLEMENTIERT | `agility.safeMovement` | keiner | Verhindert keine Threat-Reaction, weil keine ausgelöst wird. |
| Invisibility Boost | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `effectiveInvisibilityBonusForActor` nur wenn schon ein Bonus da ist | `tests/agility-stone-movement.test.ts` prüft die Zahlen, nicht die TN | |
| Damage Negation | REGELWIDRIG IMPLEMENTIERT | `vitality.damageNegation` | keiner für die Dauer | Spotlight-Ende. |
| Temporary HP | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `vitality.tempHp` | keiner für einmal pro Kampf und Kampfende | |
| Damage Maximization | TEILWEISE IMPLEMENTIERT | Flag plus `offerDamageMaximization` / `maximizeDamageFormula` | keiner | Erste Preparation ist als „Kampf gestartet und Runde > 1“ gesperrt, nicht als eigene Prep-Phase. Erzwungene 8en explodieren im Formelersatz nicht. |
| Remove Scar | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `vitality.removeScar` | keiner für kumulative Seals 1/3/7/15 und Colorless-Verbot in einem Ablauf | |
| Raises | TEILWEISE IMPLEMENTIERT | `intellect.raises`; Angriffskarte und Bogen-Feld | keiner | Siehe Free Raises oben. |
| Range & AoE Boost | TEILWEISE IMPLEMENTIERT | `getStoneAreaBonusMeters` in `calculateRange` und Artifact-AoE | keiner | Nur dort, wo die Option durch das Radial läuft. |
| Special Boost | TEILWEISE IMPLEMENTIERT | Schaden-Dialog schreibt gesammelte Special-Texte um | keiner | Reactions und persistente Effekte nicht belegt. Reihenfolge vor Special Negation nicht belegt. |
| Spell Resistance | REGELWIDRIG IMPLEMENTIERT | `intellect.spellResistance`; `target-defenses` | keiner für die Dauer | Spotlight-Ende. |
| Damage Reduction | REGELWIDRIG IMPLEMENTIERT | `resolve.damageReduction` | keiner | Spotlight-Ende. Zusätzlich rundet `applyDefensiveMitigation` die Reduktion auf, nicht den Restschaden. |
| Healing (Stone) | TEILWEISE IMPLEMENTIERT | Auflösung in `heal-resolution.ts` | keiner | Reichweite ist vorgesehen. Health-Bar-Regeln siehe Heilung oben. |
| Active Buff Empowerment | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `activateActiveBuff` addiert PL und Runden, Cap 16, kein Stack | Stone-Power-Test speichert beide Felder | |
| Special Negation | REGELWIDRIG IMPLEMENTIERT | `resolve.ward` schreibt `tempWard` und `incomingSpecialReduction`. `getIncomingWardTotal` nimmt das Maximum | keiner | Dauer endet mit dem Spotlight. Der Doppelzähl-Fix ist das Maximum, nicht die Buch-Dauer. |
| Not a Target | TEILWEISE IMPLEMENTIERT | `notATargetDecision` in `createAttackCard` | keiner | „Einziges Ziel“ zählt andere Combatants, nicht Reichweite oder Sinne. Dauer ist die Runde, nicht bis zum nächsten eigenen Zug. |
| Cleanse | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `influence.cleanse`, 20 m, Kreaturen | Apply setzt ein Flag im Test | Verteilung auf mehrere Specials liegt in `applyCleanseToActor`, nicht pro Rang getestet. |
| Colorless Recovery | TEILWEISE IMPLEMENTIERT | Budget | Regen-Tests rot | Keine Stein-für-Stein-Auswahl. |
| Enemy Evade Reduction | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `getTargetEvade(target, attacker)` | `tests/surprise.test.ts` prüft eine Subtraktion | |
| Phasing | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `wits.phasing` schreibt Charges; Schaden-Dialog kann sie anbieten | keiner für einmal pro Kampf und Verbrauch | |
| Initiative Boost | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | `wits.initiativeBoost` vor der Umwandlung in Initiative-Steine | keiner für einmal pro Kampf | |
| Reaction Denial | IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET | Flag auf dem Gegner; `spendReactionAction` verweigert ohne Verbrauch | keiner für „dieselbe Reaction gegen denselben Trigger“ | Wenn niemand gewählt wird, bleibt `pendingReactionDenial` ohne späteren Verbraucher. |
| Movement Reduction | TEILWEISE IMPLEMENTIERT | Halbierung in der Bewegungsvorschau, Rundung 5→3, 7→4, 9→5 | keiner | Echte Tokenbewegung nicht halbiert. Pending-Flag ohne Ziel hat keinen Verbraucher. |

### B3. Movement Powers (Quelle nur v0.9.8)

Alle zehn Katalogeinträge haben einen Namen und eine Distanz im Template `src/utils/powers/templates/movement.ts`. Keiner versetzt den Token gemäß seiner Bewegungsart. Status für jeden: **NUR DATEN / KATALOG**, Test: keiner.

Ground Dash, Safe Movement, Teleport, Teleport with Ally, Flight, Leap, Wall Walk, Burrow, Phase Passage, Trample.

Trample trägt zusätzlich einen `damageRider`, den kein Pfad entlang der Bewegung auslöst.

### B4. Power-Kataloge, deren Einzeleffekt nicht belegt ist

191 Katalogzeilen aus `docs/catalog-audit.json`. Der Name ist dort `correct` oder `corrected`. Das ist kein Laufzeitnachweis. Für jede Zeile ohne eigene Fundstelle in B1–B3 gilt:

- Status: **NICHT VERIFIZIERBAR**
- Implementierung: Template unter `src/utils/powers/templates/` beziehungsweise Artifact-Katalog. Gemeinsame Verbraucher, die nicht pro Power geprüft wurden: Angriffskarte, `applyStatusEffectsToTarget`, Forced Movement für Push/Pull, Aggregator für Armor/Evade/Initiative/DR/Spell Resistance.
- Test: keiner, der diese Power isoliert gegen ihr Regelbuch prüft.
- Abweichung: Stufenkurve, Dauer, Zielzahl und Sondertext dieser Zeile wurden in Phase 1 nicht ausgeführt.

Die Zeilen stehen in Abschnitt B5, erzeugt aus dem Katalog-Audit, damit kein Name fehlt.

Bekannte Katalogzeilen, die über „nicht verifizierbar“ hinaus eine negative Fundstelle haben:

| Regel / Power | Status | Fundstelle | Abweichung |
|---|---|---|---|
| Active Buff: Damage Aura, Healing Aura | TEILWEISE IMPLEMENTIERT | `src/combat/aura-pulse.ts` | Puls am Zugende, ein Wurf pro Kreatur. Kein Test. Einmal-pro-Runde nicht belegt. |
| Active Buff: Growth Form | TEILWEISE IMPLEMENTIERT | `src/combat/growth-form.ts`, Token-Resize nur in `src/utils/artifact-active-buffs.ts` | Reach, Push-Reduktion, Prone-Band liegen am normalen Buff nur, wenn `mechanics.growthForm` auf dem Effect steht. `activateActiveBuff` kopiert Mechanics. Körperliche Skill-Strafe ist nicht belegt. Kein Test der Reichweite im Spiel. |
| Active Buff: Thorns, Passive Thornhide | NUR DATEN / KATALOG | Template-Text | Kein Rückschlag bei finalem HP-Verlust. |
| Penetration als Active Buff | NUR DATEN / KATALOG | Effekttext | Kein Rüstungsignorieren aus diesem Buff. |
| Special Overdrive, Passive Special Aura | NUR DATEN / KATALOG | `modifySpecial` wird nicht angewendet | |
| Immovable + Temporary HP | NUR DATEN / KATALOG | Special `immovable` wird beim Aktivieren nicht auf den Actor geschrieben | |
| Disarm-Actives | TEILWEISE IMPLEMENTIERT | Pull bewegt. Disarm hat keine Funktion | Kommentar im Schaden-Dialog behauptet „on the spot“. |
| Dispel | NICHT IMPLEMENTIERT | kein Verbraucher | |
| Persistent Zones | TEILWEISE IMPLEMENTIERT | `spell-zone-entry.ts` schreibt Chat | Wendet den Special der Zone nicht an. `usageLimit` wird nicht geprüft. |
| Passive Healing-Zeilen mit `regen` | NUR DATEN / KATALOG | Aggregator summiert `regen` | Zugstart heilt das Special Regeneration, nicht diese Zahl. |
| Active Buff Healing mit startOfTurn | NUR DATEN / KATALOG | steht in `breakdown.healing` | keine Heilung |
| Temporary-HP-Buffs ohne `triggers.tempHP` | NUR DATEN / KATALOG | Breakdown-Feld | kein Temp-HP-Pool. Reaction-Temp-HP ist ein anderer Pfad. |
| Intensified Absorption | NUR DATEN / KATALOG | Template-Zahl | `absorption.ts` addiert sie nicht |
| Reinforced / Reaction Damage Negation | NUR DATEN / KATALOG | leere oder nur Duration-Mechanics | Spend-Dialog sieht Passive-Reserve und Stone-DN |
| Barrier, Illusion Image | NUR DATEN / KATALOG | `applyWhen: manual` | kein Objekt auf der Karte |
| Telepathy, Summon Tokens, Mind Illusion, Mind Probe, Mental Control | NUR DATEN / KATALOG | leer oder nur Duration | |
| Health-Bar-Passives außer Fortitude | NUR DATEN / KATALOG | Bars bleiben Vitality × 4 plus Fortitude | |
| Aid | NUR DATEN / KATALOG | Katalogtext | kein Reaction-Handler, der Aid ausführt. Datei `aid-reaction-handler.ts` prüft Skill-Pools, nicht die Reaction Aid. |
| Medicine stabilize | NICHT IMPLEMENTIERT | `markStabilized` wird nicht aus einem Medicine-Wurf gerufen | |

Artifact-Profile (31 Namen plus eine Regelzeile im Audit) sind im Katalog vorhanden. Stone-Power-Support-IDs wurden auf die neuen Ability-IDs gelegt. Ob jede Artifact-Stufe die gedruckte Funktion auslöst, ist **NICHT VERIFIZIERBAR**. Echo-Fließtext kann noch alte Namen tragen; maßgeblich wäre die Funktions-ID, und die wurde nicht Stufe für Stufe gegen `docs/Rules/artefacts.md` gespielt.

## B5. Katalogzeilen

<!-- CATALOG_MATRIX_START -->
| Regel / Power | Quelldokument + Abschnitt | Status | Implementierungsdatei / Funktion | Passender Test | Fehlende Funktion / Abweichung |
|---|---|---|---|---|---|
| Cleanse Absorption (active-cleanse-absorption) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-cleanse-absorption | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Cleanse (active-melee-aoe-cleanse) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-cleanse | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Damage — Tier 3 (active-melee-aoe-damage-t3) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-damage-t3 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Damage — Tier 4 (active-melee-aoe-damage-t4) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-damage-t4 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Damage — Tier 5 (active-melee-aoe-damage-t5) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-damage-t5 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Damage — Tier 6 (active-melee-aoe-damage-t6) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-damage-t6 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Dispel (active-melee-aoe-dispel) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-dispel | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Heal (active-melee-aoe-heal) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-heal | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Targeted Special Attack (active-melee-aoe-targeted-special) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-aoe-targeted-special | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Control — Pull + Disarm (active-melee-control-pull-disarm) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-control-pull-disarm | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Control — Push + Prone (active-melee-control-push-prone) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-control-push-prone | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Control — Push + Pull (active-melee-control-push-pull) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-control-push-pull | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Damage + Dispel (Mixed) (active-melee-damage-dispel-mixed) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-damage-dispel-mixed | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Damage + Stunned (active-melee-damage-stunned) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-damage-stunned | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Damage — Tier 3 (active-melee-damage-t3) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-damage-t3 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Damage — Tier 4 (active-melee-damage-t4) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-damage-t4 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Damage — Tier 5 (active-melee-damage-t5) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-damage-t5 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Damage — Tier 6 (active-melee-damage-t6) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-damage-t6 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Heal + Cleanse (Mixed) (active-melee-heal-cleanse-mixed) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-heal-cleanse-mixed | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Health Level Heal (active-melee-health-level-heal) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-health-level-heal | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Single-Target Cleanse (active-melee-single-cleanse) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-single-cleanse | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Single-Target Dispel (active-melee-single-dispel) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-single-dispel | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Single-Target Heal (active-melee-single-heal) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-single-heal | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Targeted Special Attack (active-melee-targeted-special) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-targeted-special | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee AoE Attack (active-melee-weapon-aoe) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-weapon-aoe | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Single Attack (active-melee-weapon-single) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-weapon-single | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Melee Split Attack (active-melee-weapon-split) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-melee-weapon-split | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Mental Attack (active-mental-attack) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-mental-attack | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Mental Control (active-mental-control) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-mental-control | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Mind Illusion (active-mind-illusion) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-mind-illusion | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Mind Probe (active-mind-probe) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-mind-probe | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Cleanse (active-ranged-aoe-cleanse) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-cleanse | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Damage — Tier 3 (active-ranged-aoe-damage-t3) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-damage-t3 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Damage — Tier 4 (active-ranged-aoe-damage-t4) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-damage-t4 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Damage — Tier 5 (active-ranged-aoe-damage-t5) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-damage-t5 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Damage — Tier 6 (active-ranged-aoe-damage-t6) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-damage-t6 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Dispel (active-ranged-aoe-dispel) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-dispel | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Heal (active-ranged-aoe-heal) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-heal | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Targeted Special Attack (active-ranged-aoe-targeted-special) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-aoe-targeted-special | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Barrier — 4 Rounds (active-ranged-barrier) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-barrier | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Control — Pull + Disarm (active-ranged-control-pull-disarm) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-control-pull-disarm | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Control — Push + Prone (active-ranged-control-push-prone) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-control-push-prone | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Control — Push + Pull (active-ranged-control-push-pull) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-control-push-pull | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Damage + Dispel (Mixed) (active-ranged-damage-dispel-mixed) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-damage-dispel-mixed | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Damage + Stunned (active-ranged-damage-stunned) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-damage-stunned | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Damage — Tier 3 (active-ranged-damage-t3) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-damage-t3 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Damage — Tier 4 (active-ranged-damage-t4) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-damage-t4 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Damage — Tier 5 (active-ranged-damage-t5) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-damage-t5 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Damage — Tier 6 (active-ranged-damage-t6) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-damage-t6 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Heal + Cleanse (Mixed) (active-ranged-heal-cleanse-mixed) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-heal-cleanse-mixed | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Health Level Heal (active-ranged-health-level-heal) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-health-level-heal | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Images — 4 Rounds (active-ranged-illusion-image) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-illusion-image | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Single-Target Cleanse (active-ranged-single-cleanse) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-single-cleanse | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Single-Target Dispel (active-ranged-single-dispel) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-single-dispel | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Single-Target Heal (active-ranged-single-heal) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-single-heal | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Targeted Special Attack (active-ranged-targeted-special) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-targeted-special | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged AoE Attack (active-ranged-weapon-aoe) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-weapon-aoe | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Autofire (active-ranged-weapon-autofire) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-weapon-autofire | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Single Attack (active-ranged-weapon-single) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-weapon-single | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Split Attack (active-ranged-weapon-split) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-weapon-split | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Persistent Zone — Tier 3 (active-ranged-zone-t3) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-zone-t3 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Persistent Zone — Tier 4 (active-ranged-zone-t4) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-zone-t4 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Persistent Zone — Tier 5 (active-ranged-zone-t5) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-zone-t5 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ranged Persistent Zone — Tier 6 (active-ranged-zone-t6) | docs/Rules/actives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID active-ranged-zone-t6 | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Armor (ab-armor) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-armor | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Armor Aura (ab-armor-aura) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-armor-aura | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Armor + Temporary HP (ab-armor-temp-hp) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-armor-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Cleanse Maintenance (ab-cleanse-maintenance) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-cleanse-maintenance | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Critical (ab-critical) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-critical | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Damage (ab-damage) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-damage | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Damage Aura (ab-damage-aura) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-damage-aura | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Damage + Penetration (ab-damage-penetration) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-damage-penetration | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Damage Reduction (ab-damage-reduction) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-damage-reduction | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Growth Form (ab-growth-form) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-growth-form | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Healing (ab-healing) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-healing | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Healing Aura (ab-healing-aura) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-healing-aura | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Immovable + Temporary HP (ab-immovable-temp-hp) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-immovable-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Intensified Absorption (ab-intensified-absorption) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-intensified-absorption | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Invisibility (ab-invisibility) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-invisibility | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Penetration (ab-penetration) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-penetration | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Phasing (ab-phasing) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-phasing | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Reinforced Damage Negation (ab-reinforced-damage-negation) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-reinforced-damage-negation | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Parry Recovery (ab-reinforced-parry) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-reinforced-parry | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Special Overdrive (ab-special-overdrive) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-special-overdrive | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Spell Resistance (ab-spell-resistance) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-spell-resistance | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Summon Armor Aura (ab-summon-armor-aura) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-summon-armor-aura | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Summon Damage Aura (ab-summon-damage-aura) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-summon-damage-aura | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Temporary HP (ab-temp-hp) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Temporary HP + Healing (ab-temp-hp-healing) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-temp-hp-healing | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Thorns (ab-thorns) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ab-thorns | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Armor + Evade (ab-armor-evade) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname corrected; Template-ID ab-armor-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Evade (ab-evade) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname corrected; Template-ID ab-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Active Buff: Evade + Temporary HP (ab-evade-temp-hp) | docs/Rules/active-buffs.md | NICHT VERIFIZIERBAR | Katalogname corrected; Template-ID ab-evade-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Alchemist Coat (alchemistCoat) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID alchemistCoat | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Dragon Claws (dragonClaws) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID dragonClaws | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Dragon Head (dragonHead) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID dragonHead | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Elorian Stride (elorianStride) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID elorianStride | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Falcon Wide Brim (falconWideBrim) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID falconWideBrim | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Frostbound Returning Axe (frostboundReturningAxe) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID frostboundReturningAxe | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Green Warden Mantle (greenWardenMantle) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID greenWardenMantle | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Heart of Winter (heartOfWinter) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID heartOfWinter | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Heartseeker (heartseeker) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID heartseeker | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Hunter's Scourge (huntersScourge) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID huntersScourge | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Judicator Frame (judicatorFrame) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID judicatorFrame | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Lantern of the Hollow Star (lanternOfTheHollowStar) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID lanternOfTheHollowStar | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Lor-Keth's Staff (lorKethsStaff) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID lorKethsStaff | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Moonlight Greatsword (moonlightGreatsword) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID moonlightGreatsword | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Oracle Frame (oracleFrame) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID oracleFrame | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Predator Crown (predatorCrownIntellect) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID predatorCrownIntellect | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Predator Crown (predatorCrownMight) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID predatorCrownMight | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Predator Crown (predatorCrownWits) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID predatorCrownWits | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ringchain of Kept Names (ringchainOfKeptNames) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID ringchainOfKeptNames | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Sentinel Frame (sentinelFrame) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID sentinelFrame | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Shadowgrave Armor (shadowgraveArmor) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID shadowgraveArmor | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Soul Sigil (soulSigil) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID soulSigil | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Staff of the Dark (staffOfTheDark) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID staffOfTheDark | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Starfallen Forceshield (starfallenForceshield) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID starfallenForceshield | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Stonebound Soles (stoneboundSoles) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID stoneboundSoles | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Titan Scars (titanScars) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID titanScars | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Blight Staff (witchStaffBlight) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID witchStaffBlight | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Root Staff (witchStaffRoot) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID witchStaffRoot | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Ruin Staff (witchStaffRuin) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID witchStaffRuin | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Wyrm Scales (Heavy) (wyrmScalesHeavy) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID wyrmScalesHeavy | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Serpent Scales (wyrmScalesLight) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID wyrmScalesLight | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Artifact Summon Token Generator (artifact-summon-token-generator) | docs/Rules/artefacts.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID artifact-summon-token-generator | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Burrow (movement-burrow) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-burrow | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Flight (movement-flight) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-flight | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Ground Dash (movement-ground-dash) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-ground-dash | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Leap (movement-leap) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-leap | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Phase Passage (movement-phase-passage) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-phase-passage | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Safe Movement (movement-safe-movement) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-safe-movement | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Teleport (movement-teleport) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-teleport | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Teleport with Ally (movement-teleport-with-ally) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-teleport-with-ally | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Trample (movement-trample) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-trample | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Movement: Wall Walk (movement-wall-walk) | docs/Rules/movement.md (v0.9.8) | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID movement-wall-walk | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| conditional awareness-damage (conditional-passive-awareness-damage) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID conditional-passive-awareness-damage | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| conditional awareness-evade (conditional-passive-awareness-evade) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID conditional-passive-awareness-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Armor Buff Empowerment (empower-buff-armor) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID empower-buff-armor | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Damage Buff Empowerment (empower-buff-damage) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID empower-buff-damage | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Evade Buff Empowerment (empower-buff-evade) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID empower-buff-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Wind Buff Empowerment (empower-buff-wind) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID empower-buff-wind | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Armor Buff Extension (extend-buff-armor) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID extend-buff-armor | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: DR Buff Extension (extend-buff-damage-reduction) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID extend-buff-damage-reduction | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Evade Buff Extension (extend-buff-evade) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID extend-buff-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Mobility Buff Extension (extend-buff-mobility) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID extend-buff-mobility | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Absorption (passive-absorption) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-absorption | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| awareness-damage (passive-awareness-damage) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-awareness-damage | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| awareness-evade (passive-awareness-evade) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-awareness-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Summon Tokens (passive-bound-host) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-bound-host | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Damage Negation (passive-damage-negation) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-damage-negation | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Damage Reduction (passive-damage-reduction) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-damage-reduction | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Health (passive-deep-vitality) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-deep-vitality | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Echo Armor Value (passive-echo-armor-value) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-echo-armor-value | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Evade (passive-evade) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Armor (passive-fortified-frame) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-fortified-frame | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Fortitude (passive-fortitude) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-fortitude | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Phasing (passive-ghostform) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-ghostform | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| heightened-senses (passive-heightened-senses) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-heightened-senses | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Initiative (passive-initiative) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-initiative | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Invisibility (passive-invisibility) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-invisibility | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Damage (passive-killing-intent) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-killing-intent | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Parry (passive-parry) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-parry | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Healing (passive-regeneration) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-regeneration | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Special Aura (passive-special-aura) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-special-aura | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Spell Resistance (passive-spell-resistance) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-spell-resistance | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Telepathy (passive-telepathy-mind-link) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-telepathy-mind-link | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Temporary HP (passive-temp-hp) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Thorns (passive-thornhide) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-thornhide | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Passive: Special Negation (passive-ward) | docs/Rules/passives.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID passive-ward | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Ally Armor (reaction-ally-armor) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-ally-armor | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Ally Evade (reaction-ally-evade) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-ally-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Ally Temporary HP (reaction-ally-temp-hp) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-ally-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Armor (reaction-armor) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-armor | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Armor + Temporary HP (reaction-armor-temp-hp) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-armor-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Counter Damage (reaction-counter-damage) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-counter-damage | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Counter Damage + Pull (reaction-counter-damage-pull) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-counter-damage-pull | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Counter Damage + Push (reaction-counter-damage-push) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-counter-damage-push | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Damage Negation (reaction-damage-negation) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-damage-negation | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Damage Reduction (reaction-damage-reduction) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-damage-reduction | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Evade (reaction-evade) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-evade | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Evade + Temporary HP (reaction-evade-temp-hp) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-evade-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Initiative Gain (reaction-initiative-gain) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-initiative-gain | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Parry + Attack Reflection (reaction-parry-reflection) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-parry-reflection | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Phasing (reaction-phasing) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-phasing | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Reactive Cleanse (reaction-reactive-cleanse) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-reactive-cleanse | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Reactive Overload (reaction-reactive-overload) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-reactive-overload | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Reposition (reaction-reposition) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-reposition | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Repositioning Intercept (reaction-repositioning-intercept) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-repositioning-intercept | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Parry + Weapon Damage (reaction-riposte) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-riposte | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Special Increase (reaction-special-increase) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-special-increase | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
| Reaction: Temporary HP (reaction-temp-hp) | docs/Rules/reactions.md | NICHT VERIFIZIERBAR | Katalogname correct; Template-ID reaction-temp-hp | keiner fuer diese Zeile | Einzeleffekt und Stufenkurve in Phase 1 nicht ausgefuehrt. Siehe B4 fuer bereits negativ belegte Familien. |
<!-- CATALOG_MATRIX_END -->

## C. Kritische Regelverstöße

### C1. Defensive Stones enden zu früh

- Erwartet: Parry, Armor, Evade, Damage Negation, Damage Reduction, Spell Resistance und Special Negation gelten bis zum Beginn des nächsten eigenen Zuges. Core-Tabellen ab Zeile 7834.
- Code: `clearCombatStoneTurnBonusesForActor` setzt diese Felder auf 0, wenn der Spotlight des Actors endet (`src/stones/stone-hooks.ts`).
- Beispiel: Kreatur A handelt zuerst, kauft in der Preparation +8 Evade, handelt, Spotlight endet. Kreatur B danach in derselben Runde trifft A ohne diesen Evade-Bonus. Nach dem Buch müsste der Bonus bleiben, bis A wieder an der Reihe ist.
- Korrektur: Erst löschen, wenn der nächste eigene Spotlight beginnt, nicht wenn der aktuelle endet. Preparation-Käufe der neuen Runde dürfen dabei nicht mitgelöscht werden. Das ist der bereits vorhandene Skip-Flag-Pfad und muss erhalten bleiben.

### C2. Crit ohne Ansage

- Erwartet: Vor dem Attack- oder Casting-Wurf erklären, dass dieser Pool Crit(1) ist. Natürliche 7 und 8 explodieren. Ränge 1–4 sind 1–4 solche Pools.
- Code: Der nächste Wurf in `attack-roll-handler.ts` verbraucht `critRaises` selbst.
- Beispiel: Ein Spieler wollte den Crit für den zweiten Angriff. Der erste Angriff verbraucht ihn.
- Korrektur: Checkbox auf der Angriffskarte vor dem Wurf. Ohne Haken kein Verbrauch.

### C3. Initiative-Gleichstand

- Erwartet: Core Zeile 8581. Höherer Mastery Rank, dann höherer Agility-Pool, dann 1d8, Wiederholung nur unter weiterhin Gleichen.
- Code: Spieler vor NSC, dann Agility, Wits, Intellect, Resolve, dann id. Kein Wurf.
- Beispiel: Zwei Spieler, gleiche Initiative, MR 4 und MR 2, gleicher Agility-Pool. Der Code kann den MR-2-Charakter zuerst setzen, wenn die id kleiner ist.
- Korrektur: `compareInitiativeCombatants` auf MR, Agility-Pool und einen persistierten 1d8-Tiebreak umstellen. Der alte Surprise-Status „Initiative 0“ darf dabei nicht zurückkommen.

### C4. Minimum Pool

- Erwartet: Im geprüften Core-Text gibt es keine Regel mehr, die den Würfelpool auf den Mastery Rank anhebt. Zeile 2132 betrifft ausgegebene Skill-Punkte.
- Code: `pool-finalize.ts` setzt den Pool zuletzt auf mindestens MR.
- Beispiel: Attribut 1, MR 4, kein anderer Bonus. Der Wurf benutzt 4 Würfel.
- Korrektur: Diesen Floor entfernen, sobald Q2 bestätigt, dass kein anderer Absatz ihn noch druckt. Skill-Punkte-Minimum nicht damit verwechseln.

### C5. Heilung über Bar-Grenzen und kein Broken-Reopen

- Erwartet: Heilung bleibt in der aktuellen Active Health Bar. Positive Heilung auf einer Incapacitated-Kreatur ohne offene Bar öffnet Broken und legt die HP dorthin.
- Code: `applyHealHpAcrossOpenBars` füllt alle Bars mit current > 0. Bars mit current 0 werden übersprungen.
- Beispiel: Bruised ist angeschlagen, Injured ist die aktuelle Bar und fast leer. Heilung füllt zuerst die schwerere offene Bar, nicht nur die aktuelle. Eine Incapacitated-Kreatur mit leerem Broken erhält keine HP.
- Korrektur: Nur die aktuelle Bar füllen. Separater Incapacitated-Pfad öffnet Broken.

### C6. AoE-Raise-Schaden

- Erwartet: Core Zeile 8674. Für ein AoE die Raise-Damage-Dice halbieren und aufrunden, pro Ziel gegen die erhöhte TN prüfen.
- Code: `applyOneRaiseEffect` addiert die vollen Damage-Dice. Kein Halbierungsschritt.
- Beispiel: MR 4, ein Damage-Raise, AoE. Jedes getroffene Ziel erhält +4d8 statt +2d8.
- Korrektur: Wenn das Ziel aus einem AoE stammt, `Math.ceil(raiseDamageDice / 2)` auf dieses Ziel anwenden. Die TN-Prüfung pro Ziel nicht ändern, sofern sie schon pro Ziel läuft. Das wurde nicht neu belegt.

### C7. Split Attack

- Erwartet: Bis zu zwei Ziele, geteilter Pool, zwei Würfe, danach eine Raise-Wahl für beide Erfolge, voller Schaden und volle Specials je Erfolg.
- Code: Strike 2 wird mit derselben `targetTokenId` vorgemerkt.
- Beispiel: Der Spieler kann den zweiten Schlag nicht auf eine andere Kreatur legen.
- Korrektur: Nach Strike 1 ein zweites Ziel wählen. Pool vorher teilen. Raise-Effekte einmal wählen und auf beide Erfolge kopieren.

### C8. Surprise Priority wird nicht vergeben

- Erwartet: Wer einen nichtsahnenden Gegner angreift und damit den Kampf eröffnet, erhält Surprise Priority für Runde 1, ohne die Initiative-Zahl zu ändern.
- Code: Sortierung respektiert das Flag. `grantSurprisePriority` wird nirgends aufgerufen.
- Beispiel: Hinterhalt über die normale Angriffskarte. Runde 1 bleibt die reine Initiative-Reihenfolge.
- Korrektur: An der Stelle, die den Kampf aus einem unerwiderten Angriff startet, das Flag setzen. Nicht den alten Status „halbes Evade / Initiative 0“ zurückholen.

## D. Fehlende Funktionen

### Überhaupt nicht implementiert

Fear-Konto und Fear-Check. Falling Damage. Pursuit-Spur. Damage Transfer (Vampyr). Dispel als Beenden eines Effekts. Medicine-Stabilize aus dem Wurf. Threat-Zone-Fenster beim Betreten und Verlassen.

### Daten vorhanden, Laufzeitwirkung fehlt

Die in B4 genannten Buffs und Passives ohne Verbraucher: Thorns, Thornhide, Penetration-Buff, Special Overdrive, Special Aura, Immovable-Beim-Aktivieren, Intensified Absorption, Healing-`regen`, startOfTurn-Heilung, Temp-HP-Buffs ohne Trigger, Barrier, Illusion, die Mental-Powers ohne Schaden, Health-Bar-Passives außer Fortitude, alle zehn Movement-Arten außer der Distanzzahl. Summon Damage Aura und Summon Armor Aura. Trigger `turnEndSelf`, `roundStart`, `onceHexedHitPerRound` sind im Typ als reserviert markiert (`src/types/item.d.ts`).

### Laufzeitwirkung vorhanden, aber nicht automatisch ausgelöst

Surprise Priority. Pending Reaction Denial und Pending Movement Reduction, wenn der Dialog abgebrochen wird. Aid als Katalogeintrag.

### Funktion vorhanden, UI oder Spielerinteraktion fehlt

Crit-Ansage. Colorless-Recovery-Auswahl einzelner Steine. Split-Attack-Zweit-Ziel. Free Raises auf Würfen, die nicht Angriffskarte, Skill- oder Attribut-Dialog sind. Diese übrigen Dialoge wurden nicht vollständig aufgezählt. Cone-Zielwahl im Token-Flow meldet „not yet implemented“ (`src/token-action-selector.ts`). Kein Actives-Template benutzt `shape: 'cone'`; der Hinweis betrifft Utilities, die ein Cone setzen.

### Funktion vorhanden, aber nicht ausreichend getestet

Alles in B1 und B2 mit dem Status IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET. Dazu Damage-/Healing-Aura-Puls und Growth-Form-Reach/Push/Prone. `tests/growth-form.test.ts` prüft nur die reine Funktion an einem Mock, nicht Tokenbewegung oder einen Angriff.

## E. Testabdeckung

Befehl: `npx tsc --noEmit`, danach `npx vitest run`.
Typecheck: Exit 0.
Vitest: 236 Dateien, 2621 bestanden, 14 fehlgeschlagen.

Rote Tests, erster Fehler:

| Testdatei | Behauptung des Tests | Warum das kein Regel-Nachweis ist |
|---|---|---|
| `character-print-basics.test.ts` | Stone-Dashboard | Laufzeitfehler `summary` undefined |
| `grapple-maneuver.test.ts` | Regeltext enthält noch eine alte Überschrift | Der Test sucht im Movement- oder Core-Text nach `### Opposed Attribute Contests` und findet sie nicht |
| `initiative-order.test.ts` | Surprised NSC wird nicht neu gewürfelt | Erwartet das entfernte Surprise-Initiative-0-Verhalten |
| `round-summary-ward.test.ts` | Receipt-Zeilen nach Power-Name | Gruppierung schlägt fehl |
| `stone-regen-allocation.test.ts` (4) | Colorless- und Initiative-Steine regenerieren aus dem Budget | Erwartung widerspricht der aktuellen Colorless-Regel oder der Code liefert den erwarteten Stand nicht. Kein grüner Nachweis für Colorless Recovery |
| `tower-wizard-packages.test.ts` (5) | Alte Combined-Passives und Tooltips | Combined Passives sind im Regelwerk v0.9.9.5 gestrichen. Die Tests erwarten sie noch |
| `v099-core.test.ts` | Anzeigename „Martial Damage“ | Code heißt „Damage“, wie die Stone-Ability-Tabelle |

Diese 14 Roten sind selbst ein Befund: die Testsuite ist nicht deckungsgleich mit v0.9.9.5.
Die 2621 Grünen prüfen überwiegend Hilfsfunktionen, Katalognamen, Würfelmathematik und ältere Verträge. Sie sind nicht 2621 belegte Regelwerkeinträge. Ein Test zählt in der Matrix nur in der Zeile, deren Ablauf er wirklich ausführt. Die meisten Zeilen haben deshalb „keiner“.

## F. Verbindlicher Umsetzungsplan

Noch nicht begonnen. Freigabe steht aus.

### P0 — regelwidrig oder blockiert den Tisch

1. Defensive-Stone-Dauer bis zum Beginn des nächsten eigenen Zuges. Abnahme: Nach Ende des eigenen Spotlights bleibt der Bonus bis zum nächsten eigenen Spotlight; ein Gegner dazwischen sieht ihn; ein Test setzt Spotlight-Ende und prüft das Feld.
2. Crit nur nach Ansage auf dieser Karte, ein Verbrauch pro angesagtem Pool. Abnahme: Zwei Angriffe, Haken nur auf dem zweiten, nur der zweite explodiert auf 7–8.
3. Initiative-Tiebreak MR, Agility-Pool, 1d8. Abnahme: Test mit gleichen Initiativen und verschiedenem MR. Der 1d8 wird persistiert, nicht bei jedem Sortieren neu geworfen.
4. Minimum-Pool-Floor entfernen, nach Beantwortung von Q2. Abnahme: Attribut 1, MR 4, Pool 1, sofern kein anderer Bonus.
5. Heilung nur aktuelle Bar; Incapacitated öffnet Broken. Abnahme: Zwei Tests, einer für „füllt nicht die andere offene Bar“, einer für Broken-Reopen.
6. AoE-Raise-Damage `ceil(n/2)`. Abnahme: MR 4, ein Damage-Raise, AoE-Ziel +2d8, Einzelziel +4d8.
7. Split Attack zwei Ziele. Abnahme: Zwei verschiedene Token, zwei Würfe, eine Raise-Wahl, voller Schaden je Treffer.
8. Surprise Priority automatisch bei Kampferöffnung gegen Unaware. Abnahme: Flag steht vor der Runde-1-Sortierung, Initiative-Zahl unverändert.

### P1 — zentrale fehlende Kampfmechanik

1. Threat-Zone beim Betreten und Verlassen, Safe Movement und Teleport-Pfad unterdrücken sie. Abnahme: Tokenwechsel in die Zone öffnet das Fenster; Safe Movement öffnet es nicht.
2. Movement Reduction auf gemessener Bewegung, nicht nur auf der Vorschau. Abnahme: 10 m gemessen werden 5 m Abzug von der Rundenbewegung oder die Bewegung stoppt bei der Hälfte, gemäß Buch „halbe Distanz“.
3. Colorless Recovery wählt konkrete Steine, Restkapazität für später erhaltene. Abnahme: Zwei Exhausted Colorless, nur der gewählte wird regenerierbar; ein späterer Absorption-Stein kann die Restkapazität nutzen.
4. Fear-Check und Fear-Konto bis Safe Haven. Abnahme: Fehlschlag TN 8 erhöht Fear um 1; Keep ist 1, nicht MR.
5. Falling Damage. Abnahme: 10 m Fall, 2d8, Rüstung 0 Wirkung.
6. Pursuit-Spur. Abnahme: Zwei Contests, Stand −2 beendet die Verfolgung.
7. Damage Transfer gleich real verlorenen HP der aktuellen Bar des Angreifers. Abnahme: Ziel verliert 7 echte HP, Angreifer heilt 7, nicht mehr als die Lücke seiner aktuellen Bar.
8. Movement Powers bewegen gemäß ihrer Art, nicht nur eine Meterzahl. Abnahme pro Power: Teleport überspringt Zwischenfelder und provoziert dort nicht; Ground Dash provoziert; Trample schadet einmal pro Kreatur auf dem Pfad.
9. Summon- und Special-Auren wirken auf die genannten Ziele. Abnahme: Verbündeter in der Armor Aura erhält die Rüstung nur innerhalb des Radius.

### P2 — Sonderfälle

Disarm, Dispel, Zonen wenden ihren Special an, Thorns, Thornhide, Penetration-Buff, Special Overdrive, Immovable beim Buff-Start, Intensified Absorption, Buff-Heilung und Temp-HP-Trigger, Health-Passives, Aid, Medicine-Stabilize, Crit- und Free-Raise-Dialoge auf den übrigen Wurfarten, Not-a-Target-Zielgültigkeit, Physical-Skill-Malus der Growth Form.

Abnahme je Paket: ein Test, der den gedruckten Satz ausführt, plus eine Zeile in dieser Matrix von NICHT IMPLEMENTIERT oder NUR DATEN auf IMPLEMENTIERT, ABER NICHT AUSREICHEND GETESTET oder besser.

### P3 — ohne Regelabweichung

Rote Tests, die alte Namen oder gestrichene Combined Passives erwarten, auf v0.9.9.5 umschreiben oder löschen. Katalog-Audit-Stempel von 0.9.673 auf den tatsächlichen Regelstand heben. Das ist kein Spielmechanik-Ersatz.

## Offene Fragen

Q1. Core Zeile 8296: „If the creature becomes Incapacitated, Invisibility is suppressed until it is no longer Incapacitated.“ Die Prüfliste dieses Auftrags sagt, Incapacitated dürfe Invisibility nicht beenden. Der Code unterdrückt sie. Bis zur Antwort gilt der gelesene Core-Satz als Quelle, und der Code ist an dieser Stelle nicht als Verstoß gegen Core gewertet.

Q2. Gibt es außerhalb des geprüften Treffers in Zeile 2132 noch einen Core-Absatz, der den Würfelpool auf den Mastery Rank anhebt? Die Suche nach „Minimum Pool“ im Core lieferte keinen Treffer. Der Floor im Code ist bis zur Antwort als Verstoß gegen das Fehlen der Regel geführt.

Q3. Movement v0.9.9.5 liegt nicht im Projekt. Soll v0.9.8 weiter gelten, oder wird die neuere Datei nachgereicht, bevor Movement-Powers umgesetzt werden?

## Nicht geprüft

- Lore, Setting, Charaktererschaffung als Fließtext, Schticks, Echo-Fließtext Satz für Satz, Sprachen.
- Jede der 16 Stufen jeder Katalog-Power gegen die gedruckte Zahl. Abschnitt B5 sagt das pro Zeile.
- Foundry-Laufzeit in einer echten Welt: keine Session, keine Tokenbewegung, kein Chat-Klick. Alles hier ist Quelltext- und Testlauf-Befund.
- Ob `grantSurprisePriority` über einen nicht durchsuchten String-Aufruf erreicht wird. Die Suche nach `grantSurprisePriority(` fand nur die Definition.
- Cone- und Teleport-Zielwahl über das hinaus, was im Token-Flow als nicht umgesetzt markiert ist.
- Die volle Artifact-Stufe-für-Stufe-Tabelle in `docs/Rules/artefacts.md` gegen die Echo-Compiler-Ausgabe.

Phase 1 endet hier. Es wird nichts umgesetzt, bis dieser Bericht freigegeben ist.

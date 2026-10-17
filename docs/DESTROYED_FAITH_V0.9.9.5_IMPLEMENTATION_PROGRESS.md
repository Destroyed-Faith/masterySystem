# Destroyed Faith v0.9.9.5 – Implementierungsfortschritt

Stand: 2026-10-17, nach Final Rules-to-Runtime Verification. Matrix: `docs/DESTROYED_FAITH_V0.9.9.5_RULES_RUNTIME_COVERAGE.md`. Bericht: `docs/DESTROYED_FAITH_V0.9.9.5_FINAL_RUNTIME_VERIFICATION.md`. Post-Audit-Fixes: `docs/DESTROYED_FAITH_V0.9.9.5_P1_POST_AUDIT_FIXES.md`. P1.4, P1.5 und P2 sind nicht begonnen. Das Abschluss-Audit bleibt unverändert als Momentaufnahme.

P0 und P1.1 bleiben abgenommen. Die dort genannten Foundry-Canvas-Lücken bleiben offen.

## P1.2 Movement Reduction

Wits-Ability: jede einzelne Movement Action eines markierten Gegners wird in der aktuellen Runde einmal halbiert. `Math.round` entspricht 5→3, 7→4, 9→5, 8→4, 16→8. Die Grundgeschwindigkeit bleibt. Die Action wird nicht gestrichen. Eine zweite Action wird erneut von der normalen Distanz halbiert, nicht vom schon halbierten Rest.

Reihenfolge in `movementActionMeters`: normale Distanz der Action (Dash verdoppelt Speed zuerst, Flee bleibt 4× Speed), dann Movement Enhancement einmal, dann eine Halbierung. Slow bleibt in `movement-tracker.ts` und wird hier nicht eingerechnet.

### Ablauf einer Tokenbewegung

1. Die Ability schreibt `mastery-system.movementReduction = { combatId, round }` auf die ersten N gewählten Gegner. Rank 1–4 ist N. Ohne Auswahl bleibt `pendingMovementReduction` auf dem Wirker.
2. `movementReductionActive` gilt nur bei gleicher Combat-Id und gleicher Runde. Die nächste Runde hebt die Halbierung auf, ohne die Speed zu ändern.
3. Radial und geführte Bewegung rechnen die erlaubte Distanz über `movementActionMeters`. Ein geführtes Ziel außerhalb dieses Budgets wird weiterhin abgelehnt (`attemptCommitMovement`).
4. Ein direktes Token-Update läuft durch `applyMovementCapToTokenChange` in beiden `preUpdateToken`-Hooks (`token-action-selector.ts` und `module.ts`). Liegt das Ziel hinter der einmal halbierten Distanz, werden `change.x` und `change.y` auf den Punkt entlang der Zuglinie gesetzt. Der Spieler erhält `Movement Reduction: this Movement Action stops at N m`. Ohne Flag bleibt die angeforderte Position stehen.
5. Forced Movement setzt vor dem Update `movementTraversal: 'forced'` und wird nicht halbiert. Eine Reaction (`movementTraversal: 'reaction'` oder Reposition) wird nicht halbiert und verbraucht in diesem Pfad keine Movement Action. Reposition verschiebt den Token weiterhin nicht von selbst; nur eine so gekennzeichnete Verschiebung ist klassifiziert.
6. Threat Zones laufen danach auf den bereits begrenzten Koordinaten. Teleport prüft weiter nur die Endpunkte. Lacerate in `handleTokenMovement` sieht die tatsächlich geschriebene Strecke und bleibt an.

### Geänderte Dateien

- `src/combat/movement-allowance.ts` (neu)
- `src/stones/stone-combat-effects.ts` `markMovementReductionTargets`
- `src/stones/stone-powers.ts` Aufruf dieser Markierung
- `src/radial-menu/options.ts`, `types.ts`, `rendering.ts` (Basisdistanz der Movement Power vor Enhancement und Halbierung)
- `src/token-action-selector.ts` und `src/module.ts` (Begrenzung im `preUpdateToken`)
- `src/combat/forced-movement.ts` (Kennzeichnung `forced`)
- `tests/movement-reduction.test.ts`

### Tests

`tests/movement-reduction.test.ts` führt die Fälle durch `applyMovementCapToTokenChange` (dieselbe Funktion wie die Token-Hooks), nicht nur durch eine isolierte Zahl:

1. Move 8 m → Token steht bei 4 m.
2. Dash 16 m → 8 m.
3. 5, 7, 9 m → 3, 4, 5 m.
4. Speed 8 + Enhancement 4 → 6 m.
5. Drei Movement Actions bleiben jeweils 4 m; `movementActions.used` bleibt 0, weil die Begrenzung keine Action verbraucht.
6. Movement Power 16 m → 8 m, Traversal bleibt `teleport` (keine Fenster auf den übersprungenen Feldern; derselbe Weg als `path` öffnet eines).
7. Direkter Zug über 12 m endet bei 4 m und warnt.
8. Ohne Flag bleibt ein Zug über 12 m bei 12 m.
9. Flag aus Runde 1 gilt in Runde 2 nicht mehr.
10. Die begrenzte Position öffnet weiter eine Threat Zone. `handleTokenMovement` setzt danach `lacerateStageThisTurn`.
11. Rank 1 markiert 1 von 4, Rank 3 markiert 3 von 4. Nur markierte Aktoren werden begrenzt.
12. Forced und Reaction bleiben auf der angeforderten Distanz und zählen nicht als Movement Action.

Disengage läuft durch denselben Tokenpfad: 8 m → 4 m, weiterhin eine Movement Action, kein zusätzlicher Verbrauch.

### Suite nach P1.2

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2669 bestanden, 0 fehlgeschlagen, 240 Dateien. Die bisherigen 2656 Tests sind unverändert mitgelaufen. Ersetzt wurde keiner.

### Weiterhin ohne lebenden Foundry-Canvas

- Kein echtes Token-Ziehen, kein Radial-Klick und kein Dialog zur Gegnerauswahl.
- Die geführte Bewegung lehnt ein Ziel außerhalb des Budgets weiter ab; dieser Overlay-Klick wurde nicht in Foundry ausgeführt.
- Reposition erzeugt keine Tokenverschiebung. Getestet ist nur eine bereits als Reaction gekennzeichnete Verschiebung.
- Die zehn Movement Powers haben weiterhin keine eigenen Bewegungsarten (Phase Passage, Burrow, Flight und die übrigen). P1.2 halbiert nur die Distanz und lässt ein bereits gesetztes Teleport-Traversal stehen.

## P1.3 Colorless Recovery

Die Ability schreibt keine pauschale Regenerationszahl mehr. Sie speichert die Ids der gewählten Colorless Stones. Nur diese Stones dürfen am Rundenende über die gemeinsame Grenze `MR` zurückkommen. Die Aktivierung selbst regeneriert nichts.

### Spielerablauf

1. Während einer offenen Preparation Phase wählt der Spieler im Stone-Powers-Dialog Rank 1–4. Angezeigt werden Kosten 1/3/7/15 und Kapazität 2/4/8/16.
2. Er markiert vorhandene Colorless Stones, Ready oder Exhausted. Sealed und Bound lassen sich nicht bezeichnen.
3. Bestätigen ruft `commitColorlessRecovery` auf. Die Kosten laufen über `spendStoneAbility` und senken `current`. `sealed` bleibt unverändert.
4. Eine zweite Aktivierung, ein höherer Rank oder eine Zahlung außerhalb der Preparation wird abgelehnt.
5. Freie Plätze bleiben offen. Ein später entstandener Stone kann über `assignLaterColorlessRecovery` einen freien Platz belegen, ohne erneut zu zahlen. Belegte Plätze werden nicht doppelt gezählt und nicht automatisch nachgefüllt.
6. Stone Recovery listet nur bezeichnete Exhausted Stones. Zusammen mit den Attribut-Steppers gilt ein Limit von MR. `applyStoneRegenAllocation` stellt genau diese Ids wieder her.
7. Combat-Ende löscht Flag und Ledger. Ein späterer Combat kann neu aktivieren. Zwei Charaktere haben getrennte Flags.

Stones bekommen stabile Ids im Ledger `colorlessStoneLedger`: `permanent:0…`, dazu `initiative:`, `absorption:` und `granted:`. Ein Wechsel Ready/Exhausted ändert den Zustand, nicht die Id. Läuft eine temporäre Quelle ab, verschwindet der Stone; der belegte Platz bleibt belegt.

### Dateien und Funktionen

- `src/stones/colorless-recovery.ts`: `commitColorlessRecovery`, `recordColorlessRecoveryActivation`, `assignLaterColorlessRecovery`, `restoreDesignatedColorlessStones`, `syncColorlessStoneLedger`, `expireTemporaryColorlessSource`, `clearColorlessRecovery`
- `src/stones/stone-powers.ts`: `influence.colorlessRecovery.apply` schreibt die Auswahl, kein `remaining`-Budget
- `src/stones/colorless-stones.ts`: `colorlessRecoveryBudget` zählt nur bezeichnete Exhausted Stones
- `src/combat/action-economy.ts`: `applyStoneRegenAllocation` teilt `recoveryLimit` zwischen Attributen und `colorlessIds`; `restoreStonesAfterCombat` löscht die Freischaltung
- `src/stones/stone-powers-dialog.ts` und `templates/dialogs/stone-powers.hbs`: Rank, Kosten, Kapazität, Checkboxen, spätere Plätze, Recovery-Checkboxen. Ziehen auf die Karte aktiviert die Ability nicht.

### Tests

`tests/colorless-recovery.test.ts` (10 Tests, die Fälle 1–16):

1. Kosten 1/3/7/15 und Kapazitäten 2/4/8/16.
2. Außerhalb der Preparation keine Zahlung.
3. Zweite Aktivierung abgelehnt, Rank bleibt 1.
4. Kosten senken `current`, `sealed` bleibt 0.
5. Ready und Exhausted sind wählbar.
6. Ein nicht bezeichneter Exhausted Stone bleibt nach `applyStoneRegenAllocation` Exhausted.
7. Der bezeichnete Stone wird über denselben Aufruf Ready.
8. MR 3: 1 Attribut + 2 Colorless kommen zurück; 3 Attribut + 2 Colorless lassen die Colorless liegen.
9. Ein späterer Initiative-Stone füllt einen freien Platz.
10. Dieselbe Id und ein Stein über der Kapazität werden nicht noch einmal gezählt.
11. Absorption verschwindet beim Ablauf der Quelle, der Platz bleibt belegt, Recovery holt ihn nicht zurück.
12. Sealed ist nicht wählbar. Ein Bound Stone regeneriert nicht.
13. `clearColorlessRecovery` entfernt die Freischaltung.
14. Im nächsten Combat ist Rank 2 erneut aktivierbar.
15. Der zweite Charakter behält seine Stones und hat kein Flag.
16. Fälle 6–8 und 12 laufen durch `applyStoneRegenAllocation`, nicht nur durch eine Hilfszahl.

`tests/stone-regen-allocation.test.ts` bleibt grün: ohne Bezeichnung kommt kein Colorless Stone zurück.

### Suite nach P1.3

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2679 bestanden, 0 fehlgeschlagen, 241 Dateien. Die bisherigen 2669 Tests sind unverändert mitgelaufen.

### Weiterhin ohne lebenden Foundry-Dialog

- Kein Klick auf Rank, Checkbox oder Recovery Done in einem geöffneten Foundry-Fenster.
- Die Vorlage und die Handler sind verdrahtet; der Test ruft dieselben Funktionen auf, die der Dialog aufruft.
- P1.2-Canvas-Lücken bleiben offen.

## P1.7 Damage Transfer / Vampyr

Status: vollständig. Die Heilung läuft nach der normalen Damage Resolution in `applyDamageToTarget`. Sie ist der reale HP-Verlust dieser einen Damage Instance (`hpLostFromHealthUpdate` auf den Bars vor und nach dem Treffer) und geht durch `applyHealHpAcrossOpenBars`. Overkill, Armor, Damage Reduction, Negation und reines Temporary HP zählen nicht. Die Heilung bleibt auf der aktuellen Health Bar des Angreifers. Eine scarred Bar wird nicht gefüllt.

Zwei Identitäten, keine dritte Power: `Melee Single Target Damage Transfer` und `Ranged Single Target Damage Transfer`. Vampyr ist nur der Effekttext. Life Absorption ist unangetastet.

### Ablauf

1. Der Angriff setzt `damageTransfer` auf der Attack Card, wenn das Power-Item oder `artifactPowerTemplateId` eine der beiden Identitäten ist. Ein Fehlschlag ruft `applyDamageToTarget` nicht auf. Zusätzlich bricht der Resolver ab, wenn `attackSucceeded === false`.
2. Martial Delivery behält Weapon Damage. Spell Delivery (`powerIsSpell`, `ignoreWeaponDamage` oder Casting) setzt die Waffenformel auf 0. Das ist dieselbe Entscheidung in `showDamageDialog`.
3. Limited verdoppelt nur die gedruckten Power-Damage-Dice über `applyLimitedToTransferPowerDamage`. Die Heilung wird danach nicht noch einmal verdoppelt.
4. Damage Maximization bleibt ein Damage Roll. Die Heilung liest danach nur den realen HP-Verlust.
5. `damageInstanceId` (Attack-Message-Id plus `:damage-transfer`) wird einmal beansprucht. Ein zweites Resolver-Ereignis derselben Id heilt nicht erneut.
6. Life Taken I/II/III am Staff of the Dark ist die ranged Identität als Spell, Katalog-PL 4/10/16, also 4d8/10d8/16d8, ohne Weapon Damage.

P1.3 und P1.4 wurden nicht geändert. P1.4 blockiert P1.7 nicht.

### Dateien

- `src/combat/damage-transfer.ts`
- `src/dice/damage-dialog.ts` (`applyDamageToTarget`, Waffenformel, Limited)
- `src/chat/attack-roll-handler.ts`
- `src/combat/attack-executor.ts`
- `src/types/item.d.ts` (`damageTransfer`)
- `src/utils/powers/templates/actives.ts`
- `src/utils/catalog-rules-audit.ts`
- `src/utils/general-artifacts.ts` (Life Taken zeigt auf die ranged Identität)
- `tests/damage-transfer.test.ts`
- `tests/general-artifacts.test.ts` (Life-Taken-Würfel 4d8/10d8/16d8)

### Tests

`npx vitest run tests/damage-transfer.test.ts`: 14 bestanden, 0 fehlgeschlagen. Alle 14 Abnahmefälle laufen durch `applyDamageToTarget` bzw. die Formel, die der Damage Dialog dafür benutzt. Der Heal-Spy sieht den realen HP-Verlust. Actor-Bars ändern sich entsprechend.

`npx vitest run tests/heal-resolution.test.ts tests/damage-mitigation.test.ts tests/damage-negation-npc.test.ts tests/passive-damage-rider.test.ts tests/damage-faith-reroll-chat.test.ts tests/damage-mark-spend-chat.test.ts tests/catalog-rules-audit.test.ts`: 46 bestanden, 0 fehlgeschlagen.

### Suite nach P1.7

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2693 bestanden, 0 fehlgeschlagen, 242 Dateien.

### Weiterhin ohne lebenden Foundry-Canvas

- Kein Angriffsklick, kein Damage-Chat und keine Health-Bar im geöffneten Foundry-Fenster.
- Die Tests nutzen Actor-Mocks und rufen denselben Resolver auf, den die Attack Card aufruft.

### Offene Regelpunkte

Keine. Die gedruckten Tabellen sind 1:1 übernommen. Die Heilung ist nicht höher als der reale HP-Verlust und nicht höher als die fehlenden HP der aktuellen Bar.

## P1.8 Movement Powers

Status: vollständig für den Token-Bewegungspfad. Jede der zehn Powers hat eine eigene Bewegungsart in `executeMovementPower`. Die geführte Bewegung ruft dieselbe Funktion auf. Ein Katalogeintrag allein bewegt nichts.

Eine erfolgreiche Nutzung verbraucht genau eine Movement. Dieselbe technische Power ist pro Runde nur einmal nutzbar. Weitere Movements bleiben. Ein abgelehnter Versuch schreibt weder Position noch Verbrauch. Teleport und Teleport with Ally setzen `movementTraversal: teleport`. Safe Movement setzt `safe`. Die übrigen folgen einem Pfad. Threat Zones nutzen diese Art. Lacerate läuft über `handleTokenMovement`; derselbe Koordinatenwechsel wird nicht ein zweites Mal abgerechnet.

| Power | Laufzeit |
|---|---|
| Ground Dash | Bodenpfad, gedruckte Distanz, Wände auf der Strecke blockieren, Threat Zone auf dem Pfad |
| Safe Movement | Bodenpfad, keine Movement-Triggered Reactions, kein Evade-Bonus, Lacerate bleibt |
| Teleport | sichtbares freies Ziel, keine Zwischenstrecke, Threat Zone nur an den Enden |
| Teleport with Ally | ein freiwilliger Verbündeter innerhalb von 2 m, beide Tokens, der Verbündete verbraucht keine Movement |
| Flight | 3D-Distanz, Ende auf Höhe 0 oder bestätigtes Verbleiben, kein dauerhafter Flugstatus |
| Leap | horizontale und vertikale Grenze getrennt, Bogen nur nach Bestätigung |
| Wall Walk | Pfad, Oberflächenkontakt nur nach Bestätigung, kein Durchdringen |
| Burrow | Pfad, nur nach Bestätigung geeigneten weichen Materials, kein Cover |
| Phase Passage | Distanz = Speed plus Enhancement, dann ggf. eine Halbierung; Materialdicke bleibt der gedruckte PL-Wert |
| Trample | Kreaturen auf dem tatsächlichen Segment, einmal je Kreatur, `applyDamageToTarget` ohne Attack, Raises, Weapon Damage oder Specials |

PL 1 von Teleport with Ally und Phase Passage sind nicht nutzbar. Ein Strich ist keine 0-m-Bewegung.

### Automatisch und bestätigt

Automatisch: Distanz, eine Movement, einmal pro Power, freie Zielzelle, Wandsegmente wenn die Szene welche hat, Threat-Zone-Art, Lacerate, Trample-Mitigation, Phase-Passage-Dicke gegen den gedruckten Cap.

Bestätigt durch Spieler oder GM, weil Foundry keine zuverlässige Höhe, Oberfläche oder Materialklasse hat: Flight-Landung abseits des Bodens, Leap-Bogen, Wall-Walk-Kontakt, Burrow-Material, Phase-Passage-Ende außerhalb fester Materie. Diese Bestätigung ist keine automatische Kollisionsprüfung.

### Dateien

- `src/combat/movement-powers.ts`
- `src/combat/movement-allowance.ts` (Movement Powers werden auch ohne Reduction auf ihre Distanz begrenzt)
- `src/combat/movement-tracker.ts` (dieselbe Positionsänderung nur einmal)
- `src/combat/action-economy.ts` (eine Movement, `usedMovementPowerIds`)
- `src/token-action-selector.ts`
- `src/radial-menu/options.ts`
- `src/utils/powers/templates/movement.ts`
- `src/types/item.d.ts`
- `tests/movement-powers.test.ts`

P1.7 bleibt unverändert in der Wirkung. P1.2 Reduction bleibt die eine Halbierung nach Enhancement.

### Tests

`npx vitest run tests/movement-powers.test.ts tests/movement-reduction.test.ts tests/threat-zone.test.ts`: 34 bestanden, 0 fehlgeschlagen. Die Tokenpositionen kommen aus `executeMovementPower` bzw. `applyMovementCapToTokenChange`, also aus demselben Pfad wie die Token-Hooks. Es sind Actor- und Token-Mocks, kein geöffnetes Foundry-Fenster.

### Suite nach P1.8

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2709 bestanden, 0 fehlgeschlagen, 243 Dateien.

### Weiterhin ohne lebenden Foundry-Canvas

- Kein Radial-Klick, kein Token-Ziehen und kein Bestätigungsdialog in einem geöffneten Foundry-Fenster.
- Wände werden nur geprüft, wenn die Szene Wandsegmente liefert. Sonst bleibt die Bodenbewegung eine Positionsänderung innerhalb der Distanz.

### Offene Auslegung

Leap: Enhancement erhöht das horizontale Budget dieser Movement einmal. Die vertikale Grenze bleibt der gedruckte Halbwert und wird bei Movement Reduction einzeln gerundet halbiert. Die beiden Achsen werden nicht zu einer gemeinsamen Distanz addiert. Der gedruckte Satz „horizontally or vertically“ ist damit als zwei getrennte Grenzen derselben Sprungbewegung gelesen.

## P1.9 Special Aura und Summon Auras

Status: vollständig für die drei Laufzeitwirkungen. P1.7 und P1.8 wurden nicht verändert.

Die drei Auren sind getrennt von Damage Aura und Healing Aura. Damage Aura und Healing Aura bleiben Zugende-Pulse in `pulseActiveBuffAuras` und lösen nur bei `auraPayload.kind` `damage` oder `healing` aus. Ein zweiter Puls desselben Besitzers in derselben Runde wird über `lastAuraPulseKey` verworfen. Summon Damage Aura und Summon Armor Aura haben keinen Puls.

### Special Aura

Die Passive ist um den Besitzer zentriert. Beim Slotten wird genau ein Special aus der gedruckten Beispielliste gespeichert (`specialChoice`, getrennt von `templateId`). PL 1–3 sind nicht verfügbar. Im Radius gilt +1 auf den effektiven Wert, wenn das Special bereits gespeichert ist. Der gespeicherte Stack bleibt. Zwei passende Auren bleiben bei +1. `getActiveSpecialValue` ist der Verbraucher; Weaken senkt den Might-Pool um den effektiven Wert. Natural Special Recovery und Special Negation schreiben weiter den gespeicherten Wert.

Zulässige Typen sind die gedruckten Beispiele: Challenge, Corrode, Disoriented, Expose, Hex, Lacerate, Mark, Ruin, Slow, Soulburn, Sundered, Weaken. Stunned und andere nicht genannte Typen werden nicht verstärkt. Die Liste im Regeltext heißt „common eligible examples“. Andere numerische Diminishing Specials außerhalb dieser Liste werden nicht verstärkt.

### Summon Damage Aura

Nur ein Summon mit `summonBond` auf einen Bond des Buff-Besitzers. Der Caster, Verbündete und fremde Summons bleiben außen vor. Die Würfel werden in `calculateDamageResult` bei jedem Angriff neu geprüft und nicht auf dem Summon gespeichert. Gedruckte Würfel 1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8 d8. Radien 8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,40 m. Der alte Katalog mit den Stufen 8/16/24/32 ist korrigiert.

### Summon Armor Aura

Dieselbe Besitz- und Radiusregel. Armor +2 bis +32. `applyDamageToTarget` addiert den Bonus zur Armor, die `applyDefensiveMitigation` sieht. `system.combat.armorTotal` bleibt der Basiswert. Verlassen des Radius oder Ende des Buffs entfernt den Bonus sofort.

### Dateien

- `src/combat/aura-modifiers.ts`
- `src/system/active-specials.ts`
- `src/dice/damage-dialog.ts`
- `src/combat/aura-pulse.ts`
- `src/powers/passives.ts`
- `src/utils/powers/templates/activeBuffs.ts`
- `src/utils/powers/templates/passives.ts`
- `src/types/item.d.ts`
- `tests/special-summon-auras.test.ts`
- `tests/rules-v098-combat-core.test.ts` (gedruckte Radien statt 8/16/24/32)

### Tests

`npx vitest run tests/special-summon-auras.test.ts`: 7 bestanden, 0 fehlgeschlagen. Die Fälle laufen über `getActiveSpecialValue`, `attributePoolReduction`, `applyNaturalSpecialRecovery`, `applyWardToIncomingSpecial`, `calculateDamageResult`, `applyDamageToTarget` und `pulseActiveBuffAuras`. Actor- und Token-Mocks, kein geöffnetes Foundry-Fenster.

`npx vitest run tests/damage-transfer.test.ts tests/movement-powers.test.ts`: in der gemeinsamen Prüfung 38 bestanden, zusammen mit Seed und den Aura-Tests, 0 fehlgeschlagen.

### Suite nach P1.9

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2716 bestanden, 0 fehlgeschlagen, 244 Dateien.

### Weiterhin ohne lebenden Foundry-Canvas

- Kein Token-Ziehen, kein Buff-Klick und keine Health-Bar im geöffneten Foundry-Fenster.
- Die Distanz ist die Distanz der Token-Mittelpunkte auf dem Szenenraster, dieselbe Geometrie wie die bestehende Aura-Distanz.

## P1.6 Pursuit und Flee

Status: vollständig für Flee-Kosten, Flee-Sperre und die GM-geführte Pursuit. Flee startet keine Pursuit.

### Flee

`commitFlee` prüft Movement und Attack Action. Fehlt eine, wird nichts verbraucht und nichts gesperrt. Bei Erfolg werden beide verbraucht und `fleeLock` gesetzt. Ein zweiter Aufruf in demselben Zug verbraucht nichts weiter. Die Sperre blockiert `spendAttackAction`, `spendReactionAction` und `spendColorlessStones`. `resetRoundState` behält die Sperre über die Rundengrenze. `resetTurnState` hebt sie am Beginn des eigenen nächsten Zuges auf.

Die geführte Bewegung ruft `commitFlee` erst beim ersten erfolgreichen Schritt auf. Abbruch davor lässt die Ressourcen stehen. Die Distanz ist 4 × Speed, dann Enhancement, dann höchstens eine Halbierung. Ein direkter Zug über diese Distanz wird gekappt. Die Traversal-Art ist `path`, also keine Safe-Movement-Immunität. Threat Zones bleiben offen.

### Pursuit

Der GM startet eine Pursuit mit einem Flüchtenden und einem Verfolger. Track beginnt bei 0. Jeder Exchange würfelt über `masteryRoll` mit `buildContestRollOptions` und vergleicht mit `compareContestResults`. Sieg des Flüchtenden +1, Sieg des Verfolgers −1, Gleichstand 0. +2 ist Escape, −2 ist Caught. Danach lehnt der Resolver weitere Exchanges ab. Dieselbe Exchange-Id ändert den Track nicht ein zweites Mal. Der Zustand liegt auf `combat.flags['mastery-system'].pursuit`. Chat und Dialog lesen denselben Datensatz.

Der GM kann die Attribute auf Agility, Might und Vitality begrenzen. Mehr als zwei Kreaturen werden nicht automatisch ausgewertet. Eine weitere Paarung ist eine neue Pursuit, nachdem die aktive geendet ist.

### Dateien

- `src/combat/flee.ts`
- `src/combat/pursuit.ts`
- `src/combat/pursuit-dialog.ts`
- `src/combat/action-economy.ts`
- `src/combat/movement-allowance.ts`
- `src/stones/colorless-stones.ts`
- `src/token-action-selector.ts`
- `src/module.ts`
- `tests/flee-pursuit.test.ts`

### Tests

`npx vitest run tests/flee-pursuit.test.ts`: 4 bestanden, 0 fehlgeschlagen. Zusammen mit `tests/movement-reduction.test.ts` und `tests/opposed-attribute-contest.test.ts` in der Zwischenprüfung: die Regressionsdateien blieben grün.

### Suite nach P1.6

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2720 bestanden, 0 fehlgeschlagen, 245 Dateien.

### Weiterhin ohne lebenden Foundry-Canvas

- Kein Radial-Klick, kein Token-Ziehen, kein Combat-Tracker-Button und kein Pursuit-Dialog im geöffneten Foundry-Fenster.
- Die Tests rufen `commitFlee`, `applyMovementCapToTokenChange`, `planThreatZoneWindows`, `resolvePursuitExchange` und `masteryRoll` auf.

### Offene Grenze

Eine Pursuit hat genau zwei Teilnehmer. Das Regelwerk beschreibt keine automatische Mehrparteien-Auswertung.

## Post-Audit-Bugfixes (2026-10-17)

Drei gezielte Korrekturen aus dem Abschluss-Audit, ohne Regelwerksänderungen und ohne neue Features. Details: `docs/DESTROYED_FAITH_V0.9.9.5_P1_POST_AUDIT_FIXES.md`.

1. **Token-Drag:** Geführtes Flee und Movement Powers können nicht mehr durch gewöhnliches Ziehen umgangen werden (`token-move-gate.ts`, autorisierte Updates mit `masteryAuthorizedMove`).
2. **Defensive Stones:** Parry, Armor, Evade, Damage Negation, Damage Reduction, Spell Resistance und Special Negation bleiben bis zum Beginn des nächsten eigenen Zuges (`armDefensiveStoneExpiry` / `releaseDefensiveStoneExpiry`); Spotlight-Ende löscht sie nicht.
3. **Damage Reduction:** `Final Damage = ceil(Damage × (1 − DR / 100))` in `applyDefensiveMitigation`.

### Suite nach Post-Audit-Fixes

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2728 bestanden, 0 fehlgeschlagen, 247 Dateien.

## Final Runtime Verification (2026-10-17)

Interne Regelabdeckung und Verdrahtung geprüft. Fixes in diesem Durchgang: Teleport-with-Ally im Guided Path; Death-Check-Tests; Cross-System-Integrationstests. Dispel-Actives bleiben MISSING. Fear und Fallschaden EXCLUDED.

### Suite nach Runtime Verification

- `npx tsc --noEmit`: Exit 0.
- `npx vitest run`: 2739 bestanden, 0 fehlgeschlagen, 249 Dateien.
- Entscheidung: **READY FOR FOUNDRY TESTING** (siehe Final Runtime Verification).

## Offen, bewusst nicht angefasst

Fear, Fallschaden und der gesamte P2-Katalog. P1.4 und P1.5 sind nicht begonnen.

---

## Canvas test fixes + pending rules (2026-10-17)

**Nachtrag** (ohne Änderung historischer Audit-Verdikte in `docs/DESTROYED_FAITH_V0.9.9.5_IMPLEMENTATION_AUDIT.md` / Final Implementation Audit):

- **Canvas-Test-Fixes** dokumentiert in `docs/DESTROYED_FAITH_V0.9.9.5_CANVAS_TEST_FIXES.md` (Critical UI, Threatened Ranged/Spell, NPC Perception-Pools, Restoration/Cleanse/Recovery/DN UI, Stress-Retirement, u. a.).
- **Pending rule decisions R-01 / R-02 / R-03** in Runtime umgesetzt, Regelwerke unverändert — siehe `docs/DESTROYED_FAITH_PENDING_RULE_CHANGES.md`.
- **Fear P1.4** im Code umgesetzt (`src/combat/fear.ts`, Pool-Integration, Safe Haven); Vitest `tests/fear.test.ts`. Foundry-Canvas-Abnahme weiterhin offen.

Vitest-Gesamtlauf nach diesem Paket: **2769** bestanden, **0** fehlgeschlagen, **252** Dateien; `tsc --noEmit` Exit 0.

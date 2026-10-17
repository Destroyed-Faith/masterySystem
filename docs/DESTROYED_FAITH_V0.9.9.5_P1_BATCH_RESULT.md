# Destroyed Faith v0.9.9.5 – Abschluss P1.7, P1.9, P1.8, P1.6

Stand: 2026-10-16. Kein Foundry-Fenster wurde für diese vier Pakete geklickt. Die Zahlen sind die jeweils nach dem Paket tatsächlich gelaufenen Kommandos. Die letzte gemeinsame Suite ist die nach P1.6.

## P1.7 – Damage Transfer / Vampyr

### A. Status

Vollständig.

### B. Tatsächliche Implementierung

Zwei Identitäten: Melee Single Target Damage Transfer und Ranged Single Target Damage Transfer. Vampyr ist keine dritte Power. Die Heilung ist der reale HP-Verlust dieser Schadensinstanz nach Mitigation, begrenzt auf die fehlenden HP der aktuellen Health Bar des Angreifers. Limited verdoppelt nur die gedruckten Power-Würfel. Ein Fehlschlag, ein vollständiger Prevent und reiner Temp-HP-Schaden heilen 0. Dieselbe Schadensinstanz heilt nur einmal. Life Taken I/II/III auf dem Staff of the Dark ist die ranged Identität als Spell, Katalog-PL 4/10/16.

### C. Geänderte Dateien

- `src/combat/damage-transfer.ts` – Settlement und Heilung
- `src/dice/damage-dialog.ts` – Damage Resolver
- `src/chat/attack-roll-handler.ts` – Übergabe an den Resolver
- `src/combat/attack-executor.ts` – Flag aus Item oder Artefakt
- `src/types/item.d.ts`
- `src/utils/powers/templates/actives.ts` – beide 16-Level-Tabellen
- `src/utils/catalog-rules-audit.ts`
- `src/utils/general-artifacts.ts` – Life Taken
- `tests/damage-transfer.test.ts`
- `tests/general-artifacts.test.ts`

### D. Abnahmetests

`npx vitest run tests/damage-transfer.test.ts`: 14 bestanden, 0 fehlgeschlagen. Die Fälle laufen durch `applyDamageToTarget`.

`npx vitest run tests/heal-resolution.test.ts tests/damage-mitigation.test.ts tests/damage-negation-npc.test.ts tests/passive-damage-rider.test.ts tests/damage-faith-reroll-chat.test.ts tests/damage-mark-spend-chat.test.ts tests/catalog-rules-audit.test.ts`: 46 bestanden, 0 fehlgeschlagen.

### E. Typecheck

`npx tsc --noEmit`: Exit 0, nach P1.7.

### F. Vitest

Nach P1.7: `npx vitest run` 2693 bestanden, 0 fehlgeschlagen, 242 Dateien.

### G. Foundry Canvas und UI

Nicht manuell geprüft. Actor-Mocks rufen denselben Damage Resolver auf wie die Attack Card. Kein Angriffsklick und keine Health Bar im Foundry-Fenster.

### H. Risiken und Abweichungen

Keine offene Regelabweichung in diesem Paket. Die Heilung ist nicht höher als der reale HP-Verlust und nicht höher als die fehlenden HP der aktuellen Bar.

## P1.9 – Special Aura und Summon Auras

### A. Status

Vollständig.

### B. Tatsächliche Implementierung

Special Aura: +1 auf den effektiven Wert eines bereits gespeicherten Specials aus der gedruckten Beispielliste, höchstens +1 bei Überlappung, gespeicherter Stack unverändert. PL 1–3 sind nicht verfügbar.

Summon Damage Aura: zusätzliche d8 nur beim Angriff eines eigenen Summons im Radius. Kein Zugende-Puls. Würfel und Radien sind die gedruckte Tabelle, inklusive 40 m auf PL 16.

Summon Armor Aura: derselbe Besitz und Radius. Der Bonus geht in `applyDamageToTarget` und wird nicht auf `armorTotal` geschrieben.

Damage Aura und Healing Aura bleiben Zugende-Pulse.

### C. Geänderte Dateien

- `src/combat/aura-modifiers.ts`
- `src/system/active-specials.ts`
- `src/dice/damage-dialog.ts`
- `src/combat/aura-pulse.ts`
- `src/powers/passives.ts`
- `src/utils/powers/templates/activeBuffs.ts`
- `src/utils/powers/templates/passives.ts`
- `src/types/item.d.ts`
- `tests/special-summon-auras.test.ts`
- `tests/rules-v098-combat-core.test.ts`

### D. Abnahmetests

`npx vitest run tests/special-summon-auras.test.ts`: 7 bestanden, 0 fehlgeschlagen. Die Fälle laufen über `getActiveSpecialValue`, `attributePoolReduction`, `applyNaturalSpecialRecovery`, `applyWardToIncomingSpecial`, `calculateDamageResult`, `applyDamageToTarget` und `pulseActiveBuffAuras`.

### E. Typecheck

`npx tsc --noEmit`: Exit 0, nach P1.9.

### F. Vitest

Nach P1.9: `npx vitest run` 2716 bestanden, 0 fehlgeschlagen, 244 Dateien.

### G. Foundry Canvas und UI

Nicht manuell geprüft. Tokenpositionen sind Mocks. Distanz ist die Distanz der Token-Mittelpunkte.

### H. Risiken und Abweichungen

Die Special-Aura-Liste im Regeltext heißt „common eligible examples“. Verstärkt werden nur die zwölf genannten Typen. Andere numerische Diminishing Specials außerhalb dieser Liste nicht.

## P1.8 – Alle zehn Movement Powers

### A. Status

Vollständig für den Token-Bewegungspfad.

### B. Tatsächliche Implementierung

Jede der zehn Powers hat eine eigene Bewegungsart in `executeMovementPower`. Eine erfolgreiche Nutzung verbraucht genau eine Movement. Dieselbe technische Power ist pro Runde nur einmal nutzbar. Ein abgelehnter Versuch schreibt weder Position noch Verbrauch. Teleport und Teleport with Ally sind Teleports. Safe Movement unterdrückt Movement-Triggered Reactions und gibt keinen Evade-Bonus. Die übrigen folgen einem Pfad. Trample schädigt Kreaturen auf dem Segment über `applyDamageToTarget`, ohne Angriffswurf. PL 1 von Teleport with Ally und Phase Passage sind nicht nutzbar.

Flight, Leap, Wall Walk, Burrow und Phase Passage verlangen eine Bestätigung für Höhe, Oberfläche oder Material. Diese Bestätigung ist keine automatische Kollisionsprüfung.

### C. Geänderte Dateien

- `src/combat/movement-powers.ts`
- `src/combat/movement-allowance.ts`
- `src/combat/movement-tracker.ts`
- `src/combat/action-economy.ts`
- `src/token-action-selector.ts`
- `src/radial-menu/options.ts`
- `src/utils/powers/templates/movement.ts`
- `src/types/item.d.ts`
- `tests/movement-powers.test.ts`

### D. Abnahmetests

`npx vitest run tests/movement-powers.test.ts tests/movement-reduction.test.ts tests/threat-zone.test.ts`: 34 bestanden, 0 fehlgeschlagen. Die Positionen kommen aus `executeMovementPower` und `applyMovementCapToTokenChange`.

### E. Typecheck

`npx tsc --noEmit`: Exit 0, nach P1.8.

### F. Vitest

Nach P1.8: `npx vitest run` 2709 bestanden, 0 fehlgeschlagen, 243 Dateien.

### G. Foundry Canvas und UI

Nicht manuell geprüft. Kein Radial-Klick, kein Token-Ziehen und kein Bestätigungsdialog im Foundry-Fenster. Wände werden nur geprüft, wenn die Szene Wandsegmente liefert.

### H. Risiken und Abweichungen

Leap: Enhancement erhöht das horizontale Budget einmal. Die vertikale Grenze bleibt der gedruckte Halbwert und wird bei Movement Reduction einzeln gerundet halbiert. Die Achsen werden nicht addiert.

## P1.6 – Pursuit und Flee

### A. Status

Vollständig.

### B. Tatsächliche Implementierung

Flee verlangt eine Movement und eine Attack Action. Beide werden erst bei einem erfolgreichen Bewegungsschritt verbraucht. Ein Fehlversuch sperrt nichts. Bis zum Beginn des eigenen nächsten Zuges sind Attacks, Reactions und Stone-Ausgaben in den zentralen Spend-Funktionen gesperrt. Die Rundengrenze hebt die Sperre nicht auf. Flee ist ein Pfad mit bis zu 4 × Speed und provoziert Threat Zones. Flee startet keine Pursuit.

Die Pursuit ist ein GM-Start mit einem Flüchtenden und einem Verfolger, Track 0, und Opposed Attribute Contests über die vorhandene Würfelmechanik. +2 ist Escape, −2 ist Caught. Der Zustand bleibt auf dem Combat-Flag. Chat und Dialog zeigen denselben Datensatz.

### C. Geänderte Dateien

- `src/combat/flee.ts` – Kosten, Sperre, Distanz
- `src/combat/pursuit.ts` – Track, Exchange, Chat
- `src/combat/pursuit-dialog.ts` – GM-Panel
- `src/combat/action-economy.ts` – Sperre über die Rundengrenze, Attack-Sperre
- `src/combat/movement-allowance.ts` – Flee-Kappung
- `src/stones/colorless-stones.ts` – Stone-Sperre
- `src/token-action-selector.ts` – Commit erst nach dem Schritt
- `src/module.ts` – Pursuit-Button im Combat Tracker
- `tests/flee-pursuit.test.ts`

### D. Abnahmetests

`npx vitest run tests/flee-pursuit.test.ts`: 4 bestanden, 0 fehlgeschlagen.

Dieselben Resolver: `commitFlee`, `spendAttackAction`, `spendReactionAction`, `spendColorlessStones`, `resetRoundState`, `resetTurnState`, `applyMovementCapToTokenChange`, `planThreatZoneWindows`, `startPursuit`, `resolvePursuitExchange`, `masteryRoll`.

`tests/movement-reduction.test.ts` und `tests/opposed-attribute-contest.test.ts` waren in derselben Zwischenprüfung grün.

Nicht ausgeführt als eigener Klick: der geführte Token-Pfad und der Dialog im Browser. Der Token-Pfad ruft `commitFlee` auf; der Dialog ruft `startPursuit` und `resolvePursuitExchange` auf.

### E. Typecheck

`npx tsc --noEmit`: Exit 0, nach P1.6.

### F. Vitest

Nach P1.6: `npx vitest run` 2720 bestanden, 0 fehlgeschlagen, 245 Dateien. 0 übersprungen.

### G. Foundry Canvas und UI

Nicht manuell geprüft. Offen bleiben Radial-Klick, Token-Ziehen, der Pursuit-Button und der Dialog im geöffneten Foundry-Fenster.

### H. Risiken und Abweichungen

Eine Pursuit hat genau zwei Teilnehmer. Eine weitere Kreatur wird nicht automatisch mitgewürfelt. Der GM startet dafür eine eigene Pursuit, nachdem die aktive geendet ist.

## Gesamtbewertung

| Paket | Status |
|---|---|
| P1.7 Damage Transfer / Vampyr | vollständig |
| P1.9 Special Aura und Summon Auras | vollständig |
| P1.8 Zehn Movement Powers | vollständig |
| P1.6 Pursuit und Flee | vollständig |

Zuletzt ausgeführte Suite: `npx vitest run` am 2026-10-16, 2720 bestanden, 0 fehlgeschlagen, 245 Dateien. `npx tsc --noEmit`: Exit 0.

Blocker: keine für diese vier Pakete.

Noch notwendige manuelle Foundry-Prüfung: Tokenbewegung, Radialmenü, Combat Tracker, Pursuit-Dialog, Damage Chat, Health Bars, Aura-Positionen. Keines dieser Fenster wurde in dieser Serie geöffnet.

Für einen späteren vollständigen Audit bleiben offen: Fear, Fallschaden, der restliche P2-Katalog, die Special-Aura-Beispielliste gegenüber anderen Diminishing Specials, und die Leap-Auslegung der zwei Achsen.

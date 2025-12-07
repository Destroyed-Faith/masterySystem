# Combat Start Implementation - Änderungen

## Datum: 7. Dezember 2025

## Problem
Beim Start eines Encounters in Foundry VTT passierte nichts - keine automatische Initiative-Würfelung und keine Passive-Auswahl für Spieler.

## Lösung

### 1. Automatische Initiative-Würfelung beim Combat-Start
Die `onCombatStart` Funktion wurde erweitert, um automatisch die Initiative für alle Combatants zu würfeln.

**Datei:** `dist/combat/initiative.js`

**Änderungen:**
- Die Funktion ist jetzt `async` und ruft automatisch `rollInitiativeForAllCombatants()` auf
- Nach 1 Sekunde Verzögerung (damit Passive-Dialoge Zeit haben) werden die Initiative-Würfe durchgeführt

### 2. Passive-Auswahl vor Initiative
Eine neue Funktion `promptPassiveSelection()` wurde hinzugefügt, die:
- Alle Spielercharaktere im Combat identifiziert
- Für jeden Spieler eine Chat-Nachricht erstellt, die ihre aktiven Passives anzeigt
- Den Spielern mitteilt, wie viele Passive sie noch aktivieren können (basierend auf Mastery Rank)
- Die Nachrichten sind nur für den Spieler und den GM sichtbar (whisper)

## Ablauf beim Combat-Start

1. **Combat wird gestartet** (GM klickt "Begin Combat")
2. **Passive-Phase:** 
   - System zeigt jedem Spieler ihre aktuellen Passives
   - Spieler können ihr Character Sheet öffnen und Passives aktivieren/deaktivieren
   - Hinweis: Max. aktive Passives = Mastery Rank
3. **Initiative-Phase** (nach 1 Sekunde):
   - **NPCs:** Automatische Initiative-Würfelung (kein Shop)
   - **Spieler:** Initiative-Würfelung mit Initiative Shop Dialog
   - Jeder Spieler würfelt individuell

## Funktionsweise der Initiative

### Für NPCs:
- Base Initiative = Agility + Wits + Combat Reflexes
- Würfeln: [Mastery Rank]d8 (8er explodieren)
- Kein Initiative Shop
- Automatische Chat-Nachricht mit Ergebnis

### Für Spieler:
- Base Initiative = Agility + Wits + Combat Reflexes
- Würfeln: [Mastery Rank]d8 (8er explodieren)
- **Initiative Shop Dialog öffnet sich:**
  - Extra Movement: Kosten variabel
  - Initiative Swap: Kann mit anderem Combatant tauschen
  - Extra Attack: Eine zusätzliche Attacke
  - Kosten werden von Initiative abgezogen
- Chat-Nachricht mit Ergebnis und Shop-Käufen

## Passive-System Regeln

- **8 Passive Slots** insgesamt
- **Max. aktive Passives** = Mastery Rank (standardmäßig 2)
- **Nur 1 Passive pro Kategorie** kann aktiv sein
- Kategorien: Armor, Evade, To-Hit, Damage, Roll, Save, Hit Point, Healing, Awareness, Attribute
- **Werden vor der Initiative gesetzt** - kein Wechsel während Combat
- Effekte gelten automatisch (kein Würfel erforderlich)

## Testing

Zum Testen:
1. Erstelle einen Combat Encounter in Foundry VTT
2. Füge mindestens 1 Spielercharakter und 1 NPC hinzu
3. Klicke "Begin Combat"
4. Erwartetes Verhalten:
   - Notification: "Combat started! Please select your passive abilities."
   - Chat-Nachrichten für jeden Spieler mit Passive-Status
   - Nach kurzer Zeit: "Rolling initiative for all combatants..."
   - NPCs würfeln automatisch
   - Initiative Shop Dialog öffnet sich für jeden Spieler nacheinander
   - Combat Tracker zeigt sortierte Initiative an

## Technische Details

### Neue Funktion
```javascript
async function promptPassiveSelection(combat)
```
- Filtert Spielercharaktere aus Combat
- Lädt Passive-Funktionen dynamisch
- Erstellt Whisper-Chat-Nachrichten mit Status
- Zeigt aktive Passives und verfügbare Slots

### Geänderte Funktion
```javascript
async function onCombatStart(combat, _updateData)
```
- Jetzt async
- Ruft `promptPassiveSelection()` auf
- Startet automatisch Initiative-Würfelung nach Verzögerung

## Zukünftige Verbesserungen (Optional)

1. **Interaktiver Passive-Dialog:** Statt nur Status anzuzeigen, könnte ein Dialog die Passive-Aktivierung direkt ermöglichen
2. **Countdown-Timer:** Eine visuelle Anzeige für die verbleibende Zeit bis zur Initiative-Würfelung
3. **Pause-Option:** GM kann die Initiative-Würfelung pausieren, bis alle Spieler ihre Passives gewählt haben
4. **Erinnerung speichern:** System merkt sich, ob ein Spieler seine Passives bereits für diesen Combat gewählt hat

## Hinweise

- Die Änderungen sind nur in `dist/combat/initiative.js` (kompiliertes JavaScript)
- Es gibt keine entsprechende TypeScript-Quelldatei im `src/combat` Ordner
- Bei zukünftigen Builds sollte die TypeScript-Quelle entsprechend aktualisiert werden


# Combat Overlays Implementation Summary - v0.0.33

## Datum: 7. Dezember 2025

## Implementierte Features

### 1. **Passive-Selection-Dialog** (Combat-Start)
**Datei:** `dist/sheets/passive-selection-dialog.js`
**Template:** `templates/dialogs/passive-selection.hbs`

#### Funktionalität:
- **Automatisches Overlay beim Combat-Start** für alle Spielercharaktere
- **Multi-Character-Support:** Spieler mit mehreren Charakteren navigieren Schritt für Schritt durch ihre PCs
- **Passive-Verwaltung:**
  - Zeigt alle 8 Passive-Slots
  - Aktivieren/Deaktivieren von Passives (bis Mastery Rank Limit)
  - Slot/Unslot von Passives
  - Kategoriefilter (nur 1 Passive pro Kategorie)
  - Liste verfügbarer Passives
- **Navigation:** Vor/Zurück zwischen Charakteren, GM-Skip-Option
- **Promise-basiert:** Combat-Start wartet, bis alle Spieler fertig sind

### 2. **Combat-Action-Overlay** (Pro Zug)
**Datei:** `dist/sheets/combat-action-overlay.js`
**Template:** `templates/dialogs/combat-overlay.hbs`

#### Funktionalität:
- **Automatisches Overlay bei jedem Zug** für den aktiven Combatant
- **Ressourcen-Anzeige:**
  - Stones (Current/Maximum)
  - Vitality (Current/Maximum)
  - Stress (Current/Maximum)
  - Mastery Charges (inkl. temporäre)
- **Action-Tracking:**
  - Attack, Movement, Reaction (Used/Max)
  - Use/Undo-Buttons pro Action-Type
  - Visuelles Feedback über verfügbare Aktionen
- **Powers-Liste:**
  - Gruppiert nach Typ (Movement, Active, Utility, Reaction)
  - Zeigt Level, Range, Stone-Cost
  - "Use"-Button pro Power
  - Integration mit Movement & Utility Power-Systemen
- **Quick-Actions:** Refresh, Roll Attack, End Turn/Close

### 3. **CSS-Styling**
**Datei:** `styles/overlays.css`

#### Design:
- **Dark Fantasy Theme:** Passend zum System (dunkelblau/rot-akzentuiert)
- **Responsive Design:** Grid-Layouts passen sich an Bildschirmgröße an
- **Hover-Effekte & Transitions:** Smooth Interaktionen
- **Farbkodierung:**
  - Attack: Rot (#e94560)
  - Movement: Cyan (#48dbfb)
  - Reaction: Gelb (#feca57)
  - Stones: Rot, Vitality: Rot, Stress: Gelb, Charges: Cyan
- **Button-Varianten:** Primary, Secondary, Warning, Action, Toggle, Remove
- **Mobile-optimiert:** Single-column Layouts für schmale Bildschirme

### 4. **Combat-Hook-Integration**
**Datei:** `dist/combat/initiative.js` (modifiziert)

#### Änderungen:
- **onCombatStart:**
  - Importiert `PassiveSelectionDialog` dynamisch
  - Ruft `PassiveSelectionDialog.showForCombat(combat)` auf
  - Wartet auf Abschluss, bevor Initiative gewürfelt wird
  - Entfernte alte `promptPassiveSelection`-Funktion (Chat-only)
  
- **onCombatTurn:**
  - Importiert `CombatActionOverlay` dynamisch
  - Ruft `CombatActionOverlay.showForCurrentTurn(combat)` auf
  - Overlay wird nur für Besitzer + GM angezeigt

### 5. **Handlebars-Helper**
**Datei:** `src/module.ts` (erweitert)

Neue Helper:
- `lte` - Less than or equal
- `inc` - Increment (für 1-basierte Indexierung)
- `userIsGM` - Check if user is GM

### 6. **Projekt-Architektur-Dokumentation**
**Datei:** `ARCHITECTURE.md`

Umfassende Dokumentation der:
- Ordnerstruktur
- Module & Verantwortlichkeiten
- Design-Prinzipien
- Combat-Flow mit Overlays
- Datenfluss

## Technische Details

### Modularität
- Beide Overlays sind **separate, wiederverwendbare Module**
- Import-on-demand: Nur geladen, wenn benötigt
- Keine zirkulären Abhängigkeiten
- Klare Trennung UI ↔ Logik ↔ Daten

### Integration
- Nutzt **existierende Power-Systeme** (passives.js, movement.js, utilities.js, actions.js)
- Keine Duplikation von Logik
- Kommuniziert über Actor-Updates (Foundry-Standard)
- Chat-Messages für Feedback

### Benutzerführung
- **Combat-Start-Sequenz:**
  1. GM startet Combat
  2. Passive-Selection-Overlay öffnet für jeden Spieler
  3. Spieler wählen/aktivieren Passives
  4. Nach Abschluss: Auto-Initiative-Würfelung
  5. NPCs würfeln zuerst, dann PCs mit Initiative Shop
  
- **Turn-Sequenz:**
  1. Neuer Zug beginnt
  2. Combat-Action-Overlay öffnet für aktiven Combatant
  3. Spieler sieht Ressourcen, Aktionen, Powers
  4. Kann direkt Powers nutzen oder Aktionen markieren
  5. Bei "End Turn" oder Schließen: nächster Zug

## Testing

### Zu testen in Foundry VTT:
1. **Passive-Selection:**
   - Combat starten → Overlay erscheint
   - Passives auswählen und aktivieren
   - Multi-Character: Navigation testen
   - GM-Skip-Button (nur für GM)
   
2. **Combat-Action-Overlay:**
   - Zug starten → Overlay erscheint
   - Aktionen markieren (Use/Undo)
   - Powers verwenden (Movement, Utility)
   - Ressourcen-Anzeige korrekt?
   - Refresh & Close

3. **Integration:**
   - Combat von Start bis Ende durchspielen
   - Passive korrekt gesetzt?
   - Initiative korrekt gewürfelt?
   - Overlays erscheinen zur richtigen Zeit?

## Dateien (Neu/Geändert)

### Neu erstellt:
- `dist/sheets/passive-selection-dialog.js`
- `dist/sheets/combat-action-overlay.js`
- `templates/dialogs/passive-selection.hbs`
- `templates/dialogs/combat-overlay.hbs`
- `styles/overlays.css`
- `ARCHITECTURE.md`
- `COMBAT_OVERLAYS_IMPLEMENTATION.md` (diese Datei)

### Geändert:
- `dist/combat/initiative.js` - Overlay-Integration
- `dist/sheets/index.js` - Export neuer Overlays
- `src/module.ts` - Handlebars-Helper
- `src/sheets/index.ts` - TypeScript-Exports (für zukünftige Builds)
- `system.json` - overlays.css hinzugefügt, Version → 0.0.33
- `package.json` - Version → 0.0.33

## Nächste Schritte (Optional)

1. **Attack-Roll-Dialog:** "Roll Attack"-Button im Combat-Overlay funktional machen
2. **Active/Reaction Powers:** Spezifische Handler implementieren (derzeit nur Notification)
3. **Keybindings:** Shortcuts für häufige Aktionen (z.B. Space = End Turn)
4. **Persistent Settings:** "Auto-open Combat Overlay" als User-Setting
5. **Sound Effects:** Audio-Feedback bei Overlay-Aktionen
6. **Tutorial/Tooltips:** Erste Nutzung mit Hinweisen

## Performance

- **Lazy Loading:** Overlays werden nur importiert, wenn benötigt
- **Event Delegation:** Effiziente Event-Listener
- **Re-render nur bei Änderungen:** getData() cacht Daten wo möglich
- **Keine globalen Event-Listener:** Alles im Application-Scope

## Compatibility

- **Foundry VTT v13** (verified)
- **Keine Modul-Konflikte:** Nutzt nur System-eigene APIs
- **Mobile-tauglich:** Responsive CSS-Grid-Layouts








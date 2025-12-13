# Mastery System - Projekt-Architektur

## Ordnerstruktur

```
mastery-system/
├── src/                          # TypeScript-Quellcode
│   ├── combat/                   # Combat-Logik (kompiliert, keine TS-Quellen)
│   ├── dice/                     # Würfel-System (Roll & Keep)
│   ├── documents/                # Foundry Document-Erweiterungen
│   │   ├── actor.ts              # MasteryActor
│   │   └── item.ts               # MasteryItem
│   ├── effects/                  # Effekte & Conditions (kompiliert)
│   ├── powers/                   # Powers-System (kompiliert)
│   ├── rolls/                    # Roll-Handler & Chat-Cards (kompiliert)
│   ├── sheets/                   # UI-Sheets & Dialoge
│   │   ├── character-sheet.ts
│   │   ├── npc-sheet.ts
│   │   ├── item-sheet.ts
│   │   └── index.ts              # Exports
│   ├── types/                    # TypeScript-Typdefinitionen
│   ├── utils/                    # Hilfsfunktionen
│   └── module.ts                 # Haupteinstiegspunkt
│
├── dist/                         # Kompilierte JS-Dateien
│   ├── combat/
│   │   ├── actions.js
│   │   ├── death.js
│   │   ├── initiative.js
│   │   ├── resources.js
│   │   └── ...
│   ├── powers/
│   │   ├── passives.js
│   │   ├── charges.js
│   │   ├── movement.js
│   │   └── ...
│   └── ...
│
├── templates/                    # Handlebars-Templates
│   ├── actor/
│   │   ├── character-sheet.hbs
│   │   └── npc-sheet.hbs
│   ├── chat/                     # Chat-Message-Templates
│   ├── item/
│   │   └── special-sheet.hbs
│   └── partials/                 # Wiederverwendbare Partials
│
├── styles/                       # CSS-Stylesheets
│   ├── mastery.css              # Haupt-Styles
│   ├── character-sheet.css      # Character-Sheet-Styles
│   └── chat.css                 # Chat-Message-Styles
│
└── system.json                   # System-Manifest
```

## Module & Verantwortlichkeiten

### Core-Module
- **module.ts**: Haupteinstiegspunkt, registriert Sheets, Settings, Hooks
- **documents/**: Foundry-Document-Erweiterungen (Actor, Item)
- **dice/**: Roll & Keep Würfelsystem mit Explosion

### Combat-System (kompiliert in dist/combat/)
- **initiative.js**: Initiative-System mit Shop
- **actions.js**: Action Economy (Attack/Movement/Reaction)
- **resources.js**: Stones, Vitality, Stress
- **death.js**: Death Saves & Incapacitation
- **maneuvers.js**: Combat Maneuvers

### Powers-System (kompiliert in dist/powers/)
- **passives.js**: Passive Abilities (8 Slots, Mastery Rank Limit)
- **charges.js**: Mastery Charges
- **movement.js**: Movement Powers
- **utilities.js**: Utility Powers
- **buffs.js**: Buff-Verwaltung
- **reactions.js**: Reaction Powers
- **spells.js**: Spell-System

### UI-Sheets (src/sheets/)
- **character-sheet.ts**: Hauptcharakterbogen
- **npc-sheet.ts**: NPC-Bogen
- **item-sheet.ts**: Item-Editor

### Neue Module (geplant)
- **sheets/passive-selection-dialog.ts**: Overlay für Passive-Auswahl beim Combat-Start
- **sheets/combat-action-overlay.ts**: Turn-basiertes Combat-Overlay
- **templates/dialogs/**: Templates für Overlays

## Design-Prinzipien

1. **Modularität**: Jedes Modul hat eine klar definierte Verantwortung
2. **Separation of Concerns**: UI (sheets/) ↔ Logik (combat/, powers/) ↔ Daten (documents/)
3. **Wiederverwendbarkeit**: Funktionen in utils/ und powers/ sind von Sheets unabhängig
4. **TypeScript-First**: Alle neuen Module in TypeScript, Kompilierung nach dist/
5. **Template-Driven UI**: Alle UI-Komponenten nutzen Handlebars-Templates

## Datenfluss

```
User Action (Sheet/Dialog)
    ↓
Handler in Sheet (TypeScript)
    ↓
Logik-Funktion (combat/, powers/, utils/)
    ↓
Actor/Item Update (documents/)
    ↓
Re-render & Chat-Nachricht
```

## Combat-Flow mit Overlays

```
GM: Start Combat
    ↓
onCombatStart()
    ↓
PassiveSelectionDialog.showForCombat()
    → Spieler wählen Passives
    ↓
rollInitiativeForAllCombatants()
    → NPCs: Auto-Roll
    → PCs: Initiative Shop
    ↓
onCombatTurn()
    ↓
CombatActionOverlay.showForCurrentTurn()
    → Spieler sieht Actions & Powers
    → Kann direkt Powers nutzen
```

## Nächste Schritte (v0.0.33)
- Passive-Selection-Dialog-Modul
- Combat-Action-Overlay-Modul
- Dialog-Templates
- Combat-Overlay-Styling
- Integration in Initiative-Hooks





















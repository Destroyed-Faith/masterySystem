# Divine Clash Board Automation

## Overview

Divine Clash ist ein automatisiertes Board-System für Foundry VTT, das das manuelle Token-Schieben auf einem Divine Clash Board unterstützt. Das System automatisiert Setup, Reveal, End Round und Reset, während Spieler ihre Stones manuell zwischen Zonen bewegen können.

## Setup

### 1. Scene erstellen

Erstelle eine Scene namens "Divine Clash" (oder konfiguriere eine andere Scene-ID in den Settings).

### 2. Regions benennen

Die Scene muss **Regions** (Rechteck-Zonen) mit folgenden Namen enthalten:

#### Player Seats (1..N):
- `DC_SEAT_1_READY` - Ready/Pool Zone für Spieler 1
- `DC_SEAT_1_ATTACK` - Attack Zone für Spieler 1
- `DC_SEAT_1_DEFENSE` - Defense Zone für Spieler 1
- `DC_SEAT_1_EXHAUSTED` - Exhausted Zone für Spieler 1
- `DC_SEAT_1_VITALITY` - Vitality Zone für Spieler 1

Wiederhole für jeden weiteren Spieler (Seat 2, 3, 4, etc.):
- `DC_SEAT_2_READY`, `DC_SEAT_2_ATTACK`, etc.
- `DC_SEAT_3_READY`, `DC_SEAT_3_ATTACK`, etc.
- ...

#### Enemy Seat (0):
- `DC_SEAT_0_READY` - Ready Zone für Enemy (optional)
- `DC_SEAT_0_ATTACK` - Attack Zone für Enemy (optional)
- `DC_SEAT_0_DEFENSE` - Defense Zone für Enemy (optional)
- `DC_SEAT_0_EXHAUSTED` - Exhausted Zone für Enemy (optional)
- `DC_SEAT_0_VITALITY` - Vitality Zone für Enemy (optional)

**Wichtig:** Die Regions müssen Rechtecke sein und die korrekten Namen haben. Die System-Funktionen finden Tokens in diesen Zonen automatisch.

### 3. Settings konfigurieren

In den System-Settings kannst du konfigurieren:
- **Divine Clash Scene ID**: Die Scene-ID für das Divine Clash Board (leer = "Divine Clash" per Name)
- **Power Stone Image**: Bildpfad für Power Stone Tokens
- **Vitality Stone Image**: Bildpfad für Vitality Stone Tokens
- **Cleanup Avatars on Reset**: Ob Avatar-Tokens beim Reset gelöscht werden sollen

## Verwendung

### Start

1. GM selektiert 2-6 Character Tokens (und optional 1 Enemy Token) auf einer normalen Scene
2. GM klickt "Divine Clash: Start" in den Scene Controls
3. System:
   - Findet die Divine Clash Scene
   - Pullt nur die Spieler (nicht GM) zur Divine Clash Scene
   - Spawnt für jeden Spieler:
     - 1 Avatar Token (Character)
     - Power Stones in READY Zone (Anzahl = sum(max - sustained) aller stonePools außer vitality)
     - Vitality Stones in VITALITY Zone (Anzahl aus Flag oder stonePools.vitality.max)
   - Optional: Spawnt Enemy Avatar/Stones wenn Enemy Token selektiert war

### Reveal

1. GM klickt "Divine Clash: Reveal"
2. System:
   - Setzt Phase auf "reveal"
   - Zählt Stones in ATTACK/DEFENSE für jeden Seat
   - Postet Chat-Message mit Zusammenfassung
   - Verschiebt alle ATTACK/DEFENSE Stones → EXHAUSTED (locked)

### End Round

1. GM klickt "Divine Clash: End Round"
2. System:
   - Setzt Phase zurück auf "planning"
   - Für jeden Seat: Regeneriert `max(1, Mastery Rank)` Stones aus EXHAUSTED → READY
   - Entsperrt regenerierte Stones
   - Postet Chat-Message mit Regeneration

### Reset

1. GM klickt "Divine Clash: Reset"
2. System:
   - Löscht alle Stone Tokens (Flag: `isStone === true`)
   - Optional: Löscht Avatar Tokens (wenn Setting aktiviert)
   - Cleart Scene Flags

## Token-Bewegung

### Automatische Einschränkungen

- **Spieler** können nur ihre eigenen Stones bewegen (basierend auf `seatUserId`)
- **GM** kann alle Stones bewegen
- **Locked Stones** (nach Reveal) können nicht bewegt werden
- **Reveal Phase**: Keine Bewegungen erlaubt (außer GM)
- **Enemy Stones** (Seat 0): Nur GM kann bewegen

### Zone-Tracking

Wenn ein Stone bewegt wird:
- System prüft automatisch, in welcher Zone der Stone liegt
- Update `state` Flag (ready/attack/defense/exhausted/vitality)
- Wenn Stone außerhalb aller gültigen Zonen liegt → snap zurück zu READY

## Technische Details

### Flags

**Scene Flags** (`scene.flags['mastery-system'].divineClash`):
```typescript
{
  phase: 'planning' | 'reveal',
  seats: {
    [seatIndex]: {
      seatIndex: number,
      actorId: string | null,
      userId: string | null,
      isEnemy: boolean
    }
  },
  started: boolean
}
```

**Token Flags** (`token.flags['mastery-system'].divineClash`):
```typescript
{
  isStone?: boolean,
  isAvatar?: boolean,
  stoneKind?: 'power' | 'vitality',
  seatIndex?: number,
  seatUserId?: string | null,
  state?: 'ready' | 'attack' | 'defense' | 'exhausted' | 'vitality' | 'burned'
}
```

### Stone Actors

Jeder Spieler bekommt 2 "Stone Actors":
- `DC Stone (Power) - <UserName>` - für Power Stones
- `DC Stone (Vitality) - <UserName>` - für Vitality Stones

Diese Actors haben Ownership nur für den jeweiligen Spieler, damit Tokens automatisch die richtigen Permissions haben.

## Fehlerbehebung

### "Divine Clash scene not found"
- Prüfe, ob eine Scene namens "Divine Clash" existiert
- Oder setze die Scene-ID in Settings

### "Seat X READY region not found"
- Prüfe, ob alle benötigten Regions existieren und korrekt benannt sind
- Regions müssen exakt `DC_SEAT_<n>_<ZONE>` heißen

### "No user found for actor"
- Prüfe, ob der Character einem User zugewiesen ist (user.character)
- Oder ob der Actor mindestens einen Owner hat

### Tokens werden nicht bewegt / können nicht bewegt werden
- Prüfe Token Flags (sollten `isStone: true` haben)
- Prüfe Phase (nicht "reveal" für Spieler)
- Prüfe Ownership (Spieler können nur eigene Stones bewegen)


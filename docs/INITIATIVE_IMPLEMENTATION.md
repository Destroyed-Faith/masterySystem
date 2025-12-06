# Initiative System Implementation Summary

## What Was Implemented

This document summarizes the custom Initiative system implementation for the Mastery System in Foundry VTT v13.

---

## Core Files Created/Modified

### New Files

1. **`src/utils/initiative.ts`** - Core initiative calculation logic
   - `calculateBaseInitiative()` - Agility + Wits + Combat Reflexes
   - `rollInitiativeDice()` - Mastery dice with explosions
   - `rollNpcInitiative()` - Automatic NPC initiative
   - `createInitiativeChatMessage()` - Detailed chat output
   - `applyShopPurchases()` - Update actor resources
   - `calculateShopCost()` - Calculate total cost
   - `validateShopPurchases()` - Validate against available points

2. **`src/sheets/initiative-shop-dialog.ts`** - Interactive shop UI
   - Dialog class extending Foundry's Dialog
   - Real-time cost calculation
   - Purchase validation
   - Buttons: Confirm / Skip Shop

3. **`src/combat/initiative.ts`** - Combat system integration
   - `initializeCombatHooks()` - Register all hooks
   - `overrideRollInitiative()` - Replace Foundry's default
   - `onCombatRound()` - Auto-reroll each round
   - `resetCombatantResources()` - Reset actions/movement
   - `rollPcInitiative()` - PC with shop
   - `rollNpcInitiative()` - NPC automatic

4. **`styles/initiative.css`** - UI styling
   - Initiative Shop dialog styling
   - Chat message styling (PC and NPC)
   - Combat tracker button styling

### Modified Files

1. **`src/utils/constants.ts`**
   - Added `INITIATIVE_SHOP` constants
   - Added `INITIATIVE` constants

2. **`src/module.ts`**
   - Imported `initializeCombatHooks`
   - Called initialization in `init` hook

3. **`template.json`**
   - Added `combat.initiativeBonus`
   - Added `combat.initiativeShop` object

4. **`system.json`**
   - Changed initiative formula to `@combat.initiative`
   - Added `styles/initiative.css`

5. **`src/utils/index.ts`**
   - Removed empty `powers.js` export
   - Added `initiative.js` export

---

## How It Works

### Initiative Flow

```
1. Combat Starts / New Round
   ↓
2. GM clicks "Roll Initiative"
   ↓
3. System separates PCs and NPCs
   ↓
4. NPCs roll automatically
   │  - Calculate base
   │  - Roll mastery dice (with explosions)
   │  - Post chat message
   │  - Set initiative value
   ↓
5. PCs roll with shop
   │  - Calculate base
   │  - Roll mastery dice (with explosions)
   │  - Show Initiative Shop Dialog
   │  - Player chooses purchases
   │  - Apply purchases to resources
   │  - Deduct cost from initiative
   │  - Post detailed chat message
   │  - Set final initiative value
   ↓
6. Combat proceeds in initiative order
   ↓
7. Round ends → Repeat from step 1
```

### Data Storage

#### Combatant Flags
Each combatant stores detailed initiative data:
```javascript
{
  "mastery-system": {
    "initiativeData": {
      "baseInitiative": 18,
      "masteryRoll": 13,
      "masteryRollDetails": { total: 13, rolls: [6, 7], formula: "2d8" },
      "rawInitiative": 31,
      "finalInitiative": 23,
      "shopSpent": 8,
      "shopPurchases": {
        "extraMovement": 4,
        "initiativeSwap": false,
        "extraAttack": false
      }
    }
  }
}
```

#### Actor System Data
```javascript
{
  "combat": {
    "initiative": 18, // Base initiative
    "initiativeBonus": 0, // For temporary modifiers
    "initiativeShop": {
      "movement": 4, // Extra meters purchased
      "swap": false, // Can swap this round
      "extraAttack": false // Has extra attack
    }
  }
}
```

---

## Initiative Shop Mechanics

### Costs and Effects

| Purchase | Cost | Effect | Max Per Round |
|----------|------|--------|---------------|
| Extra Movement | 4 points per 2m | Adds to `resources.movement` | Unlimited |
| Initiative Swap | 8 points | Unlocks swap ability (requires 2 raises) | 1x |
| Extra Attack | 20 points | Adds to `resources.actions` | 1x |

### Resource Updates

When a player buys from the shop:
1. **Extra Movement**: `system.resources.movement.max` +1, `.value` +1
2. **Extra Attack**: `system.resources.actions.max` +1, `.value` +1
3. **Initiative Swap**: Flag set in `system.combat.initiativeShop.swap`

At the start of each round:
- All resources reset to base values (1/1/1)
- Shop purchases cleared
- Initiative re-rolled

---

## Technical Details

### Dice Rolling with Explosions

```typescript
// Roll one d8 with explosions
let dieTotal = 0;
let exploding = true;

while (exploding) {
  const roll = Math.floor(Math.random() * 8) + 1;
  dieTotal += roll;
  
  if (roll === 8) {
    exploding = true; // Roll again!
  } else {
    exploding = false;
  }
}
```

### Hook Registration

The system hooks into these Foundry events:
- `preCreateCombat` - Set flags on new combat
- `combatStart` - Notify players
- `combatRound` - Auto-reroll initiative (round 2+)
- `renderCombatTracker` - Add custom buttons

### Combat.rollInitiative Override

The system overrides `Combat.prototype.rollInitiative` to:
1. Check if combat uses Mastery initiative
2. Separate PCs from NPCs
3. Roll NPCs automatically
4. Roll PCs with shop dialog
5. Store detailed data in flags

---

## UI Components

### Initiative Shop Dialog

**Features**:
- Shows raw initiative prominently
- Interactive controls (+ / - buttons)
- Real-time cost calculation
- Validation with error messages
- Two buttons: Confirm / Skip Shop

**Validation**:
- Cannot spend more than available
- Initiative cannot drop below 0
- Buttons disable when invalid

### Chat Messages

**NPC Messages** (Simple):
```
[Portrait] NPC Name - Initiative
Base: 12 + Roll: 8 + 5 = 25
```

**PC Messages** (Detailed):
```
[Portrait] PC Name rolls Initiative!

Base Initiative: 18 (Agility + Wits + Combat Reflexes)
Mastery Roll: 6 + 7 = 13 (2d8)
Raw Initiative: 31

Initiative Shop:
• +4m Movement (-8 ini)
• +1 Extra Attack (-20 ini)

Final Initiative: 3
```

---

## Compliance with Rules

### ✅ Implemented Features

1. **Base Initiative** = Agility + Wits + Combat Reflexes ✅
2. **Mastery Dice** = Roll [Mastery Rank]d8, keep all ✅
3. **8s Explode** = Roll again and add ✅
4. **Initiative Shop** - All three options ✅
5. **Re-roll Each Round** = Automatic at round start ✅
6. **PC vs NPC** = Different flows ✅
7. **Resource Updates** = Movement/Actions increase ✅
8. **Chat Messages** = Transparent display ✅

### 🔄 Pending Features

1. **Initiative Swap Action** - Flag set, but swap action not implemented
2. **Wits Stone Powers** - +1d8 per activation (needs Stone system)
3. **Heavy Weapon Penalty** - -10 to initiative (needs weapon tracking)
4. **Special Traits** - e.g., "Silver Lining" (roll twice, take higher)
5. **Visual Indicators** - Show shop purchases in combat tracker

---

## Future Enhancements

### Phase 2 - Refinements
1. Add tooltip in combat tracker showing shop purchases
2. Implement Initiative Swap mechanic (check for 2 raises)
3. Add heavy weapon penalty detection
4. Add special trait support (Silver Lining, Grim Hunter)

### Phase 3 - Stone Integration
1. Dialog option for Wits Stone activation
2. Show available Stones in shop
3. Calculate exponential Stone costs (1, 2, 4, 8...)
4. Track Stone expenditure per round

### Phase 4 - Advanced Features
1. Delay initiative (move down in order)
2. Ready action (trigger on condition)
3. Initiative history (show previous rounds)
4. Preset shop purchases (save favorites)

---

## Testing Checklist

- [ ] NPC rolls automatically with chat message
- [ ] PC sees Initiative Shop dialog
- [ ] Shop calculates costs correctly
- [ ] Shop validates purchases
- [ ] Confirm applies purchases and updates resources
- [ ] Skip Shop uses raw initiative
- [ ] Round 2+ auto-rerolls initiative
- [ ] Resources reset each round
- [ ] Chat messages display correctly
- [ ] Initiative order updates in tracker
- [ ] Multiple combatants work simultaneously
- [ ] Dialog styling looks good
- [ ] Console shows no errors

---

**Implementation Date**: 2025-12-06  
**System Version**: 0.0.7  
**Foundry Version**: v13  
**Author**: AI Assistant + Daniel Rodrigo Navarro Melendo


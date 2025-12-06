# Initiative System - Testing Guide

## Overview
The Initiative system for Mastery System has been implemented according to your rules document. This guide will help you test it in Foundry VTT v13.

## Features Implemented

### 1. Initiative Calculation
- **Base Initiative** = `Agility + Wits + Combat Reflexes (skill)`
- **Mastery Dice Roll**: Roll `[Mastery Rank]d8`, keep all dice
- **8s explode**: When rolling an 8, roll another d8 and add it
- **Final Initiative** = `Base + Mastery Roll - Shop Spending`

### 2. Initiative Shop (PC Only)
Players can spend initiative points to gain tactical advantages:

| Cost | Effect |
|------|--------|
| 4 points | +2m Movement |
| 8 points | Initiative Swap (exchange with another player) |
| 20 points | +1 Extra Attack Action |

### 3. Round Management
- Initiative is **rolled at the start of EACH ROUND**
- Resources (Movement, Actions, Reactions) reset each round
- Shop purchases reset each round

### 4. NPC vs PC Handling
- **NPCs**: Roll automatically, no shop access
- **PCs**: Roll with interactive Initiative Shop dialog

## Testing Steps

### Step 1: Create Test Characters

1. Create a **Player Character** with:
   - Agility: 8
   - Wits: 6
   - Combat Reflexes skill: 4
   - Mastery Rank: 2
   - Expected Base Initiative: 8 + 6 + 4 = **18**

2. Create an **NPC** with:
   - Agility: 4
   - Wits: 2
   - Combat Reflexes: 2
   - Mastery Rank: 1
   - Expected Base Initiative: 4 + 2 + 2 = **8**

### Step 2: Start Combat

1. Add both characters to the combat tracker
2. Click the **"Roll Initiative"** button in the combat tracker header

### Step 3: Verify NPC Initiative

The NPC should:
- Roll automatically (no dialog)
- Post a chat message showing:
  - Base Initiative
  - Mastery Roll (e.g., "5 + 3" for 2d8)
  - Final Initiative

**Expected Result**: NPC gets a simple initiative value (base + roll)

### Step 4: Test PC Initiative Shop

The PC should:
1. See the **Initiative Shop Dialog** appear automatically
2. The dialog shows:
   - Raw Initiative (base + mastery roll)
   - Shop options with costs
   - Real-time calculation of remaining initiative

**Test each shop option:**

#### A. Extra Movement
- Click the **+** button next to Movement
- Verify:
  - Cost increases by 4 per +2m
  - Final initiative decreases
  - Error if trying to spend more than available

#### B. Initiative Swap
- Check the **"Initiative Swap"** checkbox
- Verify:
  - Cost: 8 points
  - Final initiative decreases by 8
  - Option disabled if < 8 points available

#### C. Extra Attack
- Check the **"Extra Attack"** checkbox
- Verify:
  - Cost: 20 points
  - Final initiative decreases by 20
  - Option disabled if < 20 points available

#### D. Confirm Purchase
- Click **"Confirm"** button
- Verify:
  - Chat message shows detailed breakdown
  - Initiative shop purchases are listed
  - Final initiative is displayed
  - Character's resources update (check character sheet)

#### E. Skip Shop
- Click **"Skip Shop"** button
- Verify:
  - Initiative set to raw value (no spending)
  - Chat message shows roll without shop details

### Step 5: Test Round 2+

1. Advance to **Round 2** using the combat tracker
2. Verify:
   - Notification appears: "Re-rolling initiative..."
   - All combatants automatically re-roll initiative
   - PCs see the shop dialog again
   - Resources reset to base values

### Step 6: Verify Resource Updates

After purchasing from the shop:
1. Open the PC's character sheet
2. Check the **Resources** section:
   - Movement should increase if bought extra movement
   - Actions should increase if bought extra attack
3. Advance to next round
4. Verify resources reset to base values

## Expected Chat Messages

### NPC Initiative (Example)
```
[NPC Portrait] Crimson Priest - Initiative
Base: 8 + Roll: 3 + 5 = 16
```

### PC Initiative with Shop (Example)
```
[PC Portrait] Alaris rolls Initiative!

Base Initiative: 18 (Agility + Wits + Combat Reflexes)
Mastery Roll: 6 + 7 = 13 (2d8)
Raw Initiative: 31

Initiative Shop:
• +4m Movement (-8 ini)
• +1 Extra Attack (-20 ini)

Final Initiative: 3
```

## Known Behaviors

1. **Initiative can drop to 0** but not below
2. **Heavy weapons** should apply -10 penalty (not yet implemented in shop)
3. **Initiative Swap** requires 2 raises to use (tracked but action not yet implemented)
4. **Stones for initiative** (+1d8 per Wits Stone activation) - UI exists but Stone system integration pending

## Console Debugging

Open the browser console (F12) to see debug messages:
- `Mastery System | Initializing Combat Hooks`
- `Mastery System | Rolling initiative for combatants: [...]`
- `Mastery System | Round X started`

## Common Issues

### Issue: Shop dialog doesn't appear
**Solution**: Make sure the character:
- Is type "character" (not "npc")
- Has a player owner
- Is in an active combat

### Issue: Initiative not re-rolling each round
**Solution**: Check that:
- Combat has the `mastery-system.initiativeSystem` flag
- You're using Round 2+ (first round is manual)

### Issue: Resources not updating
**Solution**: Check character sheet resources section exists in template

## Next Steps

After testing, you may want to:
1. Implement Initiative Swap mechanic (requires 2 raises check)
2. Add Wits Stone Power integration for +1d8
3. Implement Heavy Weapon penalty (-10)
4. Add special traits (e.g., "Silver Lining" - roll twice, take higher)
5. Add visual indicators in combat tracker for shop purchases

---

**System Version**: 0.0.7
**Last Updated**: 2025-12-06


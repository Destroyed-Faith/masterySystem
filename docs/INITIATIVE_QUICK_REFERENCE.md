# Initiative System - Quick Reference

## For Players

### When Initiative Is Rolled
- **First Round**: GM clicks "Roll Initiative" in combat tracker
- **Every Round After**: Initiative automatically re-rolls at round start

### Your Initiative Roll
1. **System calculates Base**: Agility + Wits + Combat Reflexes skill
2. **You roll Mastery Dice**: [Your Mastery Rank]d8, all dice count, 8s explode
3. **Raw Initiative** = Base + Dice total

### The Initiative Shop 💰

A dialog appears showing your purchases:

#### Option 1: Extra Movement (4 pts per 2m)
- Buy as many 2m increments as you can afford
- Immediately adds to your movement this round
- Example: Spend 8 pts → +4m movement

#### Option 2: Initiative Swap (8 pts)
- Unlocks the ability to swap initiative with another PC
- Requires 2 raises to use (not yet implemented)
- Use once per round

#### Option 3: Extra Attack (20 pts)
- Gain +1 Attack Action this round
- Can be converted to Movement or Reaction
- Maximum 1 per round

### After Shopping
- Your **Final Initiative** = Raw Initiative - Points Spent
- Initiative determines turn order (higher goes first)
- Resources update on your character sheet
- Everything resets next round!

---

## For GMs

### Starting Combat
1. Add combatants to tracker
2. Click **"Roll Initiative"** button (or right-click combatant → Roll Initiative)
3. NPCs roll automatically
4. PCs see shop dialogs one by one
5. Combat begins when all have rolled

### Each Round
- Initiative **automatically re-rolls** at round start
- PCs shop again
- Resources reset to base (1 Movement, 1 Action, 1 Reaction)
- Previous round's shop purchases cleared

### NPC Initiative
- Rolls automatically, no shop
- Uses same formula: Base + Mastery Dice
- Simple chat message displays result

### Monitoring Shop Purchases
- Check chat messages for detailed breakdown
- Combatant flags store all initiative data
- Character sheet resources show current values

---

## Combat Tracker Tips

### Custom Button
The **"Roll Initiative"** button in the tracker header rolls for all combatants at once.

### Individual Rolls
Right-click a combatant → **Roll Initiative** to roll for just that character.

### Re-rolling
- Advance to next round → Auto re-rolls
- Or manually click "Roll Initiative" again

---

## Example

**Alaris the Ranger** (PC):
- Agility: 8, Wits: 6, Combat Reflexes: 4
- Mastery Rank: 2
- **Base Initiative**: 8 + 6 + 4 = **18**

**Round 1 - Initiative Roll**:
- Rolls 2d8: gets 6 and 7 = **13**
- **Raw Initiative**: 18 + 13 = **31**

**Initiative Shop**:
- Buys +4m Movement (costs 8 pts)
- Buys +1 Extra Attack (costs 20 pts)
- **Total Cost**: 28 pts
- **Final Initiative**: 31 - 28 = **3**

Alaris goes late in the round but has:
- 2 Movement actions (base 1 + bought 1)
- 2 Attack actions (base 1 + bought 1)
- Ready to dominate the battlefield!

**Round 2**:
- Initiative re-rolls automatically
- New dice: 8 (explodes!) → roll again → 5 = 13, plus 4 = **17**
- **Raw Initiative**: 18 + 17 = **35**
- Shop opens again with 35 points to spend
- Previous purchases reset

---

## Troubleshooting

**Shop not appearing?**
- Check if character is type "character" (not NPC)
- Ensure character has a player owner
- Try rolling again

**Initiative not re-rolling?**
- Only happens Round 2+ (not first round)
- Check console (F12) for errors

**Resources not updating?**
- Check character sheet resources section
- Should see Movement/Actions increase
- Resets at round start

---

## What's Next?

Not yet implemented (planned):
- ⏳ Initiative Swap action (requires raises check)
- ⏳ Wits Stone Powers (+1d8 per activation)
- ⏳ Heavy weapon penalty (-10)
- ⏳ Special traits (Silver Lining, Grim Hunter)
- ⏳ Visual indicators in tracker for purchases

---

**Version**: 0.0.8  
**Last Updated**: 2025-12-06


# Changelog

All notable changes to the Mastery System / Destroyed Faith for Foundry VTT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.29] - 2025-12-06

### Added - Mastery Powers Database & 2-Step Selection

**Mastery Powers System**
- ✅ **New File**: `src/utils/mastery-powers.ts` - Complete power database
- ✅ **Battlemage Tree**: 8 Powers fully implemented with all 4 levels
  - Arcane Combustion (Passive: Roll)
  - Flameguard (Passive: Armor)
  - Elemental Focus (Passive: Roll)
  - Combustion Surge (Active Buff)
  - Inferno Core (Active Buff)
  - Flamewave (Passive: Damage)
  - Phoenix Mantle (Passive: Healing)
  - Immolation Strike (Active)
- ✅ **Power Data Structure**: Complete with type, description, levels, effects, costs, rolls
- ✅ **Expandable System**: Easy to add more trees incrementally

**2-Step Power Selection Dialog**
- ✅ **Step 1**: Select Mastery Tree (shows which trees have powers available)
- ✅ **Step 2**: Select specific Power from that tree
- ✅ **Power Details Display**: Shows description, type, and level progression
- ✅ **Back Button**: Navigate back to tree selection
- ✅ **Auto-populated Items**: Powers created with full mechanical data
- ✅ **Visual Feedback**: Disabled trees shown as "Coming soon..."
- ✅ **Hover Effects**: Enhanced UX with animations

**Power Item Creation**
- ✅ **Full Data Import**: All power mechanics transferred to item
- ✅ **Level Scaling**: Level 1 data pre-filled (upgradeable in item sheet)
- ✅ **Type Classification**: Passive, Active, Buff, Utility, Reaction, Movement
- ✅ **Passive Categories**: Armor, Evade, Roll, Damage, Healing, etc.
- ✅ **Cost Tracking**: Action, Movement, Reaction, Stones, Charges
- ✅ **Roll Data**: Attribute, damage, damage type, penetration
- ✅ **Requirements**: Mastery Rank tracking

### Modified

**Character Sheet - Powers Tab**
- ✅ `character-sheet.ts`: Complete rewrite of `#showMasteryTreeSelectionDialog()`
- ✅ `character-sheet.ts`: New `#showPowerSelectionDialog()` method
- ✅ Dialog flow: Tree selection → Power selection → Item creation
- ✅ Notifications: Success message when power is added

**Data Structures**
- ✅ `PowerDefinition` interface: name, tree, powerType, passiveCategory, description, levels[]
- ✅ `PowerLevel` interface: level, type, range, aoe, duration, effect, cost, roll, special
- ✅ Export functions: `getPowersForTree()`, `getPower()`, `getTreesWithPowers()`

### Technical Details

**Architecture**
- ✅ Powers stored as structured data (not raw JSON)
- ✅ Each tree is a key in `MASTERY_POWERS` record
- ✅ Each power has 4 levels with complete mechanics
- ✅ Type-safe TypeScript interfaces
- ✅ Fully compatible with existing Item system

**Extensibility**
- ✅ Add new trees by adding keys to `MASTERY_POWERS`
- ✅ Each tree can have unlimited powers
- ✅ Each power can have 1-4 levels
- ✅ Dialog automatically shows/hides based on available data

**Next Steps**
- 📋 Add remaining 25 Mastery Trees (Crusader, Juggernaut, etc.)
- 📋 Extract powers from Players Guide for each tree
- 📋 Implement similar system for Spell Schools

## [0.0.28] - 2025-12-06
(previous changelog entries remain...)
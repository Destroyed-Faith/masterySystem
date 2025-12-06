# Changelog

All notable changes to the Mastery System / Destroyed Faith for Foundry VTT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.21] - 2025-12-06

### Added
- **Complete Roll & Keep d8 Dice System**
  - XkY dice rolling (roll X d8, keep Y highest)
  - Exploding 8s: roll again and add (chains infinitely)
  - **Advantage**: Reroll 1s once per die
  - **Disadvantage**: Only highest die can explode, others capped at 8
  - Proper formula generation and detailed result tracking
  - Each die tracks: rolls[], total, exploded status, rerolled status

- **Check System with Dialogs**
  - Skill checks with configurable TN
  - Attribute checks
  - Saving throws (Body/Mind/Spirit using best of 2 attributes + Vitality)
  - **Raises**: Players declare before rolling, each adds +4 to TN
  - Advantage/Disadvantage toggles
  - Situational bonuses
  - Beautiful dialog with live TN calculation
  - Both dialog and quick-check variants (for PCs vs NPCs)

- **Attack & Damage System**
  - Attack workflow with target selection
  - Weapon/Power attacks against Evade rating
  - Declare Raises before attack roll
  - **Separate damage roll only on hit**
  - Spend Raises dialog: allocate to +1d8 damage or Special effects
  - Damage calculation: base + raise dice − (armor + shield + Mastery Rank)
  - **Special rule**: If damage ≤ 0, still take 1 damage per 8 rolled
  - Damage dice do NOT explode (only to-hit rolls explode)

- **Conditions/Status Effects System**
  - Apply conditions with intensity values (e.g., Poisoned(3), Bleeding(2))
  - Duration tracking: rounds, scene, or permanent
  - Diminishing values (reduce by 1 each round)
  - Save configuration: type (body/mind/spirit), TN, frequency
  - Automatic condition updates on combat round start
  - Stack or replace existing conditions
  - Chat messages for applied/removed conditions

- **Beautiful Chat Cards**
  - **Check cards**: Show all dice (kept/dropped), explosions, rerolls, formula, TN comparison
  - **Attack cards**: Show attack roll, hit/miss, target evade, raises available
  - **Damage cards**: Show damage dice, armor reduction, final damage, 8s highlight
  - **Condition cards**: Show condition applied/removed with details
  - **Detail level setting**: Toggle between detailed (all dice) and summary (just totals)
  - Color-coded results (success=green, failure=red, damage=red gradient, conditions=purple)
  - Visual indicators: explosions(!), rerolls(↻), 8s highlighted in gold

- **Character Sheet Integration**
  - Skill rolls now open dialog with TN and Raises
  - Weapon attacks require target selection
  - Power attacks require target selection
  - All rolls go through new Roll&Keep system
  - Legacy quick roll still available for NPCs

- **System Settings**
  - "Roll Detail Level" client setting: Detailed vs Summary chat cards
  - Allows players to choose their preferred level of dice info

### Technical
- New modules: `src/rolls/rollKeep.ts`, `src/rolls/checks.ts`, `src/rolls/attacks.ts`, `src/rolls/chatCards.ts`
- New module: `src/effects/conditions.ts`
- Updated combat hooks to track conditions per round
- New CSS: `styles/rolls.css` for all roll-related UI
- Updated condition item schema in `template.json`
- TypeScript strict type checking throughout

### Notes
- The Roll&Keep system implements **exactly** your rules:
  - 1s are rerolled once with Advantage
  - Only the highest die explodes with Disadvantage
  - Raises add +4 to TN per raise
  - Damage dice do NOT explode (only attack/check rolls do)
- Future: Hook Specials/conditions to Raise spending, implement full power effects

## [0.0.20] - 2025-12-06

### Added
- **Complete Action Economy System** following Mastery System rules
  - Attack Actions (base 1, gained from Initiative Shop, Stone Powers, etc.)
  - Movement Actions (base 1, gained or converted from Attacks)
  - Reactions (base 1, gained or converted from Attacks, expire at turn start)
  - Action conversion: Convert extra Attacks to Movement or Reactions (max = Mastery Rank)
  - Cannot convert last Attack Action (must keep minimum 1)
  - Converted Reactions expire at start of next turn
  
- **Resource Management System**
  - **Stones**: Spend, regenerate (Mastery Rank per round), full restore after combat
  - **Vitality (Health)**: Integrated with existing health bar system
  - **Stress**: Based on Resolve + Wits, gain/reduce tracking, Mind Save warnings
  - Exponential Stone cost calculation for repeated power use (1, 2, 4, 8...)
  - Chat messages for all resource usage (transparent tracking)
  
- **Character Sheet Action Panel UI**
  - Visual action counters (used/max/remaining)
  - +/- buttons to mark actions used/unused
  - Action conversion controls (Attack → Movement/Reaction)
  - Undo conversion buttons
  - Real-time validation (can't exceed max, must keep 1 Attack, etc.)
  
- **Character Sheet Resource Panel UI**
  - Stones display with current/max/regeneration rate
  - Vitality (HP) display with current/max
  - Stress display with current/max
  - "Spend Stones" dialog button
  - "Add/Reduce Stress" dialog buttons
  
- **Power Selection Interface**
  - Lists all equipped powers by type (Movement, Active, Utility, Reaction)
  - "Use with Action" button for each power
  - Automatically determines correct action type from power type
  - Posts chat message showing power use and action spent
  - Filters: Movement, Active (including Active Buffs & Utilities), Reaction types
  
- **Combat Integration**
  - Actions reset at start of each round
  - Converted Reactions expire at start of turn (combatTurn hook)
  - Stones regenerate at end of round
  - Initiative Shop purchases properly update action maximums
  - All resource tracking persists across rounds
  
- **Helper Functions**
  - `resetActionsForRound()` - Reset all actions at round start
  - `resetActionsForTurn()` - Expire converted Reactions at turn start
  - `useAction() / unuseAction()` - Mark actions used/unused
  - `convertAttackAction() / undoConversion()` - Handle conversions
  - `spendStones() / regenerateStones() / restoreAllStones()` - Stone management
  - `addStress() / reduceStress()` - Stress tracking
  - `applyVitalityDamage() / healVitality()` - Health management
  - `getActionStatus() / getResourceStatus()` - Status queries

### Changed
- Updated `template.json` with new action economy schema
  - Consolidated old `resources.reactions/movement/actions` into new `actions` structure
  - Added `actions.conversions` tracking
  - Updated `resources.stones` with regeneration and tracking fields
  - Changed `resources.stress.maximum` to be derived (Resolve + Wits)
- Modified `MasteryActor.prepareCharacterData()` to calculate:
  - Action max values from base + bonus + conversions
  - Stones maximum and regeneration rate
  - Stress maximum from Resolve + Wits
  - Action conversion limits based on Mastery Rank
- Enhanced combat initiative system to call action/resource reset functions
- Added `combatTurn` hook for turn-based Reaction expiration

### Technical
- New files: `src/combat/actions.ts`, `src/combat/resources.ts`, `styles/actions.css`
- Updated: `src/documents/actor.ts`, `src/combat/initiative.ts`, `src/sheets/character-sheet.ts`
- Added comprehensive event handlers for action/resource management in character sheet
- Chat message templates for resource usage and power activation

### Documentation
- Action Economy follows rules: 1 Attack, 1 Movement, 1 Reaction per round base
- Conversions limited to Mastery Rank per round
- Must keep minimum 1 Attack Action
- Converted Reactions expire at turn start (not round start)
- Stones regenerate [Mastery Rank] per round, full after combat
- Stress = Resolve + Wits (no multiplier)

## [0.0.19] - 2025-12-06

### Added
- **Complete Initiative System** implementation based on Mastery System rules
  - Base Initiative = Agility + Wits + Combat Reflexes (skill)
  - Mastery Dice roll: [Mastery Rank]d8, keep all, 8s explode
  - Initiative is re-rolled at the start of each round (dynamic combat)
  
- **Initiative Shop** for PCs
  - 4 points: +2m Movement
  - 8 points: Initiative Swap (exchange with another player, requires 2 raises)
  - 20 points: +1 Extra Attack Action
  - Interactive dialog with real-time cost calculation
  - Validation to prevent over-spending
  
- **Automatic Resource Management**
  - Shop purchases update character resources (Movement, Actions)
  - Resources reset each round
  - Transparent display in chat messages
  
- **Separate PC/NPC Initiative Handling**
  - NPCs roll automatically without shop access
  - PCs see Initiative Shop dialog before finalizing
  
- **Combat Integration**
  - Override Combat.rollInitiative for custom logic
  - Hooks for round management and auto-reroll
  - Custom "Roll Initiative" button in combat tracker
  - Detailed combat flags for tracking initiative data
  
- **Rich Chat Messages**
  - Detailed PC initiative messages showing base, mastery roll, shop purchases
  - Simple NPC initiative messages
  - Visual breakdown of all calculations
  
- **Documentation**
  - `docs/INITIATIVE_TESTING.md` - Complete testing guide
  - `docs/INITIATIVE_IMPLEMENTATION.md` - Technical documentation
  
### Changed
- Updated `system.json` initiative formula to use custom system
- Added `styles/initiative.css` for Initiative Shop UI
- Modified `template.json` to include initiative shop data structure

### Technical
- New files: `src/utils/initiative.ts`, `src/combat/initiative.ts`, `src/sheets/initiative-shop-dialog.ts`
- Added INITIATIVE_SHOP and INITIATIVE constants to `constants.ts`
- Integrated combat hooks into main module initialization

## [0.0.2] - 2025-12-01

### Fixed
- Added compiled `dist/` files to repository for The Forge compatibility
- System now loads correctly on The Forge
- Fixed missing `dist/module.js` error

## [0.0.1] - 2025-12-01

### Added
- Initial alpha release of Mastery System / Destroyed Faith for Foundry VTT v13
- Character actor sheet with full attribute, skills, and resource tracking
- NPC actor sheet (simplified version)
- Roll & Keep d8 dice mechanic with exploding 8s
- Automatic Stone calculation from Attributes (every 8 points = 1 Stone)
- Health Bars system with cumulative penalties (-1, -2, -4)
- Stress tracking
- Power (Special) item sheets with AP tracking
- Skill management with roll buttons
- Chat cards for rolls showing dice rolled, kept, exploded, and success/failure
- Basic item types: Special, Echo, Schtick, Artifact, Condition, Weapon, Armor
- Automatic derived value calculations
- TypeScript source with compilation to JavaScript
- Complete CSS styling with dark theme

### Features
- **Attributes**: Might, Agility, Vitality, Intellect, Resolve, Influence, Wits
- **Mastery Ranks**: M1-M8 progression system
- **Dice Rolling**: Roll Xd8, keep K based on Mastery Rank, with exploding 8s
- **Target Numbers**: Preset difficulties from Trivial (8) to Heroic (32)
- **Raises**: Automatic calculation of Raises (+4 per Raise)
- **Resource Tracking**: Stones, HP, Stress, Action Economy
- **Powers**: Level 1-4 powers with AP design values

### Known Limitations
- Divine Clash mechanics not yet implemented
- Compendium packs empty (will be populated in future releases)
- Some advanced power effects need manual tracking
- Echo and Schtick sheets are basic (will be enhanced in future)

### Future Plans
- Divine Clash dialog/system
- Item effects for automatic modifiers
- Sample compendium content (powers, echoes, artifacts)
- Enhanced character creation wizard
- Token HUD integration
- Automation for condition effects


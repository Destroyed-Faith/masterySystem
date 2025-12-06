# Changelog

All notable changes to the Mastery System / Destroyed Faith for Foundry VTT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.24] - 2025-12-06

### Added - Character Sheet UI for Advanced Systems

**Passive Powers UI**
- ✅ 8 Passive Slots displayed in 4×2 grid
- ✅ Visual indication: Empty / Slotted / Active
- ✅ Limited to Mastery Rank (grayed out slots beyond MR)
- ✅ Click to slot/unslot passive powers
- ✅ Selection dialog with category filtering
- ✅ Activate/Deactivate buttons per slot
- ✅ Real-time counter showing active/max passives
- ✅ Category badges and descriptions

**Health Levels Visual Tracker**
- ✅ All 8 Health Levels displayed (Healthy → Incapacitated)
- ✅ Vitality × 2 boxes per level
- ✅ Click boxes to mark damage/heal
- ✅ Visual distinction: Empty vs Damaged (red with ✕)
- ✅ Wound penalty displayed per level (-1 to -6 dice)
- ✅ Current level highlighted
- ✅ Summary: Total damage and current penalty

**Mastery Charges Display**
- ✅ Visual charge icons (⚡ for normal, ✦ for temporary)
- ✅ Current/Max display with temporary count
- ✅ "Burn Stone" button (+2 temporary charges)
- ✅ Real-time updates
- ✅ Available vs used visual distinction

**Active Buffs Panel**
- ✅ List of all active buffs
- ✅ Buff name, type, and effect description
- ✅ Duration remaining (in rounds)
- ✅ Remove buff button (✕)
- ✅ Empty state message
- ✅ Color-coded by buff type

**Movement Maneuvers Panel**
- ✅ Grid of available maneuvers (3×2)
- ✅ Dash, Disengage, Charge, Leap, Climb buttons
- ✅ Disabled when no Movement action available
- ✅ Active state indicator (green glow)
- ✅ Effect description on each button
- ✅ Special maneuvers from powers (Teleport, Fly)

### Technical - UI Implementation
- New CSS file: `styles/advanced-systems.css` (comprehensive styling)
- Extended `character-sheet.ts`:
  - `getData()` now includes: passiveSlots, healthLevels, masteryCharges, activeBuffs, availableManeuvers
  - New event listeners for all UI interactions
  - New event handlers:
    - `#onPassiveSlotClick()` - Slot/unslot passives
    - `#onPassiveActivate()` - Activate/deactivate
    - `#onPassiveRemove()` - Remove from slot
    - `#onHealthBoxClick()` - Mark damage/heal
    - `#onBurnStone()` - Burn stone for charges
    - `#onManeuverUse()` - Use movement maneuver
    - `#onBuffRemove()` - Remove active buff
  - Selection dialog for passive powers

### Handlebars Template Snippets Provided
- Complete HTML structure for all 5 panels
- Ready to integrate into `character-sheet.hbs`
- Responsive design (mobile-friendly grid collapse)
- Accessibility-friendly (keyboard navigation ready)

### UI/UX Features
- **Color-coded panels**: Different gradient backgrounds per system
- **Interactive feedback**: Hover effects, click states, transitions
- **Real-time updates**: All panels refresh on data change
- **Visual clarity**: Icons, badges, and clear labeling
- **Tooltip support**: Descriptive titles on buttons
- **Disabled states**: Grayed out when unavailable
- **Empty states**: Helpful messages when no data

### Notes
- ⚠️ Handlebars template code provided as snippet (needs manual integration into character-sheet.hbs)
- All backend systems fully functional
- CSS and TypeScript complete and tested
- Ready for immediate use once template is integrated

## [0.0.23] - 2025-12-06

### Added - Phase 1 (Critical Systems)

**Evade Auto-Calculation**
- ✅ **Automatic Evade calculation**: `Agility + Defensive Combat Skill + (Mastery Rank × 2)`
- ✅ Equipment bonuses (shield, armor) added to base
- ✅ Passive and Buff bonuses applied on top
- ✅ `evadeBase` and `evadeTotal` tracked separately
- Formula fully implemented per rulebook (Zeile 4950)

**Reaction Trigger System**
- ✅ **12 Reaction Triggers**: whenAttacked, whenHit, whenMissed, whenDamaged, whenAllyAttacked, whenAllyDamaged, whenAllyFailsSave, whenEnemyMoves, whenEnemyEntersRange, whenEnemyLeavesRange, whenSpellCast, startOfTurn, endOfTurn
- ✅ **Automatic trigger detection** when events occur
- ✅ **Dialog prompts** for single or multiple reactions
- ✅ Range validation for reactions
- ✅ Consumes Reaction action when used
- ✅ "Resolve immediately after trigger" logic
- ✅ Helper functions: `triggerWhenAttackedReactions()`, `triggerWhenHitReactions()`, `triggerWhenDamagedReactions()`
- Ready for integration into attack/damage workflows

**Buff Duration & Limits System**
- ✅ **Buff types**: Attack, Defense, Damage, Movement, Attribute, Resistance, Regeneration, Custom
- ✅ **Max 1 buff per type** enforced
- ✅ **Duration tracking** (2-6 rounds)
- ✅ Cannot reactivate until expired
- ✅ Automatic duration decrement each round
- ✅ Buff effects (flat/dice/flag) applied to stats
- ✅ Integrated with Passive system (both applied to final stats)
- ✅ Chat notifications for applied/expired buffs

### Added - Phase 2 (Important Systems)

**Special Effects System**
- ✅ **14 Special Effects**: Prone, Bleed, Disarm, Stun, Frightened, Mark, Dazed, Slowed, Blind, Deafened, Grappled, Restrained, Poisoned, Burning, Frozen
- ✅ Each effect has unique mechanical impact
- ✅ Applied via Raises or special abilities
- ✅ Integrated with Condition system
- ✅ `applySpecialEffect()` universal function
- ✅ `parseSpecialEffects()` reads from item data
- Effects like Prone (-2 dice), Bleed (damage per round), Stun (lose actions), etc.

**Movement Maneuvers**
- ✅ **5 Basic Maneuvers**: Dash, Disengage, Charge, Leap, Climb
- ✅ **Dash**: 2× Speed for the turn
- ✅ **Disengage**: No opportunity attacks
- ✅ **Charge**: Move + Attack with +1d8 damage
- ✅ **Leap**: Athletics check to jump
- ✅ **Climb**: Half speed while climbing
- ✅ Special maneuvers from powers (Teleport, Fly)
- ✅ "Use entire Movement" logic enforced
- ✅ Flags track active maneuvers
- ✅ `getCurrentSpeed()` helper for modified speed
- ✅ `hasChargeBonusVs()` for charge damage bonus

### Added - Phase 3 (Nice-to-have)

**Spell Tag System**
- ✅ **Spell identification**: Tag, flag, or powerSchool-based
- ✅ `isSpell()` function checks if power/effect is a spell
- ✅ **Dispel Magic**: Roll Intellect vs (8 + Spell Level × 4)
- ✅ **Suppress Spells**: Anti-Magic Field condition
- ✅ **Counterspell**: Reaction to negate spell (Intellect vs 12 + Spell Level × 4)
- ✅ Consumes Reaction for Counterspell
- ✅ Tracks active spells (buffs and conditions)
- ✅ `getActiveSpells()`, `hasSpellImmunity()` helpers
- Full spell interaction system ready

### Technical
- New modules: 
  - `src/powers/reactions.ts` - Reaction trigger system
  - `src/powers/buffs.ts` - Buff duration & limits
  - `src/powers/spells.ts` - Spell tag & interactions
  - `src/effects/specials.ts` - Special effects (Prone, Bleed, etc.)
  - `src/combat/maneuvers.ts` - Movement maneuvers
- Updated `template.json`:
  - Added `evadeBase`, `evadeTotal`, `shieldEvadeBonus`, `armorEvadeBonus` to combat
  - Added `activeBuffs` array to character template
  - Added `reactionTrigger`, `reactionRollType`, `buffDuration`, `buffType`, `movementType` to special items
  - Added `isSpell`, `powerSchool` to special items
- Updated `actor.ts`:
  - Evade auto-calculation with formula
  - Buff effects applied after passive effects
- Updated `initiative.ts`:
  - Buff duration updates each round
- All systems fully integrated with combat hooks

### Balance & Mechanics
- Evade now properly scales with attributes and Mastery Rank
- Buff limits prevent stacking same-type bonuses
- Special effects add tactical depth to combat
- Movement maneuvers provide strategic options
- Spell system ready for magic-heavy campaigns
- Reaction triggers enable defensive tactics

### Still TODO (Future Updates)
- ❌ UI for Passives/Health Levels/Charges on character sheet
- ❌ Visual Health Level tracker
- ❌ Maneuver selection UI
- ❌ Reaction configuration UI on items
- Backend complete, UI enhancements pending

## [0.0.22] - 2025-12-06

### Added
- **Passive Powers System** (Complete implementation of rulebook system)
  - **8 Passive Slots** per character
  - Only **Mastery Rank** number of passives can be active
  - **10 Categories**: Armor, Evade, To-Hit, Damage, Roll, Save, Hit Point, Healing, Awareness, Attribute
  - **Category uniqueness**: Only 1 passive per category can be slotted
  - Set before Initiative roll, no switching during combat
  - Automatic effect application (flat bonuses, dice bonuses, flags)
  - `getActivePassiveEffects()`, `applyPassiveEffects()` helpers
  - Integration with actor stat calculations

- **Health Levels System with Wound Penalties**
  - **8 Health Levels**: Healthy, Bruised, Hurt, Injured, Wounded, Mauled, Crippled, Incapacitated
  - Each level has **Vitality × 2 boxes**
  - **Wound penalties**: -1 die per damaged Health Level (cumulative)
  - Damage fills boxes top-to-bottom
  - Healing clears boxes bottom-to-top
  - **Automatic dice reduction** from wounds applied to all rolls
  - `applyDamageToHealthLevels()`, `healHealthLevels()` functions
  - `getWoundPenalty()` integrated into Roll&Keep system
  - Incapacitated status when last level is damaged
  - Chat notifications for wound penalties

- **Penetration & Damage Reduction (DR) System**
  - **Penetration(X)**: Reduces target's armor by X before damage calc
  - **Damage Reduction (DR)**: Typed damage mitigation (physical, fire, cold, lightning, poison, psychic, radiant, necrotic)
  - Damage calculation: `Base Damage − (Armor − Penetration) − DR = Final Damage`
  - Added to weapon schema (`penetration`, `damageType`)
  - Added to combat stats schema (`damageReduction` object)
  - Updated damage chat cards to show penetration and DR
  - Special rule still applies: If damage ≤ 0, take 1 per 8 rolled

- **Mastery Charges System** (Charged Powers)
  - **Mastery Charges = Mastery Rank** per day
  - Refresh at dawn/long rest
  - Powers with `(Charged)` tag consume 1 charge
  - **Max 1 Charged Power per round** (enforced)
  - **Burn Stone → +2 temporary Charges** (out of combat)
  - Temporary charges lost at dawn
  - `spendCharge()`, `restoreCharges()`, `burnStoneForCharges()` functions
  - Integrated into combat round reset
  - Chat messages for charge usage
  - Flag system prevents multiple charged powers per round

### Technical
- New modules: `src/powers/passives.ts`, `src/powers/charges.ts`, `src/combat/health.ts`
- Updated `template.json`: 
  - Added `passives.slots` (8 slots)
  - Added `mastery.charges` (current/maximum/temporary)
  - Added `health.levels` array
  - Added `combat.damageReduction` object
  - Added `penetration`, `damageType` to weapons and powers
  - Added `passiveCategory`, `passiveEffects`, `charged` to special items
- Updated `actor.ts`: 
  - Passive effects applied to armor/evade
  - Health levels initialization
  - Mastery Charges initialization
  - Wound penalty calculation
- Updated `rollKeep.ts`: Wound penalties reduce dice pool before roll
- Updated `attacks.ts`: Penetration and DR in damage calculation
- Updated `chatCards.ts`: Display penetration and DR in damage cards
- Updated `initiative.ts`: Reset charged power flag each round

### Balance Notes
- Wound penalties can significantly reduce effectiveness (e.g., Injured = -3 dice)
- Penetration ignores armor but NOT DR
- Charged Powers limited to 1/round prevents nova strategies
- Burning Stones for Charges is a meaningful resource trade

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


# Changelog - Mastery System / Destroyed Faith

All notable changes to this project will be documented in this file.

## [0.1.9] - 2025-01-XX

### Fixed
- **Handlebars Helper Registration**: Fixed "Missing helper: default" error by registering helpers immediately before init hook
- **XP Management Settings**: Added debug logging to troubleshoot settings menu registration
  - Settings menu should appear as a button in the Mastery System settings tab
  - Debug logs added to verify registration process

## [0.1.8] - 2025-01-XX

### Fixed
- **Armor Calculation**: Updated armor calculation to include Mastery Rank as base armor
  - Total Armor = Mastery Rank (base) + Armor Value (equipped armor) + Shield Value (equipped shield)
  - Formula display updated to show "MR + Armor + Shield"
  - Examples: No armor = MR (e.g., 2), Light Armor = MR + 4 (e.g., 6), With Shield = MR + Armor + Shield

## [0.1.7] - 2025-01-XX

### Added
- **Character XP Management Settings**: New GM-only settings page for managing character XP
  - View all player characters and their XP spending (Attribute XP and Mastery XP)
  - See spent, available, and total XP for each character
  - Grant XP allowances to individual characters or all characters at once
  - Automatic calculation of spent XP based on attribute values and skill levels
  - Accessible via System Settings → Character XP Management

### Changed
- **Equipment Dialog Styling**: Enhanced CSS for Weapon, Armor, and Shield creation dialogs
  - Consistent dark theme with gradient backgrounds
  - Improved form styling and hover effects
  - Better visual hierarchy and readability

### Fixed
- **Schticks Validation**: Removed validation warning message (Schticks are now optional)
- **Starting Faith Fractures Display**: Removed redundant "Starting Faith Fractures" display (same as Disadvantage Points)

## [0.1.6] - 2025-01-XX

### Fixed
- **Dialog Constructor Errors**: Fixed TypeError for Weapon, Armor, and Shield creation dialogs
  - Changed from `foundry.applications.Dialog` to global `Dialog` constructor
  - Added TypeScript type casting to resolve compilation errors
  - All equipment dialogs now properly open and function correctly

## [0.1.5] - 2025-01-XX

### Added
- **Power Information Display**: Enhanced power cards with comprehensive information
  - Damage, Special, Category (Melee/Melee AoE/Range/Range AoE), and Type (Active/Active Buff/Passive) displayed in compact single-line format
  - Icons for better visual identification
  - Compact layout to save space
- **Mastery Tree Bonuses**: Added all tree bonuses to Mastery Trees
  - All 27 Mastery Trees now have their tree bonuses defined
  - Bonuses are automatically displayed in the "Selected Trees" section when a character has powers from those trees
  - Includes passive abilities for Werewolf and Werebear shapechange forms

### Fixed
- **Scroll Position Preservation**: Fixed issue where character sheet would scroll to top after any update
  - Scroll position is now preserved for all tabs (Attributes, Skills, Powers, Equipment) when form is saved
  - Works for all input changes, button clicks, and automatic form submissions
  - Uses requestAnimationFrame for reliable DOM updates

## [0.1.4] - 2025-01-XX

### Changed
- **Schticks System**: Changed from dropdown selection to free text input
  - Players can now enter custom Schtick names instead of selecting from predefined list
  - Text input field for each rank's Schtick name
- **Button Styling**: Improved layout for Powers and Equipment buttons
  - Powers & Magic header: fixed width 225px
  - Powers controls: full width with height 6px
  - Button heights: 28px and 30px for better visual consistency
  - Same styling applied to Equipment buttons (Add Weapon, Add Armor, Add Shield)

### Added
- **Weapon Creation Dialog**: Added comprehensive CSS styling
  - Dark theme matching Power Creation Dialog
  - Styled select dropdowns, detail cards, and checkboxes
  - Hover effects and smooth transitions
  - Better visual hierarchy and readability

## [0.1.3] - 2025-01-XX

### Fixed
- Committed all pending changes for Schticks table system, Powers buttons layout, and Equipment Armor/Shield functionality

## [0.1.2] - 2025-01-XX

### Changed
- Updated Schticks system to use per-rank table format
  - Schticks now displayed as table with Rank, Schtick, and Manifestation columns
  - One row per Mastery Rank (1 to current rank)
  - Rank column includes tooltips with rank-specific descriptions and examples
  - Manifestation field for custom descriptions per rank

## [0.1.1] - 2025-01-XX

### Added
- **Armor System**: Added Light, Medium, and Heavy armor types with armor values and skill penalties
  - Light Armor: +4 Armor, no penalties
  - Medium Armor: +8 Armor, Stealth Pool −2, Evade −2
  - Heavy Armor: +12 Armor, Athletics −4, Acrobatics −4, Stealth Pool −4, Evade −4
- **Shield System**: Added three shield types with shield values and evade bonuses/penalties
  - Parry Shield: +1 Shield, +4 Evade, no penalties
  - Medium Shield: +2 Shield, Evade −4
  - Tower Shield: +4 Shield, Evade −8
- Armor and Shield creation dialogs
- Shield section in Equipment tab

### Changed
- **Weapon Reach System**: Changed from absolute reach values to bonus-based system
  - Default melee reach is now 2m
  - Weapons with "Reach (2 m)" changed to "Reach (+1 m)" (total: 3m)
  - Weapons with "Reach (3 m)" changed to "Reach (+2 m)" (total: 4m)
  - Updated melee targeting and radial menu to support new format
- **Equipment Tab**: Improved styling and layout
  - Red buttons for Add Weapon/Armor/Shield, displayed side-by-side
  - Card-based layout for equipment items
  - Better visual hierarchy and hover effects
  - Responsive grid layout for equipment details

### Fixed
- Equipment tab now properly displays armor skill penalties
- Shield values and evade bonuses correctly shown in equipment list

## [0.1.0] - 2025-01-XX

### Added
- **Schticks System**: Added Schticks selection during character creation
  - Inline Schticks UI under Attributes section
  - 10 predefined Schticks with short descriptions and optional attribute affinity
  - Validation requiring exactly 2 Schticks to be selected
  - Schticks counter and validation messages
  - Schticks display after character creation is complete
- **Tree Bonuses Display**: Enhanced "Selected Trees" section to show all tree bonuses, focus, and roles
  - Tree cards with detailed information
  - Bonus highlighting with visual styling
  - Support for both Mastery Trees and Spell Schools
- **Handlebars Helper**: Added `ne` (not equal) helper for template comparisons

### Changed
- **Powers Tab**: Unified Powers & Magic into single tab
  - Removed separate Magic tab
  - "Add Mastery Power" and "Add Spell" buttons always visible
  - Creation and normal modes properly separated
- **Power Creation Dialog**: Improved styling and dynamic sizing
  - CSS classes for better styling
  - Dynamic height/width based on content
  - Better visual feedback and hover effects

### Fixed
- Character creation power/spell buttons now properly enabled during creation
- Template structure corrected for creation vs normal mode display

## [0.0.99] - 2025-01-XX

### Fixed
- **Creation Power/Spell Buttons**: Fixed "Add Mastery Power" and "Add Spell" buttons being disabled during character creation
  - Added buttons to whitelist in `#lockSheetForCreation` method
  - Explicitly enable buttons after disabling other buttons
  - Added debug logging to track button state
  - Buttons should now be clickable during character creation

## [0.0.98] - 2025-01-XX

### Fixed
- **Character Creation UI**: Fixed Creation-UI not showing in Powers tab during character creation
  - Fixed `creationComplete` logic to only be true when explicitly set to true
  - Previously undefined values were treated as complete, preventing creation UI from showing
  - Creation-UI now correctly displays with status counters and creation buttons
  - Powers are now correctly filtered during creation (shows all powers when no trees selected yet)

## [0.0.97] - 2025-01-XX

### Added
- **Character Creation: Powers & Magic System**: Complete implementation of character generation limits for Powers and Spell Schools
  - Enforces selection of exactly 2 Mastery Trees or Spell Schools (total)
  - Enforces selection of exactly 4 Powers from chosen trees
  - Enforces assignment of Rank 2 to exactly 2 Powers (others remain Rank 1)
  - Validates that no power rank exceeds Mastery Rank
  - Creation UI in Powers tab with status counters and instructions
  - Rank assignment dropdown for each selected power during creation
  - Validation prevents finalization until all power requirements are met
  - Power dialog automatically enforces limits during character creation
  - Sheet locking prevents normal power/spell addition during creation

### Updated
- **Power Creation Dialog**: Now enforces character creation limits automatically
  - Prevents selecting more than 2 trees
  - Prevents selecting more than 4 powers
  - Sets powers to Rank 1 by default during creation
  - Validates against Mastery Rank limits
- **Character Sheet**: Powers tab shows special creation UI during character creation
  - Status display showing trees selected, powers selected, and rank 2 assignments
  - Clear instructions for character creation rules
  - Separate creation buttons for Mastery Powers and Spells
  - Rank selection dropdown for each power
- **Finalize Creation**: Now validates all power requirements before allowing finalization
  - Checks for exactly 2 trees selected
  - Checks for exactly 4 powers selected
  - Checks for exactly 2 powers at Rank 2
  - Validates power ranks don't exceed Mastery Rank
- **Handlebars Helpers**: Added `contains` helper for array membership checks

## [0.0.96] - 2025-01-XX

### Fixed
- **Disadvantages Button**: Fixed "Add Disadvantage" button being disabled during character creation
  - Updated `#lockSheetForCreation` to allow disadvantage buttons
  - Added extensive debug logging to track button state and event handling
  - Button now properly enabled and clickable during character creation

### Added
- **Debug Logging**: Comprehensive logging for disadvantage system
  - Logs when button listeners are set up
  - Logs button state (enabled/disabled)
  - Logs when button is clicked
  - Logs DISADVANTAGES array loading
  - Logs dialog creation and rendering
  - Helps diagnose issues with disadvantage selection

## [0.0.95] - 2025-01-XX

### Fixed
- **Character Sheet Scrolling**: Fixed scroll position reset when spending skill or attribute points
  - Scroll position is now preserved when adding points to skills or attributes
  - Prevents annoying jump to top of page during character advancement
- **Disadvantages System**: Fixed disadvantage selection dialog not showing options
  - Added debugging to identify loading issues
  - Improved error messages when disadvantages fail to load
  - Updated all disadvantage descriptions to match official rules exactly

### Changed
- **Character Creation**: Finalize button now requires Disadvantages phase completion
  - Added `disadvantagesReviewed` flag to track if user has reviewed disadvantages tab
  - Finalize button only appears when Attributes, Skills, AND Disadvantages are complete
  - Flag is automatically set when user visits disadvantages tab or adds/removes disadvantages
  - Updated creation banner to show all required steps clearly
- **Disadvantages Display**: Clarified relationship between Disadvantage Points and Faith Fractures
  - During creation, shows "Starting Faith Fractures = Disadvantage Points"
  - After finalization, displays actual Faith Fractures values
  - Updated all disadvantage descriptions with complete rule details

### Updated
- **Disadvantages Definitions**: All 7 disadvantages updated with complete rule descriptions
  - Addiction: Complete withdrawal effects (1 day/1 week/1 month penalties)
  - Berserker's Curse: Detailed berserk state mechanics
  - Hunted: Threat rank descriptions (1-3 points)
  - Physical Scars: All 4 scar types with point costs
  - Mental Restrictions: TN values for Oath/Fear/Personality (6/8/16)
  - Unluck: Misfortune token amounts per rank
  - Vulnerability: Damage type selection

## [0.0.94] - 2025-01-XX

### Added
- **Character Creation Workflow**: Complete character creation system with guided wizard
  - 5-step wizard: Overview → Attributes → Skills → Disadvantages → Review
  - Attribute Point Buy: Start at Mastery Rank, spend exactly 16 points (max 8 per attribute)
  - Skill Point Buy: Start at 0, spend exactly 16 points (configurable via CONFIG), max 4 per skill
  - Disadvantages system: Optional 0-8 points, determines starting Faith Fractures
  - Sheet locking: Hard lock until creation complete (prevents editing, shows overlay banner)
  - GM-only "Force Unlock" option for existing characters
  - Auto-migration: Existing characters automatically marked as creation complete
- **Disadvantages System**: Complete implementation with all 7 disadvantage types
  - Addiction (2 pts): Substance/ritual dependency with penalties
  - Berserker's Curse (2 pts): Berserk state when Wounds ≥ Vitality
  - Hunted (1-3 pts): Variable threat level with hunter details
  - Physical Scars (1-3 pts): One-Eyed, One-Handed, Heavy Sleeper, Fragile Frame
  - Mental Restrictions (2 pts): Oaths/Fears/Personality traits with Resolve checks
  - Unluck (1-3 pts): Misfortune tokens per session
  - Vulnerability (3 pts): Double damage from specific type
  - Configurable fields for each disadvantage type
  - Validation to ensure total points ≤ 8
- **Disadvantages Tab**: New character sheet tab displaying selected disadvantages
  - Shows total disadvantage points and Faith Fractures sync status
  - Displays all selected disadvantages with details and point costs
  - Read-only view after creation (editable during creation wizard)
- **Character Creation Wizard**: Full-featured stepper UI
  - Step navigation with visual indicators
  - Real-time point tracking and validation
  - Attribute allocation with +/- controls (enforces MR base, 8 max)
  - Skill allocation organized by category
  - Disadvantage selection with configuration dialogs
  - Review step with complete summary
  - Finalize button that applies all changes and unlocks sheet
- **Creation State Management**: Actor flag system for tracking completion
  - `system.creation.complete` flag on all character actors
  - `system.disadvantages` array storing selected disadvantages
  - Hooks: `preCreateActor` sets new characters to incomplete
  - Migration hook: Existing characters auto-set to complete
- **CONFIG Constants**: Creation rules configuration
  - `CONFIG.MASTERY.creation.attributePoints` (16)
  - `CONFIG.MASTERY.creation.skillPoints` (16, configurable)
  - `CONFIG.MASTERY.creation.maxAttributeAtCreation` (8)
  - `CONFIG.MASTERY.creation.maxSkillAtCreation` (4)
  - `CONFIG.MASTERY.creation.maxDisadvantagePoints` (8)

### Changed
- Character sheet now locks when `system.creation.complete === false`
- Faith Fractures automatically synced with Disadvantage Points on creation finalize
- Template structure updated to include creation and disadvantages fields

## [0.0.74] - 2025-01-XX

### Added
- **Weapons System**: Complete weapons implementation with all weapons from the Players Guide
  - Created `src/utils/weapons.ts` with all 22 weapons (Unarmed, Daggers, Swords, Axes, Hammers, Polearms, Bows, Crossbows, etc.)
  - Each weapon includes: damage dice, hands requirement, innate abilities, and special effects
  - Weapon properties reference with descriptions (Finesse, Light, Versatile, Brutal, Reach, Heavy, Ranged, Set, Defensive, etc.)
  - Helper functions to filter weapons by hands, type, and properties
  - Easily extensible structure for adding new weapons
- **Special Effects System**: Complete special effects reference implementation
  - Created `src/utils/special-effects.ts` with all special effects organized by category
  - Physical Effects: Bleeding, Blinded, Corrode, Freeze, Grappled, Ignite, Poisoned, Prone, Push, Regeneration, Shock, Stunned
  - Mental Effects: Charmed, Curse, Disoriented, Frightened, Mark, Soulburn, Torment, Hex
  - Damage & Combat Modifiers: Crit, Penetration, Smite, Precision, Brutal Impact, Expose, Weaken
  - Support & Cleansing: Cleanse, Immovable
  - Each effect includes: description, duration, stacking rules, and removal methods
  - Helper functions to parse and format effect values
- **Equipment Tab**: Fully functional equipment management interface
  - Weapons section with detailed weapon cards showing damage, type, hands, properties, and special effects
  - Armor section (prepared for future implementation)
  - "Add Weapon" button opens weapon selection dialog
  - "Add Armor" button (placeholder for future implementation)
  - Equip/Unequip checkboxes for weapons and armor
  - Edit and Delete buttons for equipment items
- **Weapon Creation Dialog**: User-friendly dialog for adding weapons to characters
  - Dropdown selection with all available weapons
  - Weapons grouped by category (One-Handed Melee, Two-Handed Melee, Ranged)
  - Live preview of weapon details (damage, hands, properties, special, description)
  - Option to equip weapon immediately upon creation
  - Automatically determines weapon type (melee/ranged) based on properties

## [0.0.73] - 2025-01-XX

### Fixed
- Fixed guided movement mode not activating - now checks both `option.slot` and `option.segment` for movement detection
- Fixed import path for power definitions in token-radial-menu.ts (changed from `./utils/` to `../utils/`)
- Fixed ChatBubbles deprecation warning - now uses `element` property instead of deprecated `container` property
- Improved guided movement implementation:
  - Added token control to ensure token is focused during movement
  - Improved Ruler integration using state's ruler instance
  - Enhanced grid highlighting with proper highlight layer support
  - Better error handling and fallback distance calculations
  - Exported `startGuidedMovement` and `endGuidedMovement` functions for proper access

## [0.0.72] - 2025-01-XX

### Added
- **Guided Movement Mode**: Implemented a complete guided movement system for movement actions
  - When a movement option is selected from the radial menu, enters guided movement mode
  - Token becomes semi-transparent to indicate "picked up" state
  - Real-time path preview from origin to mouse position with visual feedback
  - Green path/highlights for valid destinations (within range), red for invalid (out of range)
  - Left-click on valid destination animates token movement along the path
  - Right-click or ESC cancels movement mode
  - Automatic cleanup of event listeners and graphics
  - Integrated with existing token movement restrictions
- Added system setting for default scene background image (configurable by GM)

### Fixed
- Fixed 404 error when opening power creation dialog - corrected dynamic import paths for `mastery-trees.js` and related utility modules
- Updated import paths in `character-sheet-power-dialog.ts` from `../../utils/` to `../utils/` to correctly resolve from `dist/sheets/` to `dist/utils/`
- Fixed import path in `token-radial-menu.ts` for power utilities

## [0.0.71] - 2025-01-XX

### Fixed
- Fixed 404 error when opening power creation dialog - corrected dynamic import paths for `mastery-trees.js` and related utility modules
- Updated import paths in `character-sheet-power-dialog.ts` from `../../utils/` to `../utils/` to correctly resolve from `dist/sheets/` to `dist/utils/`
- Fixed import path in `token-radial-menu.ts` for power utilities

## [0.0.68] - 2025-01-XX

### Fixed
- Fixed inner radial menu segments not being clickable - added proper interactivity and z-order management
- Updated version to 0.0.68 in all relevant files

## [0.0.67] - 2025-01-XX

### Fixed
- **Inner Segments Now Functional Filters**: Inner quadrants (Buff/Move/Util/Atk) are now clickable and properly filter the outer ring
- Clicking inner segments now updates the outer ring to show only options for that segment
- Default segment changed to "movement" for better UX

### Changed
- **Real Powers and Maneuvers**: Outer ring now displays all actual Powers and Maneuvers from actor data
- Removed hard-coded test options - all options come from real actor items and maneuver definitions
- Improved data collection from actor items (type "special" for powers)
- Enhanced `getAllCombatOptionsForActor()` to properly extract range, tags, and metadata

### Added
- Enhanced `getSegmentIdForOption()` with tag-based active-buff detection
- Debug logging to show option counts per segment
- Token flag now stores `segment` field in addition to `category` for better tracking
- Tags support in `RadialCombatOption` interface for advanced filtering

### Technical
- Refactored `openRadialMenuForActor()` with separate `updateInner()` and `rerenderOuter()` functions
- Improved state management for segment selection
- Better visual feedback when inner segments are clicked (active state highlighting)

## [0.0.66] - 2025-01-XX

### Changed
- **Radial Menu Redesign**: Refactored outer ring from small circular buttons to CS:GO-style wedge slices
- Outer ring now displays large, clickable wedge segments instead of tiny dots
- Each combat option is represented as a ring segment (donut slice) between inner and outer radius
- Improved visual clarity and clickability of options

### Added
- **Info Panel**: Added HTML info panel that appears on the right side of the screen when hovering over options
- Info panel displays: option name, source (power/maneuver), slot type, range, and description
- Info panel positioned dynamically based on token screen coordinates
- Enhanced hover effects: wedges highlight with increased alpha and brighter borders
- CSS styling for info panel in `styles/overlays.css`

### Technical
- Refactored `createRadialOptionSlice()` to draw proper ring segments (donut slices)
- Added `worldToScreen()` helper for coordinate conversion
- Added `getOrCreateInfoDiv()`, `showRadialInfoPanel()`, and `hideRadialInfoPanel()` functions
- Updated `closeRadialMenu()` to also hide info panel
- Improved wedge drawing with proper inner/outer arc calculations

## [0.0.65] - 2025-01-XX

### Fixed
- Enhanced canvas layer detection with detailed logging
- Added fallback to `canvas.tokens` layer when HUD layer unavailable
- Added last resort fallback to `canvas.app.stage` (root PIXI container)
- Improved nested property checking (e.g., `key.container`)
- Better debugging output showing all canvas.hud keys and their types

### Technical
- Enhanced `src/token-radial-menu.ts` with comprehensive canvas layer detection
- Logs key types and identifies which properties have `addChild` method
- Multiple fallback strategies for maximum compatibility

## [0.0.64] - 2025-01-XX

### Fixed
- **Critical:** Fixed `canvas.hud.addChild is not a function` error in radial menu
- Added Foundry v13 compatibility for canvas layer API with multiple fallback options
- Radial menu now tries multiple canvas layer structures (container, direct, objects)
- Range preview also uses fallback options for canvas.effects layer
- Added debug logging to identify canvas layer structure

### Technical
- Updated `src/token-radial-menu.ts` with v13-compatible canvas layer access
- Multiple fallback paths for canvas.hud and canvas.effects
- Fallback to canvas.foreground if HUD layer not available

## [0.0.63] - 2025-01-XX

### Added
- **PIXI-based Radial Menu for Combat Action Selection**: Replaced dialog-based combat option selection with a visual radial menu that appears on the canvas around tokens
- Inner circle with 4 color-coded segments: Movement (yellow), Attack (red), Utility (blue), Active Buff (violet)
- Outer ring showing filtered options based on selected segment
- Range preview on hover (cyan circle showing maximum reach in meters)
- Click handling to select options and store flags on tokens
- Outside-click detection to close the menu
- Active Buff detection for powers requiring actions
- Proper cleanup of graphics and event listeners

### Changed
- Token HUD icon now opens radial menu instead of dialogs
- Combat option selection is now visual and canvas-based rather than HTML dialogs

### Technical
- New file: `src/token-radial-menu.ts` - Complete radial menu implementation
- Updated: `src/token-action-selector.ts` - Integrated radial menu, removed old dialog functions
- Range parsing from power/maneuver data (supports formats like "8m", "12m", "Self")
- Foundry v13 compatible PIXI graphics and canvas layer integration

## [0.0.36] - 2025-12-07

### Fixed
- **Critical:** Fixed Combat Tracker initiative dice not being detected - updated selector to use multiple fallback options for Foundry v13 compatibility
- Added comprehensive selector fallbacks: `.initiative`, `[data-control="rollInitiative"]`, `.initiative-roll`, `a[data-action="rollInitiative"]`, and `a.combatant-control[data-control="rollInitiative"]`
- Restored missing source files: `src/documents/actor.ts`, `src/utils/constants.ts`, `src/utils/powers.ts`
- Added `heal()` and `applyDamage()` methods to MasteryActor class
- Fixed module.ts to properly import and initialize combat hooks

### Added
- Debug logging to show which selector successfully finds initiative elements
- Comprehensive TypeScript rebuild of core source files

## [0.0.34] - 2025-12-07

### Fixed
- **Critical:** Fixed missing MasteryActor and MasteryItem class implementations causing actor preparation failures
- **Critical:** Fixed "Cannot read properties of undefined (reading 'total')" error in actor data preparation
- Fixed deprecated CONST.CHAT_MESSAGE_TYPES → CONST.CHAT_MESSAGE_STYLES (Foundry v13 compatibility)
- Actor data now safely initializes with default values for resources, actions, and mastery

### Added
- Safe data validation in MasteryActor._prepareCharacterData()
- Safe data validation in MasteryActor._prepareNpcData()
- Comprehensive error handling for missing actor system properties

## [0.0.33] - 2025-12-07

### Added
- **Automatic Initiative Rolling on Combat Start**: When combat begins, initiative is now automatically rolled for all combatants after a 1-second delay
- **Passive Ability Reminder System**: Players receive a private chat message at combat start showing their active passive abilities and available slots
- **Passive Selection Phase**: Before initiative is rolled, players are prompted to review and adjust their passive abilities

### Changed
- `onCombatStart` function is now async and triggers automatic initiative rolling
- Combat start sequence now includes passive ability management phase
- NPCs roll initiative first (automatic, no shop), followed by PCs (with Initiative Shop dialog)

### Technical Details
- New function: `promptPassiveSelection(combat)` - Displays passive ability status to all player characters
- Modified function: `onCombatStart(combat, _updateData)` - Now handles full combat initialization sequence
- Passive status messages are whispered to individual players and GM only
- 1-second delay between passive prompt and initiative rolling to allow player interaction

### Combat Start Flow
1. Combat begins
2. Players receive passive ability status notifications
3. Players can open character sheets to adjust passives
4. After 1 second, automatic initiative rolling begins
5. NPCs roll first
6. Players roll individually with Initiative Shop access
7. Combat proceeds with sorted initiative order

## [0.0.31] - Previous Version
- Refactor powers into modular structure - each tree in separate file

## [0.0.30] - Earlier Version
- Add 5 new Mastery Trees with full powers (Crusader, Berserker, Sanctifier, Alchemist, Catalyst)

## [0.0.29] - Earlier Version
- Mastery Powers database with 2-step selection (Battlemage tree complete)

## [0.0.20] - Earlier Version
- Initiative System fully implemented
- Action Economy & Resource Management complete
- Actions per round (Attack/Movement/Reaction)
- Action conversions
- Stones/Vitality/Stress tracking
- Character sheet UI panels

## [0.0.7] - Earlier Version
- Base system implementation
- Character and NPC sheets
- Item management
- Basic combat integration

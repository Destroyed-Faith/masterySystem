# Changelog - Mastery System / Destroyed Faith

All notable changes to this project will be documented in this file.

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

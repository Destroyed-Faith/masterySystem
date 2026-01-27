# Changelog - Mastery System / Destroyed Faith

All notable changes to this project will be documented in this file.

## [0.4.20] - 2025-01-XX

### Added
- **Power System Schema Update: New Embedded Power Structure**
  - Updated `EmbeddedPowerData` interface to support per-level power data (Levels 1-4)
  - New schema includes: `id`, `name`, `category`, `tags`, `cost`, `trigger`, `levels` (Record<"1"|"2"|"3"|"4", PowerLevelRow>)
  - Each `PowerLevelRow` contains: `type`, `range` (RangeSpec | null), `aoe` (AoeSpec | null), `duration` (DurationSpec), `effect` (EffectSpec with optional dice), `specials` (Array<{key, rank?, note?}>)
  - No damage type arrays - uses `effect.dice` (optional string) instead
  - Supports table columns: Level, Type, Range, AoE, Duration, Effect, Special (per level)

### Changed
- **Power Migration: Backwards Compatibility**
  - Updated `migrateArtifactPower()` to convert old power structure to new schema
  - Old powers with `powerType`, `roll.damage`, etc. are automatically migrated
  - Migration runs in `MasteryItem.prepareArtifactData()` during item data preparation
  - Ensures all 4 levels exist and uses `null` instead of `undefined` for optional fields
  - `parseAoe()` now returns `AoeSpec | null` with correct schema (`shape`, `m`, `note`)

### Added
- **Power Validation: Schema Enforcement**
  - Created `src/utils/power-validation.ts` with validation helpers:
    - `validateNoDamageTypes()` - ensures no `damageTypes` or `damage[]` fields exist
    - `validateChargedPower()` - ensures charged powers have `cost.charges >= 1`
    - `validatePower()` - validates overall power structure

### Added
- **Artifact Sheet V2: Power Editor UI**
  - Created `ArtifactSheetV2` using ApplicationV2 + HandlebarsApplicationMixin (Foundry v13)
  - New "Powers" tab with Add/Duplicate/Delete functionality
  - Expandable power editors with full level table (Levels 1-4)
  - Columns: Level, Type, Range, AoE, Duration, Effect (text + optional dice), Specials
  - GM-only editing (players can view but not edit)
  - Form handling with debounced updates for better performance
  - Registered as default sheet for artifact items

### Updated
- **Documentation: Power Structure Examples**
  - Updated `docs/item-structure-examples.json` with new power structure examples:
    - "Blitzschlag" - active power with AoE radius (5-15m) and dice damage
    - "Schutzschild" - activeBuff with duration (5 rounds) and defense bonus
    - "Feuersturm" - active power with AoE radius (10-25m) and duration (3-6 rounds)
  - All examples show complete level 1-4 progression

## [0.2.95] - 2025-01-XX

### Fixed
- **Spell Selection Dialog: Magic Powers Integration**
  - Fixed 404 error when loading spells in the "Add Spell" dialog
  - Updated `magic-powers.ts` to import and convert all spells from spell schools
  - Converted `SpellDefinition` to `PowerDefinition` format for compatibility
  - Fixed school name mapping for "School of the Bound Mind"
  - All 38 spells are now available for selection in the character sheet

## [0.2.94] - 2025-01-XX

### Added
- **Spell Schools: Complete Implementation**
  - Created TypeScript structure for all Mastery Spell Schools
  - Implemented 7 spell schools with all spells:
    - **Pyromancy** (6 spells): Firebolt, Flame Weapon, Firewall, Blazing Burst, Scorching Ray, Blazing Speed
    - **Malefic Arts** (7 spells): Eldritch Bolt, Blight Surge, Soul Drain, Agony Lash, Maddening Whisper, Void Maw, Rift Step
    - **Old Pact** (8 spells): Entangle, Healing Pulse, Lightning of the Old Sky, Call Storm, Shapechange, Barkskin, Whispering Woods, Moonbeam
    - **Thorn & Whisper** (4 spells): Beguiling Glance, Nightshade Cloud, Serpent's Kiss, Ivy Lash
    - **Breach & Break** (4 spells): Arcane Pierce, Fang of Daggers, Call of Force, Force Hammer
    - **Aegis & Benedictions** (5 spells): Aid, Bless, Beacon of Grace, Feather Fall, Wings of Faith
    - **School of the Bound Mind** (4 spells): Telekinetic Manipulation, Telepathic Link, Veil of Invisibility, Phantasmic Reflection
  - Each spell includes 4 levels with complete details (Range, AoE, Duration, Effect, Special, Raises)
  - Added spell school bonuses and requirements to spell-schools.ts
  - Structure mirrors Mastery Trees and Powers for consistency

## [0.2.93] - 2025-01-XX

### Changed
- **Simplified Skill Spend UI: Single "Turn it into a success" Button**
  - Replaced multiple skill spend buttons (Spend 2, Spend 4, All-in) with a single button
  - Button shows exact skill points needed: "Turn it into a success (X Skill Points)"
  - Automatically calculates required points rounded up to next MR step (MR 2 = 2-step increments, MR 3 = 3-step increments, etc.)
  - Button only appears when spending can turn a failure into a success
  - Cleaner, more intuitive interface

## [0.2.92] - 2025-01-XX

### Changed
- **Skill Spend Panel: Conditional Display**
  - Skill Spend Panel in chat messages only shows when All-in can still make the roll succeed
  - If remaining pool is insufficient to reach target TN, panel is hidden
  - Prevents showing spend options when success is impossible

### Removed
- **Modal Skill Spending Dialog**
  - Removed modal dialog that appeared after failed skill rolls
  - All skill point spending now happens directly in chat via buttons
  - Cleaner UX without interrupting popups

## [0.2.91] - 2025-01-XX

### Changed
- **Skill Roll Dialog: Enhanced Options**
  - Skill rolls now open a comprehensive dialog before rolling
  - Attribute selection: Dropdown when skill has multiple attributes, auto-selected for single attribute
  - Base Target Number: MR-scaled difficulties (Trivial/Easy/Standard/Challenging/Hard/Very Hard/Heroic) plus Custom option
  - Raises input: Set raises (0..n) with live Final-TN display (Final-TN = Base-TN + Raises×4)
  - Dicepool correctly uses selected attribute value (not hardcoded)

- **Skill Point Spending: Post-Roll Dialog**
  - When a skill roll fails, a "Spend Skill Points" dialog automatically opens
  - Shows available pool, MR step size, and missing points to succeed
  - Step buttons for spending in MR increments (MR, 2MR, 3MR, ...)
  - All-in button to spend remaining pool (even if < MR or not multiple of MR)
  - Validates spending rules: minimum MR, multiples of MR (except All-in)
  - Skill points are persistently tracked in `system.skillsSpent[skillKey]`

- **Followup Chat Messages**
  - After spending skill points, a followup chat message shows:
    - Skill name, attribute used, Base-TN, Raises, Final-TN
    - Rolled total, skill points spent, final total
    - Success/Failure result and raises achieved

### Fixed
- Skill rolls now correctly use the selected attribute's value for dicepool size
- Multi-attribute skills properly show attribute selection dialog

## [0.2.90] - 2025-01-XX

### Added
- **Consumable Skill Points System**
  - Skills are now consumable resources (Pool = Skill Rating)
  - Skill Points can be spent AFTER rolling (post-roll decision)
  - Spending rules: minimum MR, then in steps of MR (MR, 2MR, 3MR, ...)
  - All-in option: spend entire remaining pool (even if < MR or not multiple of MR)
  - Only 1 skill per roll
  - All Skill Points refresh after "Safe Haven Rest" button click
  - Added `skillsSpent` data model to track consumed skill points per skill
  - Migration automatically initializes `skillsSpent` for all existing characters

- **Character Sheet: Skill Pool Display**
  - Shows "Pool: X/Y" next to each skill (remaining/total)
  - Safe Haven Rest button in Skills tab to restore all skill points
  - Visual feedback for remaining skill points

- **Chat: Skill Spend UI**
  - Skill rolls show "Spend Skill Points" panel in chat
  - Buttons for spending in MR steps (MR, 2MR, 3MR, ...)
  - All-in button to spend remaining pool
  - Real-time pool display updates
  - Final result = Sum of kept dice + spent Skill Points + base modifier

### Changed
- **Skill Rolls: Removed Auto-Add**
  - Skill Rating no longer automatically added to rolls
  - Skills must be spent manually after seeing the roll result
  - Attribute selection dialog for skills with multiple attributes

- **Initiative Calculation**
  - Removed permanent initiative bonuses from Martial Skills
  - Initiative = Agility + Wits (no longer includes Combat Reflexes)
  - Martial Skills cannot permanently increase Initiative/Attack/Evade

- **Skill Attribute Mappings**
  - Empathy: now uses `['wits', 'influence']` (was `['wits', 'resolve']`)

### Technical
- Added `skill-spend-handler.ts` for chat message click handling
- Extended `RollOptions` interface with `skillKey`, `isSkillRoll`, `baseModifier`
- Updated `sendRollToChat` to include skill spend UI
- Migration hook ensures all characters have `skillsSpent` initialized

## [0.2.84] - 2025-01-XX

### Added
- **Divine Clash Overlay: Group Selection Dropdown**
  - Added dropdown menu below character overlays for group selection
  - Options: "Solo" or "Join: <Character Name>" for each other PC on the scene
  - Only interactive for token owners or GM
  - Saves selection to token flag `mastery-system.divineClashParticipation`
  - Position updates automatically on canvas pan/zoom and token refresh
  - Dropdown positioned centered below all three zones (Pool, Attack, Defense)

- **Divine Clash Overlay: Vitality Stones Zone**
  - Added Vitality zone left of Pool zone for both NPCs and Characters
  - Character Vitality Stones: Read from `system.stones.vitality` with +1 bonus (if vitality=1, displays 2)
  - NPC Vitality Stones: New "Vitality" field in Divine Combat panel of NPC sheet
  - Vitality zone only appears when stones are present
  - Orange/yellow color scheme (0xFFAA00) to distinguish from other zones
  - Layout automatically adjusts when vitality stones are present

### Changed
- **Divine Clash Overlay: Improved Character Overlay Spacing**
  - Fixed spacing calculation to account for total overlay width (Vitality + Pool + Attack + Defense)
  - Increased spacing between character overlays for better visibility
  - Character name labels positioned at left edge of overlay

## [0.2.83] - 2025-01-XX

### Added
- **NPC Sheet: Divine Combat Configuration**
  - Added "Divine Combat" panel to NPC sheets with four configurable fields:
    - **Starting Pool**: Initial number of stones in the pool
    - **Regeneration**: Stones regenerated per round
    - **Basis Attack**: Base attack value for Divine Combat
    - **Basis Defense**: Base defense value for Divine Combat
  - Available for both normal NPCs and boss phases
  - Values will be used when NPCs are targeted in Divine Combat encounters
  - Styled consistently with existing combat panels

## [0.2.82] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed drawing validation error (second attempt)**
  - Changed `fillType` from 0 (no fill) to 1 (solid fill) to satisfy Foundry validation
  - Added very transparent fill (alpha: 0.1) with matching stroke color
  - Drawings now have both visible fill and visible stroke, passing validation
  - Fill is barely visible (10% opacity) so it doesn't interfere with gameplay

## [0.2.81] - 2025-01-XX

### Added
- **Divine Clash: Automatic drawing rectangles around stone areas**
  - **New feature**: System now automatically creates drawing rectangles around Power Stones and Vitality Stone
  - Green rectangle around Power Stones (all stones in a row)
  - Red rectangle around Vitality Stone
  - Rectangles are placed below tokens (z: 100) and are fully visible
  - Rectangles can be manually moved/resized/deleted if needed
  - Helps players identify stone placement areas visually

### Fixed
- **Divine Clash: Fixed drawing validation error**
  - Fixed "Drawings must have visible text, a visible fill, or a visible line" error
  - Increased stroke width from 2 to 4 pixels
  - Set stroke alpha to 1.0 (fully visible) instead of 0.6
  - Set text alpha to 0 (no text) to avoid validation issues

## [0.2.80] - 2025-01-XX

### Changed
- **Divine Clash: Simplified token placement workflow**
  - **Major change**: Removed automatic scene switching - user must manually switch to Divine Clash scene
  - **Major change**: Removed automatic player token creation - user must place character tokens manually
  - System now only generates stone tokens for selected character tokens on the current scene
  - Stone tokens are placed relative to existing player token positions:
    - Vitality Stone: 1.5 grid units to the right of player token
    - Power Stones: In a row 2 grid units in front of player token, spaced 1.2 grid units apart
  - All other tokens on the scene remain unchanged
  - Simplified code by removing ~200 lines of scene switching logic
  - Improved flexibility: GM has full control over token placement

## [0.2.78] - 2025-01-XX

### Fixed
- **Divine Clash: Set token texture.src explicitly when creating tokens**
  - **Critical fix**: Token `texture.src` is now explicitly set to the actor's image when creating tokens
  - This ensures tokens display the correct image from their parent actor, not placeholder images
  - Images are taken from `actor.img` or `actor.prototypeToken.texture.src`
  - Added debug logging to show which image is used for each token

## [0.2.77] - 2025-01-XX

### Fixed
- **Divine Clash: Fix placeholder images on stone tokens**
  - **Critical fix**: Stone actor images are now taken from settings when copying, not from the base actor
  - This prevents placeholder images from being copied from base actors to stone tokens
  - Images are now properly set from `divineClashPowerStoneImg` and `divineClashVitalityStoneImg` settings
  - Added debug logging to show image selection process

## [0.2.76] - 2025-01-XX

### Fixed
- **Divine Clash: Preserve token selection across scene switch**
  - **Critical fix**: Token selection is now saved BEFORE scene switch (selection is lost when scene changes in Foundry VTT)
  - Added extensive debug logging to track token/actor selection throughout the process
  - Now uses saved actors from before scene switch, combined with any newly selected tokens after switch
  - Prevents "Please select at least one character token" error when tokens were selected before clicking Divine Clash Start

## [0.2.75] - 2025-01-XX

### Added
- **Divine Clash: Token placement on scene**
  - **New feature**: Tokens are now automatically placed on the Divine Clash scene
    - Player token placed in center position
    - Vitality Stone token placed to the right of player (1.5 grid units)
    - Power Stone tokens placed in a row in front of player (2 grid units up, spaced 1.2 grid units apart)
  - Multiple players are spread horizontally across the scene (3 grid units spacing)
  - All tokens are linked to their actors (`actorLink: true`)
  - Tokens have proper flags for Divine Clash tracking

## [0.2.74] - 2025-01-XX

### Fixed
- **Divine Clash: Improved scene switching with multiple fallback methods**
  - **Scene switching**: Reordered methods and added direct DOM click as last resort
    - Method 1: `ui.nav.activateScene()` (now first, most reliable)
    - Method 2: `ui.nav.scene.view()` (alternative navigation method)
    - Method 3: `game.scenes.view()` (fallback)
    - Method 4: `scene.activate()` (fallback)
    - Method 5: Direct DOM click on scene navigation element (last resort)
  - All methods now use `await` to ensure they complete before checking
  - Added logging for each method attempt

## [0.2.73] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed actor folder assignment and improved scene switching**
  - **Actor folder fix**: Fixed critical bug where actors were created with Folder objects instead of folder IDs
    - Now properly handles both string IDs and Folder objects when checking actor folders
    - Fixed folder comparison to extract ID from Folder objects: `typeof folder === 'string' ? folder : folder?.id`
    - This fixes the issue where actors were never found because folder comparison failed
  - **Scene switching**: Added `ui.nav.activateScene()` as Method 3 (most reliable)
    - Scene switching now tries: `game.scenes.view()` → `ui.webrtc.viewScene()` → `ui.nav.activateScene()` → `scene.activate()`

## [0.2.72] - 2025-01-XX

### Fixed
- **Divine Clash: Try all scene switching methods and enhanced error reporting**
  - **Scene switching**: Now tries all available methods in sequence:
    - Method 1: `game.scenes.view()` (if available)
    - Method 2: `ui.webrtc.viewScene()` (if available)
    - Method 3: `scene.activate()` (fallback)
  - Enhanced error logging shows which methods are available and which failed
  - Better error messages showing expected vs actual scene IDs

## [0.2.71] - 2025-01-XX

### Fixed
- **Divine Clash: Improved scene switching and actor detection debugging**
  - **Scene switching**: Now uses `game.scenes.view()` as primary method (most reliable)
    - Increased polling time from 2 seconds to 3 seconds
    - Better error logging if scene doesn't switch
  - **Actor detection**: Enhanced debugging to identify why actors aren't found
    - Added folder contents check via `folder.contents` property
    - Added type checking for folder IDs (string vs number mismatch detection)
    - Added verification that created actors have the correct folder assigned
    - Added warning if no actors are found in the expected folder

## [0.2.70] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed scene switching and actor detection**
  - **Scene switching**: Changed from simple `activate()` to polling method that waits for scene to actually switch
    - Uses `ui.webrtc.viewScene()` if available (more reliable)
    - Polls every 100ms for up to 2 seconds to verify scene switch
    - Falls back to `game.scenes.view()` if initial method fails
  - **Actor detection**: Added folder verification and actor collection verification after creation
    - Verifies created actors are immediately available in the collection
    - Added detailed logging for folder lookup to debug why actors aren't found
    - Logs all actors in the target folder before searching

## [0.2.69] - 2025-01-XX

### Fixed
- **Divine Clash: Enhanced debugging for duplicate detection and scene switching**
  - Added detailed logging for all actors in the target folder to debug why existing actors aren't found
  - Added more detailed scene switching logs with before/after comparison
  - Increased scene activation wait time from 500ms to 1000ms
  - Added warning if scene doesn't switch after activation
- **Version display**: Made version number more prominent in console logs with a boxed display

## [0.2.68] - 2025-01-XX

### Fixed
- **Divine Clash: Fixed Collection access**: Fixed bug where `game.actors`, `game.folders`, and `game.scenes` were accessed as arrays instead of Collections
  - Changed all Collection accesses to use `Array.from(collection.values())` to properly convert Foundry VTT Collections to arrays
  - This fixes the issue where duplicate stone actors were created because existing actors couldn't be found
  - Scene switching should now work correctly

## [0.2.67] - 2025-01-XX

### Fixed
- **Divine Clash: Enhanced debug logging**: Added extensive debug logs for scene switching and duplicate prevention
  - Added detailed scene search logging (by ID and name)
  - Added scene activation verification with wait time
  - Added comparison logging for duplicate actor detection
  - Improved error handling for scene switching

## [0.2.66] - 2025-01-XX

### Fixed
- **Divine Clash: Prevent duplicate stone actors**: Fixed issue where stone actors were added multiple times when starting Divine Clash repeatedly
  - Now checks if enough actors already exist before creating new ones
  - If enough actors exist, reuses them instead of creating duplicates
  - Added scene switching when starting Divine Clash (switches to configured Divine Clash scene)

## [0.2.65] - 2025-01-XX

### Fixed
- **Divine Clash: Added extensive debug logging**: Added detailed debug logs to track folder creation and actor copying
  - Added debug logs to `processPlayerActor` to track actor processing
  - Added debug logs to `ensureStonesFolderForActor` to track folder creation
  - Added debug logs to `copyStoneActor` to track actor copying
  - Fixed TypeScript compilation errors for deprecated functions

## [0.2.64] - 2025-01-XX

### Fixed
- **Divine Clash: Removed all token rendering**: Completely removed token creation logic
  - Added debug logs to confirm new version is running
  - Ensured only actor structure is created, no tokens
  - Fixed folder creation to work correctly

## [0.2.63] - 2025-01-XX

### Changed
- **Divine Clash: Complete Redesign - Actor Structure Only**: Completely rewrote Divine Clash start function
  - No longer renders tokens or creates scene elements
  - Only creates actor structure in the Actors sidebar
  - Identifies player actors from selected tokens
  - Checks `system.stones` for each player actor
  - Creates folder structure: Actor → "Stones for Actor Name" (one level deeper than actor)
  - Copies configured base Power and Vitality Stone actors into the folder
  - Number of copies matches the stone count from `system.stones`
  - Reuses existing stone actors if already present
  - Clean, simple implementation focused on actor organization

## [0.2.62] - 2025-01-XX

### Fixed
- **Divine Clash: Stone Reuse**: Prevent duplicate stone actors and tokens when starting Divine Clash multiple times
  - Stone actors are now reused if they already exist in the player's folder
  - Stone tokens are now reused if they already exist on the scene for the same actors
  - Only missing actors/tokens are created, preventing duplicates
  - Orphaned tokens (without matching actors) are automatically cleaned up
  - Added detailed logging for reuse vs creation of stones

## [0.2.61] - 2025-01-XX

### Fixed
- **Divine Clash: Folder Creation**: Fixed folder not being created when character has 0 stones
  - Folder is now always created for each player, even if no stones need to be spawned
  - Added extensive debug logging for folder creation process
  - Folder creation happens before stone spawning, ensuring folder exists

## [0.2.60] - 2025-01-XX

### Changed
- **Divine Clash: Stone Token Creation**: Complete redesign of stone token system
  - Each player now gets a dedicated folder: "Divine Clash - [Player Name]"
  - Individual stone actors are created (one per stone needed) as proper NPC actors
  - Tokens are now created with `actorLink: true` (linked to individual stone actors)
  - Each stone actor can have its own image configured
  - No more placeholder images - stones use their actor images directly
  - Cleanup function now removes folders and all stone actors on reset

### Fixed
- **Divine Clash: Placeholder Images**: Fixed by using proper linked actors
  - Tokens are now properly linked to their stone actors
  - Images come directly from the actor, not from token data
  - Each stone is a real NPC actor that can be edited and configured

## [0.2.59] - 2025-01-XX

### Changed
- **Divine Clash: Stone Calculation**: Changed to use `system.stones` instead of `system.stonePools`
  - Power Stones now calculated as `stones.current - stones.vitality` (or `stones.total - stones.vitality`)
  - Vitality Stones now use `stones.vitality` directly
  - Falls back to old `stonePools` system for backwards compatibility
  - Better alignment with the actual stone system used in character sheets

## [0.2.58] - 2025-01-XX

### Fixed
- **Divine Clash: Scene Switching**: Fixed scene not switching when starting Divine Clash
  - Scene now switches even when only enemy token is selected (shows warning but still switches)
  - Scene is retrieved before token validation, ensuring scene switch happens
  - Improved error handling and guard logic

## [0.2.57] - 2025-01-XX

### Fixed
- **Divine Clash: Placeholder Images**: Fixed placeholder images still being displayed on stone tokens
  - Added explicit image update after token creation to ensure correct image is used
  - Token image is now verified and corrected if Foundry uses actor image instead
  - Logs show image source and any corrections made
- **Divine Clash: Multiple Simultaneous Calls**: Prevented duplicate Divine Clash start calls
  - Added guard variable to prevent multiple simultaneous executions
  - Prevents token duplication and performance issues

### Changed
- **Divine Clash: Image Handling**: Improved token image handling
  - Token image is now explicitly updated after creation if it doesn't match expected image
  - Better logging for image selection and correction process

## [0.2.56] - 2025-01-XX

### Fixed
- **Divine Clash: Power Stone Count**: Fixed incorrect stone count calculation
  - Changed from using `available` (max - sustained) to `current` value
  - Now correctly spawns only the actual stones the character has, not theoretical capacity
- **Divine Clash: Duplicate Stones**: Fixed duplicate stone tokens being spawned
  - Added cleanup function to remove existing stones for a seat before spawning new ones
  - Prevents accumulation of stones when Divine Clash is started multiple times
- **Divine Clash: Stone Image Priority**: Fixed placeholder images being used instead of settings image
  - Settings image now always takes precedence if configured
  - Added extensive debug logging for image selection process
  - Logs all image sources (settings, actor, default) and decision process
  - Helps diagnose image selection issues

### Changed
- **Divine Clash: Image Selection Logic**: Improved image resolution priority
  - Settings image is now checked first and used if set (even if it's the default path)
  - Actor images are only used if settings image is not configured
  - Added `isValidImage()` helper function to detect placeholder images

## [0.2.42] - 2025-01-XX

### Fixed
- **Active Buff Restrictions**: Only one true active buff can be active at a time
  - Added `isTrueActiveBuff` function to distinguish between true active buffs and utilities
  - Added `getTrueActiveBuffs` function to get only non-utility active buffs
  - `activateActiveBuff` now prevents activating a second true active buff if one is already active
  - Utilities can still stack (multiple utilities can be active simultaneously)
  - True active buffs (non-utilities) are limited to one at a time

### Changed
- **Combat Carousel Active Buff Display**: Improved active buff icon display
  - Active buffs (including utilities) now always show in carousel, even if effect has no icon
  - Icon is now retrieved from original power if effect icon is missing
  - Default icon (`icons/svg/aura.svg`) is used as fallback if no icon is found
  - Better tooltip information for active buffs in carousel

## [0.2.41] - 2025-01-XX

### Changed
- **Combat Carousel Positioning**: Adjusted carousel position and height
  - Changed `top` from `10px` to `-9px` to better align with UI elements
  - Increased `height` from `20vh` to `30vh` for better visibility
  - Updated both `.mastery-carousel` and `#mastery-combat-carousel` for consistency

## [0.2.40] - 2025-01-XX

### Fixed
- **Utilities as Active Buffs**: Fixed utilities not being recognized as active buffs
  - Extended `isActiveBuff` function to recognize utilities with Self-targeting (Range: Self or 0)
  - Utilities with buff-like tags or characteristics are now recognized as active buffs
  - Updated `getSegmentIdForOption` to correctly identify utilities as active buffs in radial menu
  - Utilities now appear correctly in Character Sheet and Combat Carousel when activated
  - Self-targeting utilities are now automatically activated on self without targeting

## [0.2.39] - 2025-01-XX

### Changed
- **Chat Messages Styling**: Enhanced chat message appearance with df-rulebook-ui theme
  - All chat messages now use consistent dark fantasy theme colors
  - Improved visual hierarchy with better borders, shadows, and spacing
  - Message headers styled with Cinzel Decorative font and uppercase text
  - Attack cards, roll cards, damage cards, and info cards all styled consistently
  - Better hover effects and transitions for interactive elements
  - Consistent color scheme using df-* CSS variables
  - Improved readability with proper contrast and spacing

## [0.2.38] - 2025-01-XX

### Fixed
- **Active Buffs Import Error**: Fixed dynamic import path for active buffs module
  - Changed import path from `../utils/active-buffs.js` to `./utils/active-buffs.js`
  - Active buffs can now be activated correctly from the radial menu
  - Active buffs now appear correctly in Character Sheet and Combat Carousel

## [0.2.37] - 2025-01-XX

### Fixed
- **Dialog Close Buttons**: Fixed close button styling in all dialogs
  - Improved header close button appearance with proper padding and hover effects
  - Close button now has subtle background on hover
  - Close button turns red on hover for better visual feedback
  - Removed duplicate close button from Passive Selection Dialog footer

### Changed
- **Passive Selection Dialog**: Removed close button from footer
  - Dialog now only uses the standard header close button
  - Cleaner footer layout with only navigation buttons

## [0.2.36] - 2025-01-XX

### Changed
- **Combat Carousel**: Moved carousel 10px lower to show initiative counter and other UI elements
  - Carousel now positioned at `top: 10px` instead of `top: 0`
  - Initiative counter and other top UI elements are now visible when carousel is open
- **Status Icons in Carousel**: Enhanced status icon display
  - Increased icon size from 16x16px to 20x20px for better visibility
  - Improved hover effects with purple glow for Active Buffs
  - Active Buff icons now have purple border and badge indicator
  - Better tooltip display on hover

### Added
- **Status Effects Bar in Character Sheet**: Added status effects display above Character Attributes
  - New status effects bar appears at the top of the Attributes tab
  - Shows all active effects (including Active Buffs) as icons
  - Hover over icons to see effect name, duration, and description
  - Active Buffs have purple badge indicator
  - Icons are 32x32px with hover effects for better visibility

### Fixed
- **Active Buffs Display**: Improved Active Buff detection and display
  - Added comprehensive debug logging for troubleshooting
  - Fixed status effects array initialization
  - Improved icon and description extraction from ActiveEffects

## [0.2.35] - 2025-01-XX

### Fixed
- **Active Buffs Display**: Fixed Active Buffs not showing in Character Sheet and Combat Carousel
  - Fixed ActiveEffect creation to properly set icon from power image
  - Fixed description storage (now stored directly in `description` field, not `system.description.value`)
  - Fixed duration calculation for Active Buffs outside of combat
  - Improved rounds remaining calculation (using Math.max to prevent negative values)
  - Added debug logging to help diagnose Active Buff issues
  - Character Sheet and Combat Carousel now refresh after activating an Active Buff

### Changed
- **Active Buff Activation**: Improved Active Buff activation flow
  - Character Sheet and Combat Carousel are now automatically refreshed after activation
  - Better error handling and user feedback

## [0.2.34] - 2025-01-XX

### Fixed
- **Active Buffs**: Fixed Active Buffs being treated as attacks
  - Active Buffs are now checked and activated BEFORE action consumption
  - Active Buffs no longer trigger targeting mode or damage calculations
  - Active Buffs are directly activated on self when selected from radial menu
- **Active Buff Display**: Enhanced Active Buff visualization
  - Added hover tooltips in Combat Carousel showing buff name and remaining duration
  - Improved hover tooltips in Character Sheet with full description
  - Active Buff icons in Carousel have special styling (purple border, glow effect)
  - Active Buff items in Character Sheet show detailed tooltip on hover
- **Chat CSS**: Fixed chat message styling
  - Added general chat styling that applies to all chat messages (not just theme-specific)
  - Chat messages now have proper background, borders, and spacing regardless of theme
  - Message headers and content are properly styled

### Changed
- **Combat Carousel**: Status icons now support both string icons and object icons with tooltips
  - Active Buffs are displayed as special status icons with tooltips
  - Regular effects are displayed as standard status icons
- **Handlebars Helpers**: Added `isObject` helper for template conditionals

## [0.2.33] - 2025-01-XX

### Changed
- **Power Details Display**: Improved power card expandable details
  - Power details are now always collapsed by default
  - Clicking toggle button shows full description with all level details
  - Compact description is hidden when details are expanded
  - Compact description now shows max 2 lines with ellipsis

## [0.2.32] - 2025-01-XX

### Fixed
- **Template Rendering**: Fixed "length" helper registration and template usage
  - Removed dependency on length helper in template by using #each with @first instead
  - Added verification and fallback registration of length helper in init hook
  - Improved length helper to handle null/undefined values safely
  - Template now uses #each loop to check if array has elements instead of length helper

## [0.2.31] - 2025-01-XX

### Fixed
- **Template Rendering**: Fixed "length" helper errors and mergeObject issues
  - Simplified template conditionals to use "and" helper with proper array checks
  - Added error handling in getData to ensure context is always a valid object
  - Ensured specials is always an array to prevent template errors
  - Added try-catch blocks around async imports in getData

## [0.2.30] - 2025-01-XX

### Fixed
- **Handlebars Helpers**: Fixed "length" helper registration and added "and" helper
  - Ensured length helper is properly registered in both immediate and additional registration
  - Added "and" logical helper for template conditionals
  - Fixed template conditionals that were causing mergeObject errors

## [0.2.29] - 2025-01-XX

### Fixed
- **Handlebars Helper**: Added missing "length" helper for template rendering
  - Fixes error "Missing helper: length" when rendering character sheet

## [0.2.28] - 2025-01-XX

### Fixed
- **Active Buffs in Radial Menu**: Active Buffs are now properly activated directly on self without targeting mode
  - Active Buffs no longer trigger melee targeting when selected from radial menu
  - Active Buffs are automatically set to Range 0 (Self) when created as combat options
  - Fixed issue where Active Buffs were treated as attacks requiring target selection

### Changed
- **Power Display in Character Sheet**: Enhanced power cards with better information display
  - Utility powers now correctly display as "Utility" instead of "Active"
  - Added Effect information display in power cards
  - Added expandable details section with full level information (Type, Range, AoE, Duration, Effect, Special)
  - Power level data is now loaded from power definitions and displayed in expandable section
  - Improved power card layout with toggle button for detailed information
  - Power details now show the same information as when purchasing powers

### Improved
- **Powers Overview Styling**: Updated powers overview section to use new CSS variable-based theme system
  - Removed inline styles from template
  - Consistent styling with rest of character sheet

## [0.2.27] - 2025-01-XX

### Added
- **Active Buffs System**: Implemented proper Active Buff tracking and display
  - Active Buffs are now properly recognized as buffs (not attacks) and create ActiveEffects with duration = Mastery Rank rounds
  - Added utility functions in `src/utils/active-buffs.ts` for detecting and activating active buffs
  - Active Buffs are displayed with symbols/icons in the combat carousel (via status icons)
  - Added Active Buffs section in character sheet showing active buffs with icons and remaining rounds
  - Active Buffs can be manually removed from the character sheet
  - When using a power that is an active buff, it creates an ActiveEffect instead of treating it as an attack

### Changed
- Updated `#onPowerUse` handler to detect active buffs and create ActiveEffects
- Active Buffs now use Foundry's ActiveEffect system for proper tracking and display

## [0.2.1] - 2025-01-XX

### Changed
- **BREAKING CHANGE**: Migrated CombatCarouselApp to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
  - Replaced Application v1 patterns with proper ApplicationV2 implementation
  - Uses DEFAULT_OPTIONS and PARTS instead of defaultOptions/template
  - Implements _prepareContext instead of getData
  - Uses _onRender with native DOM API instead of jQuery-based activateListeners
  - Removed _renderHTML and _replaceHTML overrides (handled by HandlebarsApplicationMixin)
  - Fixed window options: popOut: false → window.frame: false and window.positioned: false
  - Updated render() calls in module.ts to use object syntax ({ force: true/false })
  - Body class management moved to _onRender and _onClose
  - Carousel now properly renders and attaches event listeners in v13

## [0.2.0] - 2025-01-XX

### Changed
- **BREAKING CHANGE**: Migrated PassiveSelectionDialog and InitiativeShopDialog to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
  - Replaced Application v1 patterns with proper ApplicationV2 implementation
  - Uses DEFAULT_OPTIONS and PARTS instead of defaultOptions/template
  - Implements _prepareContext instead of getData
  - Uses _onRender with native DOM API instead of jQuery-based activateListeners
  - Singleton check now uses foundry.applications.instances instead of ui.windows
  - Re-render uses this.render({ force: true }) instead of manual DOM manipulation
  - Fixed all "activateListeners is not a function" and "html.find is not a function" errors
  - Dialogs now open correctly without "App element not found" errors

## [0.1.61] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed app element not found error in dialogs
  - Added wait loop in `_replaceHTML()` to wait for app element to be available in DOM
  - Prevents errors when dialog window hasn't been created yet when `_replaceHTML` is called
  - Applied fix to both Passive Selection Dialog and Initiative Shop Dialog

## [0.1.60] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed jQuery object handling in Passive Selection Dialog and Initiative Shop Dialog
  - Added jQuery object validation in `activateListeners()` methods
  - Replaced all `html.find()` calls with `$html.find()` to ensure jQuery object usage
  - Fixed "html.find is not a function" errors by ensuring html parameter is converted to jQuery object
  - Improved fallback handling when app element is not found

## [0.1.59] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed Passive Selection Dialog activateListeners error
  - Added try-catch protection in dist file (temporary fix until TypeScript compilation issue is resolved)
  - Dialog should now render correctly without crashing

## [0.1.58] - 2025-01-XX

### Fixed
- **Dialog Rendering**: Fixed Passive Selection Dialog and Initiative Shop Dialog not appearing
  - Added try-catch protection for `super.activateListeners()` calls in ApplicationV2 classes
  - Prevents errors when ApplicationV2 or Application base class doesn't have activateListeners method
  - Applied fix to PassiveSelectionDialog, InitiativeShopDialog, CombatActionOverlay, and CombatCarouselApp

## [0.1.57] - 2025-01-XX

### Fixed
- **Character Creation**: Fixed Finish button not appearing after selecting all attributes, skills, and 4 powers
  - Removed `disadvantagesReviewed` requirement from `canFinalize` check since disadvantages are optional
  - Finish button now appears when all required points are spent and 4 powers are selected

## [0.1.55] - 2025-01-XX

### Changed
- **BREAKING CHANGE**: Renamed item type `special` to `power` throughout the entire system
  - All item type checks (`item.type === 'special'`) updated to `item.type === 'power'`
  - `SpecialData` interface renamed to `PowerData`
  - `prepareSpecialData()` method renamed to `preparePowerData()`
  - Template `special-sheet.hbs` renamed to `power-sheet.hbs`
  - Updated all references in code, templates, and configuration files
- Added new item type `gear` for everyday items
  - Added `GearData` interface with `weight`, `quantity`, `equipped`, and `description` fields
  - Added gear template to `template.json`
  - Added gear to `system.json` document types
- Migrated all Application classes to ApplicationV2 to resolve Foundry VTT v13 deprecation warnings
  - `CombatCarouselApp`, `PassiveSelectionDialog`, `InitiativeShopDialog`, `CombatActionOverlay` now use `ApplicationV2`
  - Removed `override` modifiers (not supported by ApplicationV2)
  - Fixed `TokenDocument.effects` deprecated warning (now uses `Actor.effects`)

### Fixed
- Fixed Combat Carousel display issues with CSS positioning
- Fixed Passive Selection Dialog close button functionality

## [0.1.54] - 2025-01-XX

### Fixed
- **Dice Parsing**: Fixed dice notation parsing to support full Foundry Roll formulas
  - Now correctly handles formulas like "1d8 + 1d8", "2d8 + 3d8 + 2", "Weapon DMG + 1d8 + 2"
  - Removed silent truncation of complex dice expressions
  - Uses Foundry Roll.evaluate() for proper formula evaluation instead of custom regex parser
- **Damage Application**: Fixed damage application to properly handle tempHP and health bar overflow
  - TempHP is now reduced first before applying damage to health bars
  - Damage properly flows between health bars when a bar reaches 0
  - Uses existing applyDamage helper from calculations.ts for consistent overflow handling
- **Movement UX**: Fixed movement selection UX improvements
  - Radial menu now closes immediately when Move/Dash/Disengage is selected
  - Hex highlighting alignment fixed using Foundry grid APIs (getOffset/getTopLeftPoint)
  - Removed hard-coded calibration offsets, now uses reliable grid API methods
  - Path hexes correctly highlight in green (within range) or red (beyond range)
- **Dice Visibility**: Fixed dice visibility for mastery rolls
  - Dice now always appear in chat for masteryRoll
  - Dice So Nice integration added (3D dice show when module is installed)
  - Proper roll serialization using roll.toJSON() for Foundry v13 compatibility
  - Added robust error handling with user-friendly notifications

## [0.1.11] - 2025-01-XX

### Fixed
- **XP Management inline in Settings**: Fixed `html.find is not a function` error in renderSettingsConfig hook
  - Added robust handling for different html parameter types in Foundry VTT v13
  - Improved jQuery object detection and conversion
  - Added error handling and debug logging

## [0.1.10] - 2025-01-XX

### Fixed
- **XP Management Settings defaultOptions**: Fixed mergeObject error by ensuring baseOptions is always an object
  - Changed `super.defaultOptions` to `super.defaultOptions || {}` to handle undefined cases
- **Version Display**: Updated version display from "0.0.78 (Alpha)" to "0.1.9" in console output

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

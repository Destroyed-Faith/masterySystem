# Changelog

All notable changes to the Mastery System / Destroyed Faith for Foundry VTT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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


# Changelog

All notable changes to the Mastery System / Destroyed Faith for Foundry VTT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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


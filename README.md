# Mastery System / Destroyed Faith

A custom Foundry VTT game system for the **Mastery System** and **Destroyed Faith** dark fantasy tabletop RPG.

## Features

- **Roll & Keep Dice Mechanic:** Roll Xd8 (X = Attribute), keep K highest (K = Mastery Rank), with exploding 8s
- **Attribute Stones:** Every 8 attribute points = 1 Stone, a pooled resource for powerful abilities
- **Mastery Ranks (M1-M8):** Character progression tiers that define kept dice and power level
- **Health Bars System:** Multiple HP layers with cumulative penalties (-1, -2, -4)
- **Powers as Templates:** Leveled abilities (L1-L16) organized into five canonical categories (Movement / Passive / Reaction / Active / Active Buff). Active powers carry a Special Slot that expands into one entry per eligible Special; every Active can additionally be picked "as a Spell" during character creation (Active-as-Spell, see below).
- **Diminishing Conditions:** Status effects that decay each round (Bleeding, Ignite, Mark, etc.)
- **Divine Clash:** Late-game combat system using Stones as Attack/Defense pools

## Installation

### For The Forge Users

1. Go to your Forge game's **Game Setup** page
2. Click **Install System**
3. Paste this manifest URL:
   ```
   https://raw.githubusercontent.com/Destroyed-Faith/masterySystem/main/system.json
   ```
4. Click **Install**
5. Create a new world using "Mastery System / Destroyed Faith" as the game system

**Important:** To receive automatic update notifications, you must install the system using the manifest URL above. If you manually install the system (e.g., via Git clone), Foundry VTT will not detect updates automatically.

#### Updating the System

If you installed via the manifest URL, Foundry VTT will automatically check for updates:
- Go to **Setup** → **Manage Systems**
- If an update is available, you'll see an "Update" button next to the system
- Click **Update** to install the latest version

If you don't see update notifications:
1. Make sure you installed via the manifest URL (not manual installation)
2. Try refreshing Foundry VTT (F5)
3. Check that your installed version is lower than the latest version on GitHub

### For Self-Hosted Foundry VTT

1. Navigate to your Foundry VTT user data folder:
   - **Windows:** `%localappdata%\FoundryVTT\Data\systems`
   - **macOS:** `~/Library/Application Support/FoundryVTT/Data/systems`
   - **Linux:** `~/.local/share/FoundryVTT/Data/systems`

2. Clone this repository into the systems folder:
   ```bash
   cd /path/to/FoundryVTT/Data/systems
   git clone https://github.com/Destroyed-Faith/masterySystem.git mastery-system
   ```

3. Install dependencies and build:
   ```bash
   cd mastery-system
   npm install
   npm run build
   ```

4. Restart Foundry VTT
5. Create a new world and select "Mastery System / Destroyed Faith" as the game system

### Development Mode Installation

If you want to develop or modify the system:

1. Clone the repository:
   ```bash
   git clone https://github.com/Destroyed-Faith/masterySystem.git
   cd masterySystem
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the system (compiles TypeScript to JavaScript):
   ```bash
   npm run build
   ```

4. For continuous development with auto-compilation:
   ```bash
   npm run watch
   ```

5. Create a symlink from your Foundry systems folder to this repository:
   - **Windows (PowerShell as Admin):**
     ```powershell
     New-Item -ItemType SymbolicLink -Path "%localappdata%\FoundryVTT\Data\systems\mastery-system" -Target "D:\Dev\VTT\Mastery System"
     ```
   - **macOS/Linux:**
     ```bash
     ln -s /path/to/masterySystem ~/Library/Application\ Support/FoundryVTT/Data/systems/mastery-system
     ```

## Project Structure

```
mastery-system/
├── system.json          # Foundry v13 manifest
├── template.json        # Actor & Item data templates
├── src/                 # TypeScript source code
├── dist/                # Compiled JavaScript (generated)
├── templates/           # Handlebars templates for sheets
├── styles/              # CSS stylesheets
├── assets/              # Images, icons
├── packs/               # Compendium packs
└── lang/                # Localization files
```

## Authoring a new Power Template

Powers live in `src/utils/powers/templates/`:

- `movement.ts`, `reaction.ts`, `activeBuffs.ts`, `passives.ts`, `actives.ts`
- `_shared.ts` hosts the `PowerTemplate` interface and the `buildLevels` helper that deterministically fills in all 16 rank rows from a per-row factory.
- `_specials.ts` centralises the eligible Special keys per Active damage tier (T3–T6).
- `index.ts` collects `ALL_POWER_TEMPLATES` and re-exports the category/subfamily/special lookups consumed by the catalog.

Adding a template:

1. Pick the right file based on the power's category.
2. Call the category's row factory (e.g. `movementRow`, `reactionRow`, `activeBuffRow`, `passiveRow`, or one of the Active factories like `damageSingleTemplate`) and push it into the exported array. The factory handles scaling for all 16 levels.
3. For Actives that expose a Special Slot, declare `specialSlot: { tier, eligibleSpecialKeys: [...getEligibleSpecialsForTier(tier)] }` so the catalog can expand the template into one entry per eligible Special.
4. Optional: set `spellHints` to pre-select the resolution / save-type / per-Special casting attribute when the player later flips the Active into a Spell at character creation.

Nothing else is required — the catalog rebuilds from the template registry on demand (`_resetCatalogCache()` for tests) and the power-picker surfaces the template under the right category/subfamily automatically.

## Spell-casting an Active (Active-as-Spell)

Any Active power can be turned into a Spell at character creation. The picker offers a "Cast this Active as a Spell" toggle that reveals:

- **Casting Attribute** — `intellect` or `resolve` (defaults from the template's `spellHints.attributeBySpecial` when available).
- **Resolution** — `spellAttack` (roll vs target Evade) or `saveSpell` (roll vs Base TN, then targets save vs Save DC = 8 × MR).
- **Save Type** (when Save Spell) — `body` / `mind` / `spirit`.

Constraints:

- Max Spell Level a character can learn/cast is `Mastery Rank × 2`. The picker refuses ranks above the cap.
- `Base TN = 8 × ceil(Spell Level / 2)`.
- Each declared **Raise** adds `+4` to the relevant TN.
- Each **Blood Raise** costs `4 HP` (ignoring Armor, unhealable until combat ends) and adds `+4` to the final total.
- A failed cast fizzles and inflicts `1d8` Stress on the caster.

The maths & side-effects live in `src/combat/spell-roll-handler.ts` (`calculateBaseTN`, `calculateSaveDC`, `getMaxSpellLevel`, `canCastSpellAtLevel`, `rollSpell`). The combat-end hook clears the Blood Raise HP-loss flag automatically.

## Building & Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm run clean` - Remove compiled files
- `npm run rebuild` - Clean and rebuild
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Version

**Current Version:** 0.0.68 (Alpha)

Future updates will increment as:
- **0.0.x** - Bug fixes and minor changes during alpha
- **0.x.0** - New features during beta
- **1.0.0** - First stable release

## Links

- **Repository:** https://github.com/Destroyed-Faith/masterySystem
- **Issues:** https://github.com/Destroyed-Faith/masterySystem/issues
- **Discord:** [Join our community](https://discord.gg/npkQ8DaR)

## License

© 2025 Daniel Rodrigo Navarro Melendo. All rights reserved.

This work is the intellectual property of the author and may not be copied, distributed, or published in whole or in part without explicit permission. Use in private, non-commercial gaming sessions is expressly permitted.

See LICENSE file for full details.

## Credits

- **System Design:** Daniel Rodrigo Navarro Melendo
- **Character Art:** Jesús Bey
- **World Map:** Pena Negra
- **Full Page Art:** Dzmitry Zasimovich

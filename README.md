# Mastery System / Destroyed Faith

A custom Foundry VTT game system for the **Mastery System** and **Destroyed Faith** dark fantasy tabletop RPG.

## Features

- **Roll & Keep Dice Mechanic:** Roll Xd8 (X = Attribute), keep K highest (K = Mastery Rank), with exploding 8s
- **Attribute Stones:** Every 8 attribute points = 1 Stone, a pooled resource for powerful abilities
- **Mastery Ranks (M1-M8):** Character progression tiers that define kept dice and power level
- **Health Bars System:** Multiple HP layers with cumulative penalties (-1, -2, -4)
- **Powers & Mastery Trees:** Leveled abilities (L1-L4) organized in thematic trees
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

## Building & Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm run clean` - Remove compiled files
- `npm run rebuild` - Clean and rebuild
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Version

**Current Version:** 0.0.1 (Alpha)

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

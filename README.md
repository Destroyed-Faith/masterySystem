# Mastery System / Destroyed Faith

**Destroyed Faith** is a dark fantasy tabletop RPG. This repository is its **Foundry VTT game system** (`mastery-system`): sheets, dice, combat, powers, artifacts, and world tools for running the game online.

## Gameplay identity

- **Roll & Keep:** roll Attribute dice (d8), keep Mastery Rank highest; Attack Dice can explode on 8 (or 7–8 with Critical)
- **Attribute Stones:** every 8 points in an Attribute grants a Stone — a spendable pool for powerful abilities
- **Mastery Ranks:** progression that sets keep dice, power caps, and combat pressure
- **Powers & Specials:** leveled templates (Movement, Reaction, Active, Active Buff, Passive) with numeric Specials
- **Divine Clash:** late-game Stone-driven conflict on a dedicated board

## Project status

**Public Beta** (Foundry system `0.9.x`). Playable and iterating toward 1.0 — this is no longer Alpha.

- **Foundry VTT system version** is defined in [`system.json`](system.json) (mirrored in [`package.json`](package.json)).
- The **Destroyed Faith rulebook** has a separate public version number (independent of the Foundry system).
- The two version sequences are intentionally independent — do not put the rulebook version in `package.json` / `system.json`.

**Supported Foundry VTT:** version **14** (`compatibility.minimum` / `verified` in `system.json`).

---

## For players and game masters

1. Install the system via the Foundry / Forge **manifest URL** (recommended).
2. Create a world using **Mastery System / Destroyed Faith**.
3. Prefer in-world tools (character sheet, Stone Powers, Tower Wizard, Encounter Generator) over editing JSON by hand.
4. Report bugs on GitHub Issues.

**Official links**

- Website: https://destroyedfaith.com/
- YouTube: https://www.youtube.com/@destroyed-faith
- Repository: https://github.com/Destroyed-Faith/masterySystem
- Releases: https://github.com/Destroyed-Faith/masterySystem/releases
- Issues: https://github.com/Destroyed-Faith/masterySystem/issues

---

## Installation

### Recommended — Foundry / The Forge (manifest)

1. Open **Game Setup** → **Install System**
2. Paste the manifest URL:
   ```
   https://raw.githubusercontent.com/Destroyed-Faith/masterySystem/main/system.json
   ```
3. Install, then create a world with this system

Manifest installs receive Foundry update notifications when `system.json` on `main` advances and `download` points at the matching GitHub Release ZIP (`mastery-system-X.Y.Z.zip`). See [`RELEASING.md`](RELEASING.md).

### Self-hosted — development checkout

```bash
cd /path/to/FoundryVTT/Data/systems
git clone https://github.com/Destroyed-Faith/masterySystem.git mastery-system
cd mastery-system
npm ci
npm run build
```

Restart Foundry and create a world. For day-to-day development, symlink the clone into your systems folder and use `npm run watch`.

---

## For developers and contributors

```bash
git clone https://github.com/Destroyed-Faith/masterySystem.git
cd masterySystem
npm ci          # requires no private SSH key
npm run build
npm test
```

| Command | Purpose |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run watch` | Rebuild on change |
| `npm test` | Unit tests (Vitest) |
| `npm run audit:catalog` | Rules ↔ catalog audit |
| `npm run release:validate` | Version / changelog consistency |
| `npm run release:package` | Build player ZIP (allowlist) |
| `npm run release:check` | Validate + build + test + audit + package |
| `npm run test:e2e` | Playwright (needs a Foundry world; optional) |

Power templates live under `src/utils/powers/templates/`. Put one-off developer helpers in `scripts/dev/` (excluded from the player ZIP).

Release process: [`RELEASING.md`](RELEASING.md).

---

## License and Community Content

Destroyed Faith is **free to play**. The Foundry system is publicly **source-available but proprietary** — not open source.

- Videos, streams, Actual Plays, reviews, tutorials, convention play, and paid GM sessions are permitted.
- Ordinary monetization of that media is permitted.
- Publishing, redistributing, selling, or maintaining modified versions of the official core is **not** permitted without written authorization.
- Artwork and other assets may appear in permitted gameplay coverage but may **not** be extracted and redistributed separately.

Full terms:

- [`LICENSE.md`](LICENSE.md) — Destroyed Faith Proprietary Source-Available License
- [`MEDIA-AND-COMMUNITY-POLICY.md`](MEDIA-AND-COMMUNITY-POLICY.md) — streamers, reviewers, GMs, conventions
- [`ASSET-LICENSE.md`](ASSET-LICENSE.md) — visual and audio asset notice
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — issues welcome; invited contributions only for code
- [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md) — third-party and Foundry notices

### Foundry Virtual Tabletop

This game system is designed for use with a legally licensed copy of Foundry Virtual Tabletop. Foundry Virtual Tabletop is software owned by Foundry Gaming LLC. Destroyed Faith is an independent project and is not affiliated with or endorsed by Foundry Gaming LLC.

### Credits

- **System design:** Daniel Rodrigo Navarro Melendo
- **Character art:** Jesús Bey
- **World map:** Pena Negra
- **Full-page art:** Dzmitry Zasimovich

Rulebook source markdown lives under [`docs/Rules/`](docs/Rules/). Artwork rights checklist for owner verification: [`docs/ASSET-RIGHTS-CHECKLIST.md`](docs/ASSET-RIGHTS-CHECKLIST.md).

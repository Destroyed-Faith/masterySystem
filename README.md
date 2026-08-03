# Mastery System / Destroyed Faith

**Destroyed Faith** is a dark fantasy tabletop RPG. This repository is its **Foundry VTT game system** (`mastery-system`): sheets, dice, combat, powers, artifacts, and world tools for running the game online.

## Gameplay identity

- **Roll & Keep:** roll Attribute dice (d8), keep Mastery Rank highest; Attack Dice can explode on 8 (or 7–8 with Critical)
- **Attribute Stones:** every 8 points in an Attribute grants a Stone — a spendable pool for powerful abilities
- **Mastery Ranks:** progression that sets keep dice, power caps, and combat pressure
- **Powers & Specials:** leveled templates (Movement, Reaction, Active, Active Buff, Passive) with numeric Specials
- **Divine Clash:** late-game Stone-driven conflict on a dedicated board

## Project status

Pre-1.0 public development. The installed system version is defined in [`system.json`](system.json) (and mirrored in [`package.json`](package.json)). The intended next public Release Candidate version is **0.99.0** — see [`RELEASING.md`](RELEASING.md).

**Supported Foundry VTT:** version **14** (`compatibility.minimum` / `verified` in `system.json`).

---

## For players and game masters

1. Install the system via the Foundry / Forge **manifest URL** (recommended).
2. Create a world using **Mastery System / Destroyed Faith**.
3. Prefer in-world tools (character sheet, Stone Powers, Tower Wizard, Encounter Generator) over editing JSON by hand.
4. Report bugs on GitHub Issues.

**Official links**

- Repository: https://github.com/Destroyed-Faith/masterySystem
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

Manifest installs receive Foundry update notifications when `system.json` on `main` advances and the `download` URL points at a matching release asset. Until the coordinated **0.99.0** release, `download` still uses the `main` branch archive so installs keep working; immutable ZIP installs are the goal of the release process in [`RELEASING.md`](RELEASING.md).

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

**Debug logging** is off by default. Enable with the client setting **Debug Mode**, or in the browser console:

```js
CONFIG.masterySystemDebug = true
```

Specialized Stone Powers DnD traces use separate `CONFIG.masterySystemDebugStone*` flags.

Power templates live under `src/utils/powers/templates/`. Do not commit one-off root debug scripts; put helpers in `scripts/dev/`.

Release process: [`RELEASING.md`](RELEASING.md).

---

## License and credits

© Daniel Rodrigo Navarro Melendo. All rights reserved. See [`LICENSE`](LICENSE).

Private, non-commercial table use is permitted. Redistribution of the system, rule text, or commissioned assets without permission is not.

| Area | Notes |
|---|---|
| Source code & game system | All rights reserved (LICENSE) |
| Rule text (`Rules/`, in-world text) | All rights reserved |
| Artwork, maps, tokens, logos | Commissioned / third-party — see [`docs/ASSET-RIGHTS-CHECKLIST.md`](docs/ASSET-RIGHTS-CHECKLIST.md) |

**Credits**

- **System design:** Daniel Rodrigo Navarro Melendo
- **Character art:** Jesús Bey
- **World map:** Pena Negra
- **Full-page art:** Dzmitry Zasimovich

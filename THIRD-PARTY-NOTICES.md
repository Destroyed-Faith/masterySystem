# Third-Party Notices

This file distinguishes original Destroyed Faith materials from third-party components referenced or used by the project.

The Destroyed Faith Proprietary Source-Available License in [`LICENSE.md`](LICENSE.md) does **not** relicense third-party code or assets.

## Original Destroyed Faith materials

Unless a specific notice says otherwise, original materials in this repository — including the Foundry system implementation under `src/` / `dist/`, original rule text, setting material, and project documentation — are proprietary works of Daniel Rodrigo Navarro Melendo, subject to [`LICENSE.md`](LICENSE.md).

## Foundry Virtual Tabletop

This game system is designed for use with a legally licensed copy of Foundry Virtual Tabletop. Foundry Virtual Tabletop is software owned by Foundry Gaming LLC. Destroyed Faith is an independent project and is not affiliated with or endorsed by Foundry Gaming LLC.

The system references Foundry runtime assets at play time (for example core `icons/svg/…` paths and Foundry UI fonts). Those assets are provided by Foundry when installed and are **not** redistributed by this repository as project-owned stock. Their terms remain those of Foundry Gaming LLC / Foundry’s package and platform terms.

Package development for Foundry should remain consistent with Foundry’s Limited License for Package Development as published by Foundry Gaming LLC.

## Commissioned / credited visual works

Credits currently documented in project materials:

| Credit | Role |
|---|---|
| Jesús Bey | Character art |
| Pena Negra | World map |
| Dzmitry Zasimovich | Full-page art |

These works may remain subject to commission agreements and copyrights retained by their creators. Repository presence does not by itself prove copyright assignment. See [`ASSET-LICENSE.md`](ASSET-LICENSE.md) and [`docs/ASSET-RIGHTS-CHECKLIST.md`](docs/ASSET-RIGHTS-CHECKLIST.md).

## Runtime fonts loaded by styles (not vendored in-repo)

The following fonts are referenced by CSS but are **not** shipped as license-documented binary files inside this repository:

| Family / file | How referenced | In-repo license file |
|---|---|---|
| Cinzel Decorative, Cormorant Garamond, MedievalSharp | Google Fonts `@import` in `styles/df-rulebook-ui.css` | Not present — verify upstream Google Fonts / OFL terms externally |
| Laviossa | `@font-face` URL on Forge CDN in `styles/mastery-themes.css` | Not present — verify with rightsholder / host terms |
| Signika, Modesto Condensed, Font Awesome 6 | Foundry UI fallback names in styles | Foundry / upstream terms; not bundled here |

These entries require owner verification before any standalone redistribution claim.

## Shipped project assets without per-file notices

Files under `assets/` (icons, item images, logos, banners, and related media) are distributed with the system for gameplay use. Many files lack embedded copyright headers. Treat them under [`ASSET-LICENSE.md`](ASSET-LICENSE.md) and confirm provenance via the asset-rights checklist before extracting or relicensing them.

## Development-only npm packages

This repository declares **no runtime `dependencies`** in `package.json`. All npm packages currently listed are `devDependencies` used for build, test, lint, and tooling. They are **not** included in the player release ZIP produced by `scripts/package-release.mjs`.

Direct `devDependencies` observed in this workspace (license text verified from installed `node_modules` package metadata / LICENSE files where present):

| Package | License (package metadata) | Notes |
|---|---|---|
| `@playwright/test` | Apache-2.0 | Test tooling |
| `@foundryvtt/foundryvtt-cli` | MIT | Foundry CLI tooling |
| `@league-of-foundry-developers/foundry-vtt-types` | MIT | Type definitions |
| `@typescript-eslint/eslint-plugin` | MIT | Lint tooling |
| `@typescript-eslint/parser` | BSD-2-Clause | Lint tooling |
| `dotenv` | BSD-2-Clause | Local env loading for tools/tests |
| `eslint` | MIT | Lint tooling |
| `prettier` | MIT | Formatting |
| `rimraf` | ISC | Clean script helper |
| `ts-morph` | MIT | AST tooling for scripts |
| `typescript` | Apache-2.0 | Compiler |
| `vitest` | MIT | Unit tests |

### Reliable audit method for the full tree

A complete manually maintained list of every transitive npm package is impractical and would drift. To regenerate a machine-readable inventory from a clean install:

```bash
npm ci
npx --yes license-checker-rseidelsohn --summary
# or:
npx --yes license-checker-rseidelsohn --csv --out third-party-licenses.csv
```

Do not copy third-party license texts into `LICENSE.md`. Keep upstream LICENSE files inside `node_modules` during development and do not strip required notices from third-party packages.

## Materials still needing owner verification

- Commission contracts / usage scope for credited artists and for uncredited files under `assets/`
- License terms for Google Fonts families and the Laviossa Forge CDN font
- Any stock, AI-assisted, or third-party icons that may have been imported without a recorded notice
- Rulebook materials under `Rules/` that credit additional collaborators (for example design contributors named only in rulebook front matter)

Until verified, do not grant broader redistribution rights for those materials beyond gameplay use and the media policy.

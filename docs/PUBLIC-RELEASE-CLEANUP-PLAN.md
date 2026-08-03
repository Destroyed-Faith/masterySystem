# Public release cleanup — historical notes

Completed work on the Foundry system around **0.9.241–0.9.242**. Kept here only as context; follow [`RELEASING.md`](../RELEASING.md) for current release steps.

## What was cleaned

- HTTPS lockfile for clean public `npm ci`
- Root one-off scripts removed; helpers under `scripts/dev/`
- Player-first README; asset-rights checklist
- Allowlist packaging + fail-fast `.github/workflows/release.yml`
- Missing `sample-*` packs removed from `system.json`
- Foundry system version remains on the `0.9.x` sequence (`0.9.242`, then `0.9.243`, …)
- Rulebook versioning is independent and must not be written into `package.json` / `system.json`

## Runtime ZIP allowlist

Include: `system.json`, `template.json`, `dist/**/*.js` (no `.map`/`.d.ts`), `templates/`, `styles/`, `assets/`, `lang/`, existing `packs/`, `LICENSE`, `README.md`, `CHANGELOG.md`.

Exclude: `.github/`, `src/`, `tests/`, `e2e/`, `tools/`, `scripts/`, generated `reports/`, `docs/`, `Rules/`, `node_modules/`, source maps, lockfiles, tsconfig.

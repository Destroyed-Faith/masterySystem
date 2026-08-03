# Public Release Cleanup Plan (`chore/public-release-cleanup`)

## Baseline (recorded before fixes)

| Item | Current |
|---|---|
| Version | `0.9.241` (`package.json` + `system.json`) — **leave intact** |
| Foundry compatibility | minimum/verified **14** (`system.json`) |
| README | stale: claims `0.0.68 (Alpha)` and Foundry v13 |
| Download URL | `…/archive/refs/heads/main.zip` (not immutable) |
| Release workflow | rsync almost entire repo; no `npm ci` / build / test |
| Lockfile | **8** deps resolved via `git+ssh://git@github.com/foundry-vtt-types/…` (breaks clean public `npm ci`) |
| Root artifacts | unreferenced debug/fix/temp scripts + `mastery.zip` + `reports/` |
| Packs on disk | only `packs/echo-artifacts`; manifest also lists missing `sample-*` packs |

Target future public RC version (later, not this branch): **`0.99.0`**.

## Phases

1. **Lockfile / CI install** — rewrite `git+ssh` → `git+https` for public GitHub deps; verify `npm ci`.
2. **Root cleanup** — delete obsolete one-offs; move useful tools to `scripts/dev/`; expand `.gitignore`.
3. **Docs** — player-first README; `RELEASING.md`; asset rights checklist; align Foundry v14 + version source of truth.
4. **Release engineering** — `validate-release-version.mjs`, `package-release.mjs` (allowlist), rewrite `.github/workflows/release.yml`.
5. **Manifest** — `download` URL template for versioned GitHub release assets; keep `manifest` on `main/system.json`; document publish order.
6. **Logging** — `src/utils/logger.ts` + gate verbose `console.log`/`debug` behind setting/flag; keep warn/error.
7. **Verify** — clean install, build, unit tests, audits; do **not** tag/publish/release.

## Runtime ZIP allowlist (verified against `system.json` + code)

Include: `system.json`, `template.json`, `dist/**/*.js` (no `.map`/`.d.ts`), `templates/`, `styles/`, `assets/`, `lang/`, existing `packs/`, `LICENSE`, `README.md`, `CHANGELOG.md`, and any runtime icon paths referenced under `icons/` if present.

Exclude: `.github/`, `src/`, `tests/`, `e2e/`, `tools/`, `scripts/`, `reports/`, `docs/` (internal), `Rules/`, `node_modules/`, root debug scripts, source maps, lockfiles, tsconfig.
